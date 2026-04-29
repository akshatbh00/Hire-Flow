"""
workers/scraper_tasks.py — background job scraping from Adzuna
Runs every 6 hours via Celery beat.
"""
from workers.celery_app import celery_app
from database import SessionLocal
from loguru import logger


SCRAPE_CATEGORIES = [
    "it-jobs",
    "engineering-jobs",
    "graduate-jobs",
    "accounting-finance-jobs",
    "sales-jobs",
    "marketing-jobs",
]


@celery_app.task
def scrape_adzuna_jobs():
    """
    Fetch jobs from Adzuna and store in DB.
    Runs every 6 hours via Celery beat.
    Skips duplicates by source_url.
    """
    from scraper.adzuna_scraper import AdzunaScraper
    from models import Job, Company, JobStatus
    from uuid import uuid4

    db      = SessionLocal()
    scraper = AdzunaScraper()
    added   = 0

    try:
        # get or create "External" company for scraped jobs
        ext_company = db.query(Company).filter(
            Company.slug == "external-adzuna"
        ).first()

        if not ext_company:
            ext_company = Company(
                id=str(uuid4()),
                name="External (via Adzuna)",
                slug="external-adzuna",
                description="Jobs aggregated from Adzuna job board",
            )
            db.add(ext_company)
            db.commit()
            db.refresh(ext_company)

        for category in SCRAPE_CATEGORIES:
            raw_jobs = scraper.fetch_by_category(category, pages=2)
            logger.info(f"Adzuna: fetched {len(raw_jobs)} jobs for {category}")

            for raw in raw_jobs:
                normalized = scraper.normalize(raw)

                # skip duplicates
                exists = db.query(Job).filter(
                    Job.source_url == normalized["source_url"]
                ).first()
                if exists:
                    continue

                job = Job(
                    id=str(uuid4()),
                    company_id=str(ext_company.id),
                    title=normalized["title"],
                    description=normalized["description"],
                    location=normalized["location"],
                    job_type=normalized["job_type"],
                    remote_ok=normalized["remote_ok"],
                    salary_min=normalized["salary_min"],
                    salary_max=normalized["salary_max"],
                    source=normalized["source"],
                    source_url=normalized["source_url"],
                    requirements=normalized["requirements"],
                    status=JobStatus.LIVE,      # external jobs go live directly
                    is_active=True,
                    budget_approved=True,
                )
                db.add(job)
                added += 1

        db.commit()
        logger.success(f"Adzuna scrape complete — {added} new jobs added")

    except Exception as e:
        logger.error(f"Adzuna scrape failed: {e}")
        db.rollback()
    finally:
        db.close()

    return {"added": added}


@celery_app.task
def scrape_adzuna_for_keyword(keyword: str, location: str = "india"):
    """
    On-demand scrape for a specific keyword.
    Called when new job preferences are set.
    """
    from scraper.adzuna_scraper import AdzunaScraper
    scraper = AdzunaScraper()
    jobs    = scraper.fetch_jobs(keyword, location, per_page=10)
    logger.info(f"On-demand Adzuna: {len(jobs)} jobs for '{keyword}' in {location}")
    return {"fetched": len(jobs)}