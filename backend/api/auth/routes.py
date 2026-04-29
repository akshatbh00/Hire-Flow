#backend/api/auth/routes.py 
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from uuid import UUID

from database import get_db
from api.auth import service
from api.auth.schemas import (
    RegisterRequest, TokenResponse,
    UserOut, OnboardingUpdate
)

router = APIRouter(prefix="/auth", tags=["Auth"])
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")


# ── Dependency: get current user from JWT ──────────────────────────────────

# def get_current_user(
#     token: str = Depends(oauth2_scheme),
#     db: Session = Depends(get_db),
# ):

    # payload = service.decode_token(token)
    # user_id = payload.get("sub")
    # if not user_id:
    #     raise HTTPException(status_code=401, detail="Invalid token payload")
    # user = service.get_user_by_id(db, UUID(user_id))
    # if not user:
    #     raise HTTPException(status_code=404, detail="User not found")
    # return user

#after adding the referral code
def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
):
    payload = service.decode_token(token)
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid token payload")
    user = service.get_user_by_id(db, user_id)  # ← pass as string, not UUID
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

def require_recruiter(current_user=Depends(get_current_user)):
    if current_user.role not in ("recruiter", "admin"):
        raise HTTPException(status_code=403, detail="Recruiter access required")
    return current_user


def require_admin(current_user=Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return current_user

#till here

# ── Routes ─────────────────────────────────────────────────────────────────

@router.post("/register", response_model=TokenResponse, status_code=201)
def register(payload: RegisterRequest, db: Session = Depends(get_db)):
    user = service.create_user(
        db,
        email=payload.email,
        password=payload.password,
        full_name=payload.full_name,
        role=payload.role,
    )
    # track referral signup
    if payload.referral_code:
        from api.referrals.service import track_signup
        track_signup(payload.referral_code, user.id, db)

    token = service.create_access_token(user.id, user.role)
    return TokenResponse(
        access_token=token,
        user_id=user.id,
        role=user.role,
        tier=user.tier,
    )

@router.post("/login", response_model=TokenResponse)
def login(
    form: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db),
):
    """Supports both OAuth2 form and can be called with JSON via /login-json."""
    user = service.authenticate_user(db, form.username, form.password)
    token = service.create_access_token(user.id, user.role)
    return TokenResponse(
        access_token=token,
        user_id=user.id,
        role=user.role,
        tier=user.tier,
    )


@router.get("/me", response_model=UserOut)
def me(current_user=Depends(get_current_user)):
    return current_user


@router.patch("/onboarding", response_model=UserOut)
def onboarding(
    payload: OnboardingUpdate,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Called after registration — saves job type preferences."""
    prefs = {
        "titles": payload.job_titles,
        "locations": payload.locations,
        "type": payload.job_type,
    }
    return service.update_job_preferences(db, current_user.id, prefs)


# #adding the refferals
# # In RegisterRequest schema (api/auth/schemas.py) add:
# referral_code: Optional[str] = None

# # In register route, after creating user add:
# if payload.referral_code:
#     from api.referrals.service import track_signup
#     track_signup(payload.referral_code, user.id, db)