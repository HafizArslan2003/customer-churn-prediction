import os
import pickle
import numpy as np
import pandas as pd
import json
from functools import lru_cache
from fastapi import FastAPI, HTTPException, Depends, Query
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import func, or_
import shap

# Support both supported ways of starting the server:
#   project root -> uvicorn api.main:app --reload
#   api folder    -> uvicorn main:app --reload
try:
    from . import models, schemas
    from .database import engine, get_db
    from .schemas import CustomerData, PredictionResponse, ChatRequest
except ImportError:
    import models
    import schemas
    from database import engine, get_db
    from schemas import CustomerData, PredictionResponse, ChatRequest

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
DATASET_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), "../data/customers.csv"))
FEATURE_NAMES = ["login_frequency", "feature_usage_count", "support_ticket_volume", "payment_amount", "account_age"]

def risk_level(probability: float) -> str:
    if probability >= 0.7:
        return "high"
    if probability >= 0.4:
        return "medium"
    return "low"

def recommendations_for(level: str) -> list[str]:
    if level == "high":
        return ["Contact the customer", "Investigate support issues", "Offer onboarding or retention assistance"]
    if level == "medium":
        return ["Monitor engagement", "Share relevant product guidance"]
    return ["Continue regular engagement", "Invite the customer to explore more features"]

def get_model_metadata() -> dict:
    metadata_path = os.path.join(MODEL_DIR, "metadata.json")
    if os.path.exists(metadata_path):
        with open(metadata_path, encoding="utf-8") as metadata_file:
            return json.load(metadata_file)
    return {"model_name": type(model).__name__ if model is not None else "Unavailable", "features": FEATURE_NAMES, "metrics": {}, "training_rows": None, "test_rows": None, "dataset_rows": None, "trained_at": None, "version": None}


@lru_cache(maxsize=1)
def get_dataset_profile():
    """Return a small, privacy-safe aggregate profile for the AI assistant."""
    if not os.path.exists(DATASET_PATH):
        return {"available": False, "message": "The processed customers dataset was not found."}

    data = pd.read_csv(DATASET_PATH)
    numeric_columns = data.select_dtypes(include=[np.number]).columns.tolist()
    profile = {
        "available": True,
        "source": "data/customers.csv",
        "rows": int(len(data)),
        "columns": data.columns.tolist(),
        "missing_values": {column: int(count) for column, count in data.isna().sum().items() if count},
        "feature_averages": {column: round(float(data[column].mean()), 2) for column in numeric_columns},
    }
    if "churned" in data.columns:
        profile["churn_rate_percent"] = round(float(data["churned"].mean() * 100), 2)
        profile["segment_averages"] = {
            "retained": {column: round(float(value), 2) for column, value in data[data["churned"] == 0][numeric_columns].mean().items()},
            "churned": {column: round(float(value), 2) for column, value in data[data["churned"] == 1][numeric_columns].mean().items()},
        }
    return profile

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

    input_data = pd.DataFrame([[
        data.login_frequency, data.feature_usage_count,
        data.support_ticket_volume, data.payment_amount, data.account_age
    ]], columns=FEATURE_NAMES)

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
        feat = FEATURE_NAMES[idx]
        val = input_data.iloc[0, idx]
        mean_val = feature_means[feat]
        shap_val = shap_vals_churn[idx]
        if abs(shap_val) < 0.01:
            continue
        direction = "increases" if shap_val > 0 else "decreases"
        diff_pct = ((val - mean_val) / (mean_val + 1e-5)) * 100
        comp = f"{abs(diff_pct):.0f}% {'above' if val > mean_val else 'below'} average"
        reasons.append(f"{feat} is {comp} ({val:.1f} vs avg {mean_val:.1f}), which {direction} churn risk.")

    level = risk_level(float(prob))
    recommendations = recommendations_for(level)

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

    return {"churn_probability": float(prob), "prediction": prediction, "risk_level": level, "top_reasons": reasons, "recommendations": recommendations}


@app.get("/customers")
def get_customers(
    search: str = Query("", max_length=100),
    risk: str | None = Query(None, pattern="^(low|medium|high)$"),
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db),
):
    query = db.query(models.Customer)
    if search:
        filters = [models.Customer.name.ilike(f"%{search}%")]
        if search.isdigit():
            filters.append(models.Customer.id == int(search))
        query = query.filter(or_(*filters))
    customers = query.order_by(models.Customer.created_at.desc()).all()
    result = []
    for c in customers:
        pred = c.prediction
        level = risk_level(pred.churn_probability) if pred else None
        if risk and level != risk:
            continue
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
            "risk_level": level,
            "top_reasons": json.loads(pred.top_reasons) if pred and pred.top_reasons else []
        })
    total = len(result)
    start = (page - 1) * limit
    return {"items": result[start:start + limit], "total": total, "page": page, "limit": limit}


@app.get("/customers/{customer_id}")
def get_customer(customer_id: int, db: Session = Depends(get_db)):
    customer = db.query(models.Customer).filter(models.Customer.id == customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found.")
    pred = customer.prediction
    return {
        "id": customer.id,
        "name": customer.name,
        "login_frequency": customer.login_frequency,
        "feature_usage_count": customer.feature_usage_count,
        "support_ticket_volume": customer.support_ticket_volume,
        "payment_amount": customer.payment_amount,
        "account_age": customer.account_age,
        "created_at": customer.created_at.isoformat() if customer.created_at else None,
        "churn_probability": pred.churn_probability if pred else None,
        "prediction": pred.prediction if pred else None,
        "risk_level": risk_level(pred.churn_probability) if pred else None,
        "top_reasons": json.loads(pred.top_reasons) if pred and pred.top_reasons else [],
        "recommendations": recommendations_for(risk_level(pred.churn_probability)) if pred else [],
    }


@app.get("/reports/summary")
def get_reports_summary(db: Session = Depends(get_db)):
    all_preds = db.query(models.Prediction).all()
    total = len(all_preds)

    if total == 0:
        return {
            "total_customers": 0,
            "high_risk_count": 0,
            "medium_risk_count": 0,
            "low_risk_count": 0,
            "high_risk_pct": 0,
            "low_risk_pct": 0,
            "avg_churn_probability": 0,
            "daily_trend": []
        }

    high_risk = sum(1 for p in all_preds if risk_level(p.churn_probability) == "high")
    medium_risk = sum(1 for p in all_preds if risk_level(p.churn_probability) == "medium")
    low_risk = total - high_risk - medium_risk
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
        "medium_risk_count": medium_risk,
        "low_risk_count": low_risk,
        "high_risk_pct": round(high_risk / total * 100, 1),
        "low_risk_pct": round(low_risk / total * 100, 1),
        "avg_churn_probability": round(avg_prob, 4),
        "risk_distribution": {"high": high_risk, "medium": medium_risk, "low": low_risk},
        "daily_trend": daily_trend
    }


@app.get("/model/info")
def get_model_info():
    return get_model_metadata()


@app.get("/dataset/summary")
def dataset_summary():
    """Expose the same safe dataset profile used by Churn AI."""
    return get_dataset_profile()


@app.post("/chat")
async def chat(request: ChatRequest, db: Session = Depends(get_db)):
    question = request.question.strip()
    lowered = question.lower()
    if not question:
        raise HTTPException(status_code=400, detail="Question is required.")

    summary = get_reports_summary(db)
    tool_data = {"reports_summary": summary, "model_info": get_model_metadata()}
    if any(term in lowered for term in ["show", "list", "find", "customer"]):
        search = ""
        words = question.split()
        if "find" in lowered and len(words) > 1:
            search = words[-1]
        tool_data["customers"] = get_customers(search=search, risk="high" if "high risk" in lowered else None, page=1, limit=10, db=db)
    if request.context and request.context.get("customer_id"):
        try:
            tool_data["current_customer"] = get_customer(int(request.context["customer_id"]), db)
        except HTTPException:
            tool_data["current_customer"] = None

    def fallback_response() -> str:
        if "model" in lowered or "accuracy" in lowered or "feature" in lowered:
            info = tool_data["model_info"]
            metrics = info.get("metrics", {})
            return f"**Current model**\n\n{info.get('model_name', 'Unavailable')} uses {len(info.get('features', []))} features. Accuracy: {metrics.get('accuracy', 'unavailable')}. F1 score: {metrics.get('f1', 'unavailable')}."
        if "dataset" in lowered:
            profile = get_dataset_profile()
            return f"**Dataset overview**\n\nThe processed dataset contains **{profile.get('rows', 'unavailable')}** rows with a churn rate of **{profile.get('churn_rate_percent', 'unavailable')}%**."
        if "customer" in lowered or "risk" in lowered:
            return f"**Churn overview**\n\n- Total assessed: **{summary['total_customers']}**\n- High risk: **{summary['high_risk_count']}**\n- Medium risk: **{summary.get('medium_risk_count', 0)}**\n- Average churn probability: **{summary['avg_churn_probability'] * 100:.1f}%**"
        return "I can help with live churn metrics, customer search, customer risk explanations, model information, and retention actions."

    if any(term in lowered for term in ["high risk", "medium risk", "low risk", "how many customers", "accuracy", "precision", "recall", "f1 score", "what model", "what features", "dataset"]):
        return {"response": fallback_response(), "data": tool_data}

    try:
        from openai import OpenAI
        from dotenv import load_dotenv
        load_dotenv(os.path.join(os.path.dirname(__file__), "../.env"))
        api_key = os.getenv("GROQ_API_KEY")
        if not api_key:
            return {"response": fallback_response(), "data": tool_data}
        client = OpenAI(base_url="https://api.groq.com/openai/v1", api_key=api_key)
        system_prompt = """You are InsightOS AI, a professional customer churn intelligence assistant. Answer in English using Markdown. Use only the live tool data supplied below for numbers, customers, predictions, and model metrics. Never invent missing values. Explain ML features and SHAP reasons in plain business language. If the user asks for a list, format it as a compact Markdown table. Do not output raw JSON."""
        response = client.chat.completions.create(
            model=os.getenv("GROQ_MODEL", "openai/gpt-oss-20b"),
            messages=[{"role": "system", "content": system_prompt}, {"role": "user", "content": f"Live data:\n{json.dumps(tool_data, default=str)}\n\nQuestion: {question}"}],
            max_tokens=500,
        )
        return {"response": response.choices[0].message.content, "data": tool_data}
    except Exception:
        return {"response": fallback_response(), "data": tool_data}
