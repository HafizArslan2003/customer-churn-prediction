# ChurnIQ — SaaS Customer Churn Prediction Dashboard

A full-stack mini SaaS product that predicts which SaaS customers are likely to cancel their subscription in the next 30 days, with a modern dashboard UI, AI voice assistant, and historical reporting.

## Project Structure

```
.
├── api/                    # FastAPI backend
│   ├── main.py             # All API endpoints
│   ├── database.py         # SQLAlchemy SQLite setup
│   ├── models.py           # ORM models (Customer, Prediction)
│   ├── schemas.py          # Pydantic schemas
│   └── static/             # Legacy HTML simulator (optional)
├── data/                   # Dataset files
│   ├── telco_churn.csv     # Source dataset (place here)
│   └── customers.csv       # Processed & mapped features
├── frontend/               # Next.js React dashboard
│   ├── app/
│   │   ├── page.tsx        # Dashboard (simulator + AI orb)
│   │   └── reports/page.tsx # Reports page (charts + table)
│   └── components/
│       ├── Sidebar.tsx     # Navigation sidebar
│       └── AIOrb.tsx       # AI voice assistant orb widget
├── model/                  # Trained model artifacts
│   ├── model.pkl
│   ├── scaler.pkl
│   ├── explainer.pkl
│   └── feature_means.pkl
├── src/                    # ML scripts
│   ├── prepare_telco_data.py
│   └── train.py
├── .env                    # Your actual env file (gitignored)
├── .env.example            # Template for env vars
└── requirements.txt        # Python dependencies
```

---

## ⚙️ Setup Instructions

### Step 1: Environment Setup

**Python (virtual environment):**
```powershell
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

**Create your `.env` file for the AI Assistant:**
```powershell
Copy-Item .env.example .env
# Then open .env and replace with your actual Groq API key (get a free one from console.groq.com)
```

### Step 2: Prepare Data & Train Model

Place `telco_churn.csv` in the `data/` folder, then:
```powershell
python src/prepare_telco_data.py
python src/train.py
```

### Step 3: Start the FastAPI Backend

```powershell
.\venv\Scripts\Activate.ps1
uvicorn api.main:app --host 127.0.0.1 --port 8000 --reload
```

The API will be available at `http://127.0.0.1:8000`.  
API docs: `http://127.0.0.1:8000/docs`

### Step 4: Start the Next.js Frontend

In a **new terminal**:
```powershell
cd frontend
npm install
npm run dev
```

Open your browser and go to: **`http://localhost:3000`**

---

## 🖥️ Dashboard Features

| Page | Features |
|------|----------|
| **Dashboard** | Real-time churn simulator with feature sliders, probability meter, SHAP explanations, AI voice assistant orb |
| **Reports** | Risk distribution pie chart, churn probability trend line chart, recent customers table |

---

## 🤖 AI Voice Assistant (ChurnBot)

The AI orb widget is fixed to the bottom-right corner of the Dashboard page:

1. Click the **green orb** to open the chat panel
2. Type your question or click the **mic button** to speak
3. ChurnBot replies in a natural mix of **Roman Urdu + English**
4. The response is displayed as text **and spoken aloud** via SpeechSynthesis

> **Requires:** A `GROQ_API_KEY` in your `.env` file. Voice input requires Chrome browser.

---

## 🔌 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/predict` | Run churn prediction, save to DB |
| `GET` | `/customers` | List all customers with latest predictions |
| `GET` | `/reports/summary` | Aggregated stats + daily trend |
| `POST` | `/chat` | Ask ChurnBot a question (LLM) |

**Sample predict request (PowerShell):**
```powershell
Invoke-RestMethod -Uri "http://127.0.0.1:8000/predict" -Method Post `
  -ContentType "application/json" `
  -Body '{"name":"Jane Smith","login_frequency":2,"feature_usage_count":1,"support_ticket_volume":4,"payment_amount":95,"account_age":150}'
```

**Sample chat request:**
```powershell
Invoke-RestMethod -Uri "http://127.0.0.1:8000/chat" -Method Post `
  -ContentType "application/json" `
  -Body '{"question":"Ye customer churn kyun kar raha hai?"}'
```

---

## 📊 Model Performance

| Metric | Score |
|--------|-------|
| Algorithm | Logistic Regression |
| Accuracy | 80.8% |
| Precision | 68.2% |
| Recall | 51.7% |
| **F1 Score** | **0.588** |

---

## 🔧 Tech Stack

- **Frontend:** Next.js 15, React, TypeScript, Tailwind CSS, Recharts, Lucide React
- **Backend:** FastAPI, SQLAlchemy, SQLite
- **ML:** scikit-learn, SHAP, Pandas, NumPy
- **AI Assistant:** Groq `llama-3.1-8b-instant` (OpenAI compatible API)
- **Voice:** Web Speech API (SpeechRecognition + SpeechSynthesis)
