# HireFlow 🚀
AI-powered hiring portal — transparent, fast, no black boxes.

---

## Stack
| Layer      | Tech                                      |
|------------|-------------------------------------------|
| Frontend   | Next.js 14, Tailwind, Zustand             |
| Backend    | FastAPI, SQLAlchemy, Celery               |
| AI         | OpenAI (GPT-4o-mini + embeddings)         |
| Vector DB  | pgvector (dev) / Pinecone (prod)          |
| Database   | SQLite (dev) / PostgreSQL (prod)          |
| Queue      | Redis + Celery                            |
| Storage    | Local (dev) / AWS S3 (prod)               |

---

## Quick Start (Dev)

### 1. Clone + setup env
```bash
git clone <repo>
cd instant_hire

# Backend env
cp backend/.env.example backend/.env
# Fill in: OPENAI_API_KEY, JWT_SECRET

# Frontend env
echo "NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1" > frontend/.env.local
```

### 2. Backend
```bash
cd backend

# Create virtualenv
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # Mac/Linux

# Install deps
pip install fastapi uvicorn sqlalchemy pydantic-settings \
            pydantic[email] python-jose[cryptography] \
            passlib[bcrypt] python-multipart celery redis \
            openai pymupdf python-docx loguru boto3 \
            pgvector alembic sendgrid numpy

# Run migrations (creates SQLite DB)
python -c "from database import Base, engine; from models import *; Base.metadata.create_all(engine)"

# Start API
uvicorn main:app --reload --port 8000
```

### 3. Celery Worker (new terminal)
```bash
cd backend
venv\Scripts\activate
celery -A workers.celery_app worker --loglevel=info
```

### 4. Frontend
```bash
cd frontend
npm install
npm run dev
# → http://localhost:3000
```

---

## Folder Structure
```
instant_hire/
├── backend/
│   ├── ai/
│   │   ├── ats/           # ATS scoring modules
│   │   ├── benchmark/     # Benchmark vs selected pool
│   │   ├── matching/      # Job ↔ resume matching
│   │   ├── optimizer/     # Premium resume rewriter
│   │   ├── prompts/       # LLM prompt templates
│   │   ├── resume/        # Ingestion pipeline
│   │   └── retriever/     # Hybrid search + reranker
│   ├── api/
│   │   ├── admin/         # Admin endpoints
│   │   ├── applications/  # Apply + history
│   │   ├── auth/          # Register + login + JWT
│   │   ├── companies/     # Recruiter portal
│   │   ├── jobs/          # Job CRUD + AI ranking
│   │   ├── pipeline/      # Stage moves + kanban
│   │   ├── premium/       # Optimizer endpoints
│   │   ├── resume/        # Upload + ATS + benchmark
│   │   └── users/         # Dashboard + profile
│   ├── migrations/        # Alembic
│   ├── models.py          # SQLAlchemy ORM
│   ├── storage/           # Local + S3
│   ├── vector_db/         # pgvector + Pinecone
│   └── workers/           # Celery async tasks
│
└── frontend/
    ├── app/
    │   ├── (auth)/        # Login, register, onboarding
    │   ├── (user)/        # Job seeker portal
    │   └── (company)/     # Recruiter portal
    ├── components/
    │   ├── dashboard/     # Score ring, stage tracker
    │   ├── pipeline/      # Kanban board
    │   └── resume/        # ATS display
    ├── lib/               # API client + auth helpers
    └── store/             # Zustand state
```

---

## Key URLs (dev)
```
Frontend        http://localhost:3000
API Docs        http://localhost:8000/api/v1/docs
Dashboard       http://localhost:3000/dashboard
Jobs            http://localhost:3000/jobs
Company         http://localhost:3000/company/dashboard
```

---

## User Flows

### Job Seeker
```
Register → Onboarding (job prefs) → Upload Resume →
AI Analysis → Dashboard → Browse Jobs → Apply →
Track Pipeline (full transparency) → Get Notified
```

### Recruiter
```
Register (recruiter) → Company setup → Post Job →
View AI-ranked candidates → Move pipeline stages →
Candidate gets notified instantly
```

---

## Production Checklist
```
☐ Switch DATABASE_URL to PostgreSQL
☐ Enable pgvector extension
☐ Run alembic upgrade head
☐ Switch STORAGE_BACKEND to s3
☐ Set VECTOR_BACKEND to pinecone (optional)
☐ Set strong JWT_SECRET
☐ Configure SendGrid for emails
☐ Set up Redis on cloud (Upstash etc.)
☐ Deploy backend on Railway / Render / EC2
☐ Deploy frontend on Vercel
```