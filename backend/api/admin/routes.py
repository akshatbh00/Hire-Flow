"""
api/admin/routes.py — admin-only endpoints
Stats, user management, job seeding, pool management.
"""
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func

from database import get_db
from api.auth.routes import require_admin
from models import (
    User, Resume, Job, Application,
    Company, SelectedPoolEntry, UserRole
)

router = APIRouter(prefix="/admin", tags=["Admin"])


@router.get("/stats")
def platform_stats(
    db: Session = Depends(get_db),
    _=Depends(require_admin),
):
    """High-level platform health stats."""
    return {
        "users": {
            "total":      db.query(func.count(User.id)).scalar(),
            "jobseekers": db.query(func.count(User.id)).filter(User.role == UserRole.JOBSEEKER).scalar(),
            "recruiters": db.query(func.count(User.id)).filter(User.role == UserRole.RECRUITER).scalar(),
        },
        "resumes": {
            "total":      db.query(func.count(Resume.id)).scalar(),
            "processed":  db.query(func.count(Resume.id)).filter(Resume.embedding.isnot(None)).scalar(),
        },
        "jobs": {
            "total":      db.query(func.count(Job.id)).scalar(),
            "active":     db.query(func.count(Job.id)).filter(Job.is_active == True).scalar(),
        },
        "applications": {
            "total":      db.query(func.count(Application.id)).scalar(),
        },
        "companies":     db.query(func.count(Company.id)).scalar(),
        "selected_pool": db.query(func.count(SelectedPoolEntry.id)).scalar(),
    }


@router.get("/users")
def list_users(
    skip:  int = Query(0),
    limit: int = Query(50),
    db: Session = Depends(get_db),
    _=Depends(require_admin),
):
    users = db.query(User).offset(skip).limit(limit).all()
    return [
        {
            "id":         str(u.id),
            "email":      u.email,
            "full_name":  u.full_name,
            "role":       u.role,
            "tier":       u.tier,
            "is_active":  u.is_active,
            "created_at": u.created_at.isoformat() if u.created_at else None,
        }
        for u in users
    ]


@router.patch("/users/{user_id}/deactivate")
def deactivate_user(
    user_id: str,
    db: Session = Depends(get_db),
    _=Depends(require_admin),
):
    user = db.query(User).filter(User.id == user_id).first()
    if user:
        user.is_active = False
        db.commit()
    return {"status": "deactivated"}


@router.post("/jobs/{job_id}/rematch")
def trigger_rematch(
    job_id: str,
    _=Depends(require_admin),
):
    """Trigger background rematching for all resumes against a job."""
    from workers.matching_tasks import rematch_all_resumes_for_job
    rematch_all_resumes_for_job.delay(job_id)
    return {"status": "queued"}


@router.post("/resumes/reprocess-all")
def reprocess_all(
    _=Depends(require_admin),
):
    """Reprocess all resumes — use after model upgrade."""
    from workers.resume_tasks import reprocess_all_resumes
    reprocess_all_resumes.delay()
    return {"status": "queued"}


@router.get("/selected-pool")
def selected_pool_stats(
    db: Session = Depends(get_db),
    _=Depends(require_admin),
):
    """Benchmark pool breakdown by job title."""
    rows = db.execute(
        "SELECT job_title, COUNT(*) as count FROM selected_pool GROUP BY job_title ORDER BY count DESC LIMIT 20"
    ).fetchall()
    return [dict(r._mapping) for r in rows]