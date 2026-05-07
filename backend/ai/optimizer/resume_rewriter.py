"""
optimizer/resume_rewriter.py — PREMIUM FEATURE
LLM-powered full resume section rewriter.
Takes raw resume text + target JD → returns improved version section by section.

Converted from OpenAI → Groq (llama-3.3-70b-versatile)
"""
from groq import Groq
from config import settings

client = Groq(api_key=settings.GROQ_API_KEY)

GROQ_MODEL = "llama-3.3-70b-versatile"

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

Return ONLY the summary paragraph, no commentary, no label, no preamble."""


class ResumeRewriter:

    def rewrite_section(
        self,
        section_name:    str,
        section_content: str,
        job_title:       str,
        jd_snippet:      str,
    ) -> str:
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
                    {
                        "role": "user",
                        "content": prompt,
                    },
                ],
                temperature=0.4,
            )
            return resp.choices[0].message.content.strip()
        except Exception:
            return section_content  # fall back to original on failure

    def rewrite_full_resume(
        self,
        parsed_data:  dict,
        raw_sections: dict,     # {"experience": "...", "skills": "..."}
        job_title:    str,
        jd_text:      str,
    ) -> dict:
        """
        Rewrites all major sections. Returns dict of section → rewritten text.
        """
        jd_snippet = jd_text[:1500]
        rewritten  = {}
        priority   = ["summary", "experience", "skills", "projects"]

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
        job_title:   str,
        company:     str = "",
    ) -> str:
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
                    {
                        "role": "user",
                        "content": prompt,
                    },
                ],
                temperature=0.5,
            )
            return resp.choices[0].message.content.strip()
        except Exception:
            return ""  # fall back to empty on failure