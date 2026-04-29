from pydantic import BaseModel
from uuid import UUID
from typing import Optional


class CompanyCreateRequest(BaseModel):
    name:        str
    slug:        Optional[str] = None
    website:     Optional[str] = None
    description: Optional[str] = None
    logo_url:    Optional[str] = None


class CompanyUpdateRequest(BaseModel):
    name:        Optional[str] = None
    website:     Optional[str] = None
    description: Optional[str] = None
    logo_url:    Optional[str] = None


class CompanyOut(BaseModel):
    id:          UUID
    name:        str
    slug:        str
    website:     Optional[str]
    description: Optional[str]
    logo_url:    Optional[str]

    class Config:
        from_attributes = True


class RecruiterInviteRequest(BaseModel):
    email: str