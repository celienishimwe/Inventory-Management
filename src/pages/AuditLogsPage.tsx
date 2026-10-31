import React, { useEffect, useState, useCallback } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import DataTable from '../components/DataTable';
import { AuditLog } from '../types';
import api from '../lib/api';
import { toast } from 'react-toastify';
import { Search } from 'lucide-react';

export default function AuditLogsPage() {
  const [data, setData] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const r = await api.get('/audit-logs', { params: { search } });
      setData(r.data.data?.data ?? r.data.data ?? r.data ?? []);
    } catch { toast.error('Failed to load audit logs'); }
    finally { setLoading(false); }
  }, [search]);

  useEffect(() => { fetch(); }, [fetch]);

  const columns = [
    { key: 'action', header: 'Action', render: (r: AuditLog) => <span className="badge badge-info">{r.action}</span> },
    { key: 'entity', header: 'Entity' },
    { key: 'entityId', header: 'Entity ID', render: (r: AuditLog) => <code style={{ fontSize: 11, color: '#64748b' }}>{r.entityId}</code> },
    { key: 'userEmail', header: 'User', render: (r: AuditLog) => r.userEmail ?? r.userId },
    { key: 'createdAt', header: 'Timestamp', render: (r: AuditLog) => new Date(r.createdAt).toLocaleString() },
  ];

  return (
    <DashboardLayout title="Audit Logs">
      <div className="page-header">
        <div><div className="page-title">Audit Logs</div><div className="page-subtitle">Immutable record of all system actions</div></div>
      </div>
      <div className="card">
        <div style={{ marginBottom: 14 }}>
          <div className="search-bar" style={{ maxWidth: 320 }}>
            <Search size={15} color="#94a3b8" />
            <input placeholder="Search logs…" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        </div>
        <DataTable columns={columns as never} data={data as never} loading={loading} emptyMessage="No audit logs found" />
      </div>
    </DashboardLayout>
  );
}
