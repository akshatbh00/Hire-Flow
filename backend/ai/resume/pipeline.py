"""
pipeline.py — orchestrates the full resume processing flow
load → ingest → parse → chunk → embed → store
Called from Celery worker after upload
"""
from loguru import logger
from sqlalchemy.orm import Session

from ai.resume.ingestion import ResumeIngester
from ai.resume.parser import ResumeParser
from ai.resume.chunker import ResumeChunker
from ai.resume.embedder import ResumeEmbedder
from ai.ats.scorer import ATSScorer
from storage.s3 import download_file
from models import Resume, ResumeChunk
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
        resume.parsed_data = parsed

        # 4. ATS score
        ats_result = self.ats.score(raw_text, parsed)
        resume.ats_score  = ats_result["score"]
        resume.ats_report = ats_result

        # 5. Chunk + embed chunks
        chunks = self.chunker.chunk(raw_text)
        embedded = self.embedder.embed_chunks(chunks)

        # delete old chunks
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
        resume.embedding = self.embedder.embed_text(raw_text[:4000])

        db.commit()
        db.refresh(resume)
        logger.success(f"Resume {resume_id} processed — ATS: {resume.ats_score}")
        return resume