from sqlalchemy import Column, Integer, Float, String, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
try:
    from .database import Base
except ImportError:
    from database import Base

class Customer(Base):
    __tablename__ = "customers"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=True)
    login_frequency = Column(Float)
    feature_usage_count = Column(Float)
    support_ticket_volume = Column(Float)
    payment_amount = Column(Float)
    account_age = Column(Float)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    prediction = relationship("Prediction", back_populates="customer", uselist=False)

class Prediction(Base):
    __tablename__ = "predictions"

    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, ForeignKey("customers.id"))
    churn_probability = Column(Float)
    prediction = Column(Integer)
    top_reasons = Column(String) # JSON string array
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    customer = relationship("Customer", back_populates="prediction")

class RetentionTask(Base):
    __tablename__ = "retention_tasks"

    id = Column(Integer,primary_key=True,index=True)
    customer_id = Column(Integer,ForeignKey("customers.id"))
    title = Column(String)
    description = Column(String)
    priority = Column(String,default="medium")
    status = Column(String,default="pending")
    created_at = Column(DateTime,default=lambda: datetime.now(timezone.utc))

    customer = relationship("Customer")
