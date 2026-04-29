from pydantic import BaseModel, Field
from uuid import UUID
from typing import Optional
from models import JobType


class JobCreateRequest(BaseModel):
    title:       str
    description: str
    requirements: list[str] = Field(default_factory=list)
    job_type:    JobType
    location:    str
    remote_ok:   bool = False
    salary_min:  Optional[int] = None
    salary_max:  Optional[int] = None


class JobUpdateRequest(BaseModel):
    title:       Optional[str]       = None
    description: Optional[str]       = None
    requirements: Optional[list[str]] = None
    is_active:   Optional[bool]      = None
    salary_min:  Optional[int]       = None
    salary_max:  Optional[int]       = None


class JobOut(BaseModel):
    id:           UUID
    title:        str
    description:  Optional[str]
    job_type:     JobType
    location:     Optional[str]
    remote_ok:    bool
    salary_min:   Optional[int]
    salary_max:   Optional[int]
    is_active:    bool
    source:       Optional[str] = None
    source_url:   Optional[str] = None
    company_name: Optional[str] = None
    match_score:  Optional[float] = None

    class Config:
        from_attributes = True
        extra = "ignore"