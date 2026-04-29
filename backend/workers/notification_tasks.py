"""
workers/notification_tasks.py — async notification dispatch
Sends in-app + email on pipeline stage changes, new matches, etc.
"""
from workers.celery_app import celery_app
from database import SessionLocal
from loguru import logger


@celery_app.task
def notify_stage_change(user_id: str, application_id: str, new_stage: str, notes: str = None):
    """
    Called by PipelineService on every stage transition.
    Sends email + in-app notification to the candidate.
    """
    db = SessionLocal()
    try:
        from models import User, Application, Job
        user = db.query(User).filter(User.id == user_id).first()
        app  = db.query(Application).filter(Application.id == application_id).first()
        if not user or not app:
            return

        job_title = app.job.title if app.job else "the position"

        subject, body = _build_stage_message(user.full_name, job_title, new_stage, notes)

        _send_email(user.email, subject, body)
        _create_in_app(db, user_id, application_id, new_stage, body)

        logger.info(f"Notified user {user_id} → stage {new_stage}")
    except Exception as e:
        logger.error(f"Notification failed: {e}")
    finally:
        db.close()


@celery_app.task
def notify_new_job_matches(user_id: str, match_count: int):
    """Notify user when new jobs matching their profile are posted."""
    db = SessionLocal()
    try:
        from models import User
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            return
        subject = f"🎯 {match_count} new jobs match your profile"
        body    = f"Hi {user.full_name}, we found {match_count} new jobs that match your resume. Check your dashboard."
        _send_email(user.email, subject, body)
    except Exception as e:
        logger.error(f"New match notification failed: {e}")
    finally:
        db.close()


# ── Helpers ────────────────────────────────────────────────────────────────

STAGE_MESSAGES = {
    "applied":       ("Application Received", "Your application has been received and is under review."),
    "ats_screening": ("Under ATS Review",     "Your resume is being screened by our system."),
    "ats_rejected":  ("Application Update",   "Unfortunately your application did not pass initial screening. Keep improving your resume using HireFlow's suggestions."),
    "round_1":       ("Round 1 Interview",    "Congratulations! You've been shortlisted for Round 1."),
    "round_2":       ("Round 2 Interview",    "Great work! You've advanced to Round 2."),
    "round_3":       ("Round 3 Interview",    "Excellent! You've made it to Round 3."),
    "hr_round":      ("HR Interview",         "You're in the final HR round. Best of luck!"),
    "offer":         ("Offer Extended",       "🎉 Congratulations! An offer has been extended to you."),
    "selected":      ("Selected! 🎉",          "You've been selected! Check your email for next steps."),
    "withdrawn":     ("Application Withdrawn","Your application has been withdrawn as requested."),
}


def _build_stage_message(name: str, job_title: str, stage: str, notes: str = None):
    label, default_body = STAGE_MESSAGES.get(stage, ("Application Update", "Your application status has changed."))
    subject = f"HireFlow — {label} for {job_title}"
    body    = f"Hi {name},\n\n{default_body}"
    if notes:
        body += f"\n\nRecruiter note: {notes}"
    body += "\n\nView your full pipeline at HireFlow."
    return subject, body


def _send_email(to: str, subject: str, body: str):
    """
    Sends via SendGrid if key present, else logs (dev mode).
    """
    from config import settings
    if not settings.SENDGRID_API_KEY:
        logger.debug(f"[DEV EMAIL] To: {to} | Subject: {subject}\n{body}")
        return
    try:
        import sendgrid
        from sendgrid.helpers.mail import Mail
        sg  = sendgrid.SendGridAPIClient(api_key=settings.SENDGRID_API_KEY)
        msg = Mail(from_email=settings.FROM_EMAIL, to_emails=to,
                   subject=subject, plain_text_content=body)
        sg.send(msg)
    except Exception as e:
        logger.error(f"SendGrid error: {e}")


def _create_in_app(db, user_id: str, application_id: str, stage: str, message: str):
    """
    Stores notification in DB for the in-app notification bell.
    Requires InAppNotification model — we'll add it to models.py.
    Skips silently if model not yet available.
    """
    try:
        from models import InAppNotification
        import uuid
        db.add(InAppNotification(
            id=uuid.uuid4(),
            user_id=user_id,
            application_id=application_id,
            stage=stage,
            message=message,
            is_read=False,
        ))
        db.commit()
    except Exception:
        pass   # model not yet migrated — non-blocking