"""
api/salary/service.py — salary insights from job postings
Aggregates salary data by role + city + experience level.
"""
from sqlalchemy.orm import Session
from sqlalchemy import func
from models import Job, JobStatus, SalaryInsight
from uuid import uuid4
from datetime import datetime


def get_salary_insights(
    job_title: str,
    location:  str = None,
    db:        Session = None,
) -> dict:
    """
    Get market salary data for a role.
    Pulls from both live jobs and stored insights.
    """
    # query live jobs for real-time data
    q = db.query(Job).filter(
        Job.title.ilike(f"%{job_title}%"),
        Job.salary_min.isnot(None),
        Job.salary_max.isnot(None),
        Job.status == JobStatus.LIVE,
    )
    if location:
        q = q.filter(Job.location.ilike(f"%{location}%"))

    jobs = q.all()

    if not jobs:
        # fallback to stored insights
        return _from_stored_insights(job_title, location, db)

    salaries_min = [j.salary_min for j in jobs if j.salary_min]
    salaries_max = [j.salary_max for j in jobs if j.salary_max]
    all_salaries = salaries_min + salaries_max

    if not all_salaries:
        return {"message": "No salary data available for this role yet"}

    avg   = int(sum(all_salaries) / len(all_salaries))
    low   = min(salaries_min) if salaries_min else 0
    high  = max(salaries_max) if salaries_max else 0

    # store aggregated insight
    _upsert_insight(job_title, location or "All", low, high, avg, len(jobs), db)

    return {
        "job_title":    job_title,
        "location":     location or "All India",
        "salary_min":   low,
        "salary_max":   high,
        "salary_avg":   avg,
        "sample_size":  len(jobs),
        "currency":     "INR",
        "formatted": {
            "min": f"₹{low/100000:.1f}L",
            "max": f"₹{high/100000:.1f}L",
            "avg": f"₹{avg/100000:.1f}L",
        },
        "percentiles": {
            "p25": f"₹{_percentile(all_salaries, 25)/100000:.1f}L",
            "p50": f"₹{_percentile(all_salaries, 50)/100000:.1f}L",
            "p75": f"₹{_percentile(all_salaries, 75)/100000:.1f}L",
        }
    }


def get_salary_by_location(job_title: str, db: Session) -> list[dict]:
    """Compare salaries for same role across cities."""
    jobs = db.query(Job).filter(
        Job.title.ilike(f"%{job_title}%"),
        Job.salary_min.isnot(None),
        Job.location.isnot(None),
        Job.status == JobStatus.LIVE,
    ).all()

    city_data: dict[str, list] = {}
    for job in jobs:
        city = job.location.split(",")[0].strip()
        if city not in city_data:
            city_data[city] = []
        if job.salary_min and job.salary_max:
            city_data[city].append((job.salary_min + job.salary_max) / 2)

    result = []
    for city, salaries in city_data.items():
        if salaries:
            avg = int(sum(salaries) / len(salaries))
            result.append({
                "city":       city,
                "avg_salary": avg,
                "formatted":  f"₹{avg/100000:.1f}L",
                "samples":    len(salaries),
            })

    return sorted(result, key=lambda x: x["avg_salary"], reverse=True)


def get_top_paying_roles(db: Session, limit: int = 10) -> list[dict]:
    """Top paying roles on the platform."""
    jobs = db.query(Job).filter(
        Job.salary_max.isnot(None),
        Job.status == JobStatus.LIVE,
    ).order_by(Job.salary_max.desc()).limit(limit * 3).all()

    seen, result = set(), []
    for job in jobs:
        key = job.title.lower().split()[0]
        if key not in seen:
            seen.add(key)
            result.append({
                "title":     job.title,
                "max_salary": job.salary_max,
                "formatted": f"₹{job.salary_max/100000:.1f}L",
                "company":   job.company.name if job.company else "Unknown",
            })
        if len(result) >= limit:
            break

    return result


# ── Helpers ────────────────────────────────────────────────────────────────

def _percentile(data: list, pct: int) -> float:
    if not data:
        return 0
    sorted_data = sorted(data)
    idx = int(len(sorted_data) * pct / 100)
    return sorted_data[min(idx, len(sorted_data) - 1)]


def _upsert_insight(
    job_title: str, location: str,
    low: int, high: int, avg: int,
    sample_size: int, db: Session
):
    existing = db.query(SalaryInsight).filter(
        SalaryInsight.job_title.ilike(f"%{job_title}%"),
        SalaryInsight.location.ilike(f"%{location}%"),
    ).first()

    if existing:
        existing.salary_min  = low
        existing.salary_max  = high
        existing.salary_avg  = avg
        existing.sample_size = sample_size
        existing.updated_at  = datetime.utcnow()
    else:
        db.add(SalaryInsight(
            id=str(uuid4()),
            job_title=job_title,
            location=location,
            salary_min=low,
            salary_max=high,
            salary_avg=avg,
            sample_size=sample_size,
        ))
    try:
        db.commit()
    except Exception:
        db.rollback()


def _from_stored_insights(job_title: str, location: str, db: Session) -> dict:
    insight = db.query(SalaryInsight).filter(
        SalaryInsight.job_title.ilike(f"%{job_title}%"),
    ).first()

    if not insight:
        return {
            "message":     "No salary data available yet for this role",
            "job_title":   job_title,
            "sample_size": 0,
        }

    return {
        "job_title":   insight.job_title,
        "location":    insight.location,
        "salary_min":  insight.salary_min,
        "salary_max":  insight.salary_max,
        "salary_avg":  insight.salary_avg,
        "sample_size": insight.sample_size,
        "currency":    "INR",
        "formatted": {
            "min": f"₹{insight.salary_min/100000:.1f}L",
            "max": f"₹{insight.salary_max/100000:.1f}L",
            "avg": f"₹{insight.salary_avg/100000:.1f}L",
        },
    }