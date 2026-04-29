"""
pipeline/service.py — move candidates through hiring stages
Full audit trail. Triggers notifications on every transition.
"""
from sqlalchemy.orm import Session
from models import Application, StageHistory, PipelineStage, SelectedPoolEntry, Resume
from workers.notification_tasks import notify_stage_change
import uuid
from datetime import datetime
from loguru import logger

# Stage ordering for "highest stage" tracking
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

        # record history
        db.add(StageHistory(
            id=uuid.uuid4(),
            application_id=application_id,
            from_stage=from_stage,
            to_stage=to_stage,
            moved_by=moved_by_id,
            notes=notes,
        ))

        # update application
        app.current_stage = to_stage
        app.updated_at = datetime.utcnow()

        # track highest positive stage reached
        if to_stage in STAGE_ORDER:
            curr_idx    = STAGE_ORDER.index(to_stage)
            highest_idx = STAGE_ORDER.index(app.highest_stage) if app.highest_stage in STAGE_ORDER else 0
            if curr_idx > highest_idx:
                app.highest_stage = to_stage

        # if selected → add to benchmark pool
        if to_stage == PipelineStage.SELECTED:
            self._add_to_selected_pool(app, db)

        db.commit()
        db.refresh(app)

        # async notification
        notify_stage_change.delay(str(app.user_id), str(application_id), to_stage.value, notes)
        logger.info(f"App {application_id}: {from_stage} → {to_stage}")
        return app

    def get_pipeline_for_job(self, job_id: str, db: Session) -> dict:
        """Returns kanban-ready data: {stage: [applications]}"""
        apps = db.query(Application).filter(Application.job_id == job_id).all()
        kanban = {stage.value: [] for stage in PipelineStage}
        for app in apps:
            kanban[app.current_stage.value].append({
                "application_id": str(app.id),
                "user_id":        str(app.user_id),
                "match_score":    app.match_score,
                "benchmark_score":app.benchmark_score,
                "applied_at":     app.created_at.isoformat(),
            })
        return kanban

    def _add_to_selected_pool(self, app: Application, db: Session):
        resume = db.query(Resume).filter(Resume.id == app.resume_id).first()
        if not resume or resume.embedding is None:
            return
        existing = db.query(SelectedPoolEntry).filter(
            SelectedPoolEntry.resume_id == app.resume_id,
            SelectedPoolEntry.job_id == app.job_id,
        ).first()
        if not existing:
            db.add(SelectedPoolEntry(
                id=uuid.uuid4(),
                resume_id=app.resume_id,
                job_id=app.job_id,
                job_title=app.job.title if app.job else "",
                embedding=resume.embedding,
            ))