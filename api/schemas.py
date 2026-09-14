from pydantic import BaseModel
from typing import List, Optional, Any
from datetime import datetime

class RetentionTaskBase(BaseModel):
    status: Optional[str] = None
    priority: Optional[str] = None

class RetentionTaskUpdate(RetentionTaskBase):
    pass

class RetentionTaskOut(BaseModel):
    id: int
    customer_id: int
    title: str
    description: str
    priority: str
    status: str
    action_type: Optional[str] = None
    email_status: str
    completed_at: Optional[datetime] = None
    created_at: datetime
    
    # Optional field to return customer name easily
    customer_name: Optional[str] = None

    class Config:
        orm_mode = True

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
