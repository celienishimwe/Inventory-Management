import React, { useEffect, useState, useCallback } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import DataTable from '../components/DataTable';
import { InventoryMovement } from '../types';
import api from '../lib/api';
import { toast } from 'react-toastify';

export default function InventoryMovementsPage() {
  const [data, setData] = useState<InventoryMovement[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const r = await api.get('/inventory/movements');
      setData(r.data.data?.data ?? r.data.data ?? r.data ?? []);
    } catch { toast.error('Failed to load movements'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const columns = [
    { key: 'type', header: 'Type', render: (r: InventoryMovement) => <span className="badge badge-info">{r.type}</span> },
    { key: 'product', header: 'Product', render: (r: InventoryMovement) => r.product?.name ?? r.productId },
    { key: 'quantity', header: 'Quantity', render: (r: InventoryMovement) => {
      const qty = parseFloat(r.quantity);
      return <span style={{ color: qty >= 0 ? '#16a34a' : '#dc2626', fontWeight: 600 }}>{qty >= 0 ? '+' : ''}{r.quantity}</span>;
    }},
    { key: 'reference', header: 'Reference', render: (r: InventoryMovement) => r.reference ?? '—' },
    { key: 'createdAt', header: 'Date', render: (r: InventoryMovement) => new Date(r.createdAt).toLocaleString() },
  ];

  return (
    <DashboardLayout title="Inventory Movements">
      <div className="page-header">
        <div><div className="page-title">Inventory Movements</div><div className="page-subtitle">Immutable ledger of all stock movements</div></div>
      </div>
      <div className="card">
        <DataTable columns={columns as never} data={data as never} loading={loading} emptyMessage="No movements found" />
      </div>
    </DashboardLayout>
  );
}
