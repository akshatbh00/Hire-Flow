"""
api/companies/service.py — company CRUD + recruiter linking
"""
from sqlalchemy.orm import Session
from fastapi import HTTPException
from uuid import UUID, uuid4

from models import Company, Recruiter, User, UserRole
from api.companies.schemas import CompanyCreateRequest, CompanyUpdateRequest


def create_company(payload: CompanyCreateRequest, db: Session) -> Company:
    existing = db.query(Company).filter(Company.slug == payload.slug).first()
    if existing:
        raise HTTPException(409, "Company slug already taken")

    company = Company(
        id=str(uuid4()),
        name=payload.name,
        slug=payload.slug,
        website=payload.website,
        description=payload.description,
        logo_url=payload.logo_url,
    )
    db.add(company)
    db.commit()
    db.refresh(company)
    return company


def update_company(company_id: UUID, payload: CompanyUpdateRequest, db: Session) -> Company:
    company = db.query(Company).filter(Company.id == str(company_id)).first()
    if not company:
        raise HTTPException(404, "Company not found")
    for field, val in payload.model_dump(exclude_none=True).items():
        setattr(company, field, val)
    db.commit()
    db.refresh(company)
    return company


def get_company(company_id, db: Session) -> Company:
    company = db.query(Company).filter(Company.id == str(company_id)).first()
    if not company:
        raise HTTPException(404, "Company not found")
    return company


def get_company_by_recruiter(user_id, db: Session) -> Company:
    rec = db.query(Recruiter).filter(Recruiter.user_id == str(user_id)).first()
    if not rec:
        raise HTTPException(404, "No company linked to this recruiter")
    return get_company(rec.company_id, db)


def invite_recruiter(company_id: UUID, email: str, db: Session) -> Recruiter:
    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(404, "User with this email not found")

    already = db.query(Recruiter).filter(
        Recruiter.user_id   == str(user.id),
        Recruiter.company_id == str(company_id),
    ).first()
    if already:
        raise HTTPException(409, "User is already a recruiter for this company")

    user.role = UserRole.RECRUITER
    rec = Recruiter(
        id=str(uuid4()),
        user_id=str(user.id),
        company_id=str(company_id),
    )
    db.add(rec)
    db.commit()
    db.refresh(rec)
    return rec


def get_company_stats(company_id, db: Session) -> dict:
    from models import Job, Application
    from sqlalchemy import func

    active_jobs = db.query(func.count(Job.id)).filter(
        Job.company_id == str(company_id),
        Job.is_active  == True,
    ).scalar()

    total_applicants = db.query(func.count(Application.id)).join(Job).filter(
        Job.company_id == str(company_id),
    ).scalar()

    stage_counts = (
        db.query(Application.current_stage, func.count(Application.id))
        .join(Job)
        .filter(Job.company_id == str(company_id))
        .group_by(Application.current_stage)
        .all()
    )

    return {
        "active_jobs":        active_jobs,
        "total_applicants":   total_applicants,
        "pipeline_breakdown": {
            stage.value: count for stage, count in stage_counts
        },
    }