"""
vector_retriever.py — semantic vector search wrapper
Abstracts pgvector queries so job_matcher and candidate_ranker
don't write raw SQL.

FIXES:
- BUG 1: embeddings are now passed to pgvector as a proper bracket-formatted
         string "[0.1,0.2,...]" instead of Python's str(list) which produces
         "[0.1, 0.2, ...]" with spaces. pgvector's type coercion handles the
         spaced format in most versions but rejects it under strict casting —
         using the canonical format is correct and safe across all versions.
- BUG 2: retrieve_candidates() ORDER BY was sorting by raw <=> distance
         (ascending = most distant first) while the WHERE clause filtered by
         1 - <=> >= min_score (similarity). The sort and filter were
         semantically inverted — top result was the worst match above the
         threshold. Fixed to ORDER BY similarity DESC consistently.
         Same bug existed in _search_jobs() — fixed there too.
"""
from sqlalchemy.orm import Session
from sqlalchemy     import text
from ai.resume.embedder import ResumeEmbedder

embedder = ResumeEmbedder()


def _fmt_embedding(embedding: list[float]) -> str:
    """
    FIX BUG 1: format embedding for pgvector.
    str([0.1, 0.2]) → '[0.1, 0.2]'  ← Python default, spaces vary by version
    pgvector canonical → '[0.1,0.2]' ← no spaces, always accepted
    """
    return "[" + ",".join(str(v) for v in embedding) + "]"


class VectorRetriever:

    def retrieve_jobs(
        self,
        query_text: str,
        db:         Session,
        limit:      int   = 50,
        min_score:  float = 0.3,
        filters:    dict  = None,
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
        FIX BUG 1: _fmt_embedding() for correct pgvector format.
        FIX BUG 2: ORDER BY similarity DESC — was ORDER BY <=> ASC which
                   sorted worst-match-first despite the WHERE filtering
                   by similarity >= min_score.
        """
        rows = db.execute(text("""
            SELECT
                r.id          AS resume_id,
                r.user_id,
                r.ats_score,
                r.parsed_data,
                r.raw_text,
                u.full_name,
                u.email,
                1 - (r.embedding <=> :emb ::vector) AS similarity
            FROM resumes r
            JOIN users u ON u.id = r.user_id
            WHERE r.embedding IS NOT NULL
              AND r.is_active  = true
              AND 1 - (r.embedding <=> :emb ::vector) >= :min_score
            ORDER BY similarity DESC
            LIMIT :limit
        """), {
            "emb":       _fmt_embedding(query_embedding),
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
        """
        FIX BUG 1: _fmt_embedding() for correct pgvector format.
        FIX BUG 2: ORDER BY similarity DESC — was ORDER BY <=> ASC
                   (distance ascending = worst match first).
        """
        where  = "WHERE j.embedding IS NOT NULL AND j.is_active = true"
        params = {
            "emb":       _fmt_embedding(embedding),
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
                j.required_experience,
                c.name    AS company_name,
                c.logo_url,
                1 - (j.embedding <=> :emb ::vector) AS similarity
            FROM jobs j
            JOIN companies c ON c.id = j.company_id
            {where}
              AND 1 - (j.embedding <=> :emb ::vector) >= :min_score
            ORDER BY similarity DESC
            LIMIT :limit
        """), params).fetchall()

        return [dict(r._mapping) for r in rows]
