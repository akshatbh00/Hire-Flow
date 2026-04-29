from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from database import get_db
from api.pipeline.service import PipelineService
from models import PipelineStage

router = APIRouter(prefix="/pipeline", tags=["pipeline"])
svc = PipelineService()


class MoveStageRequest(BaseModel):
    application_id: str
    to_stage: PipelineStage
    notes: str | None = None


@router.post("/move")
def move_stage(req: MoveStageRequest, db: Session = Depends(get_db)):
    # TODO: inject current recruiter from JWT
    try:
        app = svc.move_stage(req.application_id, req.to_stage, "recruiter-id", req.notes, db)
        return {"stage": app.current_stage, "highest": app.highest_stage}
    except ValueError as e:
        raise HTTPException(404, str(e))


@router.get("/job/{job_id}/kanban")
def get_kanban(job_id: str, db: Session = Depends(get_db)):
    return svc.get_pipeline_for_job(job_id, db)


@router.get("/application/{app_id}/history")
def get_history(app_id: str, db: Session = Depends(get_db)):
    from models import StageHistory
    history = db.query(StageHistory).filter(
        StageHistory.application_id == app_id
    ).order_by(StageHistory.created_at).all()
    return [
        {
            "from":     h.from_stage,
            "to":       h.to_stage,
            "notes":    h.notes,
            "moved_at": h.created_at.isoformat(),
        }
        for h in history
    ]

#adding the refferalsss
# In RegisterRequest schema (api/auth/schemas.py) add:
referral_code: Optional[str] = None

# In register route, after creating user add:
if payload.referral_code:
    from api.referrals.service import track_signup
    track_signup(payload.referral_code, user.id, db)