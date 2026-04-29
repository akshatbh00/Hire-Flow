"""
api/resume/routes.py — resume upload, ATS report, benchmark, job matches
Replaces the flat api_routes.py. Auth-gated.
"""
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, Query
from sqlalchemy.orm import Session
from uuid import UUID, uuid4

from database import get_db
from models import Resume, User
from storage.s3 import upload_file, get_presigned_url
from workers.resume_tasks import process_resume
from api.auth.routes import get_current_user

router = APIRouter(prefix="/resume", tags=["Resume"])

ALLOWED_TYPES = {
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
}


@router.post("/upload", status_code=202)
async def upload_resume(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(400, "Only PDF and DOCX are supported")

    resume_id = str(uuid4())
    file_key  = f"resumes/{resume_id}/{file.filename}"
    content   = await file.read()

    upload_file(file_key, content)

    db.query(Resume).filter(
        Resume.user_id == str(current_user.id),
        Resume.is_active == True,
    ).update({"is_active": False})

    resume = Resume(
        id=resume_id,
        user_id=str(current_user.id),
        file_path=file_key,
    )
    db.add(resume)
    db.commit()

    # run pipeline directly in dev (no Celery needed)
    try:
        from ai.resume.pipeline import ResumePipeline
        ResumePipeline().run(resume_id, db)
    except Exception as e:
        print(f"Pipeline error (non-blocking): {e}")

    return {"resume_id": resume_id, "status": "processed"}

@router.get("/me")
def my_resume(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Return the current user's active resume + ATS report."""
    resume = db.query(Resume).filter(
        Resume.user_id == current_user.id,
        Resume.is_active == True,
    ).first()
    if not resume:
        raise HTTPException(404, "No resume uploaded yet")
    return {
        "resume_id":   str(resume.id),
        "ats_score":   resume.ats_score,
        "ats_report":  resume.ats_report,
        "parsed_data": resume.parsed_data,
        "file_url":    get_presigned_url(resume.file_path),
    }


@router.get("/{resume_id}/ats")
def get_ats_report(
    resume_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    r = db.query(Resume).filter(Resume.id == resume_id).first()
    if not r:
        raise HTTPException(404, "Resume not found")
    if r.user_id != current_user.id and current_user.role not in ("recruiter", "admin"):
        raise HTTPException(403, "Not allowed")
    return {"score": r.ats_score, "report": r.ats_report}


@router.get("/{resume_id}/benchmark")
def get_benchmark(
    resume_id: UUID,
    job_title: str = Query(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    from ai.benchmark.comparator import BenchmarkComparator
    return BenchmarkComparator().compare(str(resume_id), job_title, db)


@router.get("/{resume_id}/jobs")
def get_matched_jobs(
    resume_id: UUID,
    limit: int = Query(20, le=50),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    from ai.matching.job_matcher import JobMatcher
    return JobMatcher().match_jobs_for_resume(str(resume_id), db, limit)