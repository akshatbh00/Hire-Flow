from pydantic import BaseModel
from uuid import UUID
from typing import Optional
from models import PipelineStage


class ApplyRequest(BaseModel):
    job_id:    UUID
    resume_id: Optional[UUID] = None


class ApplicationOut(BaseModel):
    id:              UUID
    job_id:          UUID
    user_id:         UUID
    current_stage:   PipelineStage
    highest_stage:   PipelineStage
    match_score:     Optional[float]
    benchmark_score: Optional[float]
    ats_passed:      Optional[bool]
    job_title:       Optional[str] = None
    company_name:    Optional[str] = None

    class Config:
        from_attributes = True


class StageHistoryOut(BaseModel):
    from_stage: PipelineStage
    to_stage:   PipelineStage
    notes:      Optional[str]
    moved_at:   str