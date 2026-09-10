'use client';

import Link from 'next/link';
import { ArrowUpRight, Gauge, ShieldAlert, Sparkles, Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Area, AreaChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Scatter, ScatterChart, Tooltip, XAxis, YAxis, ZAxis } from 'recharts';
import AIPanel from '@/components/AIPanel';
import { apiFetch, Customer, Summary } from '@/lib/api';

const percent = (value: number) => `${(value * 100).toFixed(1)}%`;

type RiskPoint = { probability: number; tickets: number; name: string; risk: string };

export default function Dashboard() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      apiFetch<Summary>('/reports/summary'),
      apiFetch<{ items: Customer[] }>('/customers?limit=100'),
    ]).then(([stats, rows]) => {
      setSummary(stats);
      setCustomers(rows.items);
    }).catch(() => setError('Unable to connect to the churn service.'));
  }, []);

  const landscape: RiskPoint[] = customers.filter((customer) => customer.churn_probability != null).map((customer) => ({
    probability: Number((customer.churn_probability! * 100).toFixed(1)),
    tickets: customer.support_ticket_volume,
    name: customer.name || `Customer #${customer.id}`,
    risk: customer.risk_level || 'low',
  }));

  if (!summary) return <div className="page-wrap dashboard-page"><DashboardHero /><>{error ? <div className="panel error-text">{error}</div> : <DashboardSkeleton />}</></div>;

  return <div className="page-wrap dashboard-page">
    <DashboardHero />
    <div className="reference-mosaic">
      <div className="reference-main">
        <section className="priority-panel">
          <div className="priority-copy"><p className="priority-eyebrow">Top priority / live portfolio</p><h2>Retention signals at a glance</h2><p>Surface the customers and patterns that deserve attention first.</p></div>
          <div className="priority-kpis"><PriorityMetric icon={<Users size={17} />} label="Total customers" value={summary.total_customers.toLocaleString()} /><PriorityMetric icon={<ShieldAlert size={17} />} label="High risk" value={summary.high_risk_count.toLocaleString()} tone="danger" /><PriorityMetric icon={<Gauge size={17} />} label="Average risk" value={percent(summary.avg_churn_probability)} tone="accent" /></div>
        </section>
        <div className="reference-chart-row">
          <section className="panel reference-card chart-depth-card"><ChartHeading eyebrow="Portfolio" title="Risk distribution" detail="Current assessed mix" /><div className="reference-donut-layout"><div className="donut-chart compact-donut"><ResponsiveContainer width="100%" height="100%"><PieChart><defs><linearGradient id="riskHighGradient" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#ff9a8f" /><stop offset="55%" stopColor="#e76b61" /><stop offset="100%" stopColor="#9e343e" /></linearGradient><linearGradient id="riskMediumGradient" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#ffe69a" /><stop offset="55%" stopColor="#d5aa48" /><stop offset="100%" stopColor="#8f6628" /></linearGradient><linearGradient id="riskLowGradient" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#e4ff9b" /><stop offset="55%" stopColor="#9dca3d" /><stop offset="100%" stopColor="#4f812d" /></linearGradient><filter id="donutGlow"><feGaussianBlur stdDeviation="3" result="blur" /><feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge></filter></defs><Pie data={[{ name: 'High', value: summary.high_risk_count, key: 'high' }, { name: 'Medium', value: summary.medium_risk_count, key: 'medium' }, { name: 'Low', value: summary.low_risk_count, key: 'low' }]} dataKey="value" innerRadius="64%" outerRadius="88%" paddingAngle={4} stroke="rgba(255,255,255,.28)" strokeWidth={1} animationDuration={1100} filter="url(#donutGlow)">{['high', 'medium', 'low'].map((key) => <Cell key={key} fill={`url(#risk${key[0].toUpperCase()}${key.slice(1)}Gradient)`} />)}</Pie><Tooltip content={<RiskTooltip />} /></PieChart></ResponsiveContainer><div className="donut-center"><strong>{summary.total_customers}</strong><span>customers</span></div></div><div className="legend-list">{[['high', summary.high_risk_count], ['medium', summary.medium_risk_count], ['low', summary.low_risk_count]].map(([key, value]) => <div className="legend-row" key={String(key)}><span className={`legend-dot ${String(key)}`} /><span>{String(key)}</span><strong>{String(value)}</strong></div>)}</div></div></section>
          <section className="panel reference-card trend-card chart-depth-card"><ChartHeading eyebrow="Momentum" title="Churn risk trend" detail="Average probability by day" />{summary.daily_trend.length ? <ResponsiveContainer width="100%" height={205}><AreaChart data={summary.daily_trend} margin={{ top: 10, right: 5, left: -25, bottom: 0 }}><defs><linearGradient id="referenceRiskGradient" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#e4ff9b" stopOpacity={.62} /><stop offset="42%" stopColor="#b8e84b" stopOpacity={.3} /><stop offset="100%" stopColor="#88af2a" stopOpacity={0} /></linearGradient><linearGradient id="referenceRiskStroke" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stopColor="#719813" /><stop offset="48%" stopColor="#c4f34a" /><stop offset="100%" stopColor="#4f812d" /></linearGradient><filter id="trendGlow"><feGaussianBlur stdDeviation="3" result="blur" /><feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge></filter></defs><CartesianGrid vertical={false} stroke="#e8ede5" strokeDasharray="3 5" /><XAxis dataKey="date" tick={{ fill: '#879187', fontSize: 10 }} axisLine={false} tickLine={false} /><YAxis domain={[0, 1]} tickFormatter={(value) => `${value * 100}%`} tick={{ fill: '#879187', fontSize: 10 }} axisLine={false} tickLine={false} /><Tooltip content={<TrendTooltip />} /><Area type="monotone" dataKey="avg_probability" stroke="url(#referenceRiskStroke)" strokeWidth={3} fill="url(#referenceRiskGradient)" activeDot={{ r: 7, fill: '#e4ff9b', stroke: '#719813', strokeWidth: 3 }} dot={{ r: 4, fill: '#b8e84b', stroke: '#fff', strokeWidth: 2 }} filter="url(#trendGlow)" animationDuration={1200} /></AreaChart></ResponsiveContainer> : <div className="chart-empty">Trend data will appear after assessments.</div>}</section>
        </div>
        <section className="panel reference-card landscape-card"><ChartHeading eyebrow="Customer landscape" title="Risk constellation" detail="Each point is a real assessed customer: probability versus support pressure." />{landscape.length ? <ResponsiveContainer width="100%" height={230}><ScatterChart margin={{ top: 8, right: 15, bottom: 8, left: -22 }}><CartesianGrid stroke="#e8ede5" strokeDasharray="3 5" /><XAxis type="number" dataKey="probability" domain={[0, 100]} tickFormatter={(value) => `${value}%`} tick={{ fill: '#879187', fontSize: 10 }} axisLine={false} tickLine={false} /><YAxis type="number" dataKey="tickets" allowDecimals={false} tick={{ fill: '#879187', fontSize: 10 }} axisLine={false} tickLine={false} /><ZAxis range={[55, 55]} /><Tooltip content={<LandscapeTooltip />} /><Scatter data={landscape} fill="#7c3aed" fillOpacity={.78} animationDuration={900} /></ScatterChart></ResponsiveContainer> : <div className="chart-empty">Risk landscape will appear after assessments.</div>}<div className="landscape-legend"><span><i className="legend-dot low" /> Low probability</span><span><i className="legend-dot medium" /> Medium probability</span><span><i className="legend-dot high" /> High probability</span></div></section>
      </div>
      <AIPanel />
      <section className="panel reference-table"><div className="section-heading"><div><p className="chart-eyebrow">Latest signal</p><h2>Recent assessments</h2></div><Link href="/customers" className="text-link">View all <ArrowUpRight size={14} /></Link></div><div className="table-scroll"><table className="data-table"><thead><tr><th>Customer</th><th>Risk</th><th>Probability</th><th>Engagement</th><th>Support</th><th>Assessed</th></tr></thead><tbody>{customers.slice(0, 6).map((customer) => <tr key={customer.id}><td><Link href={`/customers/${customer.id}`} className="customer-link"><span className="avatar small">{(customer.name || `C${customer.id}`).slice(0, 1).toUpperCase()}</span>{customer.name || `Customer #${customer.id}`}</Link></td><td><span className={`risk-badge risk-${customer.risk_level || 'low'}`}>{customer.risk_level || 'unassessed'}</span></td><td>{customer.churn_probability == null ? '—' : percent(customer.churn_probability)}</td><td>{customer.login_frequency} / wk</td><td>{customer.support_ticket_volume}</td><td>{new Date(customer.created_at).toLocaleDateString()}</td></tr>)}</tbody></table></div></section>
    </div>
  </div>;
}

function DashboardHero() { return <div className="dashboard-hero"><div><p className="eyebrow">InsightOS / live intelligence</p><h1 className="page-title">Customer Churn Intelligence</h1><p className="page-lede">Monitor customer risk, understand the drivers behind churn, and prioritize retention actions.</p></div><Link href="/assessment" className="button-primary"><Sparkles size={16} /> Run assessment</Link></div>; }
function PriorityMetric({ icon, label, value, tone = '' }: { icon: React.ReactNode; label: string; value: string; tone?: string }) { return <div className="priority-metric"><span>{icon}</span><small>{label}</small><strong className={tone}>{value}</strong></div>; }
function ChartHeading({ eyebrow, title, detail }: { eyebrow: string; title: string; detail: string }) { return <div className="chart-heading"><div><p className="chart-eyebrow">{eyebrow}</p><h2>{title}</h2><p>{detail}</p></div></div>; }
function RiskTooltip({ active, payload }: { active?: boolean; payload?: { name: string; value: number }[] }) { if (!active || !payload?.length) return null; return <div className="chart-tooltip"><strong>{payload[0].name} risk</strong><span>{payload[0].value} customers</span></div>; }
function TrendTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number; payload: { count: number } }[]; label?: string }) { if (!active || !payload?.length) return null; return <div className="chart-tooltip"><strong>{label}</strong><span>Average risk: {percent(payload[0].value)}</span><span>Assessments: {payload[0].payload.count}</span></div>; }
function LandscapeTooltip({ active, payload }: { active?: boolean; payload?: { payload: RiskPoint }[] }) { if (!active || !payload?.length) return null; const point = payload[0].payload; return <div className="chart-tooltip"><strong>{point.name}</strong><span>Churn probability: {point.probability}%</span><span>Support tickets: {point.tickets}</span></div>; }
function DashboardSkeleton() { return <div className="metric-grid"><div className="skeleton-block" /><div className="skeleton-block" /><div className="skeleton-block" /><div className="skeleton-block" /></div>; }
