"""
pipeline/service.py — move candidates through hiring stages
Full audit trail. Triggers notifications on every transition.
"""
from sqlalchemy.orm import Session
from models import Application, StageHistory, PipelineStage, SelectedPoolEntry, Resume
import uuid
from datetime import datetime
from loguru import logger

STAGE_ORDER = [
    PipelineStage.APPLIED,
    PipelineStage.ATS_SCREENING,
    PipelineStage.ROUND_1,
    PipelineStage.ROUND_2,
    PipelineStage.ROUND_3,
    PipelineStage.HR_ROUND,
    PipelineStage.OFFER,
    PipelineStage.SELECTED,
]

TERMINAL_STAGES = {PipelineStage.ATS_REJECTED, PipelineStage.WITHDRAWN}

ROUND_STAGES = {
    PipelineStage.ROUND_1, PipelineStage.ROUND_2,
    PipelineStage.ROUND_3, PipelineStage.HR_ROUND,
    PipelineStage.OFFER,   PipelineStage.SELECTED,
}


class PipelineService:

    def move_stage(
        self,
        application_id: str,
        to_stage: PipelineStage,
        moved_by_id: str,
        notes: str = None,
        db: Session = None,
    ) -> Application:
        app = db.query(Application).filter(Application.id == application_id).first()
        if not app:
            raise ValueError("Application not found")

        from_stage = app.current_stage
        if from_stage == to_stage:
            return app

        db.add(StageHistory(
            id=str(uuid.uuid4()),
            application_id=application_id,
            from_stage=from_stage,
            to_stage=to_stage,
            moved_by=moved_by_id,
            notes=notes,
        ))

        app.current_stage = to_stage
        app.updated_at    = datetime.utcnow()

        # track highest stage
        if to_stage in STAGE_ORDER:
            curr_idx    = STAGE_ORDER.index(to_stage)
            highest_idx = STAGE_ORDER.index(app.highest_stage) if app.highest_stage in STAGE_ORDER else 0
            if curr_idx > highest_idx:
                app.highest_stage = to_stage

        # add to round clearer pool
        if to_stage in ROUND_STAGES:
            try:
                self._add_to_round_clearer_pool(app, to_stage.value, db)
            except Exception:
                pass

        # add to selected pool + track referral
        if to_stage == PipelineStage.SELECTED:
            self._add_to_selected_pool(app, db)
            try:
                from api.referrals.service import track_hired
                track_hired(app.user_id, db)
            except Exception:
                pass

        db.commit()
        db.refresh(app)

        # notifications
        self._notify(app, application_id, to_stage, notes)

        logger.info(f"App {application_id}: {from_stage} → {to_stage}")
        return app

    def _notify(self, app, application_id, to_stage, notes):
        try:
            from workers.notification_tasks import notify_stage_change
            notify_stage_change.delay(
                str(app.user_id),
                str(application_id),
                to_stage.value,
                notes,
            )
        except Exception:
            logger.debug(f"Notification skipped (no Celery): {to_stage.value}")

    def get_pipeline_for_job(self, job_id: str, db: Session) -> dict:
        apps   = db.query(Application).filter(Application.job_id == job_id).all()
        kanban = {stage.value: [] for stage in PipelineStage}
        kanban["insider_referred"] = []

        for app in apps:
            entry = {
                "application_id": str(app.id),
                "user_id":        str(app.user_id),
                "match_score":    app.match_score,
                "benchmark_score":app.benchmark_score,
                "applied_at":     app.created_at.isoformat(),
                "is_referred":    bool(app.notes and "INSIDER_REFERRED" in (app.notes or "")),
            }
            kanban[app.current_stage.value].append(entry)

            if app.notes and "INSIDER_REFERRED" in app.notes:
                kanban["insider_referred"].append(entry)

        return kanban

    def _add_to_selected_pool(self, app: Application, db: Session):
        resume = db.query(Resume).filter(Resume.id == app.resume_id).first()
        if not resume or resume.embedding is None:
            return
        existing = db.query(SelectedPoolEntry).filter(
            SelectedPoolEntry.resume_id == app.resume_id,
            SelectedPoolEntry.job_id   == app.job_id,
        ).first()
        if not existing:
            db.add(SelectedPoolEntry(
                id=str(uuid.uuid4()),
                resume_id=app.resume_id,
                job_id=app.job_id,
                job_title=app.job.title if app.job else "",
                embedding=resume.embedding,
            ))

    def _add_to_round_clearer_pool(self, app: Application, to_stage: str, db: Session):
        from models import RoundClearerEntry
        resume = db.query(Resume).filter(Resume.id == app.resume_id).first()
        if not resume or not resume.embedding:
            return
        existing = db.query(RoundClearerEntry).filter(
            RoundClearerEntry.resume_id     == app.resume_id,
            RoundClearerEntry.job_id        == app.job_id,
            RoundClearerEntry.round_cleared == to_stage,
        ).first()
        if not existing:
            db.add(RoundClearerEntry(
                id=str(uuid.uuid4()),
                resume_id=app.resume_id,
                job_id=app.job_id,
                job_title=app.job.title if app.job else "",
                round_cleared=to_stage,
                embedding=resume.embedding,
            ))