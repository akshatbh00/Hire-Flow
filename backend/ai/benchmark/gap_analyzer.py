"""
gap_analyzer.py — deep skill + experience gap analysis
Goes beyond comparator.py's basic skill diff.
Gives actionable, prioritized suggestions with impact scores.
"""
from openai import OpenAI
from config import settings
import json

client = OpenAI(api_key=settings.OPENAI_API_KEY)

GAP_PROMPT = """You are a career coach analyzing a candidate's resume against hired candidates for the same role.

Candidate skills: {candidate_skills}
Candidate experience: {candidate_exp} years
Candidate titles: {candidate_titles}

Selected pool — common skills: {pool_skills}
Selected pool — avg experience: {pool_avg_exp} years
Selected pool — common titles: {pool_titles}

Return ONLY valid JSON:
{{
  "critical_gaps": [
    {{"skill": str, "impact": "high|medium|low", "how_to_add": str}}
  ],
  "experience_gap": {{
    "years_behind": float,
    "suggestion": str
  }},
  "title_alignment": {{
    "score": 0-100,
    "suggestion": str
  }},
  "quick_wins": [str],
  "estimated_score_boost": float
}}"""


class GapAnalyzer:

    def analyze(
        self,
        candidate_parsed: dict,
        pool_resumes_parsed: list[dict],
    ) -> dict:
        if not pool_resumes_parsed:
            return {"error": "No pool data available for this role"}

        candidate_skills = candidate_parsed.get("skills", [])
        candidate_exp    = candidate_parsed.get("total_experience_years", 0)
        candidate_titles = [
            e.get("title", "") for e in candidate_parsed.get("experience", [])
        ]

        # aggregate pool stats
        pool_skill_freq: dict[str, int] = {}
        pool_exps, pool_titles = [], []

        for p in pool_resumes_parsed:
            for s in p.get("skills", []):
                pool_skill_freq[s.lower()] = pool_skill_freq.get(s.lower(), 0) + 1
            pool_exps.append(p.get("total_experience_years", 0))
            pool_titles += [e.get("title", "") for e in p.get("experience", [])]

        threshold    = len(pool_resumes_parsed) * 0.35
        common_pool  = [s for s, c in pool_skill_freq.items() if c >= threshold]
        pool_avg_exp = round(sum(pool_exps) / max(len(pool_exps), 1), 1)

        prompt = GAP_PROMPT.format(
            candidate_skills=", ".join(candidate_skills[:30]),
            candidate_exp=candidate_exp,
            candidate_titles=", ".join(candidate_titles[:5]),
            pool_skills=", ".join(common_pool[:30]),
            pool_avg_exp=pool_avg_exp,
            pool_titles=", ".join(set(pool_titles[:20])),
        )

        try:
            resp = client.chat.completions.create(
                model=settings.LLM_MODEL,
                messages=[{"role": "user", "content": prompt}],
                response_format={"type": "json_object"},
                temperature=0.2,
            )
            return json.loads(resp.choices[0].message.content)
        except Exception as e:
            return {"error": str(e)}