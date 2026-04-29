"""
round_comparator.py — compares candidate vs people who cleared rounds
Gives granular advice:
  "To clear Round 1 → add these skills"
  "To get selected → add these skills"
"""
import numpy as np
from sqlalchemy.orm import Session
from models import Resume, RoundClearerEntry, SelectedPoolEntry
from loguru import logger


def _cosine(a: list, b: list) -> float:
    a, b = np.array(a), np.array(b)
    denom = np.linalg.norm(a) * np.linalg.norm(b)
    return float(np.dot(a, b) / denom) if denom else 0.0


class RoundComparator:

    def compare(
        self,
        resume_id: str,
        job_title: str,
        db: Session,
    ) -> dict:
        """
        Compare candidate vs round clearers + selected pool.
        Returns per-round advice.
        """
        resume = db.query(Resume).filter(Resume.id == resume_id).first()
        if not resume or not resume.embedding:
            return {"error": "Resume not processed yet"}

        candidate_emb    = resume.embedding
        candidate_skills = set(
            s.lower() for s in (resume.parsed_data or {}).get("skills", [])
        )

        results = {}

        # check each round
        rounds = ["round_1", "round_2", "round_3", "hr_round", "selected"]
        for round_name in rounds:
            if round_name == "selected":
                pool = db.query(SelectedPoolEntry).filter(
                    SelectedPoolEntry.job_title.ilike(f"%{job_title}%"),
                    SelectedPoolEntry.embedding.isnot(None),
                ).limit(30).all()
            else:
                pool = db.query(RoundClearerEntry).filter(
                    RoundClearerEntry.job_title.ilike(f"%{job_title}%"),
                    RoundClearerEntry.round_cleared == round_name,
                    RoundClearerEntry.embedding.isnot(None),
                ).limit(30).all()

            if not pool:
                results[round_name] = {
                    "pool_size":   0,
                    "similarity":  None,
                    "skill_gaps":  [],
                    "message":     "No benchmark data yet for this round",
                }
                continue

            # similarity score
            scores = []
            pool_skills: dict[str, int] = {}

            for p in pool:
                if p.embedding:
                    scores.append(_cosine(candidate_emb, p.embedding))

                # collect pool skills
                pool_resume = db.query(Resume).filter(
                    Resume.id == p.resume_id
                ).first()
                if pool_resume and pool_resume.parsed_data:
                    for skill in pool_resume.parsed_data.get("skills", []):
                        k = skill.lower()
                        pool_skills[k] = pool_skills.get(k, 0) + 1

            avg_similarity = round(np.mean(scores) * 100, 1) if scores else None

            # skill gaps
            threshold   = len(pool) * 0.4
            common      = {s for s, c in pool_skills.items() if c >= threshold}
            skill_gaps  = sorted(common - candidate_skills)[:8]
            strengths   = sorted(common & candidate_skills)[:5]

            results[round_name] = {
                "pool_size":       len(pool),
                "similarity":      avg_similarity,
                "skill_gaps":      skill_gaps,
                "strength_skills": strengths,
                "message": self._advice(round_name, avg_similarity, skill_gaps),
            }

        return {
            "job_title":     job_title,
            "resume_id":     resume_id,
            "rounds":        results,
            "quick_summary": self._summary(results),
        }

    def _advice(self, round_name: str, similarity: float, gaps: list) -> str:
        if similarity is None:
            return "No data available yet"
        label = round_name.replace("_", " ").title()
        if similarity >= 75:
            return f"Strong match for {label} — you're competitive"
        elif similarity >= 50:
            top = ", ".join(gaps[:3]) if gaps else "general experience"
            return f"To clear {label} — focus on: {top}"
        else:
            top = ", ".join(gaps[:5]) if gaps else "core skills for this role"
            return f"Significant gap for {label} — prioritize: {top}"

    def _summary(self, results: dict) -> str:
        for round_name, data in results.items():
            sim = data.get("similarity")
            if sim and sim < 50:
                label = round_name.replace("_", " ").title()
                gaps  = data.get("skill_gaps", [])[:3]
                return f"Main blocker: {label} — add {', '.join(gaps) if gaps else 'core skills'}"
        return "You're competitive across all rounds"