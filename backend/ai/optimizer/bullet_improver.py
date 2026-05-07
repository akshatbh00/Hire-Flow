"""
optimizer/bullet_improver.py — PREMIUM FEATURE
Converts weak resume bullets into strong STAR-format bullets.

Converted from OpenAI → Groq (llama-3.3-70b-versatile)
"""
import re
import json
from groq import Groq
from config import settings

client = Groq(api_key=settings.GROQ_API_KEY)

GROQ_MODEL = "llama-3.3-70b-versatile"

BULLET_PROMPT = """Improve these resume bullet points using the STAR format 
(Situation, Task, Action, Result). Add metrics where reasonable.
Keep each bullet under 20 words.
Return ONLY raw valid JSON with no markdown, no explanation, no code fences:

{{"improved": ["bullet1", "bullet2", ...]}}

Original bullets:
{bullets}

Target role: {job_title}"""


class BulletImprover:

    def improve(self, bullets: list[str], job_title: str) -> list[str]:
        if not bullets:
            return []

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
                    {
                        "role": "user",
                        "content": prompt,
                    },
                ],
                temperature=0.4,
            )

            raw = resp.choices[0].message.content.strip()

            # Strip accidental markdown fences
            if raw.startswith("```"):
                raw = re.sub(r"^```(?:json)?\n?", "", raw)
                raw = re.sub(r"\n?```$", "", raw)

            data = json.loads(raw)
            return data.get("improved", bullets)

        except (json.JSONDecodeError, Exception):
            return bullets

    def extract_bullets_from_section(self, section_text: str) -> list[str]:
        """Pull individual bullet lines from raw section text. No API call."""
        lines = section_text.split("\n")
        return [
            l.strip().lstrip("-•●◆▪").strip()
            for l in lines
            if len(l.strip()) > 20
        ]