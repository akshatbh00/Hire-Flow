"""
backend/api/salary/routes.py
"""
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from database import get_db
from api.auth.routes import get_current_user
from api.salary import service

router = APIRouter(prefix="/salary", tags=["Salary Insights"])


@router.get("/insights")
def salary_insights(
    job_title: str = Query(...),
    location:  str = Query(None),
    db: Session = Depends(get_db),
    _=Depends(get_current_user),
):
    """
    Market salary data for a role.
    Returns min, max, avg + percentiles.
    """
    return service.get_salary_insights(job_title, location, db)


@router.get("/by-location")
def salary_by_location(
    job_title: str = Query(...),
    db: Session = Depends(get_db),
    _=Depends(get_current_user),
):
    """Compare salaries for same role across cities."""
    return service.get_salary_by_location(job_title, db)


@router.get("/top-paying")
def top_paying_roles(
    limit: int = Query(10, le=20),
    db: Session = Depends(get_db),
    _=Depends(get_current_user),
):
    """Top paying roles on HireFlow right now."""
    return service.get_top_paying_roles(db, limit)