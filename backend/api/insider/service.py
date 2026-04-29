"""
api/insider/service.py — insider referral network
Insiders: employees who work at companies and can refer candidates.
"""
from sqlalchemy.orm import Session
from sqlalchemy import func
from fastapi import HTTPException
from uuid import uuid4
from datetime import datetime

from models import (
    UserWorkHistory, InsiderReferralRequest,
    InsiderReferralMonthlyLimit, Application, User
)

MONTHLY_LIMIT   = 20
REFERRAL_BOOST  = 12.0   # +12% to match_score


# ── Work History ───────────────────────────────────────────────────────────

def add_work_history(user_id: str, company_name: str, is_current: bool,
                     is_open_to_refer: bool, network_visible: bool,
                     db: Session) -> UserWorkHistory:
    entry = UserWorkHistory(
        id=str(uuid4()),
        user_id=user_id,
        company_name=company_name.strip().lower(),
        is_current=is_current,
        is_open_to_refer=is_open_to_refer,
        network_visible=network_visible,
    )
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return entry


def get_work_history(user_id: str, db: Session) -> list[UserWorkHistory]:
    return db.query(UserWorkHistory).filter(
        UserWorkHistory.user_id == user_id
    ).all()


# ── Insider Discovery ──────────────────────────────────────────────────────

def find_insiders_for_job(job_id: str, db: Session) -> list[dict]:
    """
    Find insiders who work at the company that posted this job.
    Auto-suggestion path.
    """
    from models import Job, Company
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        return []

    company = db.query(Company).filter(Company.id == job.company_id).first()
    if not company:
        return []

    company_name = company.name.strip().lower()

    insiders = db.query(UserWorkHistory).filter(
        UserWorkHistory.company_name    == company_name,
        UserWorkHistory.is_current      == True,
        UserWorkHistory.network_visible == True,
        UserWorkHistory.is_open_to_refer == True,
    ).all()

    result = []
    for ins in insiders:
        user = db.query(User).filter(User.id == ins.user_id).first()
        if user:
            result.append({
                "user_id":          str(user.id),
                "full_name":        user.full_name,
                "company_name":     company.name,
                "is_open_to_refer": ins.is_open_to_refer,
            })
    return result


def search_insiders(company_name: str, db: Session) -> list[dict]:
    """Search insiders by company name — manual search path."""
    insiders = db.query(UserWorkHistory).filter(
        UserWorkHistory.company_name.ilike(f"%{company_name.lower()}%"),
        UserWorkHistory.network_visible  == True,
        UserWorkHistory.is_open_to_refer == True,
    ).all()

    result = []
    for ins in insiders:
        user = db.query(User).filter(User.id == ins.user_id).first()
        if user:
            result.append({
                "user_id":          str(user.id),
                "full_name":        user.full_name,
                "company_name":     ins.company_name,
                "is_open_to_refer": ins.is_open_to_refer,
            })
    return result


# ── Monthly Limit ──────────────────────────────────────────────────────────

def _get_or_create_limit(insider_id: str, db: Session) -> InsiderReferralMonthlyLimit:
    month = datetime.utcnow().strftime("%Y-%m")
    limit = db.query(InsiderReferralMonthlyLimit).filter(
        InsiderReferralMonthlyLimit.insider_id == insider_id,
        InsiderReferralMonthlyLimit.month      == month,
    ).first()
    if not limit:
        limit = InsiderReferralMonthlyLimit(
            id=str(uuid4()),
            insider_id=insider_id,
            month=month,
            count=0,
        )
        db.add(limit)
        db.commit()
        db.refresh(limit)
    return limit


def check_monthly_limit(insider_id: str, db: Session) -> dict:
    limit = _get_or_create_limit(insider_id, db)
    return {
        "used":      limit.count,
        "remaining": max(0, MONTHLY_LIMIT - limit.count),
        "limit":     MONTHLY_LIMIT,
    }


# ── Referral Request ───────────────────────────────────────────────────────

def create_referral_request(
    requester_id: str,
    insider_id:   str,
    job_id:       str,
    message:      str,
    db:           Session,
) -> InsiderReferralRequest:

    # check insider monthly limit
    limit = _get_or_create_limit(insider_id, db)
    if limit.count >= MONTHLY_LIMIT:
        raise HTTPException(429, f"This insider has reached their {MONTHLY_LIMIT} referrals/month limit")

    # one referral per candidate per job
    existing = db.query(InsiderReferralRequest).filter(
        InsiderReferralRequest.requester_id == requester_id,
        InsiderReferralRequest.job_id       == job_id,
    ).first()
    if existing:
        raise HTTPException(409, "You already have a referral request for this job")

    req = InsiderReferralRequest(
        id=str(uuid4()),
        requester_id=requester_id,
        insider_id=insider_id,
        job_id=job_id,
        message=message,
        status="pending",
        boost_applied=False,
    )
    db.add(req)
    db.commit()
    db.refresh(req)
    return req


def respond_to_request(
    request_id: str,
    insider_id: str,
    action:     str,   # "accept" or "decline"
    db:         Session,
) -> InsiderReferralRequest:

    req = db.query(InsiderReferralRequest).filter(
        InsiderReferralRequest.id         == request_id,
        InsiderReferralRequest.insider_id == insider_id,
    ).first()
    if not req:
        raise HTTPException(404, "Referral request not found")
    if req.status != "pending":
        raise HTTPException(409, "Request already actioned")

    req.status     = "accepted" if action == "accept" else "declined"
    req.updated_at = datetime.utcnow()

    if action == "accept":
        # increment monthly count
        limit = _get_or_create_limit(insider_id, db)
        limit.count += 1

        # apply +12% score boost to application
        _apply_boost(req, db)

        # ── HRMS stub (passthrough — wire later) ──────────────────
        # hrms_flag_referred_candidate(req.requester_id, req.job_id)
        # ──────────────────────────────────────────────────────────

    db.commit()
    db.refresh(req)
    return req


def _apply_boost(req: InsiderReferralRequest, db: Session):
    """Apply +12% match score boost to the candidate's application."""
    app = db.query(Application).filter(
        Application.user_id == req.requester_id,
        Application.job_id  == req.job_id,
    ).first()

    if app and not req.boost_applied:
        current_score    = app.match_score or 50.0
        app.match_score  = min(100.0, current_score + REFERRAL_BOOST)
        req.boost_applied = True
        req.application_id = str(app.id)

        # tag application as insider referred
        if app.notes:
            app.notes += " | INSIDER_REFERRED"
        else:
            app.notes = "INSIDER_REFERRED"


def get_my_requests_as_requester(user_id: str, db: Session) -> list:
    return db.query(InsiderReferralRequest).filter(
        InsiderReferralRequest.requester_id == user_id
    ).order_by(InsiderReferralRequest.created_at.desc()).all()


def get_my_requests_as_insider(user_id: str, db: Session) -> list:
    return db.query(InsiderReferralRequest).filter(
        InsiderReferralRequest.insider_id == user_id
    ).order_by(InsiderReferralRequest.created_at.desc()).all()