"""
backend/api/karen/routes.py — KAREN AI Agent endpoints
"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from database import get_db
from api.auth.routes import get_current_user
from api.karen import service
from api.karen.schemas import KarenMessageRequest, KarenMessageResponse

router = APIRouter(prefix="/karen", tags=["KAREN AI Agent"])


@router.post("/chat", response_model=KarenMessageResponse)
def chat(
    payload: KarenMessageRequest,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """
    Chat with KAREN.
    Job seekers get brutally honest career coaching.
    Recruiters get sharp talent analysis.
    """
    result = service.chat(
        user_id=str(current_user.id),
        message=payload.message,
        db=db,
    )
    return KarenMessageResponse(**result)


@router.get("/memory")
def get_memory(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Get KAREN's memory for this user."""
    return service.get_memory(str(current_user.id), db)


@router.delete("/memory")
def clear_memory(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Clear KAREN's memory — fresh start."""
    service.clear_memory(str(current_user.id), db)
    return {"message": "Memory cleared. KAREN has forgotten everything."}