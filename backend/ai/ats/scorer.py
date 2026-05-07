"""
ai/ats/scorer.py — ATS scoring orchestrator
Now uses all 4 submodules for modular, accurate scoring.

Converted from OpenAI → Groq (llama-3.3-70b-versatile)
"""
import re
import json
from groq import Groq
from config import settings
from ai.ats.report_generator import ATSReportGenerator

client    = Groq(api_key=settings.GROQ_API_KEY)
generator = ATSReportGenerator()

GROQ_MODEL = "llama-3.3-70b-versatile"

CLARITY_PROMPT = """Rate this resume for clarity and keyword density.
Return ONLY raw valid JSON with no markdown, no explanation, no code fences:
{
  "keyword_density": <int 0-35>,
  "clarity_score":   <int 0-10>,
  "issues":          ["<plain English issue>"]
}
Resume (first 4000 chars):
"""


class ATSScorer:

    def score(
        self,
        raw_text:    str,
        parsed_data: dict,
        jd_text:     str = "",
    ) -> dict:
        """
        Main entry point. Called by pipeline.py after parse step.
        Returns full ATS report dict.
        """
        llm_scores = self._llm_clarity(raw_text)
        report     = generator.generate(
            raw_text=raw_text,
            parsed_data=parsed_data,
            jd_text=jd_text,
            llm_scores=llm_scores,
        )
        return report

    def score_against_jd(
        self,
        raw_text:    str,
        parsed_data: dict,
        jd_text:     str,
    ) -> dict:
        """
        Premium path — score resume specifically against a job description.
        More accurate keyword matching.
        """
        return self.score(raw_text, parsed_data, jd_text=jd_text)

    def _llm_clarity(self, text: str) -> dict:
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
                        "content": CLARITY_PROMPT + text[:4000],
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
            return {"keyword_density": 20, "clarity_score": 7, "issues": []}