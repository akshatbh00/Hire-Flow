"""
backend/api/scraper/adzuna_scraper.py — fetches jobs from Adzuna API
Free tier: 250 requests/day
Covers India with 100K+ active listings
"""
import httpx
from config import settings
from loguru import logger

ADZUNA_BASE = "https://api.adzuna.com/v1/api/jobs"

CATEGORY_MAP = {
    "fulltime":   "it-jobs",
    "parttime":   "part-time-jobs",
    "contract":   "contract-jobs",
    "internship": "graduate-jobs",
    "remote":     "it-jobs",
}

INDIA_LOCATIONS = [
    "bangalore", "mumbai", "delhi", "hyderabad",
    "pune", "chennai", "kolkata", "noida", "gurgaon"
]


class AdzunaScraper:

    def __init__(self):
        self.app_id  = settings.ADZUNA_APP_ID
        self.app_key = settings.ADZUNA_APP_KEY
        self.country = settings.ADZUNA_COUNTRY

    def fetch_jobs(self, keywords: str, location: str = "india", page: int = 1, per_page: int = 20, category: str = "it-jobs") -> list[dict]:
        if not self.app_id or not self.app_key:
            logger.warning("Adzuna API credentials not configured")
            return []
        url    = f"{ADZUNA_BASE}/{self.country}/search/{page}"
        params = {
            "app_id":           self.app_id,
            "app_key":          self.app_key,
            "what":             keywords,
            "where":            location,
            "results_per_page": per_page,
            "category":         category,
            "content-type":     "application/json",
            "salary_include_unknown": 0,
        }
        try:
            with httpx.Client(timeout=15) as client:
                resp = client.get(url, params=params)
                resp.raise_for_status()
                return resp.json().get("results", [])
        except Exception as e:
            logger.error(f"Adzuna fetch failed: {e}")
            return []

    def fetch_by_category(self, category: str, pages: int = 2) -> list[dict]:
        all_jobs = []
        for page in range(1, pages + 1):
            jobs = self.fetch_jobs(keywords="", location="india", page=page, per_page=20, category=category)
            all_jobs.extend(jobs)
            if len(jobs) < 20:
                break
        return all_jobs

    def normalize(self, raw_job: dict) -> dict:
        salary_min = raw_job.get("salary_min")
        salary_max = raw_job.get("salary_max")
        return {
            "title":        raw_job.get("title", "").strip(),
            "description":  raw_job.get("description", "").strip(),
            "location":     raw_job.get("location", {}).get("display_name", "India"),
            "company":      raw_job.get("company", {}).get("display_name", "Unknown"),
            "salary_min":   int(salary_min) if salary_min else None,
            "salary_max":   int(salary_max) if salary_max else None,
            "source":       "adzuna",
            "source_url":   raw_job.get("redirect_url", ""),
            "job_type":     "fulltime",
            "remote_ok":    "remote" in raw_job.get("title", "").lower(),
            "requirements": [],
        }


# ── Standalone seed function (outside class) ───────────────────────────────

def seed_jobs(db, pages_per_category: int = 2):
    """Seed Adzuna jobs into DB as LIVE external jobs."""
    from models import Job, Company, JobStatus
    from uuid import uuid4
    from datetime import datetime

    scraper = AdzunaScraper()

    company = db.query(Company).filter(Company.slug == "adzuna-jobs").first()
    if not company:
        company = Company(
            id=str(uuid4()),
            name="External Jobs (Adzuna)",
            slug="adzuna-jobs",
            website="https://www.adzuna.in",
            description="Jobs aggregated from Adzuna",
        )
        db.add(company)
        db.commit()
        db.refresh(company)

    total = 0
    for category in ["it-jobs", "engineering-jobs", "graduate-jobs"]:
        raw_jobs = scraper.fetch_by_category(category, pages=pages_per_category)
        for r in raw_jobs:
            j = scraper.normalize(r)
            if not j["source_url"]:
                continue
            exists = db.query(Job).filter(Job.source_url == j["source_url"]).first()
            if exists:
                continue
            db.add(Job(
                id=str(uuid4()),
                company_id=str(company.id),
                title=j["title"][:255],
                description=j["description"][:5000],
                requirements=[],
                job_type=j["job_type"],
                location=j["location"],
                remote_ok=j["remote_ok"],
                salary_min=j["salary_min"],
                salary_max=j["salary_max"],
                is_active=True,
                source="adzuna",
                source_url=j["source_url"],
                status=JobStatus.LIVE,
                budget_approved=True,
                created_at=datetime.utcnow(),
            ))
            total += 1
        db.commit()
        logger.info(f"[Adzuna] Seeded category: {category}")

    logger.info(f"[Adzuna] Total jobs added: {total}")
    return total