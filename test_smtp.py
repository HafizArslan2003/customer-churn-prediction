"""
RetainIQ SMTP Test Script
Run: python test_smtp.py [optional-recipient-email]
Tests the exact same send_email() function used by the application.
"""
import sys
import os
from pathlib import Path

# Load .env from project root
try:
    from dotenv import load_dotenv
    load_dotenv(dotenv_path=Path(__file__).resolve().parent / ".env", override=False)
except ImportError:
    print("WARNING: python-dotenv not installed. Reading from environment only.")

# Inspect config (never print passwords)
host = os.getenv("EMAIL_HOST", "")
port = os.getenv("EMAIL_PORT", "587")
username = os.getenv("EMAIL_USERNAME", "")
password = os.getenv("EMAIL_PASSWORD", "")
from_email = os.getenv("EMAIL_FROM", "")
use_tls = os.getenv("EMAIL_USE_TLS", "true")
retention_test = os.getenv("RETENTION_TEST_EMAIL", "")

print("=== RetainIQ SMTP Configuration ===")
print(f"  EMAIL_HOST:      {'configured (' + host + ')' if host else 'MISSING'}")
print(f"  EMAIL_PORT:      {port}")
print(f"  EMAIL_USERNAME:  {'configured' if username else 'MISSING'}")
print(f"  EMAIL_PASSWORD:  {'configured' if password else 'MISSING'}")
print(f"  EMAIL_FROM:      {'configured (' + from_email + ')' if from_email else 'MISSING'}")
print(f"  EMAIL_USE_TLS:   {use_tls}")
print(f"  RETENTION_TEST_EMAIL: {retention_test or '(not set)'}")
print()

# Determine recipient
if len(sys.argv) > 1:
    recipient = sys.argv[1].strip()
    print(f"Recipient: {recipient} (from command line)")
elif retention_test:
    recipient = retention_test
    print(f"Recipient: {recipient} (from RETENTION_TEST_EMAIL)")
else:
    print("ERROR: No recipient. Pass email as argument or set RETENTION_TEST_EMAIL.")
    sys.exit(1)

if not all([host, username, password]):
    print("ERROR: Missing required SMTP configuration. Cannot send test email.")
    sys.exit(1)

# Import and call the real send_email function
sys.path.insert(0, str(Path(__file__).resolve().parent))
from api.email_service import send_email

print(f"Sending test email to: {recipient}")
print("Connecting to SMTP server...")

result = send_email(
    to_email=recipient,
    subject="RetainIQ SMTP Test",
    body=(
        "This is a RetainIQ SMTP test email.\n\n"
        "If you received this, your SMTP configuration is working correctly.\n\n"
        "-- RetainIQ System Test"
    )
)

print()
if result == "sent":
    print("SUCCESS: Email sent! Check your inbox.")
elif result == "not_configured":
    print("FAILURE: SMTP not configured (missing host/username/password).")
    sys.exit(1)
elif result == "failed":
    print("FAILURE: SMTP delivery failed. Check your EMAIL_* settings and app password.")
    sys.exit(1)
else:
    print(f"UNKNOWN result: {result}")
    sys.exit(1)
