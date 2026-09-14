import os
from pathlib import Path
from celery import Celery

# Load .env explicitly — Celery worker is a separate process and won't
# inherit env vars from FastAPI unless we load them here too.
try:
    from dotenv import load_dotenv
    _env_path = Path(__file__).resolve().parent.parent / ".env"
    load_dotenv(dotenv_path=_env_path, override=False)
except ImportError:
    pass

redis_url = os.getenv("REDIS_URL", "redis://localhost:6379/0")

celery_app = Celery(
    "retainiq_tasks",
    broker=redis_url,
    backend=redis_url,
    include=["api.tasks"]
)
