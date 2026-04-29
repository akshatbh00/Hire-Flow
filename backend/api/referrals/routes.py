"""
backend/api/referrals/routes.py
"""
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from uuid import UUID

from database import get_db
from api.auth.routes import get_current_user
from api.referrals import service
from api.referrals.schemas import ReferralCreateRequest, ReferralOut, ReferralStatsOut
from config import settings

router = APIRouter(prefix="/referrals", tags=["Referrals"])

BASE_URL = "http://localhost:3000"   # change to prod URL later


def _enrich(ref, base_url: str) -> ReferralOut:
    return ReferralOut(
        id=ref.id,
        referral_code=ref.referral_code,
        job_id=ref.job_id,
        status=ref.status,
        reward_granted=ref.reward_granted,
        referral_url=f"{base_url}/register?ref={ref.referral_code}",
    )


@router.post("", response_model=ReferralOut, status_code=201)
def create_referral(
    payload: ReferralCreateRequest,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Generate a referral link — optionally tied to a specific job."""
    ref = service.create_referral(current_user.id, payload.job_id, db)
    return _enrich(ref, BASE_URL)


@router.get("", response_model=list[ReferralOut])
def my_referrals(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """All referral links created by this user."""
    refs = service.get_my_referrals(current_user.id, db)
    return [_enrich(r, BASE_URL) for r in refs]


@router.get("/stats", response_model=ReferralStatsOut)
def my_stats(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Referral stats — signups, applications, hires, rewards."""
    return service.get_stats(current_user.id, db)


@router.get("/validate/{code}")
def validate_code(
    code: str,
    db: Session = Depends(get_db),
):
    """Public endpoint — validate a referral code on register page."""
    ref = service.get_referral_by_code(code, db)
    return {
        "valid":    True,
        "code":     ref.referral_code,
        "job_id":   ref.job_id,
        "status":   ref.status,
    }