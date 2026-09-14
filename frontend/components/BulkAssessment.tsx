'use client';

import { useState } from 'react';
import { UploadCloud, FileText, CheckCircle2, AlertCircle, RefreshCw, Download, ShieldAlert, Mail } from 'lucide-react';
import { apiFetch } from '@/lib/api';

type BulkResult = {
  name: string;
  email: string | null;
  churn_probability: number | null;
  risk_level: string | null;
  top_reasons: string[];
  retention_task: boolean;
  email_status: string | null;
  error?: string;
};

type BulkResponse = {
  total: number;
  successful: number;
  failed: number;
  high_risk: number;
  retention_tasks_created: number;
  emails_queued: number;
  results: BulkResult[];
};

export default function BulkAssessment() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [data, setData] = useState<BulkResponse | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setLoading(true);
    setError('');
    setData(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      // Direct fetch to handle multipart/form-data
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';
      const res = await fetch(`${API_URL}/predict/bulk`, {
        method: 'POST',
        body: formData,
      });
      if (!res.ok) {
        const errBody = await res.json().catch(() => null);
        throw new Error(errBody?.detail || 'Failed to process CSV.');
      }
      const responseData = await res.json();
      setData(responseData);
    } catch (err: any) {
      setError(err.message || 'An error occurred during upload.');
    } finally {
      setLoading(false);
    }
  };

  const downloadCSV = () => {
    if (!data || !data.results) return;
    const headers = ['Name', 'Email', 'Churn Probability', 'Risk Level', 'Top Reasons', 'Retention Queued', 'Email Status', 'Error'];
    const rows = data.results.map(r => [
      r.name || '',
      r.email || '',
      r.churn_probability !== null ? (r.churn_probability * 100).toFixed(1) + '%' : '',
      r.risk_level || '',
      '"' + (r.top_reasons || []).join('; ') + '"',
      r.retention_task ? 'Yes' : 'No',
      r.email_status || '',
      r.error || ''
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'churniq_bulk_results.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bulk-assessment">
      {!data && (
        <div className="panel" style={{ padding: '2rem', textAlign: 'center' }}>
          <UploadCloud size={48} style={{ color: '#9bc83e', margin: '0 auto 1rem' }} />
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.5rem', color: '#101312' }}>Upload Customer CSV</h2>
          <p style={{ color: '#879187', marginBottom: '1.5rem', maxWidth: 400, margin: '0 auto 1.5rem' }}>
            Upload a CSV containing <code>name</code>, <code>email</code>, and all required ML features. The model will assess every customer and automatically queue retention emails for high-risk accounts.
          </p>
          
          <div style={{ marginBottom: '1.5rem' }}>
            <input type="file" accept=".csv" onChange={handleFileChange} id="csv-upload" style={{ display: 'none' }} />
            <label htmlFor="csv-upload" className="button-secondary" style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
              <FileText size={16} /> {file ? file.name : 'Select CSV File'}
            </label>
          </div>

          <button onClick={handleUpload} disabled={!file || loading} className="button-primary">
            {loading ? <><RefreshCw size={16} className="button-spinner" /> Processing...</> : 'Run Bulk Assessment'}
          </button>
          
          {error && <p className="error-text" style={{ marginTop: '1rem' }}>{error}</p>}
        </div>
      )}

      {data && (
        <div className="bulk-results">
          <div className="detail-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: '1.5rem' }}>
            <div className="panel" style={{ padding: '1.25rem 1.5rem' }}>
              <p className="chart-eyebrow">Total Processed</p>
              <p style={{ fontSize: '2rem', fontWeight: 700, lineHeight: 1 }}>{data.total}</p>
            </div>
            <div className="panel" style={{ padding: '1.25rem 1.5rem', background: '#fff0f0' }}>
              <p className="chart-eyebrow" style={{ color: '#cc3333' }}>High Risk ({'>='}70%)</p>
              <p style={{ fontSize: '2rem', fontWeight: 700, lineHeight: 1, color: '#cc3333' }}>{data.high_risk}</p>
            </div>
            <div className="panel" style={{ padding: '1.25rem 1.5rem' }}>
              <p className="chart-eyebrow">Retention Tasks</p>
              <p style={{ fontSize: '2rem', fontWeight: 700, lineHeight: 1 }}>{data.retention_tasks_created}</p>
            </div>
            <div className="panel" style={{ padding: '1.25rem 1.5rem' }}>
              <p className="chart-eyebrow">Emails Queued</p>
              <p style={{ fontSize: '2rem', fontWeight: 700, lineHeight: 1 }}>{data.emails_queued}</p>
            </div>
          </div>

          <div className="panel" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.25rem 1.5rem', borderBottom: '1px solid #eef0f3' }}>
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>Assessment Results</h3>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button onClick={() => setData(null)} className="button-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}>Upload Another</button>
                <button onClick={downloadCSV} className="button-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}>
                  <Download size={14} /> Export CSV
                </button>
              </div>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #eef0f3', textAlign: 'left', color: '#879187' }}>
                  <th style={{ padding: '0.75rem 1.5rem' }}>Customer</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>Probability</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>Risk</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Automation</th>
                </tr>
              </thead>
              <tbody>
                {data.results.map((r, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid #f4f6f3' }}>
                    <td style={{ padding: '1rem 1.5rem' }}>
                      <div style={{ fontWeight: 600, color: '#101312' }}>{r.name || 'Unknown'}</div>
                      <div style={{ fontSize: '0.75rem', color: '#879187' }}>{r.email}</div>
                    </td>
                    <td style={{ padding: '1rem', textAlign: 'center', fontWeight: 600 }}>
                      {r.churn_probability !== null ? (r.churn_probability * 100).toFixed(1) + '%' : '-'}
                    </td>
                    <td style={{ padding: '1rem', textAlign: 'center' }}>
                      {r.risk_level && <span className={`chip chip-${r.risk_level}`}>{r.risk_level.toUpperCase()}</span>}
                    </td>
                    <td style={{ padding: '1rem' }}>
                      {r.retention_task ? (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#3d823d', fontWeight: 500, fontSize: '0.75rem' }}>
                          <CheckCircle2 size={14} /> Task Created
                          {r.email_status === 'queued' && <span style={{ marginLeft: 6, display: 'inline-flex', alignItems: 'center', gap: 2 }}><Mail size={12}/> Queued</span>}
                        </span>
                      ) : (
                        <span style={{ color: '#879187', fontSize: '0.75rem' }}>-</span>
                      )}
                      {r.error && <span style={{ color: '#cc3333', fontSize: '0.75rem' }}>{r.error}</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
