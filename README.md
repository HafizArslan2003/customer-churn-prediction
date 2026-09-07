# SaaS Customer Churn Prediction

Predict which SaaS customers are likely to cancel their subscription in the next 30 days using Machine Learning.

## Project Structure
- `data/`: Contains the generated synthetic dataset.
- `src/`: Data generation, preprocessing, and model training scripts.
- `model/`: Pickled models, scalers, and explainers.
- `api/`: FastAPI web server for real-time predictions.

## Setup Instructions

1. **Install Dependencies (Virtual Environment Recommended)**
   ```bash
   # Windows (PowerShell)
   python -m venv venv
   .\venv\Scripts\Activate.ps1
   pip install -r requirements.txt
   ```

2. **Prepare the Dataset**
   Place your `telco_churn.csv` dataset in the `data/` folder.
   Then run the data preparation script to map its columns to our expected features, engineer the proxy features (`login_frequency`, `support_ticket_volume`), and save it to `data/customers.csv`:
   ```bash
   python src/prepare_telco_data.py
   ```

3. **Train the Machine Learning Model**
   This script reads the data, splits it into training and testing sets, compares Random Forest and Logistic Regression, and saves the best model along with the SHAP explainer to the `model/` directory.
   ```bash
   python src/train.py
   ```

4. **Run the Prediction API**
   Start the FastAPI server:
   ```bash
   cd api
   uvicorn main:app --reload
   ```
   The API will be accessible at `http://127.0.0.1:8000`. You can also view the interactive API documentation at `http://127.0.0.1:8000/docs`.

## Testing the API

Once the server is running, you can test the `/predict` endpoint.

**Using curl:**
```bash
curl -X POST "http://127.0.0.1:8000/predict" -H "Content-Type: application/json" -d '{"login_frequency": 2.0, "feature_usage_count": 1.0, "support_ticket_volume": 3.0, "payment_amount": 95.0, "account_age": 150.0}'
```

**Using PowerShell:**
```powershell
Invoke-RestMethod -Uri "http://127.0.0.1:8000/predict" -Method Post -ContentType "application/json" -Body '{"login_frequency": 2.0, "feature_usage_count": 1.0, "support_ticket_volume": 3.0, "payment_amount": 95.0, "account_age": 150.0}'
```

### Expected Output
```json
{
  "churn_probability": 0.85,
  "prediction": 1,
  "top_reasons": [
    "support_ticket_volume is 400% above average (5.0 vs avg 1.0), which increases churn risk.",
    "login_frequency is 60% below average (2.0 vs avg 5.0), which increases churn risk."
  ]
}
```
