"""
Background Celery tasks for ChurnIQ retention automation.

The worker:
  1. Receives a job with (customer_id, task_id).
  2. Opens its own SQLAlchemy session (never reuses FastAPI's).
  3. Fetches the customer and retention task.
  4. Generates a personalised email from the SHAP reasons in the task description.
  5. Calls email_service.send_email (dev mode: logs to console).
  6. Updates email_status → "sent" or "failed".
  7. Closes the session in the finally block.
"""

import logging
from api.celery_app import celery_app
from api.database import SessionLocal
from api.models import RetentionTask, Customer
from api.email_service import send_email

logger = logging.getLogger(__name__)


def _build_email_body(customer_name: str, reasons_text: str) -> str:
    """Return a customer-friendly retention email body."""
    name = customer_name or "Valued Customer"
    lines = [
        f"Hi {name},",
        "",
        "We noticed that your recent engagement with our platform has decreased and we'd love to help you get more value from the product.",
        "",
    ]

    reasons_lower = reasons_text.lower()
    if "login" in reasons_lower:
        lines.append("We noticed your recent platform activity has decreased. We'd love to reconnect and see how things are going.")
    if "support" in reasons_lower or "ticket" in reasons_lower:
        lines.append("We'd also like to make sure any issues you've experienced are fully resolved.")
    if "feature" in reasons_lower:
        lines.append("We can also walk you through features that may not yet be part of your workflow but could save you significant time.")

    lines += [
        "",
        "Our team is ready to schedule a quick call at your convenience — no commitment needed.",
        "",
        "Best regards,",
        "The ChurnIQ Team",
    ]
    return "\n".join(lines)


@celery_app.task(bind=True, max_retries=3, default_retry_delay=60)
def send_retention_email_task(self, customer_id: int, task_id: int):
    """
    Celery task: send a personalised retention email to a high-risk customer.
    Safe to retry on transient failures; marks email_status="failed" on permanent failure.
    """
    db = SessionLocal()
    try:
        task = db.query(RetentionTask).filter(RetentionTask.id == task_id).first()
        customer = db.query(Customer).filter(Customer.id == customer_id).first()

        if not task:
            logger.warning("RetentionTask %s not found — skipping.", task_id)
            return "task_not_found"
        if not customer:
            logger.warning("Customer %s not found — skipping.", customer_id)
            task.email_status = "failed"
            db.commit()
            return "customer_not_found"

        # Already processed — do not re-send
        if task.email_status == "sent":
            return "already_sent"

        body = _build_email_body(customer.name or "", task.description or "")
        subject = "We'd love to help you get more from ChurnIQ"
        to_email = f"customer_{customer.id}@example.com"   # Replace with real email field when available

        success = send_email(to_email, subject, body)

        task.email_status = "sent" if success else "failed"
        db.commit()

        logger.info("Retention email for customer %s → %s", customer_id, task.email_status)
        return task.email_status

    except Exception as exc:
        db.rollback()
        logger.exception("Error in send_retention_email_task for task %s: %s", task_id, exc)

        # Try to mark the task as failed before retrying
        try:
            _task = db.query(RetentionTask).filter(RetentionTask.id == task_id).first()
            if _task and _task.email_status not in ("sent",):
                _task.email_status = "failed"
                db.commit()
        except Exception:
            pass

        # Retry up to max_retries times on transient errors
        raise self.retry(exc=exc)

    finally:
        db.close()
