"""
backend/api/insider/routes.py
"""
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from database import get_db
from api.auth.routes import get_current_user
from api.insider import service
from api.insider.schemas import (
    AddWorkHistoryRequest, ReferralRequestCreate,
    ReferralRequestOut, ReferralRequestAction
)

router = APIRouter(prefix="/insider", tags=["Insider Network"])


# ── Work History ───────────────────────────────────────────────────────────

@router.post("/work-history", status_code=201)
def add_work_history(
    payload: AddWorkHistoryRequest,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Add current/past company to your profile — makes you visible as insider."""
    entry = service.add_work_history(
        user_id=str(current_user.id),
        company_name=payload.company_name,
        is_current=payload.is_current,
        is_open_to_refer=payload.is_open_to_refer,
        network_visible=payload.network_visible,
        db=db,
    )
    return {"id": entry.id, "company": entry.company_name, "is_current": entry.is_current}


@router.get("/work-history")
def my_work_history(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Get your own work history."""
    return service.get_work_history(str(current_user.id), db)


# ── Insider Discovery ──────────────────────────────────────────────────────

@router.get("/job/{job_id}/insiders")
def insiders_for_job(
    job_id: str,
    db: Session = Depends(get_db),
    _=Depends(get_current_user),
):
    """Auto-suggest insiders at the company for this job."""
    return service.find_insiders_for_job(job_id, db)


@router.get("/search")
def search_insiders(
    company: str = Query(...),
    db: Session = Depends(get_db),
    _=Depends(get_current_user),
):
    """Search insiders by company name."""
    return service.search_insiders(company, db)


# ── Referral Requests ──────────────────────────────────────────────────────

@router.post("/request", response_model=ReferralRequestOut, status_code=201)
def request_referral(
    payload: ReferralRequestCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Job seeker requests referral from an insider."""
    req = service.create_referral_request(
        requester_id=str(current_user.id),
        insider_id=str(payload.insider_id),
        job_id=str(payload.job_id),
        message=payload.message,
        db=db,
    )
    return req


@router.patch("/request/{request_id}")
def respond_to_referral(
    request_id: str,
    payload: ReferralRequestAction,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Insider accepts or declines a referral request."""
    if payload.action not in ("accept", "decline"):
        from fastapi import HTTPException
        raise HTTPException(400, "Action must be 'accept' or 'decline'")
    return service.respond_to_request(
        request_id=request_id,
        insider_id=str(current_user.id),
        action=payload.action,
        db=db,
    )


@router.get("/requests/incoming")
def incoming_requests(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Insider sees all referral requests sent to them."""
    return service.get_my_requests_as_insider(str(current_user.id), db)


@router.get("/requests/sent")
def sent_requests(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Job seeker sees all referral requests they sent."""
    return service.get_my_requests_as_requester(str(current_user.id), db)


@router.get("/limit")
def my_referral_limit(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Check remaining referrals this month."""
    return service.check_monthly_limit(str(current_user.id), db)