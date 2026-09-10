'use client';

import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { useEffect, useState } from 'react';
import { apiFetch, Customer, Summary } from '@/lib/api';

export default function ReportsPage() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [error, setError] = useState('');
  useEffect(() => {
    Promise.all([apiFetch<Summary>('/reports/summary'), apiFetch<{ items: Customer[] }>('/customers?limit=20')])
      .then(([stats, rows]) => { setSummary(stats); setCustomers(rows.items); })
      .catch(() => setError('Unable to load analytics.'));
  }, []);
  if (error) return <div className="page-wrap"><p className="error-text">{error}</p></div>;
  if (!summary) return <div className="empty-state">Loading analytics...</div>;
  const highRisk = customers.filter((customer) => customer.risk_level === 'high').slice(0, 8);
  return <div className="page-wrap reports-page">
    <p className="eyebrow">Analyze</p>
    <h1 className="page-title">Analytics & Reports</h1>
    <p className="page-lede">A factual view of saved assessments and the risk movement captured by the model.</p>
    <div className="metric-grid">
      <Metric label="Total customers" value={summary.total_customers.toLocaleString()} />
      <Metric label="High risk" value={`${summary.high_risk_count} (${summary.high_risk_pct}%)`} />
      <Metric label="Medium risk" value={String(summary.medium_risk_count)} />
      <Metric label="Average probability" value={`${(summary.avg_churn_probability * 100).toFixed(1)}%`} />
    </div>
    <div className="detail-grid">
      <section className="panel"><h2>Risk distribution</h2>{Object.entries(summary.risk_distribution).map(([level, value]) => <div className="risk-row report-row" key={level}><strong>{level}</strong><div className="risk-track"><div className={`risk-fill ${level === 'high' ? 'bg-red-500' : level === 'medium' ? 'bg-amber-400' : 'bg-lime-500'}`} style={{ width: `${summary.total_customers ? value / summary.total_customers * 100 : 0}%` }} /></div><span>{value}</span></div>)}</section>
      <section className="panel"><h2>Assessment trend</h2>{summary.daily_trend.length ? <div className="trend-list">{summary.daily_trend.slice(-10).map((point) => <div className="trend-item" key={point.date}><span>{point.date}</span><strong>{(point.avg_probability * 100).toFixed(1)}%</strong><small>{point.count} assessment{point.count === 1 ? '' : 's'}</small></div>)}</div> : <div className="empty-state">No trend data yet.</div>}</section>
    </div>
    <section className="panel reports-priority-panel">
      <div className="section-heading"><div><p className="chart-eyebrow">Action queue</p><h2>High-risk customers</h2><p className="muted">Prioritize these accounts for retention follow-up.</p></div><Link href="/customers?risk=high" className="text-link">Open high-risk queue</Link></div>
      {highRisk.length ? <div className="risk-customer-list">{highRisk.map((customer) => <Link className="risk-customer-row" href={`/customers/${customer.id}`} key={customer.id}><span className="avatar">{(customer.name || `C${customer.id}`).slice(0, 1).toUpperCase()}</span><span className="risk-customer-name"><strong>{customer.name || `Customer #${customer.id}`}</strong><small>{customer.top_reasons[0] || 'Assessment requires review'}</small></span><span className="risk-customer-score"><strong>{customer.churn_probability == null ? '—' : `${(customer.churn_probability * 100).toFixed(1)}%`}</strong><span className="risk-badge risk-high">High</span></span><ArrowUpRight size={16} /></Link>)}</div> : <div className="empty-state">No high-risk customers in the current assessment set.</div>}
    </section>
    <section className="panel mt-4"><div className="section-heading"><h2>Recent assessments</h2><Link href="/customers" className="text-link">Open customer table</Link></div><div className="table-scroll"><table className="data-table"><thead><tr><th>Customer</th><th>Probability</th><th>Risk</th><th>Logins</th><th>Tickets</th><th>Assessment date</th></tr></thead><tbody>{customers.map((customer) => <tr key={customer.id}><td><Link href={`/customers/${customer.id}`} className="customer-link">{customer.name || `Customer #${customer.id}`}</Link></td><td>{customer.churn_probability == null ? '—' : `${(customer.churn_probability * 100).toFixed(1)}%`}</td><td><span className={`risk-badge risk-${customer.risk_level || 'low'}`}>{customer.risk_level || 'unassessed'}</span></td><td>{customer.login_frequency}</td><td>{customer.support_ticket_volume}</td><td>{new Date(customer.created_at).toLocaleDateString()}</td></tr>)}</tbody></table></div></section>
  </div>;
}

function Metric({ label, value }: { label: string; value: string }) { return <div className="metric-card"><div className="metric-label">{label}</div><div className="metric-value text-[22px]">{value}</div></div>; }
