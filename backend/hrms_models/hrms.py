"""
backend/models/hrms.py
Full HRMS models — Company Admin → Hiring Manager → HR hierarchy
"""

from sqlalchemy import Column, String, Integer, Float, Boolean, DateTime, ForeignKey, Enum, Text
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
import uuid

from database import Base


def gen_id():
    return str(uuid.uuid4())


# ── Enums ─────────────────────────────────────────────────────────────────────

class HRMSRole(str, enum.Enum):
    company_admin = "company_admin"
    hiring_manager = "hiring_manager"
    hr = "hr"


class InviteStatus(str, enum.Enum):
    pending = "pending"
    accepted = "accepted"
    rejected = "rejected"
    expired = "expired"


class HRStatus(str, enum.Enum):
    active = "active"
    inactive = "inactive"
    suspended = "suspended"


# ── Models ────────────────────────────────────────────────────────────────────

class HRMSMember(Base):
    """
    A person in the HRMS hierarchy linked to a company.
    One user can only be a member of one company.
    """
    __tablename__ = "hrms_members"

    id = Column(String, primary_key=True, default=gen_id)
    company_id = Column(String, ForeignKey("companies.id"), nullable=False)
    user_id = Column(String, ForeignKey("users.id"), nullable=False, unique=True)
    hrms_role = Column(Enum(HRMSRole), nullable=False)
    status = Column(Enum(HRStatus), default=HRStatus.active)

    # Hierarchy — HRs report to a Hiring Manager; HMs report to Company Admin
    reports_to_id = Column(String, ForeignKey("hrms_members.id"), nullable=True)

    # Limits
    monthly_invite_limit = Column(Integer, default=10)
    invites_used_this_month = Column(Integer, default=0)

    # Tracking
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    company = relationship("Company", back_populates="hrms_members")
    user = relationship("User", back_populates="hrms_member", foreign_keys=[user_id])
    reports_to = relationship("HRMSMember", remote_side=[id], back_populates="direct_reports")
    direct_reports = relationship("HRMSMember", back_populates="reports_to")
    invites_sent = relationship("HRMSInvite", foreign_keys="HRMSInvite.invited_by_id", back_populates="invited_by")
    pipeline_ownerships = relationship("HRPipelineOwnership", foreign_keys="[HRPipelineOwnership.hr_member_id]", back_populates="hr_member")
    activity_logs = relationship("HRActivityLog", back_populates="member")


class HRMSInvite(Base):
    """
    Invite sent by Company Admin or Hiring Manager to onboard HR staff.
    """
    __tablename__ = "hrms_invites"

    id = Column(String, primary_key=True, default=gen_id)
    company_id = Column(String, ForeignKey("companies.id"), nullable=False)
    invited_by_id = Column(String, ForeignKey("hrms_members.id"), nullable=False)

    # Who's being invited
    email = Column(String, nullable=False)
    name = Column(String, nullable=True)
    intended_role = Column(Enum(HRMSRole), nullable=False)

    # If HR, which HM they'll report to
    reports_to_id = Column(String, ForeignKey("hrms_members.id"), nullable=True)

    # Invite token (sent via email link)
    token = Column(String, unique=True, nullable=False)
    status = Column(Enum(InviteStatus), default=InviteStatus.pending)

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    expires_at = Column(DateTime, nullable=False)
    accepted_at = Column(DateTime, nullable=True)
    rejected_at = Column(DateTime, nullable=True)
    rejection_reason = Column(Text, nullable=True)

    # Relationships
    company = relationship("Company")
    invited_by = relationship("HRMSMember", foreign_keys=[invited_by_id], back_populates="invites_sent")
    reports_to = relationship("HRMSMember", foreign_keys=[reports_to_id])


class HRPipelineOwnership(Base):
    """
    Assigns an HR member as owner of a specific job's pipeline.
    Hiring Manager assigns HRs to jobs.
    """
    __tablename__ = "hr_pipeline_ownerships"

    id = Column(String, primary_key=True, default=gen_id)
    job_id = Column(String, ForeignKey("jobs.id"), nullable=False)
    hr_member_id = Column(String, ForeignKey("hrms_members.id"), nullable=False)
    assigned_by_id = Column(String, ForeignKey("hrms_members.id"), nullable=False)  # HM or Admin

    is_primary = Column(Boolean, default=True)  # Primary vs. supporting HR
    assigned_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    job = relationship("Job")
    hr_member = relationship("HRMSMember", foreign_keys=[hr_member_id], back_populates="pipeline_ownerships")
    assigned_by = relationship("HRMSMember", foreign_keys=[assigned_by_id])


class HRActivityLog(Base):
    """
    Tracks all HR actions for cost/time/token tracking.
    Every pipeline move, candidate message, interview schedule = one log entry.
    """
    __tablename__ = "hr_activity_logs"

    id = Column(String, primary_key=True, default=gen_id)
    member_id = Column(String, ForeignKey("hrms_members.id"), nullable=False)
    company_id = Column(String, ForeignKey("companies.id"), nullable=False)

    action_type = Column(String, nullable=False)
    # e.g. "stage_move", "candidate_message", "interview_schedule",
    #       "ai_resume_parse", "ai_jd_tailor", "ai_gap_analysis", "bulk_reject"

    # References
    job_id = Column(String, ForeignKey("jobs.id"), nullable=True)
    application_id = Column(String, nullable=True)

    # AI cost tracking (populated when action uses AI)
    ai_tokens_used = Column(Integer, default=0)
    ai_cost_usd = Column(Float, default=0.0)

    # Time tracking
    time_spent_seconds = Column(Integer, default=0)

    # Metadata
    metadata_json = Column(Text, nullable=True)  # JSON string for extra context
    performed_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    member = relationship("HRMSMember", back_populates="activity_logs")


class HRMonthlySummary(Base):
    """
    Monthly rollup of cost/token/time per HR member.
    Updated daily via background job (or on-demand).
    """
    __tablename__ = "hr_monthly_summaries"

    id = Column(String, primary_key=True, default=gen_id)
    member_id = Column(String, ForeignKey("hrms_members.id"), nullable=False)
    company_id = Column(String, ForeignKey("companies.id"), nullable=False)
    month = Column(String, nullable=False)  # "2025-04"

    total_actions = Column(Integer, default=0)
    total_ai_tokens = Column(Integer, default=0)
    total_ai_cost_usd = Column(Float, default=0.0)
    total_time_seconds = Column(Integer, default=0)

    stage_moves = Column(Integer, default=0)
    interviews_scheduled = Column(Integer, default=0)
    candidates_messaged = Column(Integer, default=0)
    offers_sent = Column(Integer, default=0)

    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)