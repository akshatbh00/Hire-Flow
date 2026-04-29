"""
comparator.py — compares a candidate's resume against the selected pool
Gives a percentile score + gap analysis vs hired candidates for that role.
"""
import numpy as np
from sqlalchemy.orm import Session
from sqlalchemy import text
from models import Resume, SelectedPoolEntry
from ai.resume.embedder import ResumeEmbedder
from loguru import logger

embedder = ResumeEmbedder()


def _cosine(a: list, b: list) -> float:
    a, b = np.array(a), np.array(b)
    denom = np.linalg.norm(a) * np.linalg.norm(b)
    return float(np.dot(a, b) / denom) if denom else 0.0


class BenchmarkComparator:

    def compare(
        self,
        resume_id: str,
        job_title: str,
        db: Session,
        top_k: int = 50,
    ) -> dict:
        """
        Compare resume against selected pool for a given job title.
        Returns percentile score + skill gaps.
        """
        resume = db.query(Resume).filter(Resume.id == resume_id).first()
        if not resume or resume.embedding is None:
            return {"error": "Resume not processed yet"}

        # fetch selected pool entries for this job title
        pool = db.query(SelectedPoolEntry).filter(
            SelectedPoolEntry.job_title.ilike(f"%{job_title}%"),
            SelectedPoolEntry.embedding.isnot(None),
        ).limit(top_k).all()

        if not pool:
            return {
                "percentile":      None,
                "pool_size":       0,
                "message":         "No benchmark data yet for this role",
                "similarity_score": None,
            }

        candidate_emb = list(resume.embedding)
        scores = [_cosine(candidate_emb, list(p.embedding)) for p in pool]
        candidate_score = np.mean(scores)      # avg similarity to selected pool

        # percentile: what % of pool is the candidate scoring above
        pool_self_scores = [np.mean([_cosine(list(p.embedding), list(q.embedding))
                                     for q in pool if q.id != p.id])
                            for p in pool]

        percentile = float(np.mean([candidate_score >= s for s in pool_self_scores]) * 100)

        # skill gap
        gaps = self._skill_gap(resume.parsed_data or {}, pool, db)

        return {
            "percentile":       round(percentile, 1),
            "similarity_score": round(candidate_score * 100, 1),
            "pool_size":        len(pool),
            "skill_gaps":       gaps["missing"],
            "strength_skills":  gaps["strong"],
            "improvement_pts":  round((100 - percentile) * 0.3, 1),
        }

    def _skill_gap(
        self,
        parsed: dict,
        pool: list[SelectedPoolEntry],
        db: Session,
    ) -> dict:
        """
        Compare candidate skills vs skills of selected candidates.
        Returns missing skills (appear in >40% of pool but not in candidate).
        """
        candidate_skills = set(s.lower() for s in (parsed.get("skills") or []))

        # collect skills from pool resumes
        pool_resume_ids = [str(p.resume_id) for p in pool]
        if not pool_resume_ids:
            return {"missing": [], "strong": []}

        pool_resumes = db.query(Resume).filter(
            Resume.id.in_(pool_resume_ids)
        ).all()

        skill_freq: dict[str, int] = {}
        for pr in pool_resumes:
            for skill in (pr.parsed_data or {}).get("skills", []):
                skill_freq[skill.lower()] = skill_freq.get(skill.lower(), 0) + 1

        threshold = len(pool_resumes) * 0.4   # present in 40%+ of selected resumes
        common_pool_skills = {s for s, cnt in skill_freq.items() if cnt >= threshold}

        missing  = sorted(common_pool_skills - candidate_skills)[:10]
        strong   = sorted(candidate_skills & common_pool_skills)[:5]

        return {"missing": missing, "strong": strong}