"""
reranker.py — cross-encoder reranking for top results
Takes the top N hybrid results and reranks them using
LLM-based relevance scoring for maximum precision.
Only runs on top 10–20 results (expensive — use sparingly).
"""
import json
from openai import OpenAI
from config import settings

client = OpenAI(api_key=settings.OPENAI_API_KEY)

RERANK_PROMPT = """You are a hiring expert. Score how well this candidate/job matches the query.

Query: {query}

Candidate/Job:
{document}

Return ONLY valid JSON:
{{
  "relevance_score": <float 0.0-1.0>,
  "reasoning":       "<one sentence>"
}}"""


class Reranker:

    def rerank(
        self,
        query:     str,
        results:   list[dict],
        text_key:  str  = "title",       # field to use as document text
        top_k:     int  = 10,
        use_llm:   bool = True,
    ) -> list[dict]:
        """
        Reranks top_k results using LLM relevance scoring.
        Falls back to hybrid_score if LLM fails.

        text_key: which field to use as the document for scoring
                  ("title" for jobs, "full_name" for candidates)
        """
        if not results:
            return []

        # only rerank top_k — rest stay in order
        to_rerank  = results[:top_k]
        remainder  = results[top_k:]

        if use_llm:
            reranked = self._llm_rerank(query, to_rerank, text_key)
        else:
            reranked = to_rerank

        return reranked + remainder

    def _llm_rerank(
        self,
        query:    str,
        results:  list[dict],
        text_key: str,
    ) -> list[dict]:
        scored = []
        for r in results:
            doc_text = self._build_doc_text(r, text_key)
            score    = self._score_one(query, doc_text)
            scored.append({
                **r,
                "rerank_score":     score["relevance_score"],
                "rerank_reasoning": score["reasoning"],
            })

        scored.sort(key=lambda x: x["rerank_score"], reverse=True)
        return scored

    def _score_one(self, query: str, document: str) -> dict:
        try:
            resp = client.chat.completions.create(
                model=settings.LLM_MODEL,
                messages=[{
                    "role": "user",
                    "content": RERANK_PROMPT.format(
                        query=query[:500],
                        document=document[:1000],
                    )
                }],
                response_format={"type": "json_object"},
                temperature=0,
            )
            return json.loads(resp.choices[0].message.content)
        except Exception:
            return {"relevance_score": 0.5, "reasoning": ""}

    def _build_doc_text(self, result: dict, text_key: str) -> str:
        parts = [str(result.get(text_key, ""))]
        # add supporting fields
        for field in ["description", "location", "job_type", "company_name"]:
            if result.get(field):
                parts.append(str(result[field])[:200])
        return " | ".join(filter(None, parts))