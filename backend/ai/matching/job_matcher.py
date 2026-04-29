"""
ai/matching/job_matcher.py — semantic + hybrid + weighted matching
Now uses HybridRetriever + Reranker for best accuracy.
"""
from sqlalchemy.orm import Session
from models import Resume, Job
from ai.retriever.hybrid_retriever import HybridRetriever
from ai.retriever.reranker         import Reranker
from ai.resume.embedder            import ResumeEmbedder

hybrid   = HybridRetriever()
reranker = Reranker()
embedder = ResumeEmbedder()


class JobMatcher:

    def match_jobs_for_resume(
        self,
        resume_id: str,
        db:        Session,
        limit:     int  = 20,
        filters:   dict = None,
        rerank:    bool = False,   # enable for premium users
    ) -> list[dict]:
        """
        Resume → top N matching jobs.
        Uses pre-computed embedding for speed.
        """
        resume = db.query(Resume).filter(Resume.id == resume_id).first()
        if not resume or resume.embedding is None:
            return []

        # use hybrid retrieval
        results = hybrid.retrieve_jobs(
            query_text=resume.raw_text[:3000] if resume.raw_text else "",
            db=db,
            limit=limit * 3,    # over-fetch then trim after optional rerank
            filters=filters or {},
        )

        # optional LLM rerank for premium accuracy
        if rerank and results:
            query = self._build_query_from_resume(resume)
            results = reranker.rerank(query, results, text_key="title", top_k=15)

        return results[:limit]

    def rank_candidates_for_job(
        self,
        job_id:  str,
        db:      Session,
        limit:   int  = 50,
        rerank:  bool = False,
    ) -> list[dict]:
        """
        JD → top N matching candidates.
        """
        job = db.query(Job).filter(Job.id == job_id).first()
        if not job or job.embedding is None:
            return []

        jd_text = f"{job.title} {job.description or ''} {' '.join(job.requirements or [])}"

        results = hybrid.retrieve_candidates(
            job_embedding=list(job.embedding),
            job_text=jd_text,
            db=db,
            limit=limit * 2,
        )

        if rerank and results:
            results = reranker.rerank(jd_text, results, text_key="full_name", top_k=10)

        # attach weighted scores
        calculator = ScoreCalculator()
        for r in results:
            parsed   = r.get("parsed_data") or {}
            exp      = parsed.get("total_experience_years", 0)
            ats      = r.get("ats_score") or 50
            semantic = r.get("hybrid_score") or r.get("similarity", 0.5)
            r["final_score"] = calculator.calculate(semantic, ats, 0, exp)

        results.sort(key=lambda x: x["final_score"], reverse=True)
        return results[:limit]

    def _build_query_from_resume(self, resume) -> str:
        parsed = resume.parsed_data or {}
        parts  = [
            parsed.get("current_title", ""),
            " ".join(parsed.get("skills", [])[:10]),
        ]
        return " ".join(filter(None, parts))


class ScoreCalculator:
    """Weighted final score: hybrid match + ATS + experience fit."""

    WEIGHTS = {"semantic": 0.55, "ats": 0.25, "experience": 0.20}

    def calculate(
        self,
        semantic_score: float,
        ats_score:      float,
        required_exp:   int,
        candidate_exp:  float,
    ) -> float:
        ats_norm = ats_score / 100
        exp_fit  = min(candidate_exp / max(required_exp, 1), 1.0) if required_exp else 0.8
        score    = (
            semantic_score * self.WEIGHTS["semantic"] +
            ats_norm       * self.WEIGHTS["ats"] +
            exp_fit        * self.WEIGHTS["experience"]
        )
        return round(score * 100, 1)
"""

---

**Batch 10 — Final Brain: Matching Worker + Alembic + Admin + .env.example**
```
backend/
├── workers/
│   └── matching_tasks.py     ← new
├── api/
│   └── admin/
│       └── routes.py         ← new
├── migrations/
│   └── env.py                ← new (Alembic)
└── .env.example              ← new"""