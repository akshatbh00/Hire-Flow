"""
api/referrals/service.py — referral link generation + tracking
"""
import random
import string
from sqlalchemy.orm import Session
from fastapi import HTTPException
from uuid import UUID, uuid4
from datetime import datetime

from models import Referral, User, Job


def generate_code(length: int = 8) -> str:
    return "".join(random.choices(string.ascii_uppercase + string.digits, k=length))


def create_referral(
    referrer_id: UUID,
    job_id:      UUID = None,
    db:          Session = None,
) -> Referral:
    # generate unique code
    for _ in range(10):
        code = generate_code()
        if not db.query(Referral).filter(Referral.referral_code == code).first():
            break

    referral = Referral(
        id=str(uuid4()),
        referrer_id=str(referrer_id),
        job_id=str(job_id) if job_id else None,
        referral_code=code,
        status="pending",
    )
    db.add(referral)
    db.commit()
    db.refresh(referral)
    return referral


def get_referral_by_code(code: str, db: Session) -> Referral:
    ref = db.query(Referral).filter(Referral.referral_code == code).first()
    if not ref:
        raise HTTPException(404, "Invalid referral code")
    return ref


def track_signup(code: str, new_user_id: UUID, db: Session):
    """Called during registration if referral code provided."""
    try:
        ref = get_referral_by_code(code, db)
        if ref.status == "pending":
            ref.referred_id = str(new_user_id)
            ref.status      = "signed_up"
            ref.updated_at  = datetime.utcnow()
            db.commit()
    except HTTPException:
        pass   # invalid code — silently ignore


def track_application(referred_user_id: UUID, db: Session):
    """Called when a referred user applies to a job."""
    ref = db.query(Referral).filter(
        Referral.referred_id == str(referred_user_id),
        Referral.status      == "signed_up",
    ).first()
    if ref:
        ref.status     = "applied"
        ref.updated_at = datetime.utcnow()
        db.commit()


def track_hired(referred_user_id: UUID, db: Session):
    """Called when a referred user gets selected."""
    ref = db.query(Referral).filter(
        Referral.referred_id == str(referred_user_id),
    ).first()
    if ref:
        ref.status         = "hired"
        ref.reward_granted = True
        ref.updated_at     = datetime.utcnow()
        db.commit()


def get_my_referrals(referrer_id: UUID, db: Session) -> list[Referral]:
    return db.query(Referral).filter(
        Referral.referrer_id == str(referrer_id)
    ).order_by(Referral.created_at.desc()).all()


def get_stats(referrer_id: UUID, db: Session) -> dict:
    refs = get_my_referrals(referrer_id, db)
    return {
        "total_referrals": len(refs),
        "signed_up":       sum(1 for r in refs if r.status in ("signed_up","applied","hired")),
        "applied":         sum(1 for r in refs if r.status in ("applied","hired")),
        "hired":           sum(1 for r in refs if r.status == "hired"),
        "rewards_earned":  sum(1 for r in refs if r.reward_granted),
    }