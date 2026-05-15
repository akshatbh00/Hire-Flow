"""
embedder.py — generates vector embeddings for resume chunks + whole resume
Uses OpenAI text-embedding-3-small (1536 dims).
NOTE: Groq has no embeddings API — OpenAI is kept here only for embeddings.
All LLM/chat calls elsewhere use Groq.

FIXES:
- RISK 1: embed_chunks() and embed_text() now retry on OpenAI rate limits
          (429) and transient server errors (5xx) using tenacity exponential
          backoff (up to 4 attempts, max 60s wait). Without this, a single
          429 mid-batch killed the whole pipeline job and left the resume
          with no chunks in the DB.
"""
import time
import logging
from openai import OpenAI, RateLimitError, APIStatusError
from config import settings
from ai.resume.chunker import Chunk

logger = logging.getLogger(__name__)

client = OpenAI(api_key=settings.OPENAI_API_KEY)   # kept only for embeddings

BATCH_SIZE      = 20
EMBEDDING_MODEL = "text-embedding-3-small"   # 1536 dims

# Retry settings
_MAX_ATTEMPTS   = 4
_BASE_DELAY     = 2.0   # seconds — doubles each attempt


def _with_retry(fn, *args, **kwargs):
    """
    Simple exponential-backoff retry for OpenAI rate limits and 5xx errors.
    Raises the last exception after _MAX_ATTEMPTS failures.
    """
    delay = _BASE_DELAY
    for attempt in range(1, _MAX_ATTEMPTS + 1):
        try:
            return fn(*args, **kwargs)
        except RateLimitError as exc:
            if attempt == _MAX_ATTEMPTS:
                raise
            wait = min(delay, 60)
            logger.warning(f"OpenAI rate limit hit (attempt {attempt}/{_MAX_ATTEMPTS}), retrying in {wait}s — {exc}")
            time.sleep(wait)
            delay *= 2
        except APIStatusError as exc:
            if exc.status_code < 500 or attempt == _MAX_ATTEMPTS:
                raise
            wait = min(delay, 60)
            logger.warning(f"OpenAI server error {exc.status_code} (attempt {attempt}/{_MAX_ATTEMPTS}), retrying in {wait}s")
            time.sleep(wait)
            delay *= 2


class ResumeEmbedder:

    def embed_text(self, text: str) -> list[float]:
        """Embed a single string. Retries on rate limits."""
        resp = _with_retry(
            client.embeddings.create,
            model=EMBEDDING_MODEL,
            input=text[:8000],
        )
        return resp.data[0].embedding

    def embed_chunks(self, chunks: list[Chunk]) -> list[tuple[Chunk, list[float]]]:
        """
        Batch-embed chunks. Each batch retries independently so a transient
        rate limit on batch 3 doesn't discard the work done on batches 1–2.
        """
        results = []
        for i in range(0, len(chunks), BATCH_SIZE):
            batch = chunks[i : i + BATCH_SIZE]
            texts = [c.content[:2000] for c in batch]
            # RISK 1 fix: retry wrapper around the API call
            resp = _with_retry(
                client.embeddings.create,
                model=EMBEDDING_MODEL,
                input=texts,
            )
            for chunk, emb_obj in zip(batch, resp.data):
                results.append((chunk, emb_obj.embedding))
        return results

    def embed_job_description(self, jd_text: str) -> list[float]:
        return self.embed_text(jd_text[:8000])

    def embed_batch(self, texts: list[str]) -> list[list[float]]:
        all_embeddings = []
        for i in range(0, len(texts), BATCH_SIZE):
            batch = texts[i : i + BATCH_SIZE]
            resp = _with_retry(
                client.embeddings.create,
                model=EMBEDDING_MODEL,
                input=[t[:2000] for t in batch],
            )
            all_embeddings.extend([e.embedding for e in resp.data])
        return all_embeddings
