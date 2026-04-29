from fastapi import APIRouter
from api.auth.routes import router as auth_router
from api.resume.routes import router as resume_router
from api.pipeline.routes import router as pipeline_router
from api.jobs.routes import router as jobs_router
from api.applications.routes import router as applications_router
from api.companies.routes import router as companies_router
from api.users.routes import router as users_router
from api.admin.routes import router as admin_router
from api.referrals.routes import router as referrals_router
from api.insider.routes import router as insider_router

api_router = APIRouter()
api_router.include_router(auth_router)
api_router.include_router(resume_router)
api_router.include_router(pipeline_router)
api_router.include_router(jobs_router)
api_router.include_router(applications_router)
api_router.include_router(companies_router)
api_router.include_router(users_router)
api_router.include_router(admin_router)
api_router.include_router(referrals_router)
api_router.include_router(insider_router)

from api.karen.routes import router as karen_router
api_router.include_router(karen_router)

from api.salary.routes import router as salary_router
api_router.include_router(salary_router)

from api.courses.routes import router as courses_router
from api.salary.routes  import router as salary_router
api_router.include_router(courses_router)
api_router.include_router(salary_router)
from api.hrms.routes import router as hrms_router
api_router.include_router(hrms_router)