"""
vector_retriever.py — semantic vector search wrapper
Abstracts pgvector queries so job_matcher and candidate_ranker
don't write raw SQL.
"""
from sqlalchemy.orm import Session
from sqlalchemy import text
from ai.resume.embedder import ResumeEmbedder

embedder = ResumeEmbedder()


class VectorRetriever:

    def retrieve_jobs(
        self,
        query_text:  str,
        db:          Session,
        limit:       int   = 50,
        min_score:   float = 0.3,
        filters:     dict  = None,
    ) -> list[dict]:
        """
        Given free-text query (resume text or search query),
        returns semantically similar jobs ranked by cosine similarity.
        """
        embedding = embedder.embed_text(query_text[:8000])
        return self._search_jobs(embedding, db, limit, min_score, filters or {})

    def retrieve_jobs_by_embedding(
        self,
        embedding:  list[float],
        db:         Session,
        limit:      int   = 50,
        min_score:  float = 0.3,
        filters:    dict  = None,
    ) -> list[dict]:
        """Use pre-computed embedding (faster — avoids re-embedding)."""
        return self._search_jobs(embedding, db, limit, min_score, filters or {})

    def retrieve_candidates(
        self,
        query_embedding: list[float],
        db:              Session,
        limit:           int   = 50,
        min_score:       float = 0.3,
    ) -> list[dict]:
        """
        Given a job embedding, returns best matching candidate resumes.
        """
        rows = db.execute(text("""
            SELECT
                r.id          AS resume_id,
                r.user_id,
                r.ats_score,
                r.parsed_data,
                u.full_name,
                u.email,
                1 - (r.embedding <=> :emb) AS similarity
            FROM resumes r
            JOIN users u ON u.id = r.user_id
            WHERE r.embedding  IS NOT NULL
              AND r.is_active   = true
              AND 1 - (r.embedding <=> :emb) >= :min_score
            ORDER BY r.embedding <=> :emb
            LIMIT :limit
        """), {
            "emb":       str(query_embedding),
            "limit":     limit,
            "min_score": min_score,
        }).fetchall()

        return [dict(r._mapping) for r in rows]

    def _search_jobs(
        self,
        embedding: list[float],
        db:        Session,
        limit:     int,
        min_score: float,
        filters:   dict,
    ) -> list[dict]:
        where  = "WHERE j.embedding IS NOT NULL AND j.is_active = true"
        params = {
            "emb":       str(embedding),
            "limit":     limit,
            "min_score": min_score,
        }

        if filters.get("job_type"):
            where += " AND j.job_type = :job_type"
            params["job_type"] = filters["job_type"]
        if filters.get("location"):
            where += " AND (j.remote_ok = true OR j.location ILIKE :location)"
            params["location"] = f"%{filters['location']}%"
        if filters.get("remote_ok"):
            where += " AND j.remote_ok = true"
        if filters.get("company_id"):
            where += " AND j.company_id = :company_id"
            params["company_id"] = filters["company_id"]

        rows = db.execute(text(f"""
            SELECT
                j.id, j.title, j.description, j.location,
                j.job_type, j.salary_min, j.salary_max,
                j.remote_ok, j.source, j.source_url,
                c.name   AS company_name,
                c.logo_url,
                1 - (j.embedding <=> :emb) AS similarity
            FROM jobs j
            JOIN companies c ON c.id = j.company_id
            {where}
              AND 1 - (j.embedding <=> :emb) >= :min_score
            ORDER BY j.embedding <=> :emb
            LIMIT :limit
        """), params).fetchall()

        return [dict(r._mapping) for r in rows]