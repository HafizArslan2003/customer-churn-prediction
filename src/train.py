import pandas as pd
import numpy as np
import os
import pickle
import json
from datetime import datetime, timezone
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score
from sklearn.preprocessing import StandardScaler
import shap

def load_data(filepath):
    return pd.read_csv(filepath)

def train_and_evaluate():
    current_dir = os.path.dirname(os.path.abspath(__file__))
    data_path = os.path.join(current_dir, "../data/customers.csv")
    
    if not os.path.exists(data_path):
        print(f"Data file not found at {data_path}. Please run generate_data.py first.")
        return
        
    df = load_data(data_path)
    
    X = df.drop('churned', axis=1)
    y = df['churned']
    
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    # Preprocessing
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)
    
    # Models
    rf_model = RandomForestClassifier(random_state=42, n_estimators=100)
    lr_model = LogisticRegression(random_state=42)
    
    models = {"RandomForest": rf_model, "LogisticRegression": lr_model}
    best_model = None
    best_f1 = 0
    best_name = ""
    
    for name, model in models.items():
        model.fit(X_train_scaled, y_train)
        y_pred = model.predict(X_test_scaled)
        
        acc = accuracy_score(y_test, y_pred)
        prec = precision_score(y_test, y_pred, zero_division=0)
        rec = recall_score(y_test, y_pred, zero_division=0)
        f1 = f1_score(y_test, y_pred, zero_division=0)
        
        print(f"--- {name} ---")
        print(f"Accuracy:  {acc:.4f}")
        print(f"Precision: {prec:.4f}")
        print(f"Recall:    {rec:.4f}")
        print(f"F1 Score:  {f1:.4f}\n")
        
        if f1 > best_f1:
            best_f1 = f1
            best_model = model
            best_name = name
            
    print(f"Best model selected: {best_name} (F1: {best_f1:.4f})")
    
    # Fit explainer on training data using the best model
    if best_name == "RandomForest":
        explainer = shap.TreeExplainer(best_model)
    else:
        explainer = shap.LinearExplainer(best_model, X_train_scaled)
    
    # Calculate baseline values for explanation (from unscaled data)
    means = X_train.mean()
    
    # Save model, scaler, explainer, and feature means
    model_dir = os.path.join(current_dir, "../model")
    os.makedirs(model_dir, exist_ok=True)
    
    with open(os.path.join(model_dir, "model.pkl"), "wb") as f:
        pickle.dump(best_model, f)
    with open(os.path.join(model_dir, "scaler.pkl"), "wb") as f:
        pickle.dump(scaler, f)
    with open(os.path.join(model_dir, "explainer.pkl"), "wb") as f:
        pickle.dump(explainer, f)
    with open(os.path.join(model_dir, "feature_means.pkl"), "wb") as f:
        pickle.dump(means, f)

    metrics = {}
    for name, candidate in models.items():
        candidate_pred = candidate.predict(X_test_scaled)
        metrics[name] = {
            "accuracy": round(float(accuracy_score(y_test, candidate_pred)), 4),
            "precision": round(float(precision_score(y_test, candidate_pred, zero_division=0)), 4),
            "recall": round(float(recall_score(y_test, candidate_pred, zero_division=0)), 4),
            "f1": round(float(f1_score(y_test, candidate_pred, zero_division=0)), 4),
        }
    metadata = {
        "model_name": best_name,
        "features": list(X.columns),
        "metrics": metrics[best_name],
        "training_rows": int(len(X_train)),
        "test_rows": int(len(X_test)),
        "dataset_rows": int(len(df)),
        "trained_at": datetime.now(timezone.utc).isoformat(),
        "version": "1.0",
    }
    with open(os.path.join(model_dir, "metadata.json"), "w", encoding="utf-8") as f:
        json.dump(metadata, f, indent=2)
        
    print(f"Model and preprocessing artifacts saved to {model_dir}/")

if __name__ == "__main__":
    train_and_evaluate()
