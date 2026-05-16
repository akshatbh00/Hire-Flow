"""
ai/resume/embedder.py — generates vector embeddings for resume chunks + whole resume

Switched from OpenAI text-embedding-3-small (1536 dims)
         → Jina AI jina-embeddings-v2-base-en (768 dims)

Jina AI is fully free at signup — no credit card required.
Get your free API key at: https://jina.ai/embeddings/

IMPORTANT — DB MIGRATION REQUIRED:
Switching embedding models changes vector dimensions from 1536 → 768.
All existing embeddings in your DB are now incompatible and must be
re-generated. Run migrate_embeddings.py after deploying this file.

Also update your pgvector column definitions in a DB migration:
  ALTER TABLE resumes       ALTER COLUMN embedding TYPE vector(768);
  ALTER TABLE resume_chunks ALTER COLUMN embedding TYPE vector(768);
  ALTER TABLE jobs          ALTER COLUMN embedding TYPE vector(768);
  (any other tables with embedding columns)

FIXES CARRIED OVER FROM OPENAI VERSION:
- Retry logic on rate limits (429) and server errors (5xx) with
  exponential backoff — up to 4 attempts, max 60s wait.
"""
import time
import logging
import requests
from config import settings
from ai.resume.chunker import Chunk

logger = logging.getLogger(__name__)

JINA_API_URL    = "https://api.jina.ai/v1/embeddings"
EMBEDDING_MODEL = "jina-embeddings-v2-base-en"   # 768 dims, free tier
EMBEDDING_DIMS  = 768
BATCH_SIZE      = 20   # Jina free tier allows 2 concurrent — keep batches moderate

_MAX_ATTEMPTS = 4
_BASE_DELAY   = 2.0   # seconds, doubles each attempt


def _jina_embed(texts: list[str]) -> list[list[float]]:
    """
    Core HTTP call to Jina embedding API.
    Returns list of 768-dim vectors in the same order as input texts.
    Retries on 429 rate limits and 5xx server errors.
    """
    headers = {
        "Content-Type":  "application/json",
        "Authorization": f"Bearer {settings.JINA_API_KEY}",
    }
    payload = {
        "input": texts,
        "model": EMBEDDING_MODEL,
    }

    delay = _BASE_DELAY
    for attempt in range(1, _MAX_ATTEMPTS + 1):
        try:
            resp = requests.post(
                JINA_API_URL,
                headers=headers,
                json=payload,
                timeout=30,
            )

            if resp.status_code == 429:
                if attempt == _MAX_ATTEMPTS:
                    resp.raise_for_status()
                wait = min(delay, 60)
                logger.warning(
                    f"Jina rate limit (attempt {attempt}/{_MAX_ATTEMPTS}), "
                    f"retrying in {wait}s"
                )
                time.sleep(wait)
                delay *= 2
                continue

            if resp.status_code >= 500:
                if attempt == _MAX_ATTEMPTS:
                    resp.raise_for_status()
                wait = min(delay, 60)
                logger.warning(
                    f"Jina server error {resp.status_code} "
                    f"(attempt {attempt}/{_MAX_ATTEMPTS}), retrying in {wait}s"
                )
                time.sleep(wait)
                delay *= 2
                continue

            resp.raise_for_status()
            data = resp.json()

            # Jina response: {"data": [{"embedding": [...], "index": N}, ...]}
            # Sort by index to guarantee order matches input list
            sorted_data = sorted(data["data"], key=lambda x: x["index"])
            return [item["embedding"] for item in sorted_data]

        except requests.exceptions.Timeout:
            if attempt == _MAX_ATTEMPTS:
                raise
            wait = min(delay, 60)
            logger.warning(
                f"Jina timeout (attempt {attempt}/{_MAX_ATTEMPTS}), "
                f"retrying in {wait}s"
            )
            time.sleep(wait)
            delay *= 2

    raise RuntimeError("Jina embedding API failed after all retry attempts")


class ResumeEmbedder:

    def embed_text(self, text: str) -> list[float]:
        """Embed a single string. Returns 768-dim vector."""
        return _jina_embed([text[:8000]])[0]

    def embed_chunks(self, chunks: list[Chunk]) -> list[tuple[Chunk, list[float]]]:
        """
        Batch-embed resume chunks. Each batch retries independently so a
        transient error on batch 3 doesn't discard work from batches 1-2.
        """
        results = []
        for i in range(0, len(chunks), BATCH_SIZE):
            batch = chunks[i : i + BATCH_SIZE]
            texts = [c.content[:2000] for c in batch]
            vecs  = _jina_embed(texts)
            for chunk, vec in zip(batch, vecs):
                results.append((chunk, vec))
        return results

    def embed_job_description(self, jd_text: str) -> list[float]:
        return self.embed_text(jd_text[:8000])

    def embed_batch(self, texts: list[str]) -> list[list[float]]:
        all_embeddings = []
        for i in range(0, len(texts), BATCH_SIZE):
            batch = texts[i : i + BATCH_SIZE]
            vecs  = _jina_embed([t[:2000] for t in batch])
            all_embeddings.extend(vecs)
        return all_embeddings

# """
# embedder.py — generates vector embeddings for resume chunks + whole resume
# Uses OpenAI text-embedding-3-small (1536 dims).
# NOTE: Groq has no embeddings API — OpenAI is kept here only for embeddings.
# All LLM/chat calls elsewhere use Groq.

# FIXES:
# - RISK 1: embed_chunks() and embed_text() now retry on OpenAI rate limits
#           (429) and transient server errors (5xx) using tenacity exponential
#           backoff (up to 4 attempts, max 60s wait). Without this, a single
#           429 mid-batch killed the whole pipeline job and left the resume
#           with no chunks in the DB.
# """
# import time
# import logging
# from openai import OpenAI, RateLimitError, APIStatusError
# from config import settings
# from ai.resume.chunker import Chunk

# logger = logging.getLogger(__name__)

# client = OpenAI(api_key=settings.OPENAI_API_KEY)   # kept only for embeddings

# BATCH_SIZE      = 20
# EMBEDDING_MODEL = "text-embedding-3-small"   # 1536 dims

# # Retry settings
# _MAX_ATTEMPTS   = 4
# _BASE_DELAY     = 2.0   # seconds — doubles each attempt


# def _with_retry(fn, *args, **kwargs):
#     """
#     Simple exponential-backoff retry for OpenAI rate limits and 5xx errors.
#     Raises the last exception after _MAX_ATTEMPTS failures.
#     """
#     delay = _BASE_DELAY
#     for attempt in range(1, _MAX_ATTEMPTS + 1):
#         try:
#             return fn(*args, **kwargs)
#         except RateLimitError as exc:
#             if attempt == _MAX_ATTEMPTS:
#                 raise
#             wait = min(delay, 60)
#             logger.warning(f"OpenAI rate limit hit (attempt {attempt}/{_MAX_ATTEMPTS}), retrying in {wait}s — {exc}")
#             time.sleep(wait)
#             delay *= 2
#         except APIStatusError as exc:
#             if exc.status_code < 500 or attempt == _MAX_ATTEMPTS:
#                 raise
#             wait = min(delay, 60)
#             logger.warning(f"OpenAI server error {exc.status_code} (attempt {attempt}/{_MAX_ATTEMPTS}), retrying in {wait}s")
#             time.sleep(wait)
#             delay *= 2


# class ResumeEmbedder:

#     def embed_text(self, text: str) -> list[float]:
#         """Embed a single string. Retries on rate limits."""
#         resp = _with_retry(
#             client.embeddings.create,
#             model=EMBEDDING_MODEL,
#             input=text[:8000],
#         )
#         return resp.data[0].embedding

#     def embed_chunks(self, chunks: list[Chunk]) -> list[tuple[Chunk, list[float]]]:
#         """
#         Batch-embed chunks. Each batch retries independently so a transient
#         rate limit on batch 3 doesn't discard the work done on batches 1–2.
#         """
#         results = []
#         for i in range(0, len(chunks), BATCH_SIZE):
#             batch = chunks[i : i + BATCH_SIZE]
#             texts = [c.content[:2000] for c in batch]
#             # RISK 1 fix: retry wrapper around the API call
#             resp = _with_retry(
#                 client.embeddings.create,
#                 model=EMBEDDING_MODEL,
#                 input=texts,
#             )
#             for chunk, emb_obj in zip(batch, resp.data):
#                 results.append((chunk, emb_obj.embedding))
#         return results

#     def embed_job_description(self, jd_text: str) -> list[float]:
#         return self.embed_text(jd_text[:8000])

#     def embed_batch(self, texts: list[str]) -> list[list[float]]:
#         all_embeddings = []
#         for i in range(0, len(texts), BATCH_SIZE):
#             batch = texts[i : i + BATCH_SIZE]
#             resp = _with_retry(
#                 client.embeddings.create,
#                 model=EMBEDDING_MODEL,
#                 input=[t[:2000] for t in batch],
#             )
#             all_embeddings.extend([e.embedding for e in resp.data])
#         return all_embeddings
