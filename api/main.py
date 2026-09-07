import os
import pickle
import numpy as np
import pandas as pd
import json
from fastapi import FastAPI, HTTPException, Depends
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import func
import shap

from . import models, schemas
from .database import engine, get_db
from .schemas import CustomerData, PredictionResponse

# Create DB tables
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Churn Prediction API", description="Predicts SaaS customer churn probability.")

# CORS for React/Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

MODEL_DIR = os.path.join(os.path.dirname(__file__), "../model")

try:
    with open(os.path.join(MODEL_DIR, "model.pkl"), "rb") as f:
        model = pickle.load(f)
    with open(os.path.join(MODEL_DIR, "scaler.pkl"), "rb") as f:
        scaler = pickle.load(f)
    with open(os.path.join(MODEL_DIR, "explainer.pkl"), "rb") as f:
        explainer = pickle.load(f)
    with open(os.path.join(MODEL_DIR, "feature_means.pkl"), "rb") as f:
        feature_means = pickle.load(f)
except FileNotFoundError:
    model = None


@app.get("/")
def serve_ui():
    return FileResponse(os.path.join(os.path.dirname(__file__), "static/index.html"))


@app.post("/predict", response_model=PredictionResponse)
def predict_churn(data: CustomerData, db: Session = Depends(get_db)):
    if model is None:
        raise HTTPException(status_code=500, detail="Model artifacts not found.")

    feature_names = ["login_frequency", "feature_usage_count", "support_ticket_volume", "payment_amount", "account_age"]
    input_data = pd.DataFrame([[
        data.login_frequency, data.feature_usage_count,
        data.support_ticket_volume, data.payment_amount, data.account_age
    ]], columns=feature_names)

    input_scaled = scaler.transform(input_data)
    prob = model.predict_proba(input_scaled)[0][1]
    prediction = int(model.predict(input_scaled)[0])

    shap_values = explainer.shap_values(input_scaled)
    if isinstance(shap_values, list):
        shap_vals_churn = shap_values[1][0]
    elif len(shap_values.shape) == 3:
        shap_vals_churn = shap_values[0, :, 1]
    else:
        shap_vals_churn = shap_values[0]

    reasons = []
    for idx in np.argsort(np.abs(shap_vals_churn))[::-1][:3]:
        feat = feature_names[idx]
        val = input_data.iloc[0, idx]
        mean_val = feature_means[feat]
        shap_val = shap_vals_churn[idx]
        if abs(shap_val) < 0.01:
            continue
        direction = "increases" if shap_val > 0 else "decreases"
        diff_pct = ((val - mean_val) / (mean_val + 1e-5)) * 100
        comp = f"{abs(diff_pct):.0f}% {'above' if val > mean_val else 'below'} average"
        reasons.append(f"{feat} is {comp} ({val:.1f} vs avg {mean_val:.1f}), which {direction} churn risk.")

    # Save to DB
    db_customer = models.Customer(
        name=data.name,
        login_frequency=data.login_frequency,
        feature_usage_count=data.feature_usage_count,
        support_ticket_volume=data.support_ticket_volume,
        payment_amount=data.payment_amount,
        account_age=data.account_age
    )
    db.add(db_customer)
    db.commit()
    db.refresh(db_customer)

    db_prediction = models.Prediction(
        customer_id=db_customer.id,
        churn_probability=float(prob),
        prediction=prediction,
        top_reasons=json.dumps(reasons)
    )
    db.add(db_prediction)
    db.commit()

    return {"churn_probability": float(prob), "prediction": prediction, "top_reasons": reasons}


@app.get("/customers")
def get_customers(db: Session = Depends(get_db)):
    customers = db.query(models.Customer).order_by(models.Customer.created_at.desc()).all()
    result = []
    for c in customers:
        pred = c.prediction
        result.append({
            "id": c.id,
            "name": c.name,
            "login_frequency": c.login_frequency,
            "feature_usage_count": c.feature_usage_count,
            "support_ticket_volume": c.support_ticket_volume,
            "payment_amount": c.payment_amount,
            "account_age": c.account_age,
            "created_at": c.created_at.isoformat() if c.created_at else None,
            "churn_probability": pred.churn_probability if pred else None,
            "prediction": pred.prediction if pred else None,
            "top_reasons": json.loads(pred.top_reasons) if pred and pred.top_reasons else []
        })
    return result


@app.get("/reports/summary")
def get_reports_summary(db: Session = Depends(get_db)):
    all_preds = db.query(models.Prediction).all()
    total = len(all_preds)

    if total == 0:
        return {
            "total_customers": 0,
            "high_risk_count": 0,
            "low_risk_count": 0,
            "high_risk_pct": 0,
            "low_risk_pct": 0,
            "avg_churn_probability": 0,
            "daily_trend": []
        }

    high_risk = sum(1 for p in all_preds if p.prediction == 1)
    low_risk = total - high_risk
    avg_prob = sum(p.churn_probability for p in all_preds) / total

    # Daily trend: group by date using SQLite strftime
    daily_rows = (
        db.query(
            func.strftime('%Y-%m-%d', models.Prediction.created_at).label("day"),
            func.avg(models.Prediction.churn_probability).label("avg_prob"),
            func.count(models.Prediction.id).label("count")
        )
        .group_by("day")
        .order_by("day")
        .all()
    )

    daily_trend = [
        {"date": str(row.day), "avg_probability": round(row.avg_prob, 4), "count": row.count}
        for row in daily_rows if row.day
    ]

    return {
        "total_customers": total,
        "high_risk_count": high_risk,
        "low_risk_count": low_risk,
        "high_risk_pct": round(high_risk / total * 100, 1),
        "low_risk_pct": round(low_risk / total * 100, 1),
        "avg_churn_probability": round(avg_prob, 4),
        "daily_trend": daily_trend
    }


@app.post("/chat")
async def chat(request: dict, db: Session = Depends(get_db)):
    question = request.get("question", "")
    if not question:
        raise HTTPException(status_code=400, detail="Question is required.")

    # Get DB stats for context
    total = db.query(models.Prediction).count()
    high_risk = db.query(models.Prediction).filter(models.Prediction.prediction == 1).count()
    avg_prob_row = db.query(func.avg(models.Prediction.churn_probability)).scalar()
    avg_prob = round(avg_prob_row * 100, 1) if avg_prob_row else 0

    system_prompt = f"""You are ChurnBot — an AI assistant embedded inside a SaaS Churn Prediction Dashboard.

Project Context:
- This dashboard predicts which SaaS customers are likely to churn (cancel subscription) in the next 30 days.
- ML model: Logistic Regression, trained on Telco Churn dataset, F1 Score: 0.588, Accuracy: 80.8%
- Features used: login_frequency, feature_usage_count, support_ticket_volume, payment_amount, account_age
- SHAP explainability is used to generate human-readable reasons for each prediction
- Tech stack: Python, FastAPI, SQLAlchemy, SQLite, Next.js (React), Chart.js

Current Database Stats:
- Total customers analyzed: {total}
- High-risk customers: {high_risk} ({round(high_risk/total*100, 1) if total else 0}%)
- Average churn probability: {avg_prob}%

Your personality: Reply casually in a natural mix of Roman Urdu + English (Hinglish/Urdu-English code-switching). Be helpful, friendly, and concise. Do NOT use bullet points for every response — talk naturally. Only use bullet points when listing things explicitly."""

    try:
        from openai import OpenAI
        from dotenv import load_dotenv
        load_dotenv(os.path.join(os.path.dirname(__file__), "../.env"))
        api_key = os.getenv("GROQ_API_KEY")
        if not api_key:
            return {"response": "Bhai, Groq API key set nahi hai! Pehle .env file mein GROQ_API_KEY add karo."}

        client = OpenAI(
            base_url="https://api.groq.com/openai/v1",
            api_key=api_key
        )
        response = client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": question}
            ],
            max_tokens=300
        )
        return {"response": response.choices[0].message.content}

    except Exception as e:
        return {"response": f"Oops, kuch error aa gaya: {str(e)}"}
