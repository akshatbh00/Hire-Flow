from pydantic import BaseModel, EmailStr, Field
from uuid import UUID
from typing import Optional
from models import UserRole, SubscriptionTier

class RegisterRequest(BaseModel):
    email:         EmailStr
    password:      str = Field(min_length=8)
    full_name:     str = Field(min_length=2)
    role:          UserRole = UserRole.JOBSEEKER
    referral_code: Optional[str] = None

class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: UUID
    role: UserRole
    tier: SubscriptionTier


class UserOut(BaseModel):
    id: UUID
    email: str
    full_name: Optional[str]
    role: UserRole
    tier: SubscriptionTier
    is_active: bool

    class Config:
        from_attributes = True


class OnboardingUpdate(BaseModel):
    """Called after registration to save job preferences."""
    job_titles: list[str] = Field(default_factory=list)
    locations: list[str] = Field(default_factory=list)
    job_type: Optional[str] = None