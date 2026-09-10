from pydantic import BaseModel
from typing import List, Optional, Any

class CustomerData(BaseModel):
    name: Optional[str] = None
    login_frequency: float
    feature_usage_count: float
    support_ticket_volume: float
    payment_amount: float
    account_age: float

class PredictionResponse(BaseModel):
    churn_probability: float
    prediction: int
    risk_level: str
    top_reasons: List[str]
    recommendations: List[str] = []

class ChatRequest(BaseModel):
    question: str
    context: Optional[dict[str, Any]] = None
