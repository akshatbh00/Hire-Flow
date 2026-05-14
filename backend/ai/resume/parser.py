"""
parser.py — LLM-powered structured extraction from raw resume text
Returns: name, email, phone, skills, experience (years), education, job_titles

Converted from OpenAI → Groq (llama-3.3-70b-versatile)

FIXES:
- BUG 1: parse() now returns {"is_fallback": True} on any Groq failure
         instead of a bare {}. pipeline.py checks this flag and skips
         ATS scoring + chunk storage so we never persist a poisoned
         empty-dict parsed_data that zeroes out experience_years for
         every downstream match.
- RISK 1: truncation raised from 6 000 → 10 000 chars so late-resume
          sections (projects, certifications) aren't silently dropped
          for candidates with dense career histories.
"""
import re
import json
from groq import Groq
from config import settings

client = Groq(api_key=settings.GROQ_API_KEY)

GROQ_MODEL = "llama-3.3-70b-versatile"

# RISK 1: was 6000 — late sections (projects, certs) were silently dropped
PARSE_CHAR_LIMIT = 10_000

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
        """
        Returns structured resume dict on success.
        FIX BUG 1: on any failure returns {"is_fallback": True} so the
        caller can detect the failure and avoid persisting empty data.
        """
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
                        # RISK 1 fix: use PARSE_CHAR_LIMIT instead of hardcoded 6000
                        "content": PARSE_PROMPT + raw_text[:PARSE_CHAR_LIMIT],
                    },
                ],
                temperature=0,
            )

            raw = resp.choices[0].message.content.strip()

            # Strip accidental markdown fences
            if raw.startswith("```"):
                raw = re.sub(r"^```(?:json)?\n?", "", raw)
                raw = re.sub(r"\n?```$", "", raw)

            result = json.loads(raw)
            result["is_fallback"] = False
            return result

        except (json.JSONDecodeError, Exception):
            # FIX BUG 1: was returning {} — pipeline had no way to detect failure
            return {"is_fallback": True}