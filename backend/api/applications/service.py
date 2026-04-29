"""
backend/api/applications/service.py
"""
from sqlalchemy.orm import Session
from fastapi import HTTPException
from uuid import uuid4

from models import Application, Resume, Job, PipelineStage


def apply_to_job(
    user_id:   str,
    job_id:    str,
    resume_id: str = None,
    db:        Session = None,
) -> Application:
    # prevent duplicate applications
    existing = db.query(Application).filter(
        Application.user_id == str(user_id),
        Application.job_id  == str(job_id),
    ).first()
    if existing:
        raise HTTPException(409, "Already applied to this job")

    # resolve resume
    if resume_id:
        resume = db.query(Resume).filter(Resume.id == str(resume_id)).first()
    else:
        resume = db.query(Resume).filter(
            Resume.user_id   == str(user_id),
            Resume.is_active == True,
        ).first()

    if not resume:
        raise HTTPException(400, "No resume found. Please upload your resume first.")

    # check job exists
    job = db.query(Job).filter(Job.id == str(job_id)).first()
    if not job or not job.is_active:
        raise HTTPException(404, "Job not found or closed")

    app = Application(
        id=str(uuid4()),
        user_id=str(user_id),
        job_id=str(job_id),
        resume_id=str(resume.id),
        current_stage=PipelineStage.APPLIED,
        highest_stage=PipelineStage.APPLIED,
        match_score=None,
        benchmark_score=None,
        ats_passed=None,
    )
    db.add(app)
    db.commit()
    db.refresh(app)

    # track referral application
    try:
        from api.referrals.service import track_application
        track_application(user_id, db)
    except Exception:
        pass

    return app


def get_user_applications(user_id: str, db: Session) -> list[Application]:
    return (
        db.query(Application)
        .filter(Application.user_id == str(user_id))
        .order_by(Application.created_at.desc())
        .all()
    )


def get_application_detail(app_id: str, user_id: str, db: Session) -> Application:
    app = db.query(Application).filter(Application.id == str(app_id)).first()
    if not app:
        raise HTTPException(404, "Application not found")
    if str(app.user_id) != str(user_id):
        raise HTTPException(403, "Not your application")
    return app