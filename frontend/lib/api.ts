export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

export async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...(options?.headers || {}) },
  });
  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(body?.detail || 'Unable to connect to the churn service.');
  }
  return response.json();
}

export type Customer = {
  id: number;
  name: string | null;
  login_frequency: number;
  feature_usage_count: number;
  support_ticket_volume: number;
  payment_amount: number;
  account_age: number;
  created_at: string;
  churn_probability: number | null;
  prediction: number | null;
  risk_level: 'low' | 'medium' | 'high' | null;
  top_reasons: string[];
  recommendations?: string[];
};

export type Summary = {
  total_customers: number;
  high_risk_count: number;
  medium_risk_count: number;
  low_risk_count: number;
  high_risk_pct: number;
  low_risk_pct: number;
  avg_churn_probability: number;
  risk_distribution: Record<string, number>;
  daily_trend: { date: string; avg_probability: number; count: number }[];
};
