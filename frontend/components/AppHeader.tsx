'use client';

import Link from 'next/link';
import { Bell, Moon, Search, Sun, UserRound, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { apiFetch, Customer } from '@/lib/api';

export default function AppHeader() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const savedTheme = window.localStorage.getItem('insightos-theme');
    const isDark = savedTheme === 'dark';
    setDark(isDark); document.documentElement.dataset.theme = isDark ? 'dark' : 'light';
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault(); document.querySelector<HTMLInputElement>('.search-wrap input')?.focus();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  useEffect(() => {
    const value = query.trim();
    if (!value) { setResults([]); setError(''); return; }
    const timer = window.setTimeout(() => {
      setLoading(true);
      apiFetch<{ items: Customer[] }>(`/customers?search=${encodeURIComponent(value)}&limit=6`)
        .then((payload) => setResults(payload.items))
        .catch(() => setError('Search is unavailable right now.'))
        .finally(() => setLoading(false));
    }, 250);
    return () => window.clearTimeout(timer);
  }, [query]);

  function toggleTheme() {
    const next = !dark;
    setDark(next); document.documentElement.dataset.theme = next ? 'dark' : 'light';
    window.localStorage.setItem('insightos-theme', next ? 'dark' : 'light');
  }

  return <header className="app-header"><div className="search-wrap"><Search size={18} aria-hidden="true" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search customers by name or ID" aria-label="Search customers" /><kbd>Ctrl K</kbd>{query && <button className="icon-button" onClick={() => setQuery('')} aria-label="Clear search"><X size={16} /></button>}{(loading || error || results.length > 0) && <div className="search-results">{loading && <p className="search-message">Searching customer records...</p>}{error && <p className="search-message error-text">{error}</p>}{!loading && !error && results.length === 0 && <p className="search-message">No customers found.</p>}{!loading && !error && results.map((customer) => <Link key={customer.id} href={`/customers/${customer.id}`} onClick={() => setQuery('')} className="search-result"><span><strong>{customer.name || `Customer #${customer.id}`}</strong><small>#{customer.id} · {customer.churn_probability == null ? 'Unassessed' : `${(customer.churn_probability * 100).toFixed(1)}% churn probability`}</small></span><span className={`risk-badge risk-${customer.risk_level || 'low'}`}>{customer.risk_level || 'unassessed'}</span></Link>)}</div>}</div><div className="header-actions"><button className="icon-button" onClick={toggleTheme} aria-label={dark ? 'Use light theme' : 'Use dark theme'} title={dark ? 'Use light theme' : 'Use dark theme'}>{dark ? <Sun size={18} /> : <Moon size={18} />}</button><button className="icon-button" aria-label="Notifications are not connected" title="Notifications are not connected"><Bell size={19} /></button><span className="header-profile" title="InsightOS workspace"><UserRound size={16} /><span>Workspace</span></span><span className="status-dot" title="InsightOS API online" /></div></header>;
}
