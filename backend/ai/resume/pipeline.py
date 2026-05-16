"""
pipeline.py — orchestrates the full resume processing flow
load → ingest → parse → chunk → embed → store
Called from Celery worker after upload

FIXES:
- BUG 1: whole-resume embedding now uses raw_text[:8000] instead of
         raw_text[:4000]. The embedder already accepts 8000 chars and
         chunk embeds use 2000 each — halving the summary embed for no
         reason was hurting semantic search quality for longer resumes.
- BUG 2: DB operations are now wrapped in a try/except with db.rollback()
         on any failure. Previously, if embed_chunks() raised mid-way
         (OpenAI rate limit, network error), the old chunks had already
         been deleted but the new ones were never written — leaving the
         resume with zero chunks in the DB permanently.
- BUG 3: parser failure (is_fallback=True) now short-circuits the pipeline
         early with a clear logged error instead of persisting an empty
         parsed_data dict that zeroes out total_experience_years for every
         downstream matching and scoring call.
"""
from loguru import logger
from sqlalchemy.orm import Session

from ai.resume.ingestion import ResumeIngester
from ai.resume.parser    import ResumeParser
from ai.resume.chunker   import ResumeChunker
from ai.resume.embedder  import ResumeEmbedder
from ai.ats.scorer       import ATSScorer
from storage.s3          import download_file
from models              import Resume, ResumeChunk
import uuid


class ResumePipeline:

    def __init__(self):
        self.ingester = ResumeIngester()
        self.parser   = ResumeParser()
        self.chunker  = ResumeChunker()
        self.embedder = ResumeEmbedder()
        self.ats      = ATSScorer()

    def run(self, resume_id: str, db: Session) -> Resume:
        resume = db.query(Resume).filter(Resume.id == resume_id).first()
        if not resume:
            raise ValueError(f"Resume {resume_id} not found")

        logger.info(f"Processing resume {resume_id}")

        # 1. Load file
        local_path = download_file(resume.file_path)

        # 2. Ingest → raw text
        raw_text = self.ingester.ingest(local_path)
        resume.raw_text = raw_text

        # 3. Parse structured fields
        parsed = self.parser.parse(raw_text)

        # FIX BUG 3: parser returns {"is_fallback": True} on any Groq failure.
        # Abort early — persisting empty parsed_data would zero out
        # total_experience_years and poison every downstream match score.
        if parsed.get("is_fallback"):
            logger.error(f"Resume {resume_id} — parser failed (Groq error), aborting pipeline. Will retry.")
            resume.processing_status = "parse_failed"
            db.commit()
            raise RuntimeError(f"Resume {resume_id} parse failed — Groq unavailable or returned invalid JSON")

        resume.parsed_data = parsed

        # 4. ATS score
        ats_result        = self.ats.score(raw_text, parsed)
        resume.ats_score  = ats_result["score"]
        resume.ats_report = ats_result

        # 5. Chunk + embed + store
        # FIX BUG 2: wrap all DB mutations in try/except with rollback.
        # If embed_chunks() raises (rate limit, network), the delete below
        # would have already run — without rollback the resume ends up with
        # zero chunks in the DB permanently.
        try:
            chunks   = self.chunker.chunk(raw_text)
            embedded = self.embedder.embed_chunks(chunks)

            # Delete old chunks only after new embeddings are in memory
            db.query(ResumeChunk).filter(ResumeChunk.resume_id == resume_id).delete()

            for chunk, vec in embedded:
                db.add(ResumeChunk(
                    id=uuid.uuid4(),
                    resume_id=resume_id,
                    section=chunk.section,
                    content=chunk.content,
                    embedding=vec,
                    chunk_index=chunk.chunk_index,
                ))

            # 6. Whole-resume embedding
            # FIX BUG 1: was raw_text[:4000] — now uses full 8000-char limit
            # so longer resumes get a proper summary embedding for job matching.
            resume.embedding = self.embedder.embed_text(raw_text[:8000])

            db.commit()
            db.refresh(resume)

        except Exception as exc:
            # FIX BUG 2: roll back so no partial state is persisted
            logger.error(f"Resume {resume_id} — embedding/storage failed, rolling back: {exc}")
            db.rollback()
            resume.processing_status = "embed_failed"
            db.commit()
            raise

        logger.success(f"Resume {resume_id} processed — ATS: {resume.ats_score}")
        return resume
