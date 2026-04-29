"""
backend/api/jobs/service.py — CRUD + search + embedding for job postings
"""
from sqlalchemy.orm import Session
from fastapi import HTTPException
from uuid import UUID, uuid4
from datetime import datetime
import logging
import re

from models import Job, Company, Recruiter, JobStatus
from ai.resume.embedder import ResumeEmbedder
from api.jobs.schemas import JobCreateRequest, JobUpdateRequest

embedder = ResumeEmbedder()
logger   = logging.getLogger(__name__)


# ── Core CRUD ──────────────────────────────────────────────────────────────

def create_job(
    payload: JobCreateRequest,
    recruiter_user_id: UUID,
    db: Session,
) -> Job:
    rec = db.query(Recruiter).filter(
        Recruiter.user_id == str(recruiter_user_id)
    ).first()
    if not rec:
        raise HTTPException(403, "You are not linked to any company")

    embedding = None
    try:
        jd_text   = f"{payload.title}\n{payload.description}\n{' '.join(payload.requirements)}"
        embedding = embedder.embed_job_description(jd_text)
    except Exception:
        pass  # skip embedding in dev without OpenAI key

    job = Job(
        id=str(uuid4()),
        company_id=str(rec.company_id),
        title=payload.title,
        description=payload.description,
        requirements=payload.requirements,
        job_type=payload.job_type,
        location=payload.location,
        remote_ok=payload.remote_ok,
        salary_min=payload.salary_min,
        salary_max=payload.salary_max,
        embedding=embedding,
    )
    db.add(job)
    db.commit()
    db.refresh(job)
    return job


def update_job(job_id: UUID, payload: JobUpdateRequest, db: Session) -> Job:
    job = db.query(Job).filter(Job.id == str(job_id)).first()
    if not job:
        raise HTTPException(404, "Job not found")
    for field, val in payload.model_dump(exclude_none=True).items():
        setattr(job, field, val)
    db.commit()
    db.refresh(job)
    return job


def get_job(job_id: str, db: Session) -> Job:
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(404, "Job not found")
    return job


def list_jobs(
    db: Session,
    job_type:  str  = None,
    location:  str  = None,
    remote_ok: bool = None,
    search:    str  = None,
    skip:      int  = 0,
    limit:     int  = 20,
) -> list[Job]:
    q = db.query(Job).filter(Job.is_active == True)
    if job_type:  q = q.filter(Job.job_type == job_type)
    if remote_ok: q = q.filter(Job.remote_ok == True)
    if location:  q = q.filter(Job.location.ilike(f"%{location}%"))
    if search:    q = q.filter(
                      Job.title.ilike(f"%{search}%") |
                      Job.description.ilike(f"%{search}%")
                  )
    return q.offset(skip).limit(limit).all()


def delete_job(job_id: UUID, db: Session):
    job = db.query(Job).filter(Job.id == str(job_id)).first()
    if not job:
        raise HTTPException(404, "Job not found")
    job.is_active = False
    db.commit()


# ── Approval flow ──────────────────────────────────────────────────────────

def get_pending_approvals(db: Session):
    return db.query(Job).filter(
        Job.status == JobStatus.PENDING_APPROVAL,
    ).order_by(Job.created_at.asc()).all()


def approve_job(job_id: str, recruiter_id: str, db: Session) -> Job:
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(404, "Job not found")

    rec = db.query(Recruiter).filter(Recruiter.user_id == recruiter_id).first()
    if not rec or str(rec.company_id) != str(job.company_id):
        raise HTTPException(403, "Not authorized")

    try:
        notify_matching_candidates(job_id, db)
    except Exception as e:
        logger.error(f"Job alert failed: {e}")

    job.status      = JobStatus.LIVE
    job.is_active   = True
    job.approved_by = recruiter_id
    job.approved_at = datetime.utcnow()
    db.commit()
    db.refresh(job)
    return job


def reject_job(job_id: str, recruiter_id: str, reason: str, db: Session) -> Job:
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(404, "Job not found")

    rec = db.query(Recruiter).filter(Recruiter.user_id == recruiter_id).first()
    if not rec or str(rec.company_id) != str(job.company_id):
        raise HTTPException(403, "Not authorized")

    job.status           = JobStatus.REJECTED
    job.rejection_reason = reason
    db.commit()
    db.refresh(job)
    return job


def close_job(job_id: str, db: Session) -> Job:
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(404, "Job not found")
    job.status    = JobStatus.CLOSED
    job.is_active = False
    db.commit()
    db.refresh(job)
    return job


# ── Match breakdown ────────────────────────────────────────────────────────

def get_match_breakdown(job_id: str, user_id: str, db: Session) -> dict:
    from models import Resume

    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(404, "Job not found")

    resume = db.query(Resume).filter(
        Resume.user_id   == user_id,
        Resume.is_active == True,
    ).first()
    if not resume:
        return {
            "overall": 0, "skills": 0, "experience": 0, "location": 0,
            "breakdown": {}, "missing_skills": [],
            "message": "Upload a resume to see your match score",
        }

    parsed = resume.parsed_data or {}

    candidate_skills = set(s.lower() for s in parsed.get("skills", []))
    required_skills  = set(s.lower() for s in (job.requirements or []))
    if required_skills:
        matched_skills = candidate_skills & required_skills
        missing_skills = sorted(required_skills - candidate_skills)
        skills_score   = round(len(matched_skills) / len(required_skills) * 100, 1)
    else:
        matched_skills = set()
        missing_skills = []
        skills_score   = 70.0

    candidate_exp = parsed.get("total_experience_years", 0) or 0
    exp_mentions  = re.findall(r"(\d+)\+?\s*years?", (job.description or ""), re.IGNORECASE)
    required_exp  = int(exp_mentions[0]) if exp_mentions else 0
    exp_score     = min(100.0, (candidate_exp / required_exp) * 100) if required_exp else 80.0

    if job.remote_ok:
        location_score = 100.0
    elif job.location and parsed.get("location"):
        job_loc        = job.location.lower()
        cand_loc       = parsed.get("location", "").lower()
        location_score = 100.0 if any(w in job_loc for w in cand_loc.split()) else 40.0
    else:
        location_score = 60.0

    overall = round(skills_score * 0.50 + exp_score * 0.30 + location_score * 0.20, 1)

    return {
        "overall":        overall,
        "skills":         skills_score,
        "experience":     round(exp_score, 1),
        "location":       location_score,
        "matched_skills": sorted(matched_skills)[:10],
        "missing_skills": missing_skills[:10],
        "candidate_exp":  candidate_exp,
        "required_exp":   required_exp,
        "remote_ok":      job.remote_ok,
        "breakdown": {
            "skills_weight":     "50%",
            "experience_weight": "30%",
            "location_weight":   "20%",
        }
    }


# ── Notifications ──────────────────────────────────────────────────────────

def notify_matching_candidates(job_id: str, db: Session):
    from models import User, InAppNotification, UserRole

    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        return

    users = db.query(User).filter(
        User.role      == UserRole.JOBSEEKER,
        User.is_active == True,
        User.job_pref.isnot(None),
    ).all()

    notified = 0
    for user in users:
        prefs   = user.job_pref or {}
        titles  = [t.lower() for t in prefs.get("titles", [])]
        job_t   = job.title.lower()
        matches = any(t in job_t or job_t in t for t in titles) if titles else True

        if matches:
            db.add(InAppNotification(
                id=str(uuid4()),
                user_id=str(user.id),
                message=f"New job alert: {job.title} at {job.company.name if job.company else 'a company'} — matches your profile!",
                stage="job_alert",
            ))
            notified += 1

    db.commit()
    logger.info(f"Job alerts sent to {notified} candidates for {job.title}")