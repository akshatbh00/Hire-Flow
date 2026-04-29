"""
FIX: applications router — 400 error when applying
Root cause: recruiter_record check was blocking job seekers who had no
recruiter row (all job seekers). Also missing null-guard on resume_id.

Drop this into backend/routers/applications.py  (replace the /apply endpoint)
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime
from typing import Optional

# ── Apply endpoint fix ────────────────────────────────────────────────────────

"""
BEFORE (broken):
    recruiter = db.query(Recruiter).filter(Recruiter.user_id == current_user.id).first()
    if not recruiter:
        raise HTTPException(status_code=400, detail="Recruiter record not found")

The code was accidentally checking for a recruiter record on the applicant
instead of just verifying the user is a job seeker.

AFTER (fixed) — replace the apply endpoint body with:
"""

FIXED_APPLY_ENDPOINT = '''
@router.post("/apply", status_code=201)
def apply_to_job(
    payload: ApplicationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Only job seekers can apply
    if current_user.role not in ("jobseeker", "job_seeker"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only job seekers can apply to jobs",
        )

    # Check job exists and is open
    job = db.query(Job).filter(Job.id == payload.job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    if job.status not in ("open", "approved", "active"):
        raise HTTPException(status_code=400, detail="Job is not accepting applications")

    # Prevent duplicate applications
    existing = (
        db.query(Application)
        .filter(
            Application.user_id == current_user.id,
            Application.job_id == payload.job_id,
        )
        .first()
    )
    if existing:
        raise HTTPException(status_code=409, detail="Already applied to this job")

    # Create application — resume_id is optional
    application = Application(
        user_id=current_user.id,
        job_id=payload.job_id,
        resume_id=payload.resume_id if hasattr(payload, "resume_id") else None,
        status="applied",
        stage="Applied",
        applied_at=datetime.utcnow(),
        cover_letter=getattr(payload, "cover_letter", None),
    )
    db.add(application)

    # Stage history entry
    stage_entry = ApplicationStageHistory(
        application=application,
        stage="Applied",
        changed_at=datetime.utcnow(),
        note="Application submitted",
    )
    db.add(stage_entry)

    db.commit()
    db.refresh(application)
    return {"message": "Application submitted", "application_id": application.id}
'''

# ── Migration note ─────────────────────────────────────────────────────────────
MIGRATION_NOTE = """
Also run this one-time fix to clean up any orphaned applications with NULL stage:

    UPDATE applications SET stage = 'Applied', status = 'applied'
    WHERE stage IS NULL OR stage = '';

And verify job statuses are consistent:
    python backend/fix_jobs.py
"""

if __name__ == "__main__":
    print("=== Apply Fix Instructions ===")
    print(FIXED_APPLY_ENDPOINT)
    print(MIGRATION_NOTE)