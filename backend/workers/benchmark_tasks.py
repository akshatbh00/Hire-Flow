"""
workers/benchmark_tasks.py — recalculate benchmark scores in background
Runs after a candidate is moved to SELECTED (adds to pool)
or on a nightly cron to refresh all scores.
"""
from workers.celery_app import celery_app
from database import SessionLocal
from loguru import logger


@celery_app.task
def recalculate_benchmark_for_job(job_id: str):
    """
    After a new candidate is selected for a job,
    recalculate benchmark scores for all applicants of that job.
    """
    db = SessionLocal()
    try:
        from models import Application, Job
        from ai.benchmark.comparator import BenchmarkComparator

        job = db.query(Job).filter(Job.id == job_id).first()
        if not job:
            return

        apps = db.query(Application).filter(Application.job_id == job_id).all()
        comparator = BenchmarkComparator()

        for app in apps:
            result = comparator.compare(str(app.resume_id), job.title, db)
            app.benchmark_score = result.get("percentile")

        db.commit()
        logger.info(f"Recalculated benchmarks for {len(apps)} applicants on job {job_id}")
    except Exception as e:
        logger.error(f"Benchmark recalc failed: {e}")
    finally:
        db.close()


@celery_app.task
def nightly_benchmark_refresh():
    """
    Celery beat cron — refresh all active application benchmark scores nightly.
    Add to celery beat schedule in celery_app.py.
    """
    db = SessionLocal()
    try:
        from models import Job
        jobs = db.query(Job).filter(Job.is_active == True).all()
        for job in jobs:
            recalculate_benchmark_for_job.delay(str(job.id))
        logger.info(f"Queued benchmark refresh for {len(jobs)} active jobs")
    finally:
        db.close()