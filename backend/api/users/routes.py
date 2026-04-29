"""
backend/api/users/routes.py
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from api.auth.routes import get_current_user, require_admin
from api.users import service
from api.users.schemas import UserUpdateRequest

router = APIRouter(prefix="/users", tags=["Users"])


@router.get("/dashboard")
def dashboard(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    return service.get_dashboard(current_user.id, db)


@router.patch("/me")
def update_profile(
    payload: UserUpdateRequest,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    return service.update_profile(
        current_user.id,
        full_name=payload.full_name,
        job_pref=payload.job_pref,
        db=db,
    )


@router.post("/notifications/read")
def mark_read(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    service.mark_notifications_read(current_user.id, db)
    return {"message": "Notifications marked as read"}


@router.get("/profile/completeness")
def profile_completeness(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    return service.get_profile_completeness(str(current_user.id), db)


# ── Admin endpoints ────────────────────────────────────────────────────────

@router.get("/admin/all")
def get_all_users(
    db: Session = Depends(get_db),
    _=Depends(require_admin),
):
    """Return all users — admin only."""
    from models import User
    users = db.query(User).order_by(User.created_at.desc()).all()
    return [
        {
            "id":        str(u.id),
            "email":     u.email,
            "full_name": u.full_name,
            "role":      u.role.value if hasattr(u.role, "value") else str(u.role),
            "tier":      u.tier.value if hasattr(u.tier, "value") else str(u.tier),
            "is_active": u.is_active,
            "created_at": u.created_at.isoformat() if u.created_at else None,
        }
        for u in users
    ]


@router.patch("/admin/{user_id}")
def update_user(
    user_id: str,
    payload: dict,
    db: Session = Depends(get_db),
    current_user=Depends(require_admin),
):
    """Toggle user active status — admin only."""
    from models import User
    if user_id == str(current_user.id):
        raise HTTPException(400, "Cannot modify your own account")
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(404, "User not found")
    if "is_active" in payload:
        user.is_active = payload["is_active"]
    db.commit()
    return {
        "id":        str(user.id),
        "email":     user.email,
        "full_name": user.full_name,
        "is_active": user.is_active,
    }