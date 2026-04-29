"""
workers/matching_tasks.py — standalone background job matching worker
Runs after resume processing + when new jobs are posted.
"""
from workers.celery_app import celery_app
from database import SessionLocal
from loguru import logger


@celery_app.task(bind=True, max_retries=2)
def match_resume_to_all_jobs(self, resume_id: str, notify: bool = True):
    """
    Full job matching for a resume.
    Stores top matches in resume.parsed_data._cached_matches.
    Optionally notifies user of new matches.
    """
    db = SessionLocal()
    try:
        from models import Resume
        from ai.matching.job_matcher import JobMatcher

        resume = db.query(Resume).filter(Resume.id == resume_id).first()
        if not resume or not resume.embedding:
            logger.warning(f"Resume {resume_id} not ready for matching")
            return

        matches = JobMatcher().match_jobs_for_resume(
            resume_id, db, limit=50
        )

        # cache in parsed_data
        parsed = resume.parsed_data or {}
        parsed["_cached_matches"]    = matches[:10]
        parsed["_match_count"]       = len(matches)
        resume.parsed_data           = parsed
        db.commit()

        logger.info(f"Matched resume {resume_id} → {len(matches)} jobs")

        # notify user
        if notify and matches:
            from workers.notification_tasks import notify_new_job_matches
            notify_new_job_matches.delay(str(resume.user_id), len(matches))

    except Exception as exc:
        logger.error(f"Matching failed for {resume_id}: {exc}")
        self.retry(exc=exc)
    finally:
        db.close()


@celery_app.task
def match_new_job_to_all_resumes(job_id: str):
    """
    When a new job is posted, find and notify matching candidates.
    Runs in background after job creation.
    """
    db = SessionLocal()
    try:
        from models import Job, Resume, User
        from ai.matching.job_matcher import JobMatcher

        job = db.query(Job).filter(Job.id == job_id).first()
        if not job or not job.embedding:
            return

        candidates = JobMatcher().rank_candidates_for_job(job_id, db, limit=100)
        top_users  = [c["user_id"] for c in candidates[:20]]

        logger.info(
            f"New job {job.title} matched to {len(candidates)} candidates"
        )

        # notify top matches
        for user_id in top_users:
            from workers.notification_tasks import notify_new_job_matches
            notify_new_job_matches.delay(str(user_id), 1)

    except Exception as exc:
        logger.error(f"Job matching failed for {job_id}: {exc}")
    finally:
        db.close()


@celery_app.task
def rematch_all_resumes_for_job(job_id: str):
    """
    Admin task — rematch all active resumes for a specific job.
    Useful after job description is updated.
    """
    db = SessionLocal()
    try:
        from models import Resume
        resumes = db.query(Resume).filter(Resume.is_active == True).all()
        for r in resumes:
            match_resume_to_all_jobs.delay(str(r.id), notify=False)
        logger.info(f"Queued rematching {len(resumes)} resumes for job {job_id}")
    finally:
        db.close()