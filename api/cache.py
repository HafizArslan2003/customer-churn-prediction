"""Optional Redis utilities. The database remains the source of truth."""

import os
import time
from typing import Any

try:
    from redis import Redis
except ImportError:  # Redis is optional for local development.
    Redis = None


_client = None


def client():
    global _client
    if _client is not None:
        return _client
    url = os.getenv("REDIS_URL")
    if not url or Redis is None:
        return None
    try:
        _client = Redis.from_url(url, decode_responses=True, socket_connect_timeout=1, socket_timeout=1)
        _client.ping()
        return _client
    except Exception:
        _client = None
        return None


def get_json(key: str) -> Any | None:
    redis = client()
    if not redis:
        return None
    try:
        import json
        value = redis.get(key)
        return json.loads(value) if value else None
    except Exception:
        return None


def set_json(key: str, value: Any, ttl_seconds: int) -> None:
    redis = client()
    if not redis:
        return
    try:
        import json
        redis.setex(key, ttl_seconds, json.dumps(value, default=str))
    except Exception:
        pass


def delete(key: str) -> None:
    redis = client()
    if redis:
        try:
            redis.delete(key)
        except Exception:
            pass


def rate_limit(scope: str, limit: int, window_seconds: int) -> bool:
    """Return True when the request should be allowed; bypass safely without Redis."""
    redis = client()
    if not redis:
        return True
    bucket = int(time.time() // window_seconds)
    key = f"insightos:rate:{scope}:{bucket}"
    try:
        count = redis.incr(key)
        if count == 1:
            redis.expire(key, window_seconds)
        return count <= limit
    except Exception:
        return True
