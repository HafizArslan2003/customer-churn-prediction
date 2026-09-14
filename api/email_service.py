import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

def send_email(to_email: str, subject: str, body: str) -> bool:
    host = os.getenv("EMAIL_HOST")
    port = int(os.getenv("EMAIL_PORT", "587"))
    username = os.getenv("EMAIL_USERNAME")
    password = os.getenv("EMAIL_PASSWORD")
    from_email = os.getenv("EMAIL_FROM", "noreply@churniq.com")
    use_tls = os.getenv("EMAIL_USE_TLS", "true").lower() == "true"

    if not host or not username or not password:
        # Fallback for dev mode
        print(f"[Email Service] Would send email to {to_email}: {subject}")
        print(body)
        return True

    try:
        msg = MIMEMultipart()
        msg['From'] = from_email
        msg['To'] = to_email
        msg['Subject'] = subject
        msg.attach(MIMEText(body, 'plain'))

        server = smtplib.SMTP(host, port)
        if use_tls:
            server.starttls()
        server.login(username, password)
        server.send_message(msg)
        server.quit()
        return True
    except Exception as e:
        print(f"Failed to send email: {e}")
        return False
