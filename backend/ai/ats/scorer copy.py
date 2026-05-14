"""
ai/ats/scorer.py — ATS scoring orchestrator

FIXES:
- RISK 2: _llm_clarity() now sets is_fallback=True on any Groq failure
          (network error, rate limit, bad key, malformed JSON) so the
          report surfaces a warning instead of silently returning defaults.
- RISK 3: CLARITY_PROMPT now loaded from prompts/ats_analysis.txt via
          prompt_loader — edits to the .txt file take effect immediately
          without touching this file.
"""
import re
import json
from groq import Groq
from config import settings
from ai.ats.report_generator  import ATSReportGenerator
from ai.prompts.prompt_loader import load_prompt

client    = Groq(api_key=settings.GROQ_API_KEY)
generator = ATSReportGenerator()

GROQ_MODEL     = "llama-3.3-70b-versatile"
CLARITY_PROMPT = load_prompt("ats_analysis")   # reads prompts/ats_analysis.txt


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
        """
        FIX RISK 2: any failure sets is_fallback=True so report_generator
        can add a warning to the returned report instead of silently
        returning a score that looks real but used default values.
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
                        "content": CLARITY_PROMPT + text[:4000],
                    },
                ],
                temperature=0,
            )

            raw = resp.choices[0].message.content.strip()

            if raw.startswith("```"):
                raw = re.sub(r"^```(?:json)?\n?", "", raw)
                raw = re.sub(r"\n?```$", "", raw)

            result = json.loads(raw)
            result["is_fallback"] = False
            return result

        except (json.JSONDecodeError, Exception):
            return {
                "keyword_density": 20,
                "clarity_score":   7,
                "issues":          [],
                "is_fallback":     True,   # FIX RISK 2: caller now knows this is a default
            }
