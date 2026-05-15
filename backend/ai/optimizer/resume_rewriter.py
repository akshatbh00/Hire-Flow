"""
ai/optimizer/resume_rewriter.py — PREMIUM FEATURE
LLM-powered full resume section rewriter.
Takes raw resume text + target JD → returns improved version section by section.

Converted from OpenAI → Groq (llama-3.3-70b-versatile)

FIXES:
- BUG 1: rewrite_full_resume() now rewrites all sections concurrently using
         ThreadPoolExecutor instead of sequential Groq calls. 4 serial
         round-trips (summary + experience + skills + projects) collapsed
         to ~1 round-trip in practice.
- BUG 2: rewrite_section() now returns a dict with is_fallback=True on any
         Groq failure instead of silently returning the original text. The
         caller (jd_tailorer) can detect failures and warn the user rather
         than presenting unchanged content as "optimised".
"""
import logging
from concurrent.futures import ThreadPoolExecutor, as_completed
from groq import Groq
from config import settings

logger = logging.getLogger(__name__)

client = Groq(api_key=settings.GROQ_API_KEY)

GROQ_MODEL   = "llama-3.3-70b-versatile"
MAX_WORKERS  = 4   # one per section — stays within Groq concurrency limits

REWRITE_PROMPT = """You are an expert resume writer. Rewrite the following resume section \
to better match the job description. Keep it truthful — only rephrase, never fabricate.

Job Title: {job_title}
Job Description (key requirements): {jd_snippet}

Original Section ({section_name}):
{section_content}

Rules:
- Use strong action verbs
- Quantify achievements where possible
- Mirror keywords from the JD naturally
- Keep the same approximate length
- Return ONLY the rewritten text, no commentary
"""

SUMMARY_PROMPT = """Write a 3-sentence professional summary for this candidate targeting \
the role below.

Candidate: {name}, {exp} years experience, skills: {skills}
Target Role: {job_title} at {company}

Return ONLY the summary paragraph, no commentary, no label, no preamble."""


class ResumeRewriter:

    def rewrite_section(
        self,
        section_name:    str,
        section_content: str,
        job_title:       str,
        jd_snippet:      str,
    ) -> dict:
        """
        Returns {"text": str, "is_fallback": bool}.
        FIX BUG 2: on failure returns is_fallback=True so callers know
        the content is unchanged rather than silently showing original
        text as if it were optimised.
        """
        prompt = REWRITE_PROMPT.format(
            job_title=job_title,
            jd_snippet=jd_snippet[:1500],
            section_name=section_name,
            section_content=section_content[:3000],
        )
        try:
            resp = client.chat.completions.create(
                model=GROQ_MODEL,
                messages=[
                    {
                        "role": "system",
                        "content": "You are an expert resume writer. Return only the rewritten content, nothing else.",
                    },
                    {"role": "user", "content": prompt},
                ],
                temperature=0.4,
            )
            return {
                "text":        resp.choices[0].message.content.strip(),
                "is_fallback": False,
            }
        except Exception as exc:
            logger.warning(f"rewrite_section failed for '{section_name}': {exc}")
            # FIX BUG 2: was returning section_content bare with no failure signal
            return {
                "text":        section_content,
                "is_fallback": True,
            }

    def rewrite_full_resume(
        self,
        parsed_data:  dict,
        raw_sections: dict,     # {"experience": "...", "skills": "..."}
        job_title:    str,
        jd_text:      str,
    ) -> dict:
        """
        Rewrites all major sections concurrently.
        Returns dict of section → {"text": str, "is_fallback": bool}.

        FIX BUG 1: was sequential — 4 serial Groq calls. Now fires all
        section rewrites in parallel via ThreadPoolExecutor.
        """
        jd_snippet = jd_text[:1500]
        priority   = ["summary", "experience", "skills", "projects"]
        tasks      = [
            (section, raw_sections[section])
            for section in priority
            if raw_sections.get(section)
        ]

        rewritten: dict[str, dict] = {}

        with ThreadPoolExecutor(max_workers=MAX_WORKERS) as pool:
            future_to_section = {
                pool.submit(
                    self.rewrite_section,
                    section, content, job_title, jd_snippet,
                ): section
                for section, content in tasks
            }
            for future in as_completed(future_to_section):
                section = future_to_section[future]
                rewritten[section] = future.result()   # never raises

        return rewritten

    def generate_summary(
        self,
        parsed_data: dict,
        job_title:   str,
        company:     str = "",
    ) -> dict:
        """
        Returns {"text": str, "is_fallback": bool}.
        FIX BUG 2: failure returns is_fallback=True instead of bare "".
        """
        prompt = SUMMARY_PROMPT.format(
            name=parsed_data.get("name", "Candidate"),
            exp=parsed_data.get("total_experience_years", 0),
            skills=", ".join(parsed_data.get("skills", [])[:10]),
            job_title=job_title,
            company=company,
        )
        try:
            resp = client.chat.completions.create(
                model=GROQ_MODEL,
                messages=[
                    {
                        "role": "system",
                        "content": "You are an expert resume writer. Return only the requested text, nothing else.",
                    },
                    {"role": "user", "content": prompt},
                ],
                temperature=0.5,
            )
            return {
                "text":        resp.choices[0].message.content.strip(),
                "is_fallback": False,
            }
        except Exception as exc:
            logger.warning(f"generate_summary failed: {exc}")
            return {"text": "", "is_fallback": True}