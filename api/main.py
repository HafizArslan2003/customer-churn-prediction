import os
import pickle
import numpy as np
import pandas as pd
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import shap

app = FastAPI(title="Churn Prediction API", description="Predicts SaaS customer churn probability.")

MODEL_DIR = os.path.join(os.path.dirname(__file__), "../model")

# Load artifacts globally on startup
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

class CustomerData(BaseModel):
    login_frequency: float
    feature_usage_count: float
    support_ticket_volume: float
    payment_amount: float
    account_age: float

@app.post("/predict")
def predict_churn(data: CustomerData):
    if model is None:
        raise HTTPException(status_code=500, detail="Model artifacts not found. Please train the model first.")
        
    # Prepare input
    feature_names = [
        "login_frequency", "feature_usage_count", "support_ticket_volume", 
        "payment_amount", "account_age"
    ]
    input_data = pd.DataFrame([[
        data.login_frequency,
        data.feature_usage_count,
        data.support_ticket_volume,
        data.payment_amount,
        data.account_age
    ]], columns=feature_names)
    
    # Scale
    input_scaled = scaler.transform(input_data)
    
    # Predict
    prob = model.predict_proba(input_scaled)[0][1]
    prediction = int(model.predict(input_scaled)[0])
    
    # SHAP Explainability
    shap_values = explainer.shap_values(input_scaled)
    
    # For RandomForest, shap_values is a list [class_0, class_1]. We want class 1.
    if isinstance(shap_values, list):
        shap_vals_churn = shap_values[1][0]
    elif len(shap_values.shape) == 3: # (samples, features, classes)
        shap_vals_churn = shap_values[0, :, 1]
    else:
        shap_vals_churn = shap_values[0]
        
    # Generate human-readable reasons
    reasons = []
    # Sort features by absolute SHAP value impact
    sorted_indices = np.argsort(np.abs(shap_vals_churn))[::-1]
    
    for idx in sorted_indices[:3]: # top 3 reasons
        feat = feature_names[idx]
        val = input_data.iloc[0, idx]
        mean_val = feature_means[feat]
        shap_val = shap_vals_churn[idx]
        
        if abs(shap_val) < 0.01:
            continue
            
        direction = "increases" if shap_val > 0 else "decreases"
        diff_pct = ((val - mean_val) / (mean_val + 1e-5)) * 100
        
        if val > mean_val:
            comp = f"{abs(diff_pct):.0f}% above average"
        else:
            comp = f"{abs(diff_pct):.0f}% below average"
            
        reasons.append(f"{feat} is {comp} ({val:.1f} vs avg {mean_val:.1f}), which {direction} churn risk.")

    return {
        "churn_probability": float(prob),
        "prediction": prediction,
        "top_reasons": reasons
    }
