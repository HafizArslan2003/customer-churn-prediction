'use client';

import Link from 'next/link';
import { ArrowUpRight, ShieldAlert, Users, Activity, Gauge } from 'lucide-react';
import { useEffect, useState } from 'react';
import AIPanel from '@/components/AIPanel';
import { apiFetch, Customer, Summary } from '@/lib/api';

export default function Dashboard() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [error, setError] = useState('');
  useEffect(() => { Promise.all([apiFetch<Summary>('/reports/summary'), apiFetch<{ items: Customer[] }>('/customers?limit=5')]).then(([stats, rows]) => { setSummary(stats); setCustomers(rows.items); }).catch(() => setError('Unable to connect to the churn service.')); }, []);
  const percent = (value: number) => `${(value * 100).toFixed(1)}%`;
  return <div className="page-wrap">
    <div className="page-heading"><p className="eyebrow">Customer churn intelligence</p><h1 className="page-title">Predict. Understand. Retain.</h1><p className="page-lede">A live view of customer risk, model assessments, and the actions that can protect valuable relationships.</p></div>
    {error && <div className="panel error-text">{error}</div>}
    {!summary ? <div className="empty-state">Loading churn intelligence...</div> : <>
      <div className="metric-grid"><Metric icon={<Users size={18} />} label="Total customers" value={summary.total_customers.toLocaleString()} /><Metric icon={<ShieldAlert size={18} />} label="High risk" value={summary.high_risk_count.toLocaleString()} tone="danger" /><Metric icon={<Gauge size={18} />} label="Average risk" value={percent(summary.avg_churn_probability)} tone="accent" /><Metric icon={<Activity size={18} />} label="Low risk" value={summary.low_risk_count.toLocaleString()} tone="success" /></div>
      <div className="dashboard-grid"><div className="stack"><section className="panel"><h2>Risk distribution</h2><div className="risk-bars">{[['high', summary.high_risk_count, '#db554b'], ['medium', summary.medium_risk_count, '#d6a52c'], ['low', summary.low_risk_count, '#9fcf31']].map(([label, value, color]) => <div className="risk-row" key={String(label)}><strong>{String(label)}</strong><div className="risk-track"><div className="risk-fill" style={{ width: `${summary.total_customers ? Number(value) / summary.total_customers * 100 : 0}%`, background: String(color) }} /></div><span>{String(value)}</span></div>)}</div></section><section className="panel"><div className="section-heading"><h2>Recent assessments</h2><Link href="/customers" className="text-link">View all <ArrowUpRight size={14} /></Link></div><div className="table-scroll"><table className="data-table"><thead><tr><th>Customer</th><th>Risk</th><th>Probability</th><th>Assessed</th></tr></thead><tbody>{customers.map((customer) => <tr key={customer.id}><td><Link href={`/customers/${customer.id}`} className="customer-link">{customer.name || `Customer #${customer.id}`}</Link></td><td><span className={`risk-badge risk-${customer.risk_level || 'low'}`}>{customer.risk_level || 'unassessed'}</span></td><td>{customer.churn_probability == null ? '—' : percent(customer.churn_probability)}</td><td>{new Date(customer.created_at).toLocaleDateString()}</td></tr>)}</tbody></table></div>{customers.length === 0 && <div className="empty-state">No assessments yet. Run the first one from Risk Assessment.</div>}</section></div><AIPanel /></div>
    </>}
  </div>;
}

function Metric({ icon, label, value, tone = '' }: { icon: React.ReactNode; label: string; value: string; tone?: string }) { return <div className="metric-card"><div className="metric-label flex items-center gap-2">{icon}{label}</div><div className={`metric-value ${tone === 'danger' ? 'text-red-600' : tone === 'success' ? 'text-lime-700' : tone === 'accent' ? 'text-[#719813]' : ''}`}>{value}</div></div>; }
