from celery import Celery
from celery.schedules import crontab
from config import settings

celery_app = Celery(
    "hireflow",
    broker=settings.CELERY_BROKER_URL,
    backend=settings.CELERY_RESULT_BACKEND,
    include=[
        "workers.resume_tasks",
        "workers.matching_tasks",
        "workers.notification_tasks",
        "workers.benchmark_tasks",
        "workers.scraper_tasks",        # ← add this
    ]
)

celery_app.conf.update(
    task_serializer="json",
    result_serializer="json",
    accept_content=["json"],
    timezone="Asia/Kolkata",
    enable_utc=True,
    task_track_started=True,
    worker_prefetch_multiplier=1,
    task_acks_late=True,
)

celery_app.conf.beat_schedule = {
    "nightly-benchmark-refresh": {
        "task":     "workers.benchmark_tasks.nightly_benchmark_refresh",
        "schedule": crontab(hour=2, minute=0),
    },
    "scrape-adzuna-every-6-hours": {
        "task":     "workers.scraper_tasks.scrape_adzuna_jobs",
        "schedule": crontab(hour="*/6"),
    },
}