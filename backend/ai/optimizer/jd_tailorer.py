"""
ai/optimizer/jd_tailorer.py — PREMIUM FEATURE
Tailors an entire resume specifically for one job description.
Orchestrates rewriter + bullet_improver in one call.

FIXES:
- BUG 1: generate_summary() no longer unconditionally overwrites the
         summary that rewrite_full_resume() already produced in step 1.
         generate_summary() is now only called when the rewritten summary
         is missing or was a fallback (Groq failed for that section).
- BUG 2: ATS re-score in step 4 was calling " ".join(rewritten.values())
         on a dict that contains experience_bullets as a list[str], not a
         string — crashed with TypeError. Text assembly now explicitly
         handles both str and list values safely.
"""
import logging
from ai.optimizer.resume_rewriter import ResumeRewriter
from ai.optimizer.bullet_improver import BulletImprover
from ai.ats.scorer                import ATSScorer
from loguru import logger


class JDTailorer:

    def __init__(self):
        self.rewriter = ResumeRewriter()
        self.improver = BulletImprover()
        self.ats      = ATSScorer()

    def tailor(
        self,
        parsed_data:  dict,
        raw_sections: dict,
        job_title:    str,
        jd_text:      str,
        company:      str = "",
    ) -> dict:
        """
        Full tailoring pipeline:
        1. Rewrite all sections toward JD (concurrent)
        2. Improve bullets in experience section
        3. Generate targeted summary only if step 1 didn't produce one
        4. Re-score ATS on the combined rewritten text
        Returns the complete tailored resume package.
        """
        logger.info(f"Tailoring resume for: {job_title}")

        # step 1 — rewrite all sections concurrently
        # rewritten shape: {section: {"text": str, "is_fallback": bool}}
        rewritten = self.rewriter.rewrite_full_resume(
            parsed_data, raw_sections, job_title, jd_text
        )

        # step 2 — improve bullets inside the rewritten experience section
        if "experience" in rewritten:
            bullets      = self.improver.extract_bullets_from_section(
                rewritten["experience"]["text"]
            )
            bullet_result = self.improver.improve(bullets, job_title)
            rewritten["experience_bullets"] = bullet_result   # {"improved": [...], "is_fallback": bool}

        # step 3 — FIX BUG 1: only generate a fresh summary if step 1
        # didn't produce one or if that rewrite fell back to the original.
        summary_result = rewritten.get("summary", {})
        if not summary_result.get("text") or summary_result.get("is_fallback"):
            rewritten["summary"] = self.rewriter.generate_summary(
                parsed_data, job_title, company
            )

        # step 4 — re-score ATS on the combined rewritten text
        # FIX BUG 2: rewritten values are dicts {"text":..., "is_fallback":...}
        # and experience_bullets is {"improved": [...], ...} — must extract
        # text safely from each value type to avoid TypeError in join().
        text_parts = []
        for key, val in rewritten.items():
            if key == "experience_bullets":
                # val is {"improved": [str], "is_fallback": bool}
                text_parts.extend(val.get("improved", []))
            elif isinstance(val, dict):
                # val is {"text": str, "is_fallback": bool}
                text = val.get("text", "")
                if text:
                    text_parts.append(text)
            elif isinstance(val, str):
                text_parts.append(val)

        combined = " ".join(text_parts)
        new_ats  = self.ats.score(combined, parsed_data, jd_text=jd_text)

        # Collect any fallback warnings to surface to the caller
        fallback_sections = [
            k for k, v in rewritten.items()
            if isinstance(v, dict) and v.get("is_fallback")
        ]

        return {
            "tailored_sections":  rewritten,
            "projected_ats":      new_ats["score"],
            "ats_breakdown":      new_ats["breakdown"],
            "job_title":          job_title,
            "company":            company,
            "fallback_sections":  fallback_sections,   # empty list = all rewrites succeeded
        }