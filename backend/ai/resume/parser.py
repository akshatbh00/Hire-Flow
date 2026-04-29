"""
parser.py — LLM-powered structured extraction from raw resume text
Returns: name, email, phone, skills, experience (years), education, job_titles
"""
import json
from openai import OpenAI
from config import settings

client = OpenAI(api_key=settings.OPENAI_API_KEY)

PARSE_PROMPT = """Extract structured data from this resume. Return ONLY valid JSON, no markdown.

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
        resp = client.chat.completions.create(
            model=settings.LLM_MODEL,
            messages=[
                {"role": "user", "content": PARSE_PROMPT + raw_text[:6000]}
            ],
            response_format={"type": "json_object"},
            temperature=0,
        )
        content = resp.choices[0].message.content
        try:
            return json.loads(content)
        except json.JSONDecodeError:
            return {}