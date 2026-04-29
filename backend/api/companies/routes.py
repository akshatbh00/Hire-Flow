"""
backend/api/companies/routes.py
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from uuid import UUID, uuid4
from datetime import datetime
import re

from database import get_db
from api.auth.routes import get_current_user, require_recruiter, require_admin
from api.companies import service
from api.companies.schemas import (
    CompanyCreateRequest, CompanyUpdateRequest,
    CompanyOut, RecruiterInviteRequest,
)
from models import Company, Recruiter, CompanyJoinRequest, JoinRequestStatus, InAppNotification

router = APIRouter(prefix="/companies", tags=["Companies"])


@router.post("/setup", response_model=CompanyOut, status_code=201)
def setup_company(
    payload: CompanyCreateRequest,
    db: Session = Depends(get_db),
    current_user=Depends(require_recruiter),
):
    slug = re.sub(r'[^a-z0-9]+', '-', payload.name.lower()).strip('-')
    existing = db.query(Company).filter(Company.slug == slug).first()
    if existing:
        slug = f"{slug}-{str(uuid4())[:8]}"
    payload.slug = slug
    company = service.create_company(payload, db)
    rec = Recruiter(id=str(uuid4()), user_id=str(current_user.id), company_id=str(company.id))
    db.add(rec)
    db.commit()
    return company


@router.post("", response_model=CompanyOut, status_code=201)
def create_company(
    payload: CompanyCreateRequest,
    db: Session = Depends(get_db),
    _=Depends(require_admin),
):
    return service.create_company(payload, db)


@router.get("/search")
def search_companies(
    q: str,
    db: Session = Depends(get_db),
    _=Depends(get_current_user),
):
    """Search companies by name — used during recruiter registration."""
    companies = db.query(Company).filter(Company.name.ilike(f"%{q}%")).limit(10).all()
    return [{"id": str(c.id), "name": c.name, "slug": c.slug, "website": c.website} for c in companies]


@router.get("/me/join-status")
def my_join_status(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Check if current user has a pending/approved/rejected join request."""
    req = db.query(CompanyJoinRequest).filter(
        CompanyJoinRequest.requester_id == str(current_user.id),
    ).order_by(CompanyJoinRequest.created_at.desc()).first()

    if not req:
        return {"status": "none"}

    return {
        "status":       req.status.value,
        "company_id":   req.company_id,
        "company_name": req.company.name if req.company else None,
        "created_at":   req.created_at.isoformat() if req.created_at else None,
    }


@router.get("/me", response_model=CompanyOut)
def my_company(
    db: Session = Depends(get_db),
    current_user=Depends(require_recruiter),
):
    return service.get_company_by_recruiter(current_user.id, db)


@router.get("/me/stats")
def my_company_stats(
    db: Session = Depends(get_db),
    current_user=Depends(require_recruiter),
):
    company = service.get_company_by_recruiter(current_user.id, db)
    return service.get_company_stats(company.id, db)


@router.get("/me/jobs")
def my_company_jobs(
    db: Session = Depends(get_db),
    current_user=Depends(require_recruiter),
):
    from models import Job
    from api.jobs.schemas import JobOut
    rec = db.query(Recruiter).filter(Recruiter.user_id == str(current_user.id)).first()
    if not rec:
        raise HTTPException(404, "No company linked to this recruiter")
    jobs = db.query(Job).filter(Job.company_id == str(rec.company_id), Job.is_active == True).order_by(Job.created_at.desc()).all()
    return [JobOut(**{c.name: getattr(j, c.name) for c in j.__table__.columns}, company_name=j.company.name if j.company else None) for j in jobs]


@router.get("/me/join-requests")
def get_join_requests(
    db: Session = Depends(get_db),
    current_user=Depends(require_recruiter),
):
    """Pending join requests for the current recruiter's company."""
    rec = db.query(Recruiter).filter(Recruiter.user_id == str(current_user.id)).first()
    if not rec:
        raise HTTPException(404, "No company linked")
    requests = db.query(CompanyJoinRequest).filter(
        CompanyJoinRequest.company_id == str(rec.company_id),
        CompanyJoinRequest.status == JoinRequestStatus.PENDING,
    ).order_by(CompanyJoinRequest.created_at.desc()).all()
    return [
        {
            "id":              str(r.id),
            "requester_id":    r.requester_id,
            "requester_name":  r.requester.full_name if r.requester else None,
            "requester_email": r.requester.email if r.requester else None,
            "message":         r.message,
            "created_at":      r.created_at.isoformat() if r.created_at else None,
        }
        for r in requests
    ]


@router.post("/me/join-requests/{request_id}/approve")
def approve_join_request(
    request_id: str,
    db: Session = Depends(get_db),
    current_user=Depends(require_recruiter),
):
    req = db.query(CompanyJoinRequest).filter(CompanyJoinRequest.id == request_id).first()
    if not req:
        raise HTTPException(404, "Request not found")
    req.status      = JoinRequestStatus.APPROVED
    req.reviewed_by = str(current_user.id)
    req.reviewed_at = datetime.utcnow()
    rec = Recruiter(id=str(uuid4()), user_id=req.requester_id, company_id=req.company_id)
    db.add(rec)
    from models import User, UserRole
    user = db.query(User).filter(User.id == req.requester_id).first()
    if user:
        user.role = UserRole.RECRUITER
    db.add(InAppNotification(
        id=str(uuid4()), user_id=req.requester_id, stage="join_approved",
        message=f"Your request to join {req.company.name if req.company else 'the company'} has been approved!",
    ))
    db.commit()
    return {"message": "Request approved", "status": "approved"}


@router.post("/me/join-requests/{request_id}/reject")
def reject_join_request(
    request_id: str,
    payload: dict,
    db: Session = Depends(get_db),
    current_user=Depends(require_recruiter),
):
    req = db.query(CompanyJoinRequest).filter(CompanyJoinRequest.id == request_id).first()
    if not req:
        raise HTTPException(404, "Request not found")
    req.status      = JoinRequestStatus.REJECTED
    req.reviewed_by = str(current_user.id)
    req.reviewed_at = datetime.utcnow()
    db.add(InAppNotification(
        id=str(uuid4()), user_id=req.requester_id, stage="join_rejected",
        message=f"Your request to join {req.company.name if req.company else 'the company'} was not approved.",
    ))
    db.commit()
    return {"message": "Request rejected", "status": "rejected"}


@router.post("/{company_id}/request-join", status_code=201)
def request_join(
    company_id: str,
    payload: dict,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Recruiter requests to join an existing company."""
    company = db.query(Company).filter(Company.id == company_id).first()
    if not company:
        raise HTTPException(404, "Company not found")
    existing_rec = db.query(Recruiter).filter(Recruiter.user_id == str(current_user.id), Recruiter.company_id == company_id).first()
    if existing_rec:
        raise HTTPException(409, "You are already a member of this company")
    existing_req = db.query(CompanyJoinRequest).filter(
        CompanyJoinRequest.requester_id == str(current_user.id),
        CompanyJoinRequest.company_id == company_id,
        CompanyJoinRequest.status == JoinRequestStatus.PENDING,
    ).first()
    if existing_req:
        raise HTTPException(409, "You already have a pending request for this company")
    req = CompanyJoinRequest(
        id=str(uuid4()), company_id=company_id,
        requester_id=str(current_user.id), message=payload.get("message", ""),
    )
    db.add(req)
    recruiters = db.query(Recruiter).filter(Recruiter.company_id == company_id).all()
    for rec in recruiters:
        db.add(InAppNotification(
            id=str(uuid4()), user_id=rec.user_id, stage="join_request",
            message=f"{current_user.full_name or current_user.email} wants to join {company.name} as a recruiter.",
        ))
    db.commit()
    return {"id": str(req.id), "company_id": company_id, "company_name": company.name, "status": "pending"}


@router.patch("/{company_id}", response_model=CompanyOut)
def update_company(
    company_id: UUID,
    payload: CompanyUpdateRequest,
    db: Session = Depends(get_db),
    _=Depends(require_recruiter),
):
    return service.update_company(company_id, payload, db)


@router.get("/{company_id}", response_model=CompanyOut)
def get_company(
    company_id: UUID,
    db: Session = Depends(get_db),
    _=Depends(get_current_user),
):
    return service.get_company(company_id, db)


@router.post("/{company_id}/invite")
def invite_recruiter(
    company_id: UUID,
    payload: RecruiterInviteRequest,
    db: Session = Depends(get_db),
    _=Depends(require_recruiter),
):
    service.invite_recruiter(company_id, payload.email, db)
    return {"message": "Recruiter invited successfully"}