"""
optimizer/bullet_improver.py — PREMIUM FEATURE
Converts weak resume bullets into strong STAR-format bullets.
"""
from openai import OpenAI
from config import settings
import json

client = OpenAI(api_key=settings.OPENAI_API_KEY)

BULLET_PROMPT = """Improve these resume bullet points using the STAR format 
(Situation, Task, Action, Result). Add metrics where reasonable.
Keep each bullet under 20 words. Return JSON only:

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
                model=settings.LLM_MODEL,
                messages=[{"role": "user", "content": prompt}],
                response_format={"type": "json_object"},
                temperature=0.4,
            )
            data = json.loads(resp.choices[0].message.content)
            return data.get("improved", bullets)
        except Exception:
            return bullets

    def extract_bullets_from_section(self, section_text: str) -> list[str]:
        """Pull individual bullet lines from raw section text."""
        lines  = section_text.split("\n")
        return [
            l.strip().lstrip("-•●◆▪").strip()
            for l in lines
            if len(l.strip()) > 20
        ]