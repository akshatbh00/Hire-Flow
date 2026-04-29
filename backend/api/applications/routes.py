"""
backend/api/applications/routes.py
"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from uuid import UUID

from database import get_db
from api.auth.routes import get_current_user
from api.applications import service
from api.applications.schemas import ApplyRequest, ApplicationOut, StageHistoryOut
from models import StageHistory

router = APIRouter(prefix="/applications", tags=["Applications"])


@router.post("", response_model=ApplicationOut, status_code=201)
def apply(
    payload: ApplyRequest,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    app = service.apply_to_job(
        current_user.id, payload.job_id, payload.resume_id, db
    )
    return _enrich(app)


@router.get("", response_model=list[ApplicationOut])
def my_applications(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    apps = service.get_user_applications(current_user.id, db)
    return [_enrich(a) for a in apps]


@router.get("/{app_id}", response_model=ApplicationOut)
def application_detail(
    app_id: UUID,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    app = service.get_application_detail(app_id, current_user.id, db)
    return _enrich(app)


@router.get("/{app_id}/history", response_model=list[StageHistoryOut])
def stage_history(
    app_id: UUID,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Full pipeline audit trail — gives candidates 100% transparency."""
    history = (
        db.query(StageHistory)
        .filter(StageHistory.application_id == app_id)
        .order_by(StageHistory.created_at)
        .all()
    )
    return [
        StageHistoryOut(
            from_stage=h.from_stage,
            to_stage=h.to_stage,
            notes=h.notes,
            moved_at=h.created_at.isoformat(),
        )
        for h in history
    ]


@router.delete("/{app_id}/withdraw", status_code=204)
def withdraw(
    app_id: UUID,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    from models import PipelineStage
    app = service.get_application_detail(app_id, current_user.id, db)
    app.current_stage = PipelineStage.WITHDRAWN
    db.commit()


# ── Helper ─────────────────────────────────────────────────────────────────

def _enrich(app) -> ApplicationOut:
    return ApplicationOut(
        id=app.id,
        job_id=app.job_id,
        user_id=app.user_id,
        current_stage=app.current_stage,
        highest_stage=app.highest_stage,
        match_score=app.match_score,
        benchmark_score=app.benchmark_score,
        ats_passed=app.ats_passed,
        job_title=app.job.title if app.job else None,
        company_name=app.job.company.name if app.job and app.job.company else None,
    )


# ── Quick Apply ───────────────────────────────────────────────────────────
@router.post("/quick-apply/{job_id}", response_model=ApplicationOut, status_code=201)
def quick_apply(
    job_id: str,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """
    One-click apply — uses active resume automatically.
    No form needed. Single endpoint call.
    """
    app = service.apply_to_job(
        user_id=str(current_user.id),
        job_id=job_id,
        resume_id=None,   # auto-picks active resume
        db=db,
    )
    return _enrich(app)