"""
optimizer/jd_tailorer.py — PREMIUM FEATURE
Tailors an entire resume specifically for one job description.
Orchestrates rewriter + bullet_improver in one call.
"""
from ai.optimizer.resume_rewriter import ResumeRewriter
from ai.optimizer.bullet_improver import BulletImprover
from ai.ats.scorer import ATSScorer
from loguru import logger


class JDTailorer:

    def __init__(self):
        self.rewriter = ResumeRewriter()
        self.improver = BulletImprover()
        self.ats      = ATSScorer()

    def tailor(
        self,
        parsed_data: dict,
        raw_sections: dict,
        job_title: str,
        jd_text: str,
        company: str = "",
    ) -> dict:
        """
        Full tailoring pipeline:
        1. Rewrite all sections toward JD
        2. Improve bullets in experience section
        3. Generate a targeted summary
        4. Re-score ATS on the new version
        Returns the complete tailored resume package.
        """
        logger.info(f"Tailoring resume for: {job_title}")

        # step 1 — rewrite sections
        rewritten = self.rewriter.rewrite_full_resume(
            parsed_data, raw_sections, job_title, jd_text
        )

        # step 2 — improve bullets inside experience
        if "experience" in rewritten:
            bullets  = self.improver.extract_bullets_from_section(rewritten["experience"])
            improved = self.improver.improve(bullets, job_title)
            # replace bullets in the rewritten experience
            rewritten["experience_bullets"] = improved

        # step 3 — generate targeted summary
        rewritten["summary"] = self.rewriter.generate_summary(
            parsed_data, job_title, company
        )

        # step 4 — estimate new ATS score on combined text
        combined = " ".join(rewritten.values())
        new_ats  = self.ats.score(combined, parsed_data)

        return {
            "tailored_sections": rewritten,
            "projected_ats":     new_ats["score"],
            "ats_breakdown":     new_ats["breakdown"],
            "job_title":         job_title,
            "company":           company,
        }