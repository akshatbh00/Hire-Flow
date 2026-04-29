"""
workers/resume_tasks.py — Celery async tasks for resume processing
Triggered after upload. Runs the full AI pipeline in background.
"""
from workers.celery_app import celery_app
from database import SessionLocal
from loguru import logger


@celery_app.task(bind=True, max_retries=3, default_retry_delay=10)
def process_resume(self, resume_id: str):
    """
    Full pipeline: ingest → parse → chunk → embed → ATS score → store
    """
    db = SessionLocal()
    try:
        from ai.resume.pipeline import ResumePipeline
        ResumePipeline().run(resume_id, db)
        # trigger job matching in background after processing
        match_resume_to_jobs.delay(resume_id)
    except Exception as exc:
        logger.error(f"Resume {resume_id} failed: {exc}")
        self.retry(exc=exc)
    finally:
        db.close()


@celery_app.task(bind=True, max_retries=2)
def match_resume_to_jobs(self, resume_id: str):
    """
    After resume is processed, pre-compute top job matches and cache them.
    Runs automatically after process_resume completes.
    """
    db = SessionLocal()
    try:
        from ai.matching.job_matcher import JobMatcher
        from models import Resume
        resume = db.query(Resume).filter(Resume.id == resume_id).first()
        if not resume or not resume.embedding:
            return
        matches = JobMatcher().match_jobs_for_resume(resume_id, db, limit=50)
        # store top matches in parsed_data cache for fast dashboard load
        if resume.parsed_data:
            resume.parsed_data["_cached_matches"] = matches[:10]
            db.commit()
        logger.info(f"Cached {len(matches)} job matches for resume {resume_id}")
    except Exception as exc:
        logger.error(f"Job matching failed for {resume_id}: {exc}")
        self.retry(exc=exc)
    finally:
        db.close()


@celery_app.task
def reprocess_all_resumes():
    """
    Admin task — reprocess all resumes (e.g. after model upgrade).
    Run manually: celery_app.send_task('workers.resume_tasks.reprocess_all_resumes')
    """
    db = SessionLocal()
    try:
        from models import Resume
        ids = [str(r.id) for r in db.query(Resume.id).filter(Resume.is_active == True).all()]
        for rid in ids:
            process_resume.delay(rid)
        logger.info(f"Queued reprocessing for {len(ids)} resumes")
    finally:
        db.close()