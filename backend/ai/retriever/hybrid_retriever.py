"""
hybrid_retriever.py — BM25 keyword search + vector semantic search
Combined for better recall. BM25 catches exact keyword matches
that pure vector search misses (e.g. specific tech names).
"""
import math
import re
from collections import Counter
from sqlalchemy.orm import Session
from ai.retriever.vector_retriever import VectorRetriever

vector_retriever = VectorRetriever()

# BM25 parameters
K1 = 1.5
B  = 0.75


class BM25:
    """Lightweight in-memory BM25 over a list of documents."""

    def __init__(self, docs: list[str]):
        self.docs      = docs
        self.n         = len(docs)
        self.avgdl     = sum(len(d.split()) for d in docs) / max(self.n, 1)
        self.df        = self._doc_freq()
        self.tokenized = [self._tokenize(d) for d in docs]

    def _tokenize(self, text: str) -> list[str]:
        return re.findall(r"\b\w{2,}\b", text.lower())

    def _doc_freq(self) -> Counter:
        df: Counter = Counter()
        for doc in self.docs:
            for term in set(self._tokenize(doc)):
                df[term] += 1
        return df

    def score(self, query: str, doc_idx: int) -> float:
        tokens = self._tokenize(query)
        doc    = self.tokenized[doc_idx]
        dl     = len(doc)
        tf     = Counter(doc)
        score  = 0.0
        for term in tokens:
            if tf[term] == 0:
                continue
            idf   = math.log((self.n - self.df[term] + 0.5) / (self.df[term] + 0.5) + 1)
            numer = tf[term] * (K1 + 1)
            denom = tf[term] + K1 * (1 - B + B * dl / self.avgdl)
            score += idf * (numer / denom)
        return score

    def rank(self, query: str) -> list[tuple[int, float]]:
        scores = [(i, self.score(query, i)) for i in range(self.n)]
        return sorted(scores, key=lambda x: x[1], reverse=True)


class HybridRetriever:

    VECTOR_WEIGHT = 0.65
    BM25_WEIGHT   = 0.35

    def retrieve_jobs(
        self,
        query_text:  str,
        db:          Session,
        limit:       int  = 20,
        filters:     dict = None,
    ) -> list[dict]:
        """
        Hybrid search:
        1. Vector search — top 100 semantic candidates
        2. BM25 over those 100 — rerank by keyword relevance
        3. Combine scores with weighted fusion
        4. Return top N
        """
        # step 1 — broad vector search
        vector_results = vector_retriever.retrieve_jobs(
            query_text, db, limit=100, min_score=0.2, filters=filters or {}
        )
        if not vector_results:
            return []

        # step 2 — BM25 over the vector candidates
        docs   = [f"{r['title']} {r.get('description','')}" for r in vector_results]
        bm25   = BM25(docs)
        bm25_scores = dict(bm25.rank(query_text))

        # step 3 — normalise + fuse scores
        max_vec  = max((r["similarity"] for r in vector_results), default=1)
        max_bm25 = max(bm25_scores.values(), default=1) or 1

        fused = []
        for i, result in enumerate(vector_results):
            vec_norm  = result["similarity"] / max_vec
            bm25_norm = bm25_scores.get(i, 0) / max_bm25
            combined  = (
                self.VECTOR_WEIGHT * vec_norm +
                self.BM25_WEIGHT   * bm25_norm
            )
            fused.append({**result, "hybrid_score": round(combined, 4)})

        # step 4 — sort by hybrid score
        fused.sort(key=lambda x: x["hybrid_score"], reverse=True)
        return fused[:limit]

    def retrieve_candidates(
        self,
        job_embedding: list[float],
        job_text:      str,
        db:            Session,
        limit:         int = 30,
    ) -> list[dict]:
        """Hybrid candidate retrieval for a job posting."""
        vector_results = vector_retriever.retrieve_candidates(
            job_embedding, db, limit=100, min_score=0.2
        )
        if not vector_results:
            return []

        docs = [
            " ".join((r.get("parsed_data") or {}).get("skills", []))
            + " " + (r.get("parsed_data") or {}).get("current_title", "")
            for r in vector_results
        ]
        bm25        = BM25(docs)
        bm25_scores = dict(bm25.rank(job_text))

        max_vec  = max((r["similarity"] for r in vector_results), default=1)
        max_bm25 = max(bm25_scores.values(), default=1) or 1

        fused = []
        for i, result in enumerate(vector_results):
            vec_norm  = result["similarity"] / max_vec
            bm25_norm = bm25_scores.get(i, 0) / max_bm25
            combined  = self.VECTOR_WEIGHT * vec_norm + self.BM25_WEIGHT * bm25_norm
            fused.append({**result, "hybrid_score": round(combined, 4)})

        fused.sort(key=lambda x: x["hybrid_score"], reverse=True)
        return fused[:limit]