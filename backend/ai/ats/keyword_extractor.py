"""
keyword_extractor.py — extracts and compares keywords
between a job description and a resume.
Used by scorer.py and gap_analyzer.py.

Converted from OpenAI → Groq (llama-3.3-70b-versatile)
"""
import re
import json
from groq import Groq
from config import settings

client = Groq(api_key=settings.GROQ_API_KEY)

# Common filler words to ignore
STOPWORDS = {
    "and","the","for","with","this","that","have","from",
    "our","you","will","are","your","all","been","has",
    "were","they","their","can","more","also","which",
}

JD_EXTRACT_PROMPT = """Extract the most important technical and role-specific keywords 
from this job description. Include: skills, tools, frameworks, methodologies, 
certifications, and role-specific terms.

Return ONLY valid JSON with no markdown, no explanation, no code fences — raw JSON only:
{
  "hard_skills":   ["python", "fastapi", ...],
  "soft_skills":   ["leadership", ...],
  "tools":         ["docker", "git", ...],
  "domain_terms":  ["microservices", "agile", ...]
}

Job Description:
"""

GROQ_MODEL = "llama-3.3-70b-versatile"  # or "mixtral-8x7b-32768", "llama3-70b-8192"


class KeywordExtractor:

    def extract_from_jd(self, jd_text: str) -> dict:
        """LLM-powered extraction from job description via Groq."""
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
                        "content": JD_EXTRACT_PROMPT + jd_text[:4000],
                    },
                ],
                temperature=0,
            )

            raw = resp.choices[0].message.content.strip()

            # Strip accidental markdown fences if the model adds them
            if raw.startswith("```"):
                raw = re.sub(r"^```(?:json)?\n?", "", raw)
                raw = re.sub(r"\n?```$", "", raw)

            return json.loads(raw)

        except (json.JSONDecodeError, Exception):
            return {"hard_skills": [], "soft_skills": [], "tools": [], "domain_terms": []}

    def extract_from_resume(self, raw_text: str, parsed_data: dict) -> set[str]:
        """
        Extract all meaningful keywords from resume.
        Combines parsed skills + raw text n-gram extraction.
        No API call — unchanged from original.
        """
        keywords = set()

        # from structured parser output
        for skill in parsed_data.get("skills", []):
            keywords.add(skill.lower().strip())
        for skill in parsed_data.get("soft_skills", []):
            keywords.add(skill.lower().strip())

        # from raw text — unigrams + bigrams
        words = re.findall(r"\b[a-zA-Z][a-zA-Z+#.]{1,20}\b", raw_text.lower())
        bigrams = [f"{words[i]} {words[i+1]}" for i in range(len(words) - 1)]

        for w in words + bigrams:
            if w not in STOPWORDS and len(w) > 2:
                keywords.add(w)

        return keywords

    def compare(
        self,
        jd_keywords: dict,
        resume_keywords: set[str],
    ) -> dict:
        """
        Compare JD keywords vs resume keywords.
        Returns matched, missing, and a keyword score (0–35).
        No API call — unchanged from original.
        """
        all_jd = set()
        for group in jd_keywords.values():
            for k in group:
                all_jd.add(k.lower().strip())

        if not all_jd:
            return {"matched": [], "missing": [], "score": 20, "coverage": 0.0}

        matched = sorted(all_jd & resume_keywords)
        missing = sorted(all_jd - resume_keywords)

        coverage = len(matched) / len(all_jd)
        score = round(coverage * 35, 1)

        return {
            "matched":  matched[:20],
            "missing":  missing[:20],
            "score":    min(score, 35),
            "coverage": round(coverage * 100, 1),
        }