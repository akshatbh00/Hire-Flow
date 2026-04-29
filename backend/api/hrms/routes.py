# """
# backend/api/hrms/routers.py
# Full HRMS API — invite, accept/reject, hierarchy, pipeline ownership, tracking
# """

# from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
# from sqlalchemy.orm import Session
# from sqlalchemy import func
# from datetime import datetime, timedelta
# from typing import List, Optional
# from pydantic import BaseModel, EmailStr
# import secrets
# import json
# from database import get_db
# from api.auth.routes import get_current_user
# from models import User
# from hrms_models.hrms import (
#     HRMSMember, HRMSInvite, HRPipelineOwnership,
#     HRActivityLog, HRMonthlySummary,
#     HRMSRole, InviteStatus, HRStatus
# )

# router = APIRouter(prefix="/hrms", tags=["HRMS"])

# INVITE_EXPIRY_HOURS = 72


# # ── Pydantic schemas ──────────────────────────────────────────────────────────

# class InviteCreate(BaseModel):
#     email: EmailStr
#     name: Optional[str] = None
#     intended_role: HRMSRole
#     reports_to_id: Optional[str] = None  # required if role=hr

# class InviteResponse(BaseModel):
#     id: str
#     email: str
#     name: Optional[str]
#     intended_role: str
#     status: str
#     created_at: datetime
#     expires_at: datetime

# class AcceptInvitePayload(BaseModel):
#     token: str
#     name: str          # confirm/set their name
#     password: str      # set password on first login

# class RejectInvitePayload(BaseModel):
#     token: str
#     reason: Optional[str] = None

# class AssignPipelinePayload(BaseModel):
#     job_id: str
#     hr_member_id: str
#     is_primary: bool = True

# class LogActivityPayload(BaseModel):
#     action_type: str
#     job_id: Optional[str] = None
#     application_id: Optional[str] = None
#     ai_tokens_used: int = 0
#     ai_cost_usd: float = 0.0
#     time_spent_seconds: int = 0
#     metadata: Optional[dict] = None


# # ── Helpers ───────────────────────────────────────────────────────────────────

# def get_hrms_member(user: User, db: Session) -> HRMSMember:
#     member = db.query(HRMSMember).filter(HRMSMember.user_id == user.id).first()
#     if not member:
#         raise HTTPException(status_code=403, detail="Not an HRMS member")
#     return member

# def require_role(member: HRMSMember, *roles: HRMSRole):
#     if member.hrms_role not in roles:
#         raise HTTPException(status_code=403, detail=f"Requires role: {[r.value for r in roles]}")

# def current_month() -> str:
#     return datetime.utcnow().strftime("%Y-%m")


# # ── Invite endpoints ──────────────────────────────────────────────────────────

# @router.post("/invite", status_code=201)
# def send_invite(
#     payload: InviteCreate,
#     db: Session = Depends(get_db),
#     current_user: User = Depends(get_current_user),
# ):
#     """
#     Company Admin can invite Hiring Managers and HRs.
#     Hiring Manager can only invite HRs (who will report to them).
#     """
#     member = get_hrms_member(current_user, db)
#     require_role(member, HRMSRole.company_admin, HRMSRole.hiring_manager)

#     # HM can only invite HRs
#     if member.hrms_role == HRMSRole.hiring_manager:
#         if payload.intended_role != HRMSRole.hr:
#             raise HTTPException(status_code=403, detail="Hiring Managers can only invite HRs")
#         payload.reports_to_id = member.id

#     # Validate reports_to for HR role
#     if payload.intended_role == HRMSRole.hr and not payload.reports_to_id:
#         raise HTTPException(status_code=400, detail="HR must have a Hiring Manager (reports_to_id)")

#     # Check invite limit
#     if member.invites_used_this_month >= member.monthly_invite_limit:
#         raise HTTPException(status_code=429, detail="Monthly invite limit reached")

#     # Check not already a member
#     existing_user = db.query(User).filter(User.email == payload.email).first()
#     if existing_user:
#         existing_member = db.query(HRMSMember).filter(HRMSMember.user_id == existing_user.id).first()
#         if existing_member:
#             raise HTTPException(status_code=409, detail="User is already an HRMS member")

#     # Check no pending invite already
#     existing_invite = db.query(HRMSInvite).filter(
#         HRMSInvite.email == payload.email,
#         HRMSInvite.status == InviteStatus.pending,
#         HRMSInvite.company_id == member.company_id,
#     ).first()
#     if existing_invite:
#         raise HTTPException(status_code=409, detail="Pending invite already exists for this email")

#     token = secrets.token_urlsafe(32)
#     invite = HRMSInvite(
#         company_id=member.company_id,
#         invited_by_id=member.id,
#         email=payload.email,
#         name=payload.name,
#         intended_role=payload.intended_role,
#         reports_to_id=payload.reports_to_id,
#         token=token,
#         expires_at=datetime.utcnow() + timedelta(hours=INVITE_EXPIRY_HOURS),
#     )
#     db.add(invite)
#     member.invites_used_this_month += 1
#     db.commit()
#     db.refresh(invite)

#     # TODO: Send email with link: /hrms/join?token={token}
#     # For now return token in response (dev only — remove in production)
#     return {
#         "message": "Invite sent",
#         "invite_id": invite.id,
#         "token_dev_only": token,  # REMOVE IN PRODUCTION
#         "expires_at": invite.expires_at,
#     }


# @router.post("/invite/accept")
# def accept_invite(
#     payload: AcceptInvitePayload,
#     db: Session = Depends(get_db),
# ):
#     """
#     Invitee accepts invite — creates/links their user account + HRMS member record.
#     """
#     invite = db.query(HRMSInvite).filter(HRMSInvite.token == payload.token).first()
#     if not invite:
#         raise HTTPException(status_code=404, detail="Invite not found")
#     if invite.status != InviteStatus.pending:
#         raise HTTPException(status_code=400, detail=f"Invite is {invite.status.value}")
#     if invite.expires_at < datetime.utcnow():
#         invite.status = InviteStatus.expired
#         db.commit()
#         raise HTTPException(status_code=400, detail="Invite has expired")

#     # Create or fetch user
#     existing_user = db.query(User).filter(User.email == invite.email).first()
#     if existing_user:
#         user = existing_user
#         # Update their role
#         user.role = invite.intended_role.value
#     else:
#         from backend.auth import hash_password
#         user = User(
#             email=invite.email,
#             name=payload.name,
#             hashed_password=hash_password(payload.password),
#             role=invite.intended_role.value,
#             status="active",
#         )
#         db.add(user)
#         db.flush()

#     # Create HRMS member record
#     hrms_member = HRMSMember(
#         company_id=invite.company_id,
#         user_id=user.id,
#         hrms_role=invite.intended_role,
#         reports_to_id=invite.reports_to_id,
#     )
#     db.add(hrms_member)

#     invite.status = InviteStatus.accepted
#     invite.accepted_at = datetime.utcnow()
#     db.commit()

#     return {"message": "Invite accepted. You can now log in.", "user_id": user.id}


# @router.post("/invite/reject")
# def reject_invite(
#     payload: RejectInvitePayload,
#     db: Session = Depends(get_db),
# ):
#     invite = db.query(HRMSInvite).filter(HRMSInvite.token == payload.token).first()
#     if not invite:
#         raise HTTPException(status_code=404, detail="Invite not found")
#     if invite.status != InviteStatus.pending:
#         raise HTTPException(status_code=400, detail=f"Invite is already {invite.status.value}")

#     invite.status = InviteStatus.rejected
#     invite.rejected_at = datetime.utcnow()
#     invite.rejection_reason = payload.reason
#     db.commit()
#     return {"message": "Invite rejected"}


# @router.get("/invites")
# def list_invites(
#     db: Session = Depends(get_db),
#     current_user: User = Depends(get_current_user),
# ):
#     member = get_hrms_member(current_user, db)
#     require_role(member, HRMSRole.company_admin, HRMSRole.hiring_manager)

#     q = db.query(HRMSInvite).filter(HRMSInvite.company_id == member.company_id)
#     if member.hrms_role == HRMSRole.hiring_manager:
#         q = q.filter(HRMSInvite.invited_by_id == member.id)

#     invites = q.order_by(HRMSInvite.created_at.desc()).all()
#     return [
#         {
#             "id": i.id,
#             "email": i.email,
#             "name": i.name,
#             "role": i.intended_role.value,
#             "status": i.status.value,
#             "created_at": i.created_at,
#             "expires_at": i.expires_at,
#         }
#         for i in invites
#     ]


# # ── Team / Hierarchy endpoints ────────────────────────────────────────────────

# @router.get("/team")
# def get_team(
#     db: Session = Depends(get_db),
#     current_user: User = Depends(get_current_user),
# ):
#     """Returns the full team hierarchy for the company."""
#     member = get_hrms_member(current_user, db)

#     members = db.query(HRMSMember).filter(
#         HRMSMember.company_id == member.company_id
#     ).all()

#     def serialize(m: HRMSMember):
#         return {
#             "id": m.id,
#             "user_id": m.user_id,
#             "name": m.user.name if m.user else "Unknown",
#             "email": m.user.email if m.user else "",
#             "role": m.hrms_role.value,
#             "status": m.status.value,
#             "reports_to_id": m.reports_to_id,
#             "invites_used": m.invites_used_this_month,
#             "invite_limit": m.monthly_invite_limit,
#         }

#     return [serialize(m) for m in members]


# @router.patch("/member/{member_id}/status")
# def update_member_status(
#     member_id: str,
#     status: HRStatus,
#     db: Session = Depends(get_db),
#     current_user: User = Depends(get_current_user),
# ):
#     actor = get_hrms_member(current_user, db)
#     require_role(actor, HRMSRole.company_admin)

#     target = db.query(HRMSMember).filter(
#         HRMSMember.id == member_id,
#         HRMSMember.company_id == actor.company_id,
#     ).first()
#     if not target:
#         raise HTTPException(status_code=404, detail="Member not found")
#     if target.id == actor.id:
#         raise HTTPException(status_code=400, detail="Cannot change your own status")

#     target.status = status
#     db.commit()
#     return {"message": f"Member status updated to {status.value}"}


# # ── Pipeline ownership ────────────────────────────────────────────────────────

# @router.post("/pipeline/assign")
# def assign_pipeline(
#     payload: AssignPipelinePayload,
#     db: Session = Depends(get_db),
#     current_user: User = Depends(get_current_user),
# ):
#     """Hiring Manager assigns an HR to own a job's pipeline."""
#     actor = get_hrms_member(current_user, db)
#     require_role(actor, HRMSRole.hiring_manager, HRMSRole.company_admin)

#     # Verify HR member belongs to same company
#     hr_member = db.query(HRMSMember).filter(
#         HRMSMember.id == payload.hr_member_id,
#         HRMSMember.company_id == actor.company_id,
#         HRMSMember.hrms_role == HRMSRole.hr,
#     ).first()
#     if not hr_member:
#         raise HTTPException(status_code=404, detail="HR member not found in your company")

#     # Check for existing primary ownership
#     if payload.is_primary:
#         existing_primary = db.query(HRPipelineOwnership).filter(
#             HRPipelineOwnership.job_id == payload.job_id,
#             HRPipelineOwnership.is_primary == True,
#         ).first()
#         if existing_primary:
#             existing_primary.is_primary = False  # Demote old primary

#     ownership = HRPipelineOwnership(
#         job_id=payload.job_id,
#         hr_member_id=payload.hr_member_id,
#         assigned_by_id=actor.id,
#         is_primary=payload.is_primary,
#     )
#     db.add(ownership)
#     db.commit()
#     return {"message": "Pipeline assigned", "ownership_id": ownership.id}


# @router.get("/pipeline/{job_id}/owners")
# def get_pipeline_owners(
#     job_id: str,
#     db: Session = Depends(get_db),
#     current_user: User = Depends(get_current_user),
# ):
#     ownerships = db.query(HRPipelineOwnership).filter(
#         HRPipelineOwnership.job_id == job_id
#     ).all()
#     return [
#         {
#             "hr_member_id": o.hr_member_id,
#             "hr_name": o.hr_member.user.name if o.hr_member and o.hr_member.user else "Unknown",
#             "is_primary": o.is_primary,
#             "assigned_at": o.assigned_at,
#         }
#         for o in ownerships
#     ]


# # ── Activity & cost tracking ──────────────────────────────────────────────────

# @router.post("/activity/log")
# def log_activity(
#     payload: LogActivityPayload,
#     db: Session = Depends(get_db),
#     current_user: User = Depends(get_current_user),
# ):
#     member = get_hrms_member(current_user, db)

#     log = HRActivityLog(
#         member_id=member.id,
#         company_id=member.company_id,
#         action_type=payload.action_type,
#         job_id=payload.job_id,
#         application_id=payload.application_id,
#         ai_tokens_used=payload.ai_tokens_used,
#         ai_cost_usd=payload.ai_cost_usd,
#         time_spent_seconds=payload.time_spent_seconds,
#         metadata_json=json.dumps(payload.metadata) if payload.metadata else None,
#     )
#     db.add(log)

#     # Update monthly summary
#     month = current_month()
#     summary = db.query(HRMonthlySummary).filter(
#         HRMonthlySummary.member_id == member.id,
#         HRMonthlySummary.month == month,
#     ).first()
#     if not summary:
#         summary = HRMonthlySummary(
#             member_id=member.id,
#             company_id=member.company_id,
#             month=month,
#         )
#         db.add(summary)

#     summary.total_actions += 1
#     summary.total_ai_tokens += payload.ai_tokens_used
#     summary.total_ai_cost_usd += payload.ai_cost_usd
#     summary.total_time_seconds += payload.time_spent_seconds

#     if payload.action_type == "stage_move":
#         summary.stage_moves += 1
#     elif payload.action_type == "interview_schedule":
#         summary.interviews_scheduled += 1
#     elif payload.action_type == "candidate_message":
#         summary.candidates_messaged += 1
#     elif payload.action_type == "offer_sent":
#         summary.offers_sent += 1

#     db.commit()
#     return {"message": "Activity logged"}


# @router.get("/stats/team")
# def get_team_stats(
#     month: Optional[str] = None,
#     db: Session = Depends(get_db),
#     current_user: User = Depends(get_current_user),
# ):
#     """Company Admin / HM sees cost + activity stats for their team."""
#     member = get_hrms_member(current_user, db)
#     require_role(member, HRMSRole.company_admin, HRMSRole.hiring_manager)

#     target_month = month or current_month()

#     q = db.query(HRMonthlySummary).filter(
#         HRMonthlySummary.company_id == member.company_id,
#         HRMonthlySummary.month == target_month,
#     )

#     # HM only sees their direct reports
#     if member.hrms_role == HRMSRole.hiring_manager:
#         report_ids = [r.id for r in member.direct_reports]
#         q = q.filter(HRMonthlySummary.member_id.in_(report_ids + [member.id]))

#     summaries = q.all()
#     return [
#         {
#             "member_id": s.member_id,
#             "member_name": s.member.user.name if s.member and s.member.user else "Unknown",
#             "role": s.member.hrms_role.value if s.member else "unknown",
#             "month": s.month,
#             "total_actions": s.total_actions,
#             "total_ai_tokens": s.total_ai_tokens,
#             "total_ai_cost_usd": round(s.total_ai_cost_usd, 4),
#             "total_time_hours": round(s.total_time_seconds / 3600, 2),
#             "stage_moves": s.stage_moves,
#             "interviews_scheduled": s.interviews_scheduled,
#             "candidates_messaged": s.candidates_messaged,
#             "offers_sent": s.offers_sent,
#         }
#         for s in summaries
#     ]


# @router.get("/stats/me")
# def get_my_stats(
#     month: Optional[str] = None,
#     db: Session = Depends(get_db),
#     current_user: User = Depends(get_current_user),
# ):
#     """Any HRMS member sees their own stats."""
#     member = get_hrms_member(current_user, db)
#     target_month = month or current_month()

#     summary = db.query(HRMonthlySummary).filter(
#         HRMonthlySummary.member_id == member.id,
#         HRMonthlySummary.month == target_month,
#     ).first()

#     if not summary:
#         return {"month": target_month, "total_actions": 0, "total_ai_tokens": 0,
#                 "total_ai_cost_usd": 0, "total_time_hours": 0}

#     return {
#         "month": summary.month,
#         "total_actions": summary.total_actions,
#         "total_ai_tokens": summary.total_ai_tokens,
#         "total_ai_cost_usd": round(summary.total_ai_cost_usd, 4),
#         "total_time_hours": round(summary.total_time_seconds / 3600, 2),
#         "stage_moves": summary.stage_moves,
#         "interviews_scheduled": summary.interviews_scheduled,
#         "candidates_messaged": summary.candidates_messaged,
#         "offers_sent": summary.offers_sent,
#     }


"""
backend/api/hrms/router.py

Endpoints:
  GET    /hrms/me                        — my HRMSMember profile
  GET    /hrms/members                   — [company_admin] all members in company
  POST   /hrms/members/invite            — [company_admin / hiring_manager] invite user
  PATCH  /hrms/members/{member_id}/role  — [company_admin] change role
  DELETE /hrms/members/{member_id}       — [company_admin] deactivate member
  GET    /hrms/jobs                      — scoped job list (role-aware)
  POST   /hrms/jobs/{job_id}/assign      — [hiring_manager / company_admin] assign recruiter
  GET    /hrms/metrics                   — [hiring_manager / company_admin] HR performance
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime
import uuid

from database import get_db
from models import (
    User, UserRole, HRMSMember, HRMSRole,
    Company, Job, JobStatus, Application, PipelineStage
)
from api.auth.routes import get_current_user   # adjust import path if different in your project

router = APIRouter(prefix="/hrms", tags=["HRMS"])


# ─────────────────────────────────────────────────────────────────────────────
# Schemas
# ─────────────────────────────────────────────────────────────────────────────

class InviteMemberIn(BaseModel):
    email: EmailStr
    hrms_role: HRMSRole = HRMSRole.RECRUITER
    reports_to: Optional[str] = None   # HRMSMember.id of the hiring manager


class UpdateRoleIn(BaseModel):
    hrms_role: HRMSRole


class AssignJobIn(BaseModel):
    recruiter_member_id: str            # HRMSMember.id of the recruiter to assign
    hiring_manager_member_id: Optional[str] = None  # defaults to caller if HM


class MemberOut(BaseModel):
    id: str
    user_id: str
    full_name: Optional[str]
    email: str
    hrms_role: str
    is_active: bool
    joined_at: Optional[datetime]
    reports_to: Optional[str]

    class Config:
        from_attributes = True


class JobAssignmentOut(BaseModel):
    job_id: str
    title: str
    status: str
    assigned_recruiter: Optional[str]
    assigned_hiring_manager: Optional[str]

    class Config:
        from_attributes = True


class HRMetricsOut(BaseModel):
    member_id: str
    full_name: str
    hrms_role: str
    total_assigned_jobs: int
    total_applications: int
    offers_made: int
    selected: int
    avg_time_to_hire_days: Optional[float]


# ─────────────────────────────────────────────────────────────────────────────
# Helpers
# ─────────────────────────────────────────────────────────────────────────────

def get_hrms_member(user: User, db: Session) -> HRMSMember:
    """Get the HRMSMember record for the current user. Raises 403 if not found."""
    member = db.query(HRMSMember).filter(
        HRMSMember.user_id == user.id,
        HRMSMember.is_active == True
    ).first()
    if not member:
        raise HTTPException(status_code=403, detail="Not part of any HRMS team")
    return member


def require_hrms_roles(*roles: HRMSRole):
    """Dependency factory — ensures caller has one of the given HRMS roles."""
    def _check(
        current_user: User = Depends(get_current_user),
        db: Session = Depends(get_db)
    ) -> HRMSMember:
        member = get_hrms_member(current_user, db)
        if member.hrms_role not in roles:
            raise HTTPException(
                status_code=403,
                detail=f"Requires one of: {[r.value for r in roles]}"
            )
        return member
    return _check


# ─────────────────────────────────────────────────────────────────────────────
# Routes
# ─────────────────────────────────────────────────────────────────────────────

@router.get("/me", response_model=MemberOut)
def get_my_hrms_profile(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Returns the caller's HRMSMember record."""
    member = get_hrms_member(current_user, db)
    return _member_out(member, db)


@router.get("/members", response_model=list[MemberOut])
def list_members(
    caller: HRMSMember = Depends(require_hrms_roles(
        HRMSRole.COMPANY_ADMIN, HRMSRole.HIRING_MANAGER
    )),
    db: Session = Depends(get_db)
):
    """
    Company Admin  → sees all members in the company.
    Hiring Manager → sees only their direct reports.
    """
    q = db.query(HRMSMember).filter(
        HRMSMember.company_id == caller.company_id,
        HRMSMember.is_active == True
    )
    if caller.hrms_role == HRMSRole.HIRING_MANAGER:
        q = q.filter(HRMSMember.reports_to == caller.id)

    return [_member_out(m, db) for m in q.all()]


@router.post("/members/invite", response_model=MemberOut, status_code=201)
def invite_member(
    body: InviteMemberIn,
    caller: HRMSMember = Depends(require_hrms_roles(
        HRMSRole.COMPANY_ADMIN, HRMSRole.HIRING_MANAGER
    )),
    db: Session = Depends(get_db)
):
    """
    Invite an existing HireFlow user into the HRMS team.
    - Company Admin can invite both recruiters and hiring managers.
    - Hiring Manager can only invite recruiters (who will report to them).
    """
    # Hiring managers can only create recruiters
    if caller.hrms_role == HRMSRole.HIRING_MANAGER and body.hrms_role != HRMSRole.RECRUITER:
        raise HTTPException(status_code=403, detail="Hiring managers can only invite recruiters")

    # Find the user by email
    target_user = db.query(User).filter(User.email == body.email).first()
    if not target_user:
        raise HTTPException(status_code=404, detail="No HireFlow account found for that email")

    # Check if already a member
    existing = db.query(HRMSMember).filter(
        HRMSMember.user_id == target_user.id,
        HRMSMember.company_id == caller.company_id
    ).first()
    if existing:
        if existing.is_active:
            raise HTTPException(status_code=409, detail="User is already a team member")
        # Reactivate if previously deactivated
        existing.is_active = True
        existing.hrms_role = body.hrms_role
        db.commit()
        db.refresh(existing)
        return _member_out(existing, db)

    # Determine reports_to
    reports_to = body.reports_to
    if caller.hrms_role == HRMSRole.HIRING_MANAGER:
        reports_to = caller.id   # auto-assign to this HM

    member = HRMSMember(
        id=str(uuid.uuid4()),
        user_id=target_user.id,
        company_id=caller.company_id,
        hrms_role=body.hrms_role,
        reports_to=reports_to,
        invited_by=caller.user_id,
        joined_at=datetime.utcnow(),   # auto-join for now; swap for email invite flow later
    )
    db.add(member)

    # Upgrade their User.role if needed
    role_map = {
        HRMSRole.RECRUITER:      UserRole.RECRUITER,
        HRMSRole.HIRING_MANAGER: UserRole.HIRING_MANAGER,
        HRMSRole.COMPANY_ADMIN:  UserRole.ADMIN,
    }
    target_user.role = role_map[body.hrms_role]

    db.commit()
    db.refresh(member)
    return _member_out(member, db)


@router.patch("/members/{member_id}/role", response_model=MemberOut)
def update_member_role(
    member_id: str,
    body: UpdateRoleIn,
    caller: HRMSMember = Depends(require_hrms_roles(HRMSRole.COMPANY_ADMIN)),
    db: Session = Depends(get_db)
):
    """Company Admin only — promote or demote a team member."""
    member = db.query(HRMSMember).filter(
        HRMSMember.id == member_id,
        HRMSMember.company_id == caller.company_id
    ).first()
    if not member:
        raise HTTPException(status_code=404, detail="Member not found")

    member.hrms_role = body.hrms_role

    # Sync User.role
    role_map = {
        HRMSRole.RECRUITER:      UserRole.RECRUITER,
        HRMSRole.HIRING_MANAGER: UserRole.HIRING_MANAGER,
        HRMSRole.COMPANY_ADMIN:  UserRole.ADMIN,
    }
    user = db.query(User).filter(User.id == member.user_id).first()
    if user:
        user.role = role_map[body.hrms_role]

    db.commit()
    db.refresh(member)
    return _member_out(member, db)


@router.delete("/members/{member_id}", status_code=204)
def deactivate_member(
    member_id: str,
    caller: HRMSMember = Depends(require_hrms_roles(HRMSRole.COMPANY_ADMIN)),
    db: Session = Depends(get_db)
):
    """Company Admin only — soft-delete (deactivate) a team member."""
    member = db.query(HRMSMember).filter(
        HRMSMember.id == member_id,
        HRMSMember.company_id == caller.company_id
    ).first()
    if not member:
        raise HTTPException(status_code=404, detail="Member not found")
    if member.id == caller.id:
        raise HTTPException(status_code=400, detail="Cannot deactivate yourself")

    member.is_active = False
    db.commit()


@router.get("/jobs", response_model=list[JobAssignmentOut])
def list_hrms_jobs(
    caller: HRMSMember = Depends(require_hrms_roles(
        HRMSRole.RECRUITER, HRMSRole.HIRING_MANAGER, HRMSRole.COMPANY_ADMIN
    )),
    db: Session = Depends(get_db)
):
    """
    Role-scoped job list:
    - Recruiter        → only jobs assigned to them
    - Hiring Manager   → all jobs they own
    - Company Admin    → all company jobs
    """
    q = db.query(Job).filter(Job.company_id == caller.company_id)

    if caller.hrms_role == HRMSRole.RECRUITER:
        q = q.filter(Job.assigned_recruiter_id == caller.id)
    elif caller.hrms_role == HRMSRole.HIRING_MANAGER:
        q = q.filter(Job.assigned_hiring_manager_id == caller.id)
    # COMPANY_ADMIN sees all — no extra filter

    jobs = q.all()
    return [_job_assignment_out(j, db) for j in jobs]


@router.post("/jobs/{job_id}/assign", response_model=JobAssignmentOut)
def assign_job(
    job_id: str,
    body: AssignJobIn,
    caller: HRMSMember = Depends(require_hrms_roles(
        HRMSRole.HIRING_MANAGER, HRMSRole.COMPANY_ADMIN
    )),
    db: Session = Depends(get_db)
):
    """
    Assign a recruiter (and optionally a hiring manager) to a job.
    - Hiring Manager auto-assigns themselves as the HM if not specified.
    """
    job = db.query(Job).filter(
        Job.id == job_id,
        Job.company_id == caller.company_id
    ).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    # Validate recruiter belongs to this company
    recruiter = db.query(HRMSMember).filter(
        HRMSMember.id == body.recruiter_member_id,
        HRMSMember.company_id == caller.company_id,
        HRMSMember.hrms_role == HRMSRole.RECRUITER,
        HRMSMember.is_active == True
    ).first()
    if not recruiter:
        raise HTTPException(status_code=404, detail="Recruiter not found in your team")

    job.assigned_recruiter_id = recruiter.id

    # Set hiring manager
    if body.hiring_manager_member_id:
        hm = db.query(HRMSMember).filter(
            HRMSMember.id == body.hiring_manager_member_id,
            HRMSMember.company_id == caller.company_id,
            HRMSMember.hrms_role == HRMSRole.HIRING_MANAGER,
            HRMSMember.is_active == True
        ).first()
        if not hm:
            raise HTTPException(status_code=404, detail="Hiring manager not found")
        job.assigned_hiring_manager_id = hm.id
    elif caller.hrms_role == HRMSRole.HIRING_MANAGER:
        job.assigned_hiring_manager_id = caller.id

    db.commit()
    db.refresh(job)
    return _job_assignment_out(job, db)


@router.get("/metrics", response_model=list[HRMetricsOut])
def get_hr_metrics(
    caller: HRMSMember = Depends(require_hrms_roles(
        HRMSRole.HIRING_MANAGER, HRMSRole.COMPANY_ADMIN
    )),
    db: Session = Depends(get_db)
):
    """
    HR performance metrics per recruiter.
    - Hiring Manager → metrics for their direct reports only.
    - Company Admin  → metrics for everyone in the company.
    """
    q = db.query(HRMSMember).filter(
        HRMSMember.company_id == caller.company_id,
        HRMSMember.hrms_role == HRMSRole.RECRUITER,
        HRMSMember.is_active == True
    )
    if caller.hrms_role == HRMSRole.HIRING_MANAGER:
        q = q.filter(HRMSMember.reports_to == caller.id)

    recruiters = q.all()
    results = []

    for rec in recruiters:
        user = db.query(User).filter(User.id == rec.user_id).first()

        # Jobs assigned to this recruiter
        assigned_jobs = db.query(Job).filter(
            Job.assigned_recruiter_id == rec.id
        ).all()
        job_ids = [j.id for j in assigned_jobs]

        total_apps = 0
        offers = 0
        selected = 0
        hire_days_list = []

        if job_ids:
            apps = db.query(Application).filter(Application.job_id.in_(job_ids)).all()
            total_apps = len(apps)
            for app in apps:
                if app.current_stage == PipelineStage.OFFER:
                    offers += 1
                if app.current_stage == PipelineStage.SELECTED:
                    selected += 1
                    if app.created_at and app.updated_at:
                        delta = (app.updated_at - app.created_at).days
                        hire_days_list.append(delta)

        avg_days = round(sum(hire_days_list) / len(hire_days_list), 1) if hire_days_list else None

        results.append(HRMetricsOut(
            member_id=rec.id,
            full_name=user.full_name if user else "Unknown",
            hrms_role=rec.hrms_role.value,
            total_assigned_jobs=len(job_ids),
            total_applications=total_apps,
            offers_made=offers,
            selected=selected,
            avg_time_to_hire_days=avg_days,
        ))

    return results


# ─────────────────────────────────────────────────────────────────────────────
# Private helpers
# ─────────────────────────────────────────────────────────────────────────────

def _member_out(member: HRMSMember, db: Session) -> MemberOut:
    user = db.query(User).filter(User.id == member.user_id).first()
    return MemberOut(
        id=member.id,
        user_id=member.user_id,
        full_name=user.full_name if user else None,
        email=user.email if user else "",
        hrms_role=member.hrms_role.value,
        is_active=member.is_active,
        joined_at=member.joined_at,
        reports_to=member.reports_to,
    )


def _job_assignment_out(job: Job, db: Session) -> JobAssignmentOut:
    rec_name = None
    hm_name = None
    if job.assigned_recruiter_id:
        rec = db.query(HRMSMember).filter(HRMSMember.id == job.assigned_recruiter_id).first()
        if rec:
            u = db.query(User).filter(User.id == rec.user_id).first()
            rec_name = u.full_name if u else None
    if job.assigned_hiring_manager_id:
        hm = db.query(HRMSMember).filter(HRMSMember.id == job.assigned_hiring_manager_id).first()
        if hm:
            u = db.query(User).filter(User.id == hm.user_id).first()
            hm_name = u.full_name if u else None
    return JobAssignmentOut(
        job_id=job.id,
        title=job.title,
        status=job.status.value,
        assigned_recruiter=rec_name,
        assigned_hiring_manager=hm_name,
    )
