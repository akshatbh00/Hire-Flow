from sqlalchemy import (
    Column, String, Integer, Float, Boolean, DateTime,
    ForeignKey, Text, JSON, Enum as SAEnum
)
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
from pgvector.sqlalchemy import Vector
from datetime import datetime
import uuid
import enum
from database import Base


def uuid_pk():
    return Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

def now():
    return Column(DateTime, default=datetime.utcnow)


# ── Enums ──────────────────────────────────────────────────────────────────

class UserRole(str, enum.Enum):
    JOBSEEKER = "jobseeker"
    RECRUITER = "recruiter"
    ADMIN = "admin"

class PipelineStage(str, enum.Enum):
    APPLIED        = "applied"
    ATS_SCREENING  = "ats_screening"
    ATS_REJECTED   = "ats_rejected"
    ROUND_1        = "round_1"
    ROUND_2        = "round_2"
    ROUND_3        = "round_3"
    HR_ROUND       = "hr_round"
    OFFER          = "offer"
    SELECTED       = "selected"
    WITHDRAWN      = "withdrawn"

class JobType(str, enum.Enum):
    FULLTIME   = "fulltime"
    PARTTIME   = "parttime"
    CONTRACT   = "contract"
    INTERNSHIP = "internship"
    REMOTE     = "remote"

class SubscriptionTier(str, enum.Enum):
    FREE    = "free"
    PREMIUM = "premium"


# ── Models ─────────────────────────────────────────────────────────────────

class User(Base):
    __tablename__ = "users"
    id           = uuid_pk()
    email        = Column(String, unique=True, nullable=False, index=True)
    hashed_pw    = Column(String, nullable=False)
    full_name    = Column(String)
    role         = Column(SAEnum(UserRole), default=UserRole.JOBSEEKER)
    tier         = Column(SAEnum(SubscriptionTier), default=SubscriptionTier.FREE)
    job_pref     = Column(JSON)          # {"titles":[], "locations":[], "type":"fulltime"}
    is_active    = Column(Boolean, default=True)
    created_at   = now()

    resumes      = relationship("Resume", back_populates="user")
    applications = relationship("Application", back_populates="user")


class Company(Base):
    __tablename__ = "companies"
    id          = uuid_pk()
    name        = Column(String, nullable=False)
    slug        = Column(String, unique=True)
    logo_url    = Column(String)
    website     = Column(String)
    description = Column(Text)
    created_at  = now()

    jobs        = relationship("Job", back_populates="company")
    recruiters  = relationship("Recruiter", back_populates="company")


class Recruiter(Base):
    __tablename__ = "recruiters"
    id         = uuid_pk()
    user_id    = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    company_id = Column(UUID(as_uuid=True), ForeignKey("companies.id"))
    company    = relationship("Company", back_populates="recruiters")


class Resume(Base):
    __tablename__ = "resumes"
    id            = uuid_pk()
    user_id       = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    file_path     = Column(String)           # S3 key or local path
    raw_text      = Column(Text)
    parsed_data   = Column(JSON)             # structured: name, skills, exp, education
    ats_score     = Column(Float)
    ats_report    = Column(JSON)
    embedding     = Column(Vector(1536))     # whole-resume embedding for fast lookup
    is_active     = Column(Boolean, default=True)
    created_at    = now()

    user          = relationship("User", back_populates="resumes")
    chunks        = relationship("ResumeChunk", back_populates="resume")


class ResumeChunk(Base):
    __tablename__ = "resume_chunks"
    id          = uuid_pk()
    resume_id   = Column(UUID(as_uuid=True), ForeignKey("resumes.id"))
    section     = Column(String)             # "experience", "skills", etc.
    content     = Column(Text)
    embedding   = Column(Vector(1536))
    chunk_index = Column(Integer)

    resume      = relationship("Resume", back_populates="chunks")


class Job(Base):
    __tablename__ = "jobs"
    id           = uuid_pk()
    company_id   = Column(UUID(as_uuid=True), ForeignKey("companies.id"))
    title        = Column(String, nullable=False)
    description  = Column(Text)
    requirements = Column(JSON)              # ["Python", "FastAPI", ...]
    job_type     = Column(SAEnum(JobType))
    location     = Column(String)
    remote_ok    = Column(Boolean, default=False)
    salary_min   = Column(Integer)
    salary_max   = Column(Integer)
    embedding    = Column(Vector(1536))      # JD embedding for matching
    is_active    = Column(Boolean, default=True)
    source       = Column(String, default="internal")  # "linkedin", "naukri", etc.
    source_url   = Column(String)
    created_at   = now()

    company      = relationship("Company", back_populates="jobs")
    applications = relationship("Application", back_populates="job")


class Application(Base):
    __tablename__ = "applications"
    id              = uuid_pk()
    user_id         = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    job_id          = Column(UUID(as_uuid=True), ForeignKey("jobs.id"))
    resume_id       = Column(UUID(as_uuid=True), ForeignKey("resumes.id"))
    current_stage   = Column(SAEnum(PipelineStage), default=PipelineStage.APPLIED)
    highest_stage   = Column(SAEnum(PipelineStage), default=PipelineStage.APPLIED)
    match_score     = Column(Float)          # AI match % at time of apply
    benchmark_score = Column(Float)          # vs selected pool
    ats_passed      = Column(Boolean)
    notes           = Column(Text)
    created_at      = now()
    updated_at      = Column(DateTime, onupdate=datetime.utcnow)

    user            = relationship("User", back_populates="applications")
    job             = relationship("Job", back_populates="applications")
    stage_history   = relationship("StageHistory", back_populates="application")


class StageHistory(Base):
    """Full audit trail — gives candidate 100% transparency."""
    __tablename__ = "stage_history"
    id             = uuid_pk()
    application_id = Column(UUID(as_uuid=True), ForeignKey("applications.id"))
    from_stage     = Column(SAEnum(PipelineStage))
    to_stage       = Column(SAEnum(PipelineStage))
    moved_by       = Column(UUID(as_uuid=True), ForeignKey("users.id"))  # recruiter
    notes          = Column(Text)
    created_at     = now()

    application    = relationship("Application", back_populates="stage_history")


class SelectedPoolEntry(Base):
    """Resumes of selected candidates — benchmark reference index."""
    __tablename__ = "selected_pool"
    id          = uuid_pk()
    resume_id   = Column(UUID(as_uuid=True), ForeignKey("resumes.id"))
    job_id      = Column(UUID(as_uuid=True), ForeignKey("jobs.id"))
    job_title   = Column(String)             # denormalized for fast grouping
    embedding   = Column(Vector(1536))
    created_at  = now()


class Subscription(Base):
    __tablename__ = "subscriptions"
    id          = uuid_pk()
    user_id     = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    tier        = Column(SAEnum(SubscriptionTier))
    payment_id  = Column(String)
    valid_until = Column(DateTime)
    created_at  = now()