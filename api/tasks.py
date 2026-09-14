import os
from api.celery_app import celery_app
from api.database import SessionLocal
from api.models import RetentionTask, Customer
from api.email_service import send_email

@celery_app.task(bind=True, max_retries=3)
def send_retention_email_task(self, customer_id: int, task_id: int):
    db = SessionLocal()
    try:
        task = db.query(RetentionTask).filter(RetentionTask.id == task_id).first()
        customer = db.query(Customer).filter(Customer.id == customer_id).first()

        if not task or not customer:
            return "Customer or Task not found"

        # Generate personalized email based on SHAP reasons stored in task description
        reasons = task.description.lower()
        
        email_body = f"Hi {customer.name or 'Customer'},\n\nWe noticed that your recent engagement with the platform has decreased. We'd love to help you get more value from the product.\n\n"
        
        if "login" in reasons:
            email_body += "We noticed your recent platform activity has decreased.\n"
        if "support" in reasons:
            email_body += "We'd also like to make sure any issues you're experiencing are resolved.\n"
        if "feature" in reasons:
            email_body += "We can help you discover features that may be useful for your workflow.\n"
            
        email_body += "\nOur team can help you with a quick walkthrough and answer any questions you may have.\n\nBest,\nChurnIQ Team"

        subject = "How can we help you get more out of ChurnIQ?"
        
        # We assume a fake email for the customer since it's not in the DB
        to_email = f"customer_{customer.id}@example.com"

        success = send_email(to_email, subject, email_body)

        if success:
            task.email_status = "sent"
        else:
            task.email_status = "failed"
            # If we had actual SMTP configured and it failed, we'd raise self.retry() here,
            # but since we might just be logging it locally, we leave it as failed.
            
        db.commit()
        return "Email processed"
    except Exception as exc:
        db.rollback()
        # Ensure we mark it failed if an exception happens
        task = db.query(RetentionTask).filter(RetentionTask.id == task_id).first()
        if task:
            task.email_status = "failed"
            db.commit()
        raise self.retry(exc=exc, countdown=60)
    finally:
        db.close()
