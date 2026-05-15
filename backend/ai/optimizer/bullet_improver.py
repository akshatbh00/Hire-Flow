"""
ai/optimizer/bullet_improver.py — PREMIUM FEATURE
Converts weak resume bullets into strong STAR-format bullets.

Converted from OpenAI → Groq (llama-3.3-70b-versatile)

FIXES:
- BUG 1: improve() now returns {"improved": [...], "is_fallback": bool}
         instead of a bare list. On JSON decode failure or Groq error the
         caller receives is_fallback=True so it can warn the user instead
         of silently presenting unchanged bullets as improved.
- BUG 2: extract_bullets_from_section() now normalises \n\n to \n before
         splitting. PDF-extracted text commonly uses double newlines between
         bullets — the old single \n split silently dropped those lines.
"""
import re
import json
import logging
from groq import Groq
from config import settings

logger = logging.getLogger(__name__)

client = Groq(api_key=settings.GROQ_API_KEY)

GROQ_MODEL = "llama-3.3-70b-versatile"

BULLET_PROMPT = """Improve these resume bullet points using the STAR format \
(Situation, Task, Action, Result). Add metrics where reasonable.
Keep each bullet under 20 words.
Return ONLY raw valid JSON with no markdown, no explanation, no code fences:

{{"improved": ["bullet1", "bullet2", ...]}}

Original bullets:
{bullets}

Target role: {job_title}"""


class BulletImprover:

    def improve(self, bullets: list[str], job_title: str) -> dict:
        """
        Returns {"improved": [str], "is_fallback": bool}.
        FIX BUG 1: was returning bare list — caller had no way to detect
        Groq failures. Now surfaces is_fallback=True on any error so
        jd_tailorer can warn the user.
        """
        if not bullets:
            return {"improved": [], "is_fallback": False}

        prompt = BULLET_PROMPT.format(
            bullets="\n".join(f"- {b}" for b in bullets[:15]),
            job_title=job_title,
        )
        try:
            resp = client.chat.completions.create(
                model=GROQ_MODEL,
                messages=[
                    {
                        "role": "system",
                        "content": "You are a JSON-only API. Never output anything except raw, valid JSON.",
                    },
                    {"role": "user", "content": prompt},
                ],
                temperature=0.4,
            )

            raw = resp.choices[0].message.content.strip()

            # Strip accidental markdown fences
            if raw.startswith("```"):
                raw = re.sub(r"^```(?:json)?\n?", "", raw)
                raw = re.sub(r"\n?```$",           "", raw)

            data = json.loads(raw)
            return {
                "improved":    data.get("improved", bullets),
                "is_fallback": False,
            }

        except (json.JSONDecodeError, Exception) as exc:
            logger.warning(f"BulletImprover.improve failed: {exc}")
            # FIX BUG 1: was returning bare bullets list with no failure signal
            return {
                "improved":    bullets,
                "is_fallback": True,
            }

    def extract_bullets_from_section(self, section_text: str) -> list[str]:
        """
        Pull individual bullet lines from raw section text. No API call.
        FIX BUG 2: normalise double newlines before splitting so bullets
        separated by blank lines (common in PDF-extracted text) aren't
        silently dropped.
        """
        # FIX BUG 2: collapse \n\n → \n so PDF double-spaced bullets aren't lost
        normalised = re.sub(r"\n{2,}", "\n", section_text)
        lines      = normalised.split("\n")
        return [
            line.strip().lstrip("-•●◆▪").strip()
            for line in lines
            if len(line.strip()) > 20
        ]