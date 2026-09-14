"""Shared product rules used by the API, reports, and AI responses."""

RISK_THRESHOLDS = {"low_max": 0.4, "medium_max": 0.7}


def risk_level(probability: float) -> str:
    if probability >= RISK_THRESHOLDS["medium_max"]:
        return "high"
    if probability >= RISK_THRESHOLDS["low_max"]:
        return "medium"
    return "low"


def risk_thresholds_payload() -> dict:
    return {
        "low": {"min": 0, "max": RISK_THRESHOLDS["low_max"]},
        "medium": {"min": RISK_THRESHOLDS["low_max"], "max": RISK_THRESHOLDS["medium_max"]},
        "high": {"min": RISK_THRESHOLDS["medium_max"], "max": 1},
    }
