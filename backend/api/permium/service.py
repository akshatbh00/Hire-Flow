"""
api/premium/service.py — gate premium features behind subscription check
"""
from sqlalchemy.orm import Session
from fastapi import HTTPException
from uuid import UUID
from models import User, SubscriptionTier, Resume, Job


def require_premium(user: User):
    if user.tier != SubscriptionTier.PREMIUM:
        raise HTTPException(
            403,
            "This is a premium feature. Upgrade your plan to access resume optimizer."
        )


def get_resume_and_job(
    resume_id: UUID,
    job_id: UUID,
    db: Session,
):
    resume = db.query(Resume).filter(Resume.id == resume_id).first()
    if not resume:
        raise HTTPException(404, "Resume not found")

    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(404, "Job not found")

    return resume, job


def build_raw_sections(resume) -> dict:
    """
    Reconstruct raw section text from parsed_data + raw_text.
    Used as input for the optimizer.
    """
    parsed = resume.parsed_data or {}
    raw    = resume.raw_text or ""

    # best effort — use parsed fields to reconstruct sections
    sections = {}

    exp_entries = parsed.get("experience", [])
    if exp_entries:
        sections["experience"] = "\n".join(
            f"{e.get('title')} at {e.get('company')}: {e.get('description', '')}"
            for e in exp_entries
        )

    skills = parsed.get("skills", [])
    if skills:
        sections["skills"] = ", ".join(skills)

    certs = parsed.get("certifications", [])
    if certs:
        sections["certifications"] = ", ".join(certs)

    # fallback — use raw text slice for projects
    sections["projects"] = raw[2000:3500] if len(raw) > 2000 else ""

    return sections