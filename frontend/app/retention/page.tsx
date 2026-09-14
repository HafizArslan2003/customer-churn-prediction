'use client';
import { useEffect, useState } from 'react';
import { Mail, RefreshCw, AlertCircle, ShieldAlert } from 'lucide-react';
import { apiFetch } from '@/lib/api';

interface RetentionTask {
  id: number;
  customer_id: number;
  customer_name: string;
  title: string;
  description: string;
  priority: string;
  status: string;
  action_type: string | null;
  email_status: string;
  completed_at: string | null;
  created_at: string;
}

export default function RetentionTasksPage() {
  const [tasks, setTasks] = useState<RetentionTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchTasks = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await apiFetch<RetentionTask[]>('/retention-tasks');
      setTasks(data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load retention tasks.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTasks(); }, []);

  const updateStatus = async (id: number, status: string) => {
    try {
      await apiFetch(`/retention-tasks/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status })
      });
      // Optimistic update without full reload
      setTasks(prev => prev.map(t => t.id === id ? { ...t, status } : t));
    } catch (e: unknown) {
      console.error('Failed to update task status', e);
    }
  };

  const emailBadge = (status: string) => {
    const map: Record<string, string> = {
      sent: 'bg-green-100 text-green-700',
      failed: 'bg-red-100 text-red-700',
      pending: 'bg-yellow-100 text-yellow-700',
    };
    return map[status] ?? 'bg-gray-100 text-gray-600';
  };

  const statusBadge = (status: string) => {
    const map: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-700',
      in_progress: 'bg-blue-100 text-blue-700',
      completed: 'bg-green-100 text-green-700',
    };
    return map[status] ?? 'bg-gray-100 text-gray-600';
  };

  return (
    <div className="page-wrap">
      <p className="eyebrow">CRM Automation</p>
      <h1 className="page-title">Retention Tasks</h1>
      <p className="page-lede">
        High-risk customers automatically get a retention task and a personalized outreach email via the background worker. Update task status as your team acts on each case.
      </p>

      {/* Summary row */}
      <div className="metric-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginBottom: '1.5rem' }}>
        <div className="metric-card">
          <p className="metric-label">Total tasks</p>
          <p className="metric-value">{tasks.length}</p>
        </div>
        <div className="metric-card">
          <p className="metric-label">Pending</p>
          <p className="metric-value">{tasks.filter(t => t.status === 'pending').length}</p>
        </div>
        <div className="metric-card">
          <p className="metric-label">Emails sent</p>
          <p className="metric-value">{tasks.filter(t => t.email_status === 'sent').length}</p>
        </div>
      </div>

      {/* Header row */}
      <div className="panel" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.25rem 1.5rem', borderBottom: '1px solid #eef0f3' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ShieldAlert size={18} style={{ color: '#cc3333' }} />
            <strong style={{ fontSize: '0.95rem' }}>Active Retention Cases</strong>
          </div>
          <button
            onClick={fetchTasks}
            className="button-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', padding: '0.45rem 0.9rem' }}
          >
            <RefreshCw size={13} /> Refresh
          </button>
        </div>

        {loading ? (
          <div className="empty-state">Loading retention tasks…</div>
        ) : error ? (
          <div className="empty-state" style={{ color: '#cc3333' }}>
            <AlertCircle size={20} style={{ marginBottom: '0.5rem' }} />
            <p>{error}</p>
          </div>
        ) : tasks.length === 0 ? (
          <div className="empty-state">
            <p>No retention tasks yet.</p>
            <p style={{ fontSize: '0.82rem', color: '#879187', marginTop: '0.25rem' }}>
              They are created automatically when a customer's churn probability exceeds 70%.
            </p>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #eef0f3', textAlign: 'left', color: '#879187', fontWeight: 600, fontSize: '0.78rem' }}>
                <th style={{ padding: '0.75rem 1.5rem' }}>Customer</th>
                <th style={{ padding: '0.75rem 1rem' }}>Task</th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>Priority</th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>Email</th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>Workflow</th>
                <th style={{ padding: '0.75rem 1.5rem 0.75rem 0', textAlign: 'right' }}>Created</th>
              </tr>
            </thead>
            <tbody>
              {tasks.map(task => (
                <tr key={task.id} style={{ borderBottom: '1px solid #f4f6f3' }}>
                  <td style={{ padding: '1rem 1.5rem' }}>
                    <div style={{ fontWeight: 700, color: '#101312' }}>{task.customer_name}</div>
                    <div style={{ fontSize: '0.75rem', color: '#879187' }}>ID #{task.customer_id}</div>
                  </td>
                  <td style={{ padding: '1rem 1rem', maxWidth: 260 }}>
                    <div style={{ fontWeight: 600, color: '#101312', marginBottom: 2 }}>{task.title}</div>
                    <div style={{ fontSize: '0.75rem', color: '#879187', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={task.description}>
                      {task.description}
                    </div>
                  </td>
                  <td style={{ padding: '1rem', textAlign: 'center' }}>
                    <span className={`chip ${task.priority === 'high' ? 'chip-high' : task.priority === 'medium' ? 'chip-medium' : 'chip-low'}`}>
                      {task.priority}
                    </span>
                  </td>
                  <td style={{ padding: '1rem', textAlign: 'center' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                      <Mail size={13} />
                      <span className={`chip ${emailBadge(task.email_status)}`} style={{ padding: '2px 8px' }}>
                        {task.email_status}
                      </span>
                    </span>
                  </td>
                  <td style={{ padding: '1rem', textAlign: 'center' }}>
                    <select
                      value={task.status}
                      onChange={e => updateStatus(task.id, e.target.value)}
                      style={{ fontSize: '0.8rem', padding: '0.3rem 0.5rem', borderRadius: 8, border: '1px solid #dde3d8', background: '#f7f9f5', cursor: 'pointer' }}
                    >
                      <option value="pending">Pending</option>
                      <option value="in_progress">In Progress</option>
                      <option value="completed">Completed</option>
                    </select>
                  </td>
                  <td style={{ padding: '1rem 1.5rem 1rem 0', textAlign: 'right', color: '#879187', fontSize: '0.75rem', whiteSpace: 'nowrap' }}>
                    {new Date(task.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
