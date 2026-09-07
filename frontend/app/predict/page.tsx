'use client';
import { useState, useCallback } from 'react';
import { Activity } from 'lucide-react';

const DEFAULTS = {
  login_frequency: 5,
  feature_usage_count: 4,
  support_ticket_volume: 1,
  payment_amount: 65,
  account_age: 400,
};

const RANGES: Record<keyof typeof DEFAULTS, { min: number; max: number; label: string; prefix?: string; suffix?: string }> = {
  login_frequency:       { min: 0, max: 30,   label: 'Login Frequency',       suffix: ' / week' },
  feature_usage_count:   { min: 0, max: 10,   label: 'Feature Usage Count',   suffix: ' features' },
  support_ticket_volume: { min: 0, max: 10,   label: 'Support Ticket Volume', suffix: ' tickets' },
  payment_amount:        { min: 10, max: 200, label: 'Payment Amount',        prefix: '$' },
  account_age:           { min: 0, max: 2000, label: 'Account Age',           suffix: ' days' },
};

interface PredictionResult {
  churn_probability: number;
  prediction: number;
  top_reasons: string[];
}

let debounceTimer: ReturnType<typeof setTimeout>;

export default function PredictorPage() {
  const [values, setValues] = useState(DEFAULTS);
  const [result, setResult] = useState<PredictionResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [customerName, setCustomerName] = useState('');

  const runPrediction = useCallback(async (vals: typeof DEFAULTS, name: string) => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:8000/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...vals, name: name || null }),
      });
      const data: PredictionResult = await res.json();
      setResult(data);
    } catch {
      console.error('API error');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleChange = (key: keyof typeof DEFAULTS, val: number) => {
    const newValues = { ...values, [key]: val };
    setValues(newValues);
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => runPrediction(newValues, customerName), 300);
  };

  const prob = result ? Math.round(result.churn_probability * 100) : null;
  const isHighRisk = result?.prediction === 1;

  return (
    <div className="p-6 md:p-10 max-w-6xl">
      <div className="mb-10">
        <h1 className="text-4xl font-semibold mb-2 tracking-tight flex items-center gap-3">
          <Activity className="text-[#876DFF]" size={32} /> Churn Predictor
        </h1>
        <p className="text-gray-500">
          Simulate customer metrics to predict their likelihood of churning.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        
        {/* Left Col - Sliders */}
        <div className="lg:col-span-3 card-white p-8">
          <div className="mb-8">
            <label className="block text-sm font-semibold mb-2">Customer Name (Optional)</label>
            <input
              type="text"
              placeholder="e.g. Acme Corp"
              value={customerName}
              onChange={e => setCustomerName(e.target.value)}
              className="w-full rounded-xl px-4 py-3 bg-gray-50 border border-gray-200 outline-none focus:border-[#876DFF] transition-colors"
            />
          </div>

          <div className="space-y-8">
            {(Object.keys(RANGES) as Array<keyof typeof DEFAULTS>).map((key) => {
              const cfg = RANGES[key];
              const val = values[key];
              const display = cfg.prefix ? `${cfg.prefix}${val}` : `${val}${cfg.suffix ?? ''}`;
              return (
                <div key={key}>
                  <div className="flex justify-between mb-3">
                    <label className="text-sm font-semibold">{cfg.label}</label>
                    <span className="text-sm font-bold bg-[#F3F4F6] px-3 py-1 rounded-full text-[#876DFF]">{display}</span>
                  </div>
                  <input
                    type="range"
                    min={cfg.min}
                    max={cfg.max}
                    value={val}
                    onChange={e => handleChange(key, parseFloat(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-full appearance-none outline-none"
                  />
                  <div className="flex justify-between text-[10px] text-gray-400 mt-2 font-medium">
                    <span>{cfg.min}</span>
                    <span>{cfg.max}</span>
                  </div>
                </div>
              );
            })}
          </div>

          <button
            onClick={() => runPrediction(values, customerName)}
            className="mt-10 w-full py-4 rounded-xl font-bold text-white transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5"
            style={{ background: 'var(--color-dark)' }}
          >
            {loading ? 'Analyzing...' : 'Save Prediction to Database'}
          </button>
        </div>

        {/* Right Col - Results */}
        <div className="lg:col-span-2 space-y-6">
          <div className="card-dark p-8">
            <h3 className="font-semibold text-gray-400 text-sm uppercase tracking-widest mb-6">Prediction Score</h3>
            
            {loading ? (
              <div className="text-3xl text-gray-500 animate-pulse py-10">Running ML Model...</div>
            ) : prob !== null ? (
              <div>
                <div className="flex items-end gap-3 mb-4">
                  <div className={`text-7xl font-bold tracking-tighter ${isHighRisk ? 'text-red-400' : 'text-[#BAF91A]'}`}>
                    {prob}%
                  </div>
                </div>
                
                <div className="w-full h-3 bg-white/10 rounded-full mb-6 overflow-hidden">
                  <div 
                    className="h-full rounded-full transition-all duration-1000 ease-out"
                    style={{ 
                      width: `${prob}%`, 
                      background: isHighRisk ? '#ef4444' : '#BAF91A' 
                    }}
                  />
                </div>

                <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full font-bold text-sm ${isHighRisk ? 'bg-red-500/20 text-red-400' : 'bg-[#BAF91A]/20 text-[#BAF91A]'}`}>
                  {isHighRisk ? '⚠️ High Risk of Churn' : '✅ Low Risk (Safe)'}
                </div>
              </div>
            ) : (
              <div className="text-gray-400 py-10">Adjust sliders to see prediction.</div>
            )}
          </div>

          {result?.top_reasons && result.top_reasons.length > 0 && (
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h3 className="font-semibold text-sm uppercase tracking-widest mb-4 text-gray-500">AI Explanations (SHAP)</h3>
              <ul className="space-y-3">
                {result.top_reasons.map((r, i) => (
                  <li key={i} className="text-sm p-3 bg-gray-50 rounded-xl border border-gray-100 leading-relaxed font-medium">
                    {r}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
