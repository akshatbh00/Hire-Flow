from pydantic import BaseModel, EmailStr
from uuid import UUID
from typing import Optional
from models import SubscriptionTier


class UserUpdateRequest(BaseModel):
    full_name:  Optional[str]      = None
    job_pref:   Optional[dict]     = None


class UserDashboardOut(BaseModel):
    """
    Single endpoint response for the job seeker dashboard.
    Everything the frontend needs in one call.
    """
    user_id:          UUID
    full_name:        str
    tier:             SubscriptionTier
    active_resume:    Optional[dict]   # ats_score, parsed summary
    highest_stage:    Optional[str]    # best stage across all applications
    total_applied:    int
    active_pipeline:  list[dict]       # recent applications with stage
    top_job_matches:  list[dict]       # cached AI matches
    notifications:    list[dict]       # unread in-app notifications


class NotificationOut(BaseModel):
    id:      UUID
    message: str
    stage:   Optional[str]
    is_read: bool
    created_at: str