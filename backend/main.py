from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
from collections import defaultdict
import time
import logging

from config import settings
from database import Base, engine

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    try:
        Base.metadata.create_all(bind=engine)
    except Exception as e:
        logger.error(f"DB ERROR: {e}")
    yield


app = FastAPI(
    title=settings.APP_NAME,
    version="0.1.0",
    docs_url=f"{settings.API_PREFIX}/docs",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Rate limiting ──────────────────────────────────────────────────────────
# Simple in-memory rate limiter — 10 requests per minute per IP on auth routes
_rate_store: dict[str, list[float]] = defaultdict(list)
RATE_LIMIT   = 10   # max requests
RATE_WINDOW  = 60   # seconds

def is_rate_limited(ip: str) -> bool:
    now    = time.time()
    hits   = _rate_store[ip]
    # remove hits outside the window
    recent = [t for t in hits if now - t < RATE_WINDOW]
    _rate_store[ip] = recent
    if len(recent) >= RATE_LIMIT:
        return True
    _rate_store[ip].append(now)
    return False

@app.middleware("http")
async def rate_limit_auth(request: Request, call_next):
    if request.url.path in (
        f"{settings.API_PREFIX}/auth/login",
        f"{settings.API_PREFIX}/auth/register",
    ):
        ip = request.client.host if request.client else "unknown"
        if is_rate_limited(ip):
            return JSONResponse(
                status_code=429,
                content={"detail": "Too many requests. Please wait a minute and try again."},
            )
    return await call_next(request)


# ── Global error handler — no stack traces in responses ────────────────────
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    # Log full traceback server-side only
    logger.exception(f"Unhandled error on {request.method} {request.url.path}")
    # Return generic message to client — no internal details exposed
    return JSONResponse(
        status_code=500,
        content={"detail": "An internal error occurred. Please try again."},
    )


from api.router import api_router
app.include_router(api_router, prefix=settings.API_PREFIX)

from api.hrms.routes import router as hrms_router
app.include_router(hrms_router)


@app.get("/health")
def health():
    return {"status": "ok"}