'use client';

import Link from 'next/link';
import { ArrowLeft, Play, ShieldAlert } from 'lucide-react';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { apiFetch, Customer } from '@/lib/api';

export default function CustomerDetailPage() {
  const params = useParams<{ id: string }>(); const [customer, setCustomer] = useState<Customer | null>(null); const [error, setError] = useState('');
  useEffect(() => { apiFetch<Customer>(`/customers/${params.id}`).then(setCustomer).catch(() => setError('Customer record could not be found.')); }, [params.id]);
  if (error) return <div className="page-wrap"><p className="error-text">{error}</p><Link href="/customers" className="text-link"><ArrowLeft size={15} /> Back to customers</Link></div>;
  if (!customer) return <div className="empty-state">Loading customer...</div>;
  const probability = customer.churn_probability == null ? null : customer.churn_probability * 100;
  return <div className="page-wrap"><Link href="/customers" className="text-link"><ArrowLeft size={15} /> Back to customers</Link><div className="detail-heading"><div><p className="eyebrow">Customer record #{customer.id}</p><h1 className="page-title">{customer.name || `Customer #${customer.id}`}</h1><p className="page-lede">Assessed {new Date(customer.created_at).toLocaleString()}.</p></div><Link href="/assessment" className="button-primary"><Play size={15} /> Run new assessment</Link></div><div className="metric-grid"><Metric label="Churn probability" value={probability == null ? 'Not assessed' : `${probability.toFixed(1)}%`} /><Metric label="Risk level" value={customer.risk_level || 'Not assessed'} /><Metric label="Prediction" value={customer.prediction === 1 ? 'Likely to churn' : customer.prediction === 0 ? 'Likely to retain' : 'Pending'} /><Metric label="Monthly payment" value={`$${customer.payment_amount}`} /></div><div className="detail-grid"><section className="panel"><h2>Activity profile</h2><div className="detail-metrics"><Metric label="Login frequency" value={`${customer.login_frequency} / week`} /><Metric label="Feature usage" value={`${customer.feature_usage_count} features`} /><Metric label="Support tickets" value={`${customer.support_ticket_volume} this month`} /><Metric label="Account age" value={`${customer.account_age} days`} /></div></section><section className="panel"><h2><ShieldAlert size={18} /> Why this customer is at risk</h2>{customer.top_reasons.length ? <ul className="reason-list">{customer.top_reasons.map((reason) => <li key={reason}>{reason}</li>)}</ul> : <div className="empty-state">No explanation is stored for this assessment.</div>}<h3 className="subheading">Recommended actions</h3><ul className="reason-list">{(customer.recommendations || []).map((action) => <li key={action}>{action}</li>)}</ul></section></div></div>;
}
function Metric({ label, value }: { label: string; value: string }) { return <div className="metric-card"><div className="metric-label">{label}</div><div className="metric-value text-[20px]">{value}</div></div>; }
