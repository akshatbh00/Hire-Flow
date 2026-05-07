from pydantic_settings import BaseSettings
from functools import lru_cache

class Settings(BaseSettings):
    # App
    APP_NAME: str = "HireFlow"
    DEBUG: bool = False
    API_PREFIX: str = "/api/v1"

    # DB
    DATABASE_URL: str

    # Redis
    REDIS_URL: str = "redis://localhost:6379/0"
    CELERY_BROKER_URL: str = "redis://localhost:6379/0"
    CELERY_RESULT_BACKEND: str = "redis://localhost:6379/1"

    # AI
    OPENAI_API_KEY: str = ""
    EMBEDDING_MODEL: str = "text-embedding-3-small"
    LLM_MODEL: str = "gpt-4o-mini"
    GROQ_API_KEY: str = ""

    # Vector DB
    VECTOR_BACKEND: str = "pgvector"
    PINECONE_API_KEY: str = ""
    PINECONE_ENV: str = ""
    PINECONE_INDEX: str = "hireflow"

    # Storage
    STORAGE_BACKEND: str = "local"
    AWS_ACCESS_KEY_ID: str = ""
    AWS_SECRET_ACCESS_KEY: str = ""
    AWS_S3_BUCKET: str = ""
    AWS_REGION: str = "ap-south-1"

    # Auth
    JWT_SECRET: str
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRE_MINUTES: int = 1440

    # Email
    SENDGRID_API_KEY: str = ""
    FROM_EMAIL: str = "noreply@hireflow.in"

    # Premium
    RAZORPAY_KEY_ID: str = ""
    RAZORPAY_KEY_SECRET: str = ""

    class Config:
        env_file = ".env"

    # Adzuna
    ADZUNA_APP_ID:  str = ""
    ADZUNA_APP_KEY: str = ""
    ADZUNA_COUNTRY: str = "in"

@lru_cache
def get_settings() -> Settings:
    return Settings()

settings = get_settings()
