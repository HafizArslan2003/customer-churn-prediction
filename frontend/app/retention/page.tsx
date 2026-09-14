'use client';
import { useEffect, useState } from 'react';
import { Mail, RefreshCw, CheckCircle, Clock } from 'lucide-react';

interface RetentionTask {
  id: number;
  customer_id: number;
  customer_name: string;
  title: string;
  description: string;
  priority: string;
  status: string;
  email_status: string;
  created_at: string;
}

export default function RetentionTasksPage() {
  const [tasks, setTasks] = useState<RetentionTask[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://127.0.0.1:8000/retention-tasks');
      if (res.ok) {
        const data = await res.json();
        setTasks(data);
      }
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const updateStatus = async (id: number, status: string) => {
    try {
      await fetch(`http://127.0.0.1:8000/retention-tasks/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      fetchTasks();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="p-8 max-w-[1200px] mx-auto min-h-screen">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-[32px] font-bold text-[#101312] tracking-tight">Retention Tasks</h1>
        <button onClick={fetchTasks} className="flex items-center gap-2 px-4 py-2 bg-white rounded-xl shadow-sm text-sm font-semibold hover:bg-gray-50">
          <RefreshCw size={16} /> Refresh
        </button>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading tasks...</div>
        ) : tasks.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No retention tasks found.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50/50 border-b border-gray-100">
              <tr className="text-left text-gray-500 font-semibold">
                <th className="px-6 py-4">Customer</th>
                <th className="px-6 py-4">Task Details</th>
                <th className="px-6 py-4">Priority</th>
                <th className="px-6 py-4">Email Status</th>
                <th className="px-6 py-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {tasks.map(task => (
                <tr key={task.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-bold text-[#101312]">{task.customer_name}</div>
                    <div className="text-xs text-gray-500 mt-1">ID: #{task.customer_id}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-semibold text-[#101312]">{task.title}</div>
                    <div className="text-xs text-gray-500 max-w-xs truncate mt-1" title={task.description}>
                      {task.description}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-md text-xs font-bold uppercase tracking-wider ${
                      task.priority === 'high' ? 'bg-red-100 text-red-700' : 
                      task.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' : 
                      'bg-green-100 text-green-700'
                    }`}>
                      {task.priority}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <Mail size={14} className={task.email_status === 'sent' ? 'text-green-500' : task.email_status === 'failed' ? 'text-red-500' : 'text-gray-400'} />
                      <span className="capitalize font-medium text-gray-600">{task.email_status}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <select
                      value={task.status}
                      onChange={(e) => updateStatus(task.id, e.target.value)}
                      className="bg-gray-50 border border-gray-200 text-gray-700 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2"
                    >
                      <option value="pending">Pending</option>
                      <option value="in_progress">In Progress</option>
                      <option value="completed">Completed</option>
                    </select>
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
