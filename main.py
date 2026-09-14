"""Convenience ASGI entrypoint for running RetainIQ from the project root.

Use: uvicorn main:app --reload
"""

from api.main import app

