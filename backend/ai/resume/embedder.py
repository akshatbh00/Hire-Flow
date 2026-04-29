"""
embedder.py — generates vector embeddings for resume chunks + whole resume
Uses OpenAI text-embedding-3-small (1536 dims) by default.
Batches API calls to stay within rate limits.
"""
from openai import OpenAI
from config import settings
from ai.resume.chunker import Chunk

client = OpenAI(api_key=settings.OPENAI_API_KEY)

BATCH_SIZE = 20   # max texts per API call


class ResumeEmbedder:

    def embed_text(self, text: str) -> list[float]:
        """Embed a single string — used for whole-resume embedding."""
        resp = client.embeddings.create(
            model=settings.EMBEDDING_MODEL,
            input=text[:8000],   # stay within token limit
        )
        return resp.data[0].embedding

    def embed_chunks(self, chunks: list[Chunk]) -> list[tuple[Chunk, list[float]]]:
        """
        Batch-embed a list of Chunk objects.
        Returns list of (chunk, embedding_vector) tuples.
        """
        results = []
        for i in range(0, len(chunks), BATCH_SIZE):
            batch = chunks[i : i + BATCH_SIZE]
            texts = [c.content[:2000] for c in batch]   # trim per chunk
            resp = client.embeddings.create(
                model=settings.EMBEDDING_MODEL,
                input=texts,
            )
            for chunk, emb_obj in zip(batch, resp.data):
                results.append((chunk, emb_obj.embedding))
        return results

    def embed_job_description(self, jd_text: str) -> list[float]:
        """Embed a job description for candidate matching."""
        return self.embed_text(jd_text[:8000])

    def embed_batch(self, texts: list[str]) -> list[list[float]]:
        """Generic batch embed — used by benchmark comparator."""
        all_embeddings = []
        for i in range(0, len(texts), BATCH_SIZE):
            batch = texts[i : i + BATCH_SIZE]
            resp = client.embeddings.create(
                model=settings.EMBEDDING_MODEL,
                input=[t[:2000] for t in batch],
            )
            all_embeddings.extend([e.embedding for e in resp.data])
        return all_embeddings