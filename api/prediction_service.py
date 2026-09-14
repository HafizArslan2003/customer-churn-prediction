"""
Shared ML prediction logic used by both /predict and /predict/bulk.
Keeps all model inference, SHAP explanation, DB saving, and retention
triggering in one place so there is exactly ONE copy of the logic.

Customer identity rules:
  - If email is provided -> look up existing customer by email; update if found.
  - If no email -> always create a new record (anonymous prediction).
"""

import json
import logging
import numpy as np
import pandas as pd
from sqlalchemy.orm import Session

logger = logging.getLogger(__name__)

try:
    from . import models
    from .config import risk_level
except ImportError:
    import models
    from config import risk_level

# These will be set by main.py at startup so we don't re-load pkl files
_model = None
_scaler = None
_explainer = None
_feature_means = None
_feature_names: list[str] = []
_get_celery_fn = None  # lazy celery getter


def init(model, scaler, explainer, feature_means, feature_names, get_celery_fn):
    """Called once from main.py after loading artifacts."""
    global _model, _scaler, _explainer, _feature_means, _feature_names, _get_celery_fn
    _model = model
    _scaler = scaler
    _explainer = explainer
    _feature_means = feature_means
    _feature_names = feature_names
    _get_celery_fn = get_celery_fn


def recommendations_for(level: str) -> list[str]:
    if level == "high":
        return ["Contact the customer", "Investigate support issues", "Offer onboarding or retention assistance"]
    if level == "medium":
        return ["Monitor engagement", "Share relevant product guidance"]
    return ["Continue regular engagement", "Invite the customer to explore more features"]


def _get_or_create_customer(
    db: Session,
    name,
    email,
    login_frequency: float,
    feature_usage_count: float,
    support_ticket_volume: float,
    payment_amount: float,
    account_age: float,
) -> "models.Customer":
    """
    Find existing customer by email (if provided) and update their activity fields.
    If no customer with that email exists, create a new one.
    If no email is provided, always create a new anonymous record.

    This prevents customer table from growing every time the same CSV is uploaded.
    """
    clean_email = email.strip() if email and email.strip() else None

    if clean_email:
        existing = (
            db.query(models.Customer)
            .filter(models.Customer.email == clean_email)
            .first()
        )
        if existing:
            # Update mutable fields so the record stays current
            if name:
                existing.name = name
            existing.login_frequency = login_frequency
            existing.feature_usage_count = feature_usage_count
            existing.support_ticket_volume = support_ticket_volume
            existing.payment_amount = payment_amount
            existing.account_age = account_age
            db.commit()
            db.refresh(existing)
            logger.info("Reusing existing customer id=%s email=%s", existing.id, clean_email)
            return existing

    # No email provided OR no matching customer found -> create new
    customer = models.Customer(
        name=name,
        email=clean_email,
        login_frequency=login_frequency,
        feature_usage_count=feature_usage_count,
        support_ticket_volume=support_ticket_volume,
        payment_amount=payment_amount,
        account_age=account_age,
    )
    db.add(customer)
    db.commit()
    db.refresh(customer)
    if clean_email:
        logger.info("Created new customer id=%s email=%s", customer.id, clean_email)
    else:
        logger.info("Created anonymous customer id=%s (no email)", customer.id)
    return customer


def run_prediction(
    *,
    name,
    email,
    login_frequency: float,
    feature_usage_count: float,
    support_ticket_volume: float,
    payment_amount: float,
    account_age: float,
    db: Session,
    persist: bool = True,
) -> dict:
    """
    Run the full ML prediction pipeline for one customer.

    If persist=True: saves Customer (deduped by email), Prediction, and
    (if high-risk) RetentionTask to the DB and queues a Celery email job.

    Returns a dict with all prediction info + retention metadata.
    """
    if _model is None:
        raise RuntimeError("Model artifacts not loaded")

    input_data = pd.DataFrame([[
        login_frequency, feature_usage_count,
        support_ticket_volume, payment_amount, account_age
    ]], columns=_feature_names)

    input_scaled = _scaler.transform(input_data)
    prob = float(_model.predict_proba(input_scaled)[0][1])
    prediction = int(_model.predict(input_scaled)[0])

    # SHAP
    shap_values = _explainer.shap_values(input_scaled)
    if isinstance(shap_values, list):
        shap_vals_churn = shap_values[1][0]
    elif len(shap_values.shape) == 3:
        shap_vals_churn = shap_values[0, :, 1]
    else:
        shap_vals_churn = shap_values[0]

    reasons: list[str] = []
    for idx in np.argsort(np.abs(shap_vals_churn))[::-1][:3]:
        feat = _feature_names[idx]
        val = input_data.iloc[0, idx]
        mean_val = _feature_means[feat]
        shap_val = shap_vals_churn[idx]
        if abs(shap_val) < 0.01:
            continue
        direction = "increases" if shap_val > 0 else "decreases"
        diff_pct = ((val - mean_val) / (mean_val + 1e-5)) * 100
        comp = f"{abs(diff_pct):.0f}% {'above' if val > mean_val else 'below'} average"
        reasons.append(f"{feat} is {comp} ({val:.1f} vs avg {mean_val:.1f}), which {direction} churn risk.")

    level = risk_level(prob)
    recs = recommendations_for(level)

    result = {
        "name": name,
        "email": email,
        "churn_probability": prob,
        "prediction": prediction,
        "risk_level": level,
        "top_reasons": reasons,
        "recommendations": recs,
        "retention_task": False,
        "email_status": None,
    }

    if not persist:
        return result

    # -- Save Customer (deduped by email) -------------------------
    db_customer = _get_or_create_customer(
        db=db,
        name=name,
        email=email,
        login_frequency=login_frequency,
        feature_usage_count=feature_usage_count,
        support_ticket_volume=support_ticket_volume,
        payment_amount=payment_amount,
        account_age=account_age,
    )

    # -- Save Prediction ------------------------------------------
    db_prediction = models.Prediction(
        customer_id=db_customer.id,
        churn_probability=prob,
        prediction=prediction,
        top_reasons=json.dumps(reasons),
    )
    db.add(db_prediction)
    db.commit()

    # -- Retention trigger (>= 70%) -------------------------------
    if level == "high":
        existing_task = (
            db.query(models.RetentionTask)
            .filter(
                models.RetentionTask.customer_id == db_customer.id,
                models.RetentionTask.title == "Contact high-risk customer",
                models.RetentionTask.status.in_(["pending", "in_progress"]),
            )
            .first()
        )

        target_task = None
        if not existing_task:
            reason_summary = " ".join(reasons) if reasons else "No SHAP reasons were available."

            clean_email = email.strip() if email and email.strip() else None
            initial_email_status = "pending" if clean_email else "missing_recipient"

            new_task = models.RetentionTask(
                customer_id=db_customer.id,
                title="Contact high-risk customer",
                description=f"Churn probability: {prob:.1%}. Main risk reasons: {reason_summary}",
                priority="high",
                status="pending",
                action_type="email",
                email_status=initial_email_status,
            )
            db.add(new_task)
            db.commit()
            db.refresh(new_task)
            target_task = new_task
            result["retention_task"] = True
            result["email_status"] = initial_email_status
        else:
            target_task = existing_task
            result["retention_task"] = True
            result["email_status"] = existing_task.email_status

            # If we now have an email but previously did not, allow retry
            clean_email = email.strip() if email and email.strip() else None
            if clean_email and target_task.email_status == "missing_recipient":
                target_task.email_status = "pending"
                result["email_status"] = "pending"
                db.commit()

        # Queue email if status warrants it
        retryable = {"pending", "failed", "queue_failed", "not_configured"}
        if target_task and target_task.email_status in retryable:
            try:
                celery_fn = _get_celery_fn() if _get_celery_fn else None
                if celery_fn is not None:
                    celery_fn.delay(db_customer.id, target_task.id)
                    target_task.email_status = "queued"
                    result["email_status"] = "queued"
                    logger.info(
                        "Queued retention email task for customer id=%s task id=%s",
                        db_customer.id, target_task.id,
                    )
                else:
                    target_task.email_status = "queue_failed"
                    result["email_status"] = "queue_failed"
                    logger.warning(
                        "Celery unavailable -- could not queue email for customer %s", db_customer.id
                    )
            except Exception as e:
                logger.error("Failed to queue Celery task: %s", e)
                target_task.email_status = "queue_failed"
                result["email_status"] = "queue_failed"
            db.commit()

    return result
