from pydantic import BaseModel
from typing import Optional
from uuid import UUID


class ReferralCreateRequest(BaseModel):
    job_id: Optional[UUID] = None   # optional — refer for specific job


class ReferralOut(BaseModel):
    id:            UUID
    referral_code: str
    job_id:        Optional[UUID]
    status:        str
    reward_granted: bool
    referral_url:  str              # full shareable URL

    class Config:
        from_attributes = True


class ReferralStatsOut(BaseModel):
    total_referrals:   int
    signed_up:         int
    applied:           int
    hired:             int
    rewards_earned:    int