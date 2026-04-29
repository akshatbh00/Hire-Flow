"""
optimizer/resume_rewriter.py — PREMIUM FEATURE
LLM-powered full resume section rewriter.
Takes raw resume text + target JD → returns improved version section by section.
"""
from openai import OpenAI
from config import settings
import json

client = OpenAI(api_key=settings.OPENAI_API_KEY)

REWRITE_PROMPT = """You are an expert resume writer. Rewrite the following resume section 
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

SUMMARY_PROMPT = """Write a 3-sentence professional summary for this candidate targeting the role below.

Candidate: {name}, {exp} years experience, skills: {skills}
Target Role: {job_title} at {company}

Return ONLY the summary paragraph."""


class ResumeRewriter:

    def rewrite_section(
        self,
        section_name: str,
        section_content: str,
        job_title: str,
        jd_snippet: str,
    ) -> str:
        prompt = REWRITE_PROMPT.format(
            job_title=job_title,
            jd_snippet=jd_snippet[:1500],
            section_name=section_name,
            section_content=section_content[:3000],
        )
        resp = client.chat.completions.create(
            model=settings.LLM_MODEL,
            messages=[{"role": "user", "content": prompt}],
            temperature=0.4,
        )
        return resp.choices[0].message.content.strip()

    def rewrite_full_resume(
        self,
        parsed_data: dict,
        raw_sections: dict,     # {"experience": "...", "skills": "..."}
        job_title: str,
        jd_text: str,
    ) -> dict:
        """
        Rewrites all major sections. Returns dict of section → rewritten text.
        """
        jd_snippet  = jd_text[:1500]
        rewritten   = {}
        priority    = ["summary", "experience", "skills", "projects"]

        for section in priority:
            content = raw_sections.get(section)
            if content:
                rewritten[section] = self.rewrite_section(
                    section, content, job_title, jd_snippet
                )

        return rewritten

    def generate_summary(
        self,
        parsed_data: dict,
        job_title: str,
        company: str = "",
    ) -> str:
        prompt = SUMMARY_PROMPT.format(
            name=parsed_data.get("name", "Candidate"),
            exp=parsed_data.get("total_experience_years", 0),
            skills=", ".join(parsed_data.get("skills", [])[:10]),
            job_title=job_title,
            company=company,
        )
        resp = client.chat.completions.create(
            model=settings.LLM_MODEL,
            messages=[{"role": "user", "content": prompt}],
            temperature=0.5,
        )
        return resp.choices[0].message.content.strip()