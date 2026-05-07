"""
api/karen/service.py — KAREN AI Agent
Brutally honest career coach for job seekers.
Sharp talent analyst for recruiters.

Converted from OpenAI → Groq (llama-3.3-70b-versatile)
"""
import re
import json
from groq import Groq
from sqlalchemy.orm import Session
from datetime import datetime

from config import settings
from models import (
    KarenMemory, User, Resume, Application,
    Job, UserRole, PipelineStage
)

client = Groq(api_key=settings.GROQ_API_KEY)

GROQ_MODEL      = "llama-3.3-70b-versatile"
MAX_MESSAGES    = 10
SUMMARY_TRIGGER = 15


# ── Personality prompts ────────────────────────────────────────────────────

JOBSEEKER_SYSTEM = """You are KAREN, a brutally honest AI career coach on HireFlow.
You have access to the user's complete profile data provided below.
Your personality:
- Direct, no sugarcoating
- Data-driven ("Your ATS score is 42. Industry average is 68. Here's why.")
- Actionable ("Add Docker and Kubernetes to your skills section — they appear in 80% of DevOps JDs")
- Occasionally sarcastic but always helpful
- Never say "Great question!" or any filler phrases

You can AUTO-APPLY to jobs on behalf of the user when they ask.
For everything else (withdraw, profile changes) — SUGGEST ONLY, never act.

When applying to a job, include exactly this in your response:
ACTION:APPLY:{job_id}

User Profile:
{profile}

Conversation summary so far:
{summary}"""


RECRUITER_SYSTEM = """You are KAREN, a sharp AI talent analyst on HireFlow.
You have access to this recruiter's pipeline and candidate data provided below.
Your personality:
- Analytical and precise
- Data-first ("Your Round 1 → Round 2 conversion is 34%. Industry benchmark is 52%.")
- Strategic recommendations
- No fluff, no filler

You SUGGEST actions only — never auto-act for recruiters.

Recruiter Pipeline Data:
{profile}

Conversation summary so far:
{summary}"""


# ── Context builders ───────────────────────────────────────────────────────

def _build_jobseeker_context(user: User, db: Session) -> str:
    resume = db.query(Resume).filter(
        Resume.user_id   == user.id,
        Resume.is_active == True,
    ).first()

    apps = db.query(Application).filter(
        Application.user_id == user.id
    ).order_by(Application.created_at.desc()).limit(5).all()

    parsed = (resume.parsed_data or {}) if resume else {}

    context = {
        "name":           user.full_name,
        "email":          user.email,
        "tier":           user.tier,
        "job_pref":       user.job_pref,
        "ats_score":      resume.ats_score if resume else None,
        "skills":         parsed.get("skills", [])[:15],
        "experience_yrs": parsed.get("total_experience_years", 0),
        "current_title":  parsed.get("current_title"),
        "applications": [
            {
                "job_title":     a.job.title if a.job else "Unknown",
                "company":       a.job.company.name if a.job and a.job.company else "Unknown",
                "stage":         a.current_stage.value,
                "highest_stage": a.highest_stage.value,
                "match_score":   a.match_score,
            }
            for a in apps
        ],
    }
    return json.dumps(context, indent=2)


def _build_recruiter_context(user: User, db: Session) -> str:
    from models import Recruiter, Job, Company

    rec = db.query(Recruiter).filter(Recruiter.user_id == user.id).first()
    if not rec:
        return json.dumps({"error": "Not linked to any company"})

    company = db.query(Company).filter(Company.id == rec.company_id).first()
    jobs    = db.query(Job).filter(
        Job.company_id == rec.company_id,
        Job.is_active  == True,
    ).limit(5).all()

    pipeline_summary = []
    for job in jobs:
        apps = db.query(Application).filter(Application.job_id == job.id).all()
        stage_counts = {}
        for app in apps:
            stage = app.current_stage.value
            stage_counts[stage] = stage_counts.get(stage, 0) + 1
        pipeline_summary.append({
            "job_id":    str(job.id),
            "title":     job.title,
            "applicants": len(apps),
            "pipeline":  stage_counts,
        })

    context = {
        "company":     company.name if company else "Unknown",
        "recruiter":   user.full_name,
        "active_jobs": len(jobs),
        "pipeline":    pipeline_summary,
    }
    return json.dumps(context, indent=2)


# ── Memory management ──────────────────────────────────────────────────────

def _get_or_create_memory(user_id: str, db: Session) -> KarenMemory:
    memory = db.query(KarenMemory).filter(
        KarenMemory.user_id == user_id
    ).first()
    if not memory:
        from uuid import uuid4
        memory = KarenMemory(
            id=str(uuid4()),
            user_id=user_id,
            messages=[],
            summary=None,
            total_messages=0,
        )
        db.add(memory)
        db.commit()
        db.refresh(memory)
    return memory


def _summarize_messages(messages: list) -> str:
    """Summarize old messages to keep context window small."""
    if not messages:
        return ""
    text = "\n".join(
        f"{m['role'].upper()}: {m['content']}" for m in messages
    )
    try:
        resp = client.chat.completions.create(
            model=GROQ_MODEL,
            messages=[
                {
                    "role": "system",
                    "content": "You are a concise summarizer. Return only the summary, no preamble.",
                },
                {
                    "role": "user",
                    "content": (
                        "Summarize this conversation in 3-4 sentences, "
                        f"keeping key facts about the user:\n\n{text}"
                    ),
                },
            ],
            temperature=0,
            max_tokens=200,
        )
        return resp.choices[0].message.content.strip()
    except Exception:
        return "Previous conversation context available."


def _update_memory(
    memory:      KarenMemory,
    user_msg:    str,
    karen_reply: str,
    db:          Session,
):
    messages = list(memory.messages or [])
    messages.append({"role": "user",      "content": user_msg})
    messages.append({"role": "assistant", "content": karen_reply})

    memory.total_messages = (memory.total_messages or 0) + 2

    if len(messages) > SUMMARY_TRIGGER:
        to_summarize   = messages[:-MAX_MESSAGES]
        keep           = messages[-MAX_MESSAGES:]
        new_summary    = _summarize_messages(to_summarize)
        memory.summary = (memory.summary or "") + " " + new_summary
        memory.messages = keep
    else:
        memory.messages = messages[-MAX_MESSAGES:]

    memory.updated_at = datetime.utcnow()
    db.commit()


# ── Action handler ─────────────────────────────────────────────────────────

def _handle_action(
    reply:   str,
    user_id: str,
    db:      Session,
) -> tuple[str, str | None]:
    action_taken = None

    if "ACTION:APPLY:" in reply:
        try:
            job_id      = reply.split("ACTION:APPLY:")[1].split()[0].strip()
            clean_reply = reply.replace(f"ACTION:APPLY:{job_id}", "").strip()

            from api.applications.service import apply_to_job
            app = apply_to_job(
                user_id=user_id,
                job_id=job_id,
                resume_id=None,
                db=db,
            )
            job          = db.query(Job).filter(Job.id == job_id).first()
            action_taken = f"Applied to: {job.title if job else job_id}"
            return clean_reply, action_taken
        except Exception as e:
            clean_reply = reply.replace(
                reply[reply.find("ACTION:APPLY:"):reply.find("ACTION:APPLY:") + 50], ""
            ).strip()
            return clean_reply + f"\n(Note: Could not auto-apply — {str(e)})", None

    return reply, action_taken


# ── Main chat function ─────────────────────────────────────────────────────

def chat(
    user_id: str,
    message: str,
    db:      Session,
) -> dict:
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        return {"reply": "User not found", "action_taken": None, "suggestions": []}

    is_recruiter = user.role in (UserRole.RECRUITER, UserRole.ADMIN)
    if is_recruiter:
        profile     = _build_recruiter_context(user, db)
        system_tmpl = RECRUITER_SYSTEM
    else:
        profile     = _build_jobseeker_context(user, db)
        system_tmpl = JOBSEEKER_SYSTEM

    memory  = _get_or_create_memory(user_id, db)
    summary = memory.summary or "No previous conversation."

    system_prompt = system_tmpl.format(
        profile=profile,
        summary=summary,
    )

    messages = [{"role": "system", "content": system_prompt}]
    for m in (memory.messages or []):
        messages.append({"role": m["role"], "content": m["content"]})
    messages.append({"role": "user", "content": message})

    try:
        resp = client.chat.completions.create(
            model=GROQ_MODEL,
            messages=messages,
            temperature=0.7,
            max_tokens=500,
        )
        raw_reply = resp.choices[0].message.content.strip()
    except Exception as e:
        return {
            "reply":        f"KAREN is unavailable right now: {str(e)}",
            "action_taken": None,
            "suggestions":  [],
        }

    clean_reply, action_taken = _handle_action(raw_reply, user_id, db)
    _update_memory(memory, message, clean_reply, db)
    suggestions = _get_suggestions(user, is_recruiter)

    return {
        "reply":        clean_reply,
        "action_taken": action_taken,
        "suggestions":  suggestions,
    }


def _get_suggestions(user: User, is_recruiter: bool) -> list[str]:
    if is_recruiter:
        return [
            "Show me top candidates for my latest job",
            "What's my pipeline conversion rate?",
            "Which role has the most applicants?",
        ]
    return [
        "What's my ATS score?",
        "What skills am I missing for my target role?",
        "Show me jobs matching my profile",
        "How do I improve my resume?",
    ]


def get_memory(user_id: str, db: Session) -> dict:
    memory = _get_or_create_memory(user_id, db)
    return {
        "total_messages":  memory.total_messages,
        "recent_messages": memory.messages,
        "has_summary":     bool(memory.summary),
    }


def clear_memory(user_id: str, db: Session):
    memory                = _get_or_create_memory(user_id, db)
    memory.messages       = []
    memory.summary        = None
    memory.total_messages = 0
    memory.updated_at     = datetime.utcnow()
    db.commit()