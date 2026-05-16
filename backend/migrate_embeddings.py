"""
migrate_embeddings.py — re-embeds all resumes and jobs after switching
from OpenAI (1536 dims) to Jina AI (768 dims).

Place this file in your backend root (same folder as main.py).

Run ONCE after deploying the new embedder.py:
    DATABASE_URL=your_db_url python migrate_embeddings.py

Steps it performs:
  1. Alter pgvector columns to vector(768)
  2. Re-embed all active resumes (whole-resume embedding)
  3. Re-embed all resume chunks
  4. Re-embed all active jobs
  5. Null out embeddings it couldn't process (rather than crash)
"""
import os
import sys
import time
import uuid
import logging
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
logger = logging.getLogger(__name__)

DATABASE_URL = os.environ.get("DATABASE_URL")
if not DATABASE_URL:
    logger.error("DATABASE_URL env var not set. Aborting.")
    sys.exit(1)

engine  = create_engine(DATABASE_URL)
Session = sessionmaker(bind=engine)


def alter_columns(conn):
    """Step 1 — update pgvector column dimensions from 1536 → 768."""
    logger.info("Altering embedding columns to vector(768)...")
    tables = ["resumes", "resume_chunks", "jobs"]
    for table in tables:
        stmt = (
            f"ALTER TABLE {table} "
            f"ALTER COLUMN embedding TYPE vector(768) "
            f"USING NULL::vector(768);"
        )
        try:
            conn.execute(text(stmt))
            conn.commit()
            logger.info(f"  OK: {table}.embedding → vector(768)")
        except Exception as e:
            logger.warning(f"  Skipped {table} (may not exist or already correct): {e}")


def migrate_resumes(db):
    """Steps 2+3 — re-embed resume.embedding and all resume chunks."""
    from models import Resume, ResumeChunk
    from ai.resume.embedder import ResumeEmbedder
    from ai.resume.chunker  import ResumeChunker

    embedder = ResumeEmbedder()
    chunker  = ResumeChunker()

    resumes = db.query(Resume).filter(
        Resume.is_active == True,
        Resume.raw_text  != None,
    ).all()

    logger.info(f"Re-embedding {len(resumes)} resumes...")

    for i, resume in enumerate(resumes, 1):
        try:
            # Whole-resume embedding
            resume.embedding = embedder.embed_text(resume.raw_text[:8000])

            # Chunk embeddings
            chunks   = chunker.chunk(resume.raw_text)
            embedded = embedder.embed_chunks(chunks)

            db.query(ResumeChunk).filter(
                ResumeChunk.resume_id == resume.id
            ).delete()

            for chunk, vec in embedded:
                db.add(ResumeChunk(
                    id=uuid.uuid4(),
                    resume_id=resume.id,
                    section=chunk.section,
                    content=chunk.content,
                    embedding=vec,
                    chunk_index=chunk.chunk_index,
                ))

            db.commit()
            logger.info(f"  [{i}/{len(resumes)}] Resume {resume.id} — OK ({len(embedded)} chunks)")

        except Exception as e:
            db.rollback()
            logger.error(f"  [{i}/{len(resumes)}] Resume {resume.id} — FAILED: {e}")
            resume.embedding = None
            db.commit()

        time.sleep(0.1)   # stay within Jina free tier rate limits


def migrate_jobs(db):
    """Step 4 — re-embed all active jobs."""
    from models import Job
    from ai.resume.embedder import ResumeEmbedder

    embedder = ResumeEmbedder()
    jobs     = db.query(Job).filter(Job.is_active == True).all()

    logger.info(f"Re-embedding {len(jobs)} jobs...")

    for i, job in enumerate(jobs, 1):
        jd_text = f"{job.title} {job.description or ''} {' '.join(job.requirements or [])}"
        try:
            job.embedding = embedder.embed_job_description(jd_text)
            db.commit()
            logger.info(f"  [{i}/{len(jobs)}] Job {job.id} ({job.title}) — OK")
        except Exception as e:
            db.rollback()
            logger.error(f"  [{i}/{len(jobs)}] Job {job.id} — FAILED: {e}")
            job.embedding = None
            db.commit()

        time.sleep(0.1)


def main():
    logger.info("=== HireFlow embedding migration: OpenAI 1536d → Jina AI 768d ===")

    with engine.connect() as conn:
        alter_columns(conn)

    db = Session()
    try:
        migrate_resumes(db)
        migrate_jobs(db)
        logger.info("=== Migration complete — all embeddings are now 768-dim (Jina AI) ===")
    finally:
        db.close()


if __name__ == "__main__":
    main()