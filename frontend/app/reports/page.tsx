'use client';
import { useEffect, useState } from 'react';
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  LineChart, Line, XAxis, YAxis, CartesianGrid,
} from 'recharts';

const COLORS = ['#ef4444', '#22c55e'];

interface Summary {
  total_customers: number;
  high_risk_count: number;
  low_risk_count: number;
  high_risk_pct: number;
  low_risk_pct: number;
  avg_churn_probability: number;
  daily_trend: { date: string; avg_probability: number; count: number }[];
}

interface Customer {
  id: number;
  name: string | null;
  login_frequency: number;
  feature_usage_count: number;
  support_ticket_volume: number;
  payment_amount: number;
  account_age: number;
  churn_probability: number | null;
  prediction: number | null;
  created_at: string;
}

export default function ReportsPage() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('http://localhost:8000/reports/summary').then(r => r.json()),
      fetch('http://localhost:8000/customers').then(r => r.json()),
    ]).then(([s, c]) => {
      setSummary(s);
      setCustomers(c);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const pieData = summary ? [
    { name: 'High Risk', value: summary.high_risk_count },
    { name: 'Low Risk', value: summary.low_risk_count },
  ] : [];

  const statCards = summary ? [
    { label: 'Total Analyzed', value: summary.total_customers, color: 'var(--text-primary)' },
    { label: 'High Risk', value: `${summary.high_risk_count} (${summary.high_risk_pct}%)`, color: 'var(--danger)' },
    { label: 'Low Risk', value: `${summary.low_risk_count} (${summary.low_risk_pct}%)`, color: 'var(--success)' },
    { label: 'Avg Churn Probability', value: `${(summary.avg_churn_probability * 100).toFixed(1)}%`, color: 'var(--accent)' },
  ] : [];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-[var(--text-secondary)] animate-pulse">Loading reports...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1180px] px-6 py-10 xl:px-10">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">Reports & Analytics</h1>
        <p className="text-[var(--text-secondary)] text-sm mt-1">
          Aggregated churn insights from all saved predictions.
        </p>
      </div>

      {/* Summary Stat Cards */}
      {summary && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {statCards.map((s, i) => (
            <div key={i} className="card p-5">
              <p className="text-xs text-[var(--text-secondary)] uppercase tracking-widest mb-2">{s.label}</p>
              <p className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Pie Chart */}
        <div className="card p-6">
          <h3 className="font-semibold text-[var(--text-primary)] mb-4 text-sm uppercase tracking-widest">
            Risk Distribution
          </h3>
          {summary && summary.total_customers > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={pieData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  innerRadius={40}
                  label={(props: { name?: string; percent?: number }) => `${props.name ?? ''} ${((props.percent ?? 0) * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {pieData.map((_, index) => (
                    <Cell key={index} fill={COLORS[index]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: '8px', color: 'var(--text-primary)' }}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-52 text-[var(--text-secondary)] text-sm">
              No data yet. Run some predictions first!
            </div>
          )}
        </div>

        {/* Line Chart */}
        <div className="card p-6">
          <h3 className="font-semibold text-[var(--text-primary)] mb-4 text-sm uppercase tracking-widest">
            Avg Churn Probability Over Time
          </h3>
          {summary && summary.daily_trend.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={summary.daily_trend}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--card-border)" />
                <XAxis
                  dataKey="date"
                  tick={{ fill: 'var(--text-secondary)', fontSize: 10 }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: 'var(--text-secondary)', fontSize: 10 }}
                  domain={[0, 1]}
                  tickFormatter={(v) => `${(v * 100).toFixed(0)}%`}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: '8px', color: 'var(--text-primary)' }}
                  formatter={(val) => [`${(Number(val) * 100).toFixed(1)}%`, 'Avg Churn Prob']}
                />
                <Line
                  type="monotone"
                  dataKey="avg_probability"
                  stroke="#a3e635"
                  strokeWidth={2.5}
                  dot={{ fill: '#a3e635', r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-52 text-[var(--text-secondary)] text-sm">
              No trend data yet.
            </div>
          )}
        </div>
      </div>

      {/* Customers Table */}
      <div className="card p-6">
        <h3 className="font-semibold text-[var(--text-primary)] mb-4 text-sm uppercase tracking-widest">
          Recent Customers
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr
                className="text-xs uppercase"
                style={{ borderBottom: '1px solid var(--card-border)', color: 'var(--text-secondary)' }}
              >
                {['Name', 'Logins/wk', 'Features', 'Tickets', 'Payment', 'Churn Prob', 'Risk', 'Date'].map(h => (
                  <th key={h} className="text-left py-2 px-3 font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {customers.map((c) => (
                <tr
                  key={c.id}
                  className="transition-colors"
                  style={{ borderBottom: '1px solid var(--card-border)' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.02)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <td className="py-2 px-3 text-[var(--text-primary)] font-medium">
                    {c.name || `Customer #${c.id}`}
                  </td>
                  <td className="py-2 px-3 text-[var(--text-secondary)]">{c.login_frequency}</td>
                  <td className="py-2 px-3 text-[var(--text-secondary)]">{c.feature_usage_count}</td>
                  <td className="py-2 px-3 text-[var(--text-secondary)]">{c.support_ticket_volume}</td>
                  <td className="py-2 px-3 text-[var(--text-secondary)]">${c.payment_amount}</td>
                  <td
                    className="py-2 px-3 font-bold"
                    style={{ color: c.prediction === 1 ? 'var(--danger)' : 'var(--success)' }}
                  >
                    {c.churn_probability !== null ? `${(c.churn_probability * 100).toFixed(1)}%` : '—'}
                  </td>
                  <td className="py-2 px-3">
                    <span
                      className="px-2 py-0.5 rounded-full text-xs font-semibold"
                      style={{
                        background: c.prediction === 1 ? 'rgba(239,68,68,0.15)' : 'rgba(34,197,94,0.15)',
                        color: c.prediction === 1 ? 'var(--danger)' : 'var(--success)',
                      }}
                    >
                      {c.prediction === 1 ? 'High Risk' : 'Low Risk'}
                    </span>
                  </td>
                  <td className="py-2 px-3 text-[var(--text-secondary)] text-xs">
                    {new Date(c.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
              {customers.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-[var(--text-secondary)]">
                    No customers yet. Run a prediction on the Dashboard!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
