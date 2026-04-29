"""
backend/api/courses/routes.py
"""
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from database import get_db
from api.auth.routes import get_current_user
from api.courses import service

router = APIRouter(prefix="/courses", tags=["Course Suggestions"])


@router.get("/for-skills")
def courses_for_skills(
    skills: str = Query(..., description="Comma separated skill gaps"),
    _=Depends(get_current_user),
):
    """
    Get Coursera course suggestions for skill gaps.
    Google, IBM, Microsoft, Meta certified courses only.
    """
    skill_list = [s.strip() for s in skills.split(",") if s.strip()]
    return {
        "skill_gaps": skill_list,
        "courses":    service.get_courses_for_skills(skill_list),
        "total":      len(service.get_courses_for_skills(skill_list)),
    }


@router.get("/for-job")
def courses_for_job(
    job_title: str = Query(...),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """
    Get course suggestions based on job title.
    Uses your current skills to personalize suggestions.
    """
    from models import Resume
    resume  = db.query(Resume).filter(
        Resume.user_id   == str(current_user.id),
        Resume.is_active == True,
    ).first()
    skills  = (resume.parsed_data or {}).get("skills", []) if resume else []
    courses = service.get_courses_for_job(job_title, skills)
    return {
        "job_title": job_title,
        "courses":   courses,
        "total":     len(courses),
    }


@router.get("/gap-analysis/{resume_id}")
def gap_analysis_with_courses(
    resume_id: str,
    job_title: str = Query(...),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """
    Full gap analysis + course suggestions in one call.
    Shows: missing skills + recommended courses to fill them.
    """
    from models import Resume, SelectedPoolEntry
    from ai.benchmark.gap_analyzer import GapAnalyzer

    resume = db.query(Resume).filter(Resume.id == resume_id).first()
    if not resume:
        from fastapi import HTTPException
        raise HTTPException(404, "Resume not found")

    # get pool resumes
    pool = db.query(SelectedPoolEntry).filter(
        SelectedPoolEntry.job_title.ilike(f"%{job_title}%")
    ).limit(30).all()

    pool_resumes = db.query(Resume).filter(
        Resume.id.in_([str(p.resume_id) for p in pool])
    ).all()
    pool_parsed = [r.parsed_data for r in pool_resumes if r.parsed_data]

    # gap analysis
    gaps   = GapAnalyzer().analyze(resume.parsed_data or {}, pool_parsed)
    skills = gaps.get("critical_gaps", [])
    skill_names = [g["skill"] if isinstance(g, dict) else g for g in skills]

    # course suggestions
    courses = service.get_courses_for_skills(skill_names)

    return {
        "job_title":    job_title,
        "gap_analysis": gaps,
        "courses":      courses,
        "message":      f"Found {len(courses)} courses to bridge your skill gaps",
    }