"""
ai/benchmark/gap_analyzer.py — deep skill + experience gap analysis
Goes beyond comparator.py's basic skill diff.
Gives actionable, prioritized suggestions with impact scores.

Converted from OpenAI → Groq (llama-3.3-70b-versatile)

FIXES:
- BUG 1: Groq failure previously returned {"error": str(e)} — a dict with
         none of the expected keys. Any caller accessing result["critical_gaps"]
         would crash with KeyError. Now returns a fully-shaped fallback dict
         with is_fallback=True and empty-but-valid values for every field.
- RISK 1: pool_titles was built as ", ".join(set(pool_titles[:20])) —
          slicing before set() meant common titles like "Software Engineer"
          still appeared many times if they dominated the first 20 entries.
          Fixed to deduplicate the full list first, then slice.
"""
import re
import json
import logging
from groq import Groq
from config import settings

logger = logging.getLogger(__name__)

client = Groq(api_key=settings.GROQ_API_KEY)

GROQ_MODEL = "llama-3.3-70b-versatile"

GAP_PROMPT = """You are a career coach analyzing a candidate's resume against hired \
candidates for the same role.

Candidate skills: {candidate_skills}
Candidate experience: {candidate_exp} years
Candidate titles: {candidate_titles}

Selected pool — common skills: {pool_skills}
Selected pool — avg experience: {pool_avg_exp} years
Selected pool — common titles: {pool_titles}

Return ONLY raw valid JSON with no markdown, no explanation, no code fences:
{{
  "critical_gaps": [
    {{"skill": "<skill name>", "impact": "high|medium|low", "how_to_add": "<suggestion>"}}
  ],
  "experience_gap": {{
    "years_behind": <float>,
    "suggestion":   "<suggestion>"
  }},
  "title_alignment": {{
    "score":      <int 0-100>,
    "suggestion": "<suggestion>"
  }},
  "quick_wins":             ["<actionable tip>"],
  "estimated_score_boost":  <float>
}}"""

# Shape returned on any Groq failure — all expected keys present so callers never KeyError
_FALLBACK_RESPONSE = {
    "critical_gaps":        [],
    "experience_gap":       {"years_behind": 0.0, "suggestion": ""},
    "title_alignment":      {"score": 0,      "suggestion": ""},
    "quick_wins":           [],
    "estimated_score_boost": 0.0,
    "is_fallback":          True,
}


class GapAnalyzer:

    def analyze(
        self,
        candidate_parsed:    dict,
        pool_resumes_parsed: list[dict],
    ) -> dict:
        if not pool_resumes_parsed:
            return {**_FALLBACK_RESPONSE, "error": "No pool data available for this role"}

        candidate_skills = candidate_parsed.get("skills", [])
        candidate_exp    = candidate_parsed.get("total_experience_years", 0)
        candidate_titles = [
            e.get("title", "") for e in candidate_parsed.get("experience", [])
        ]

        pool_skill_freq: dict[str, int] = {}
        pool_exps, pool_titles_raw = [], []

        for p in pool_resumes_parsed:
            for s in p.get("skills", []):
                pool_skill_freq[s.lower()] = pool_skill_freq.get(s.lower(), 0) + 1
            pool_exps.append(p.get("total_experience_years", 0))
            pool_titles_raw += [e.get("title", "") for e in p.get("experience", [])]

        threshold    = len(pool_resumes_parsed) * 0.35
        common_pool  = [s for s, c in pool_skill_freq.items() if c >= threshold]
        pool_avg_exp = round(sum(pool_exps) / max(len(pool_exps), 1), 1)

        # RISK 1 fix: deduplicate full list first, then slice
        # was: set(pool_titles_raw[:20]) — duplicates survived if dominant in first 20
        pool_titles_deduped = list(dict.fromkeys(t for t in pool_titles_raw if t))[:20]

        prompt = GAP_PROMPT.format(
            candidate_skills=", ".join(candidate_skills[:30]),
            candidate_exp=candidate_exp,
            candidate_titles=", ".join(candidate_titles[:5]),
            pool_skills=", ".join(common_pool[:30]),
            pool_avg_exp=pool_avg_exp,
            pool_titles=", ".join(pool_titles_deduped),
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
                temperature=0.2,
            )

            raw = resp.choices[0].message.content.strip()

            if raw.startswith("```"):
                raw = re.sub(r"^```(?:json)?\n?", "", raw)
                raw = re.sub(r"\n?```$",           "", raw)

            result = json.loads(raw)
            result["is_fallback"] = False
            return result

        except (json.JSONDecodeError, Exception) as exc:
            # FIX BUG 1: was returning {"error": str(e)} — missing all expected
            # keys, causing KeyError in any caller that accessed critical_gaps etc.
            logger.warning(f"GapAnalyzer.analyze failed: {exc}")
            return {**_FALLBACK_RESPONSE}