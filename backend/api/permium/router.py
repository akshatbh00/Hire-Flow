"""
backend/api/premium/routes.py — premium optimizer endpoints
All routes are gated: user must have tier=PREMIUM
"""
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from uuid import UUID
from pydantic import BaseModel
from typing import Optional

from database import get_db
from api.auth.routes import get_current_user
from api.premium import service

router = APIRouter(prefix="/premium", tags=["Premium"])


class TailorRequest(BaseModel):
    resume_id: UUID
    job_id:    UUID


class BulletRequest(BaseModel):
    bullets:   list[str]
    job_title: str


class SummaryRequest(BaseModel):
    resume_id: UUID
    job_title: str
    company:   Optional[str] = ""


@router.post("/tailor")
def tailor_resume(
    payload: TailorRequest,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """
    PREMIUM — Full resume tailoring for a specific job.
    Rewrites all sections, improves bullets, regenerates summary,
    and returns a projected ATS score.
    """
    service.require_premium(current_user)
    resume, job = service.get_resume_and_job(payload.resume_id, payload.job_id, db)

    from ai.optimizer.jd_tailorer import JDTailorer
    raw_sections = service.build_raw_sections(resume)

    result = JDTailorer().tailor(
        parsed_data=resume.parsed_data or {},
        raw_sections=raw_sections,
        job_title=job.title,
        jd_text=job.description or "",
        company=job.company.name if job.company else "",
    )
    return result


@router.post("/bullets")
def improve_bullets(
    payload: BulletRequest,
    current_user=Depends(get_current_user),
):
    """PREMIUM — Improve specific bullet points toward a target role."""
    service.require_premium(current_user)
    from ai.optimizer.bullet_improver import BulletImprover
    improved = BulletImprover().improve(payload.bullets, payload.job_title)
    return {"improved": improved}


@router.post("/summary")
def generate_summary(
    payload: SummaryRequest,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """PREMIUM — Generate a targeted professional summary."""
    service.require_premium(current_user)
    resume = db.query(__import__("models").Resume).filter(
        __import__("models").Resume.id == payload.resume_id
    ).first()
    if not resume:
        from fastapi import HTTPException
        raise HTTPException(404, "Resume not found")

    from ai.optimizer.resume_rewriter import ResumeRewriter
    summary = ResumeRewriter().generate_summary(
        resume.parsed_data or {},
        payload.job_title,
        payload.company,
    )
    return {"summary": summary}


@router.get("/gap-analysis")
def gap_analysis(
    job_title: str = Query(...),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """PREMIUM — Deep gap analysis vs selected pool for a role."""
    service.require_premium(current_user)

    from models import Resume, SelectedPoolEntry
    from ai.benchmark.gap_analyzer import GapAnalyzer

    resume = db.query(Resume).filter(
        Resume.user_id   == current_user.id,
        Resume.is_active == True,
    ).first()
    if not resume:
        from fastapi import HTTPException
        raise HTTPException(400, "No active resume found")

    pool = db.query(SelectedPoolEntry).filter(
        SelectedPoolEntry.job_title.ilike(f"%{job_title}%")
    ).limit(50).all()

    pool_resume_ids = [str(p.resume_id) for p in pool]
    pool_resumes    = db.query(Resume).filter(
        Resume.id.in_(pool_resume_ids)
    ).all()
    pool_parsed = [r.parsed_data for r in pool_resumes if r.parsed_data]

    return GapAnalyzer().analyze(resume.parsed_data or {}, pool_parsed)