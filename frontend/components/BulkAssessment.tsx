'use client';

import { useState } from 'react';
import { UploadCloud, FileText, CheckCircle2, RefreshCw, Download, Mail, AlertTriangle, XCircle, AlertCircle, BarChart3, Users, Clock } from 'lucide-react';

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
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  };

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
    link.setAttribute('download', 'retainiq_bulk_results.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  const getEmailStatusBadge = (status: string | null) => {
    if (!status) return <span className="status-badge gray">Not required</span>;
    if (status === 'sent') return <span className="status-badge green"><CheckCircle2 size={12} /> Sent</span>;
    if (status === 'queued' || status === 'pending') return <span className="status-badge blue"><Clock size={12} /> Queued</span>;
    if (status === 'missing_recipient') return <span className="status-badge orange"><AlertCircle size={12} /> Missing Email</span>;
    if (status === 'not_configured') return <span className="status-badge orange"><AlertTriangle size={12} /> No SMTP</span>;
    return <span className="status-badge red"><XCircle size={12} /> Failed</span>;
  };

  return (
    <div className="bulk-assessment fade-in">
      {!data && (
        <div className="panel" style={{ padding: '3rem 2rem', textAlign: 'center', transition: 'all 0.3s ease' }}>
          <div 
            className={`upload-dropzone ${dragActive ? 'active' : ''}`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            style={{
              border: `2px dashed ${dragActive ? '#9bc83e' : '#e2e8f0'}`,
              borderRadius: '12px',
              padding: '3rem 2rem',
              backgroundColor: dragActive ? '#f6fdf6' : '#fafafa',
              transition: 'all 0.2s ease',
              marginBottom: '2rem'
            }}
          >
            <UploadCloud size={56} style={{ color: dragActive ? '#7a9f31' : '#a0aec0', margin: '0 auto 1rem', transition: 'color 0.2s ease' }} />
            <h2 style={{ fontSize: '1.35rem', fontWeight: 600, marginBottom: '0.5rem', color: '#1a202c' }}>
              {dragActive ? 'Drop your CSV here' : 'Upload Customer CSV'}
            </h2>
            <p style={{ color: '#718096', marginBottom: '1.5rem', maxWidth: 450, margin: '0 auto 1.5rem', lineHeight: 1.5 }}>
              Upload a CSV containing <code>name</code>, <code>email</code>, and all required ML features. The model will assess every customer and automatically queue retention emails for high-risk accounts.
            </p>
            
            <div style={{ marginBottom: '1rem' }}>
              <input type="file" accept=".csv" onChange={handleFileChange} id="csv-upload" style={{ display: 'none' }} />
              <label htmlFor="csv-upload" className="button-secondary" style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 1.2rem' }}>
                <FileText size={16} /> {file ? file.name : 'Browse Files'}
              </label>
            </div>
            {file && <p style={{ fontSize: '0.85rem', color: '#38a169', fontWeight: 500 }}><CheckCircle2 size={14} style={{ display: 'inline', verticalAlign: 'text-bottom' }}/> Ready to process</p>}
          </div>

          <button onClick={handleUpload} disabled={!file || loading} className="button-primary" style={{ padding: '0.75rem 2rem', fontSize: '1rem' }}>
            {loading ? <><RefreshCw size={18} className="button-spinner" /> Processing Batch...</> : 'Run Bulk Assessment'}
          </button>
          
          {error && <div className="error-banner" style={{ marginTop: '1.5rem', padding: '1rem', background: '#fff5f5', color: '#c53030', borderRadius: '8px', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}><AlertTriangle size={18} /> {error}</div>}
        </div>
      )}

      {data && (
        <div className="bulk-results fade-in-up">
          <div className="detail-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', marginBottom: '1.5rem', gap: '1rem' }}>
            <div className="panel summary-card">
              <div className="card-icon blue-icon"><Users size={20} /></div>
              <div>
                <p className="chart-eyebrow">Total Processed</p>
                <p className="card-value">{data.total}</p>
              </div>
            </div>
            <div className="panel summary-card alert-card">
              <div className="card-icon red-icon"><AlertTriangle size={20} /></div>
              <div>
                <p className="chart-eyebrow" style={{ color: '#c53030' }}>High Risk (≥70%)</p>
                <p className="card-value" style={{ color: '#c53030' }}>{data.high_risk}</p>
              </div>
            </div>
            <div className="panel summary-card">
              <div className="card-icon green-icon"><BarChart3 size={20} /></div>
              <div>
                <p className="chart-eyebrow">Retention Tasks</p>
                <p className="card-value">{data.retention_tasks_created}</p>
              </div>
            </div>
            <div className="panel summary-card">
              <div className="card-icon purple-icon"><Mail size={20} /></div>
              <div>
                <p className="chart-eyebrow">Emails Queued</p>
                <p className="card-value">{data.emails_queued}</p>
              </div>
            </div>
          </div>

          <div className="panel" style={{ padding: 0, overflow: 'hidden', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.25rem 1.5rem', borderBottom: '1px solid #e2e8f0', background: '#f8fafc' }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600, color: '#1e293b' }}>Assessment Results</h3>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button onClick={() => setData(null)} className="button-secondary" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}>Upload Another</button>
                <button onClick={downloadCSV} className="button-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', fontSize: '0.85rem' }}>
                  <Download size={16} /> Export CSV
                </button>
              </div>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #e2e8f0', textAlign: 'left', color: '#64748b', backgroundColor: '#ffffff' }}>
                    <th style={{ padding: '1rem 1.5rem', fontWeight: 600 }}>Customer</th>
                    <th style={{ padding: '1rem', textAlign: 'center', fontWeight: 600 }}>Probability</th>
                    <th style={{ padding: '1rem', textAlign: 'center', fontWeight: 600 }}>Risk Level</th>
                    <th style={{ padding: '1rem', fontWeight: 600 }}>Retention Automation</th>
                  </tr>
                </thead>
                <tbody>
                  {data.results.map((r, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9', transition: 'background-color 0.15s', cursor: 'default' }} className="table-row-hover">
                      <td style={{ padding: '1rem 1.5rem' }}>
                        <div style={{ fontWeight: 600, color: '#0f172a' }}>{r.name || 'Unknown'}</div>
                        <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '2px' }}>{r.email || <span style={{ fontStyle: 'italic', color: '#94a3b8' }}>No email provided</span>}</div>
                      </td>
                      <td style={{ padding: '1rem', textAlign: 'center', fontWeight: 600, color: '#334155' }}>
                        {r.churn_probability !== null ? (r.churn_probability * 100).toFixed(1) + '%' : '-'}
                      </td>
                      <td style={{ padding: '1rem', textAlign: 'center' }}>
                        {r.risk_level && <span className={`chip chip-${r.risk_level}`}>{r.risk_level.toUpperCase()}</span>}
                      </td>
                      <td style={{ padding: '1rem' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                          {r.retention_task ? (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#15803d', fontWeight: 500, fontSize: '0.8rem' }}>
                              <CheckCircle2 size={14} /> Task Created
                            </span>
                          ) : (
                            <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}>No task required</span>
                          )}
                          {r.retention_task && (
                            <div style={{ display: 'inline-flex', alignItems: 'center' }}>
                              {getEmailStatusBadge(r.email_status)}
                            </div>
                          )}
                          {r.error && <span style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '2px' }}>{r.error}</span>}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
      
      <style dangerouslySetInnerHTML={{__html: `
        .fade-in { animation: fadeIn 0.4s ease-out; }
        .fade-in-up { animation: fadeInUp 0.5s ease-out; }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        
        .summary-card { display: flex; align-items: center; gap: 1rem; padding: 1.25rem 1.5rem; transition: transform 0.2s ease, box-shadow 0.2s ease; }
        .summary-card:hover { transform: translateY(-2px); box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.05); }
        .alert-card { background: linear-gradient(145deg, #fff5f5 0%, #ffffff 100%); border: 1px solid #fed7d7; }
        
        .card-icon { display: flex; align-items: center; justify-content: center; width: 44px; height: 44px; border-radius: 10px; }
        .blue-icon { background: #eff6ff; color: #3b82f6; }
        .red-icon { background: #fef2f2; color: #ef4444; }
        .green-icon { background: #f0fdf4; color: #22c55e; }
        .purple-icon { background: #f5f3ff; color: #8b5cf6; }
        
        .card-value { font-size: 1.8rem; font-weight: 700; line-height: 1.2; color: #0f172a; margin-top: 4px; }
        
        .table-row-hover:hover { background-color: #f8fafc !important; }
        
        .status-badge { display: inline-flex; align-items: center; gap: 4px; padding: 3px 8px; border-radius: 12px; font-size: 0.75rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.02em; }
        .status-badge.green { background: #dcfce7; color: #166534; }
        .status-badge.blue { background: #dbeafe; color: #1e40af; }
        .status-badge.orange { background: #ffedd5; color: #9a3412; }
        .status-badge.red { background: #fee2e2; color: #991b1b; }
        .status-badge.gray { background: #f1f5f9; color: #475569; }
      `}} />
    </div>
  );
}
