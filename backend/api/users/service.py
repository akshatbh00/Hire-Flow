"""
api/users/service.py — user profile + dashboard aggregation
"""
from sqlalchemy.orm import Session
from sqlalchemy import func
from fastapi import HTTPException
from uuid import UUID

from models import User, Resume, Application, InAppNotification, PipelineStage


def get_dashboard(user_id: UUID, db: Session) -> dict:
    """
    Aggregates everything for the job seeker dashboard in one DB round-trip.
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(404, "User not found")

    # active resume summary
    resume = db.query(Resume).filter(
        Resume.user_id  == user_id,
        Resume.is_active == True,
    ).first()

    active_resume = None
    if resume:
        active_resume = {
            "resume_id":  str(resume.id),
            "ats_score":  resume.ats_score,
            "skills":     (resume.parsed_data or {}).get("skills", [])[:8],
            "name":       (resume.parsed_data or {}).get("name"),
        }

    # all applications, ordered by recency
    apps = (
        db.query(Application)
        .filter(Application.user_id == user_id)
        .order_by(Application.created_at.desc())
        .limit(10)
        .all()
    )

    # highest stage ever reached (for the hero dashboard card)
    STAGE_ORDER = [
        PipelineStage.APPLIED, PipelineStage.ATS_SCREENING,
        PipelineStage.ROUND_1, PipelineStage.ROUND_2, PipelineStage.ROUND_3,
        PipelineStage.HR_ROUND, PipelineStage.OFFER, PipelineStage.SELECTED,
    ]
    highest = None
    for app in apps:
        if app.highest_stage in STAGE_ORDER:
            if highest is None or STAGE_ORDER.index(app.highest_stage) > STAGE_ORDER.index(highest):
                highest = app.highest_stage

    pipeline = [
        {
            "application_id": str(a.id),
            "job_title":      a.job.title if a.job else None,
            "company":        a.job.company.name if a.job and a.job.company else None,
            "current_stage":  a.current_stage.value,
            "highest_stage":  a.highest_stage.value,
            "match_score":    a.match_score,
            "applied_at":     a.created_at.isoformat(),
        }
        for a in apps
    ]

    # cached job matches from resume parsed_data
    top_matches = []
    if resume and resume.parsed_data:
        top_matches = resume.parsed_data.get("_cached_matches", [])[:5]

    # unread notifications
    notifs = (
        db.query(InAppNotification)
        .filter(
            InAppNotification.user_id  == user_id,
            InAppNotification.is_read  == False,
        )
        .order_by(InAppNotification.created_at.desc())
        .limit(10)
        .all()
    )

    notifications = [
        {
            "id":         str(n.id),
            "message":    n.message,
            "stage":      n.stage,
            "is_read":    n.is_read,
            "created_at": n.created_at.isoformat(),
        }
        for n in notifs
    ]

    return {
        "user_id":        str(user.id),
        "full_name":      user.full_name,
        "tier":           user.tier,
        "active_resume":  active_resume,
        "highest_stage":  highest.value if highest else None,
        "total_applied":  len(apps),
        "active_pipeline": pipeline,
        "top_job_matches": top_matches,
        "notifications":   notifications,
    }


def update_profile(user_id: UUID, full_name: str = None, job_pref: dict = None, db: Session = None) -> User:
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(404, "User not found")
    if full_name:
        user.full_name = full_name
    if job_pref:
        user.job_pref = job_pref
    db.commit()
    db.refresh(user)
    return user


def mark_notifications_read(user_id: UUID, db: Session):
    db.query(InAppNotification).filter(
        InAppNotification.user_id == user_id,
        InAppNotification.is_read == False,
    ).update({"is_read": True})
    db.commit()

# % profile completeness
def get_profile_completeness(user_id: str, db: Session) -> dict:
    """
    Calculates profile completeness % with actionable nudges.
    """
    from models import Resume, UserWorkHistory

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(404, "User not found")

    resume = db.query(Resume).filter(
        Resume.user_id   == user_id,
        Resume.is_active == True,
    ).first()

    parsed      = (resume.parsed_data or {}) if resume else {}
    work_history = db.query(UserWorkHistory).filter(
        UserWorkHistory.user_id == user_id
    ).first()

    checks = {
        "resume_uploaded": {
            "done":   resume is not None,
            "points": 25,
            "nudge":  "Upload your resume to get started",
        },
        "skills_filled": {
            "done":   len(parsed.get("skills", [])) >= 3,
            "points": 20,
            "nudge":  "Add at least 3 skills to your resume",
        },
        "job_preferences": {
            "done":   bool(user.job_pref and user.job_pref.get("titles")),
            "points": 15,
            "nudge":  "Set your job preferences in onboarding",
        },
        "work_history": {
            "done":   work_history is not None,
            "points": 15,
            "nudge":  "Add your current company to unlock insider network",
        },
        "experience_filled": {
            "done":   len(parsed.get("experience", [])) >= 1,
            "points": 15,
            "nudge":  "Make sure your resume has work experience",
        },
        "education_filled": {
            "done":   len(parsed.get("education", [])) >= 1,
            "points": 10,
            "nudge":  "Add your education details to resume",
        },
    }

    earned     = sum(v["points"] for v in checks.values() if v["done"])
    total      = sum(v["points"] for v in checks.values())
    score      = round((earned / total) * 100, 1)
    incomplete = [
        {"field": k, "nudge": v["nudge"], "points": v["points"]}
        for k, v in checks.items() if not v["done"]
    ]

    # grade
    grade = "A" if score >= 90 else "B" if score >= 70 else "C" if score >= 50 else "D"

    return {
        "score":      score,
        "grade":      grade,
        "earned_pts": earned,
        "total_pts":  total,
        "checks":     {k: v["done"] for k, v in checks.items()},
        "incomplete":  incomplete,
        "message":    "Great profile!" if score >= 80 else
                      "Almost there!" if score >= 60 else
                      "Complete your profile to get more visibility",
    }