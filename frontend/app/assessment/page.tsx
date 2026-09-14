'use client';

import { FormEvent, useState } from 'react';
import { Activity, ArrowRight, Banknote, CalendarDays, CheckCircle2, LifeBuoy, LogIn, Sparkles, UserRound } from 'lucide-react';
import { apiFetch } from '@/lib/api';

import BulkAssessment from '@/components/BulkAssessment';

import { Mail as MailIcon } from 'lucide-react';

type FormData = { name: string; email: string; login_frequency: number; feature_usage_count: number; support_ticket_volume: number; payment_amount: number; account_age: number };
type Result = { churn_probability: number; prediction: number; risk_level: string; top_reasons: string[]; recommendations: string[]; retention_task: boolean; email_status: string | null };
const initialForm: FormData = { name: '', email: '', login_frequency: 5, feature_usage_count: 4, support_ticket_volume: 1, payment_amount: 65, account_age: 400 };
const fields = [{ key: 'login_frequency', label: 'Login frequency', description: 'Weekly sign-ins show active engagement.', unit: 'per week', icon: LogIn, group: 'Engagement' }, { key: 'feature_usage_count', label: 'Feature usage', description: 'Number of product capabilities used.', unit: 'features', icon: Activity, group: 'Engagement' }, { key: 'support_ticket_volume', label: 'Support tickets', description: 'Recent support requests can signal friction.', unit: 'this month', icon: LifeBuoy, group: 'Support' }, { key: 'payment_amount', label: 'Payment amount', description: 'Current recurring payment value.', unit: 'USD / month', icon: Banknote, group: 'Financial' }, { key: 'account_age', label: 'Account age', description: 'Time since the account was created.', unit: 'days', icon: CalendarDays, group: 'Customer profile' }] as const;

export default function AssessmentPage() {
  const [activeTab, setActiveTab] = useState<'individual' | 'bulk'>('individual');
  const [form, setForm] = useState<FormData>(initialForm); const [loading, setLoading] = useState(false); const [result, setResult] = useState<Result | null>(null); const [error, setError] = useState('');
  async function submit(event: FormEvent) { event.preventDefault(); setLoading(true); setError(''); try { setResult(await apiFetch<Result>('/predict', { method: 'POST', body: JSON.stringify({ ...form, name: form.name || null, email: form.email || null }) })); } catch { setError('Unable to connect to the churn service.'); } finally { setLoading(false); } }
  const update = (key: keyof FormData, value: string) => setForm((current) => ({ ...current, [key]: (key === 'name' || key === 'email') ? value : Number(value) }));
  
  return <div className="page-wrap assessment-page">
    <div className="assessment-hero">
      <div>
        <p className="eyebrow">Intentional prediction</p>
        <h1 className="page-title">Risk Assessment</h1>
        <p className="page-lede">Translate customer activity into a clear churn signal, then use the explanation to choose the next best retention action.</p>
        
        <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
          <button onClick={() => setActiveTab('individual')} className={`button-secondary ${activeTab === 'individual' ? 'active-tab' : ''}`} style={activeTab === 'individual' ? { background: '#101312', color: 'white' } : {}}>Individual Assessment</button>
          <button onClick={() => setActiveTab('bulk')} className={`button-secondary ${activeTab === 'bulk' ? 'active-tab' : ''}`} style={activeTab === 'bulk' ? { background: '#101312', color: 'white' } : {}}>Bulk CSV Assessment</button>
        </div>
      </div>
      <div className="assessment-badge"><Sparkles size={16} /> Powered by the live model</div>
    </div>
    
    {activeTab === 'individual' ? (
      <div className="assessment-layout"><form onSubmit={submit} className="panel assessment-form"><SectionHeading number="01" title="Customer profile" detail="Identify the account you are assessing." />
      <div style={{ display: 'flex', gap: '1rem' }}>
        <label className="field-label wide-field" style={{ flex: 1 }}><span><UserRound size={15} /> Customer name <small>Optional</small></span><input value={form.name} onChange={(event) => update('name', event.target.value)} placeholder="e.g. Acme Studios" /></label>
        <label className="field-label wide-field" style={{ flex: 1 }}><span><MailIcon size={15} /> Customer email <small>Required for email tasks</small></span><input type="email" value={form.email} onChange={(event) => update('email', event.target.value)} placeholder="e.g. customer@example.com" /></label>
      </div>
      <SectionHeading number="02" title="Engagement & support" detail="Signals that describe how the customer uses the product." /><div className="assessment-fields">{fields.filter((field) => field.group === 'Engagement' || field.group === 'Support').map((field) => <Field key={field.key} field={field} value={form[field.key] as number} onChange={(value) => update(field.key, value)} />)}</div><SectionHeading number="03" title="Financial & tenure" detail="Context that helps calibrate the assessment." /><div className="assessment-fields">{fields.filter((field) => field.group === 'Financial' || field.group === 'Customer profile').map((field) => <Field key={field.key} field={field} value={form[field.key] as number} onChange={(value) => update(field.key, value)} />)}</div><button disabled={loading} className="button-primary assessment-submit">{loading ? <><span className="button-spinner" /> Analyzing customer signals...</> : <>Run assessment <ArrowRight size={16} /> </>}</button>{error && <p className="error-text form-error">{error}</p>}</form><ResultPanel result={result} /></div>
    ) : (
      <BulkAssessment />
    )}
  </div>;
}

function SectionHeading({ number, title, detail }: { number: string; title: string; detail: string }) { return <div className="form-section-heading"><span>{number}</span><div><h2>{title}</h2><p>{detail}</p></div></div>; }
function Field({ field, value, onChange }: { field: typeof fields[number]; value: number; onChange: (value: string) => void }) { const Icon = field.icon; return <label className="assessment-field"><span className="assessment-field-label"><i><Icon size={15} /></i><b>{field.label}</b><small>{field.unit}</small></span><input type="number" min="0" step="any" value={value} onChange={(event) => onChange(event.target.value)} /><em>{field.description}</em></label>; }
function ResultPanel({ result }: { result: Result | null }) { 
  if (!result) return <aside className="assessment-result empty-result"><div className="result-mark"><Activity size={22} /></div><p className="eyebrow">Awaiting assessment</p><h2>Make the signal actionable.</h2><p>Submit customer activity to see probability, risk level, model reasons, and recommended retention actions.</p><div className="result-rule" /></aside>; 
  const probability = Math.round(result.churn_probability * 100); 
  return <aside className={`assessment-result result-${result.risk_level}`}><div className="result-topline"><span className="eyebrow">Assessment result</span><CheckCircle2 size={18} /></div><div className="result-gauge" style={{ '--gauge': `${probability * 3.6}deg` } as React.CSSProperties}><div><strong>{probability}%</strong><span>churn probability</span></div></div><p className={`result-risk risk-text-${result.risk_level}`}>{result.risk_level.toUpperCase()} RISK</p><h2>{result.prediction ? 'Likely to churn' : 'Likely to retain'}</h2>
  
  <section className="result-section"><h3>Retention automation</h3>
    {result.risk_level === 'high' ? (
      <div style={{ marginTop: '0.5rem', padding: '0.75rem', background: '#f6fdf6', border: '1px solid #d4ecd4', borderRadius: '6px' }}>
        <p style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#2d6a2d', fontWeight: 500, fontSize: '0.85rem' }}><CheckCircle2 size={14} /> Retention task created</p>
        <p style={{ margin: '0.25rem 0 0 0', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#2d6a2d', fontWeight: 500, fontSize: '0.85rem' }}>
          <CheckCircle2 size={14} /> 
          Email {result.email_status === 'sent' ? 'sent' : result.email_status === 'queue_failed' ? 'queue failed' : result.email_status === 'missing_recipient' ? 'missing recipient' : result.email_status === 'not_configured' ? 'not configured' : 'queued'}
        </p>
      </div>
    ) : (
      <p style={{ fontSize: '0.85rem', color: '#879187' }}>No email required.</p>
    )}
  </section>
  
  <section className="result-section"><h3>Why this signal?</h3><ul>{result.top_reasons.map((reason) => <li key={reason}>{reason}</li>)}</ul></section><section className="result-section"><h3>Recommended actions</h3><ul>{result.recommendations.map((recommendation) => <li key={recommendation}>{recommendation}</li>)}</ul></section></aside>; 
}
