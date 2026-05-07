"""
parser.py — LLM-powered structured extraction from raw resume text
Returns: name, email, phone, skills, experience (years), education, job_titles

Converted from OpenAI → Groq (llama-3.3-70b-versatile)
"""
import re
import json
from groq import Groq
from config import settings

client = Groq(api_key=settings.GROQ_API_KEY)

GROQ_MODEL = "llama-3.3-70b-versatile"

PARSE_PROMPT = """Extract structured data from this resume.
Return ONLY raw valid JSON with no markdown, no explanation, no code fences.

Schema:
{
  "name": str,
  "email": str | null,
  "phone": str | null,
  "location": str | null,
  "total_experience_years": float,
  "current_title": str | null,
  "skills": [str],
  "soft_skills": [str],
  "education": [{"degree": str, "institution": str, "year": int|null}],
  "experience": [{"title": str, "company": str, "duration_months": int, "description": str}],
  "certifications": [str],
  "languages": [str]
}

Resume:
"""


class ResumeParser:

    def parse(self, raw_text: str) -> dict:
        try:
            resp = client.chat.completions.create(
                model=GROQ_MODEL,
                messages=[
                    {
                        "role": "system",
                        "content": "You are a JSON-only API. Never output anything except raw, valid JSON.",
                    },
                    {
                        "role": "user",
                        "content": PARSE_PROMPT + raw_text[:6000],
                    },
                ],
                temperature=0,
            )

            raw = resp.choices[0].message.content.strip()

            # Strip accidental markdown fences
            if raw.startswith("```"):
                raw = re.sub(r"^```(?:json)?\n?", "", raw)
                raw = re.sub(r"\n?```$", "", raw)

            return json.loads(raw)

        except (json.JSONDecodeError, Exception):
            return {}