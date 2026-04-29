#backend/api/insider/schemas.py
from pydantic import BaseModel
from typing import Optional
from uuid import UUID


class AddWorkHistoryRequest(BaseModel):
    company_name:      str
    is_current:        bool = True
    is_open_to_refer:  bool = True
    network_visible:   bool = True


class InsiderOut(BaseModel):
    """An insider visible to job seekers."""
    user_id:          str
    full_name:        str
    company_name:     str
    is_open_to_refer: bool


class ReferralRequestCreate(BaseModel):
    insider_id: UUID
    job_id:     UUID
    message:    Optional[str] = None


class ReferralRequestOut(BaseModel):
    id:             str
    requester_id:   str
    insider_id:     str
    job_id:         str
    status:         str
    message:        Optional[str]
    boost_applied:  bool

    class Config:
        from_attributes = True


class ReferralRequestAction(BaseModel):
    action: str   # "accept" or "decline"