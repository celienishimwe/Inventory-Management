import React, { useEffect, useState, useCallback } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import DataTable from '../components/DataTable';
import { LowStockItem } from '../types';
import api from '../lib/api';
import { toast } from 'react-toastify';
import { AlertTriangle } from 'lucide-react';

export default function LowStockReportPage() {
  const [data, setData] = useState<LowStockItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const r = await api.get('/reports/low-stock');
      setData(r.data.data?.data ?? r.data.data ?? r.data ?? []);
    } catch { toast.error('Failed to load low stock report'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const columns = [
    { key: 'product', header: 'Product', render: (r: LowStockItem) => r.product?.name ?? r.productId },
    { key: 'sku', header: 'SKU', render: (r: LowStockItem) => r.product?.sku ?? '—' },
    { key: 'warehouse', header: 'Warehouse', render: (r: LowStockItem) => r.warehouse?.name ?? r.warehouseId },
    {
      key: 'available', header: 'Available',
      render: (r: LowStockItem) => (
        <span className={`badge ${parseFloat(r.available) <= 0 ? 'badge-danger' : 'badge-warning'}`}>
          {r.available}
        </span>
      ),
    },
    { key: 'reorderLevel', header: 'Reorder Level' },
    {
      key: 'gap', header: 'Deficit',
      render: (r: LowStockItem) => {
        const gap = r.reorderLevel - parseFloat(r.available);
        return <span style={{ color: '#dc2626', fontWeight: 700 }}>-{gap.toFixed(2)}</span>;
      },
    },
  ];

  return (
    <DashboardLayout title="Low Stock Report">
      <div className="page-header">
        <div>
          <div className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <AlertTriangle size={22} color="#f59e0b" /> Low Stock Report
          </div>
          <div className="page-subtitle">Items at or below reorder level</div>
        </div>
      </div>
      <div className="card">
        <DataTable columns={columns as never} data={data as never} loading={loading} emptyMessage="All stock levels are healthy 🎉" />
      </div>
    </DashboardLayout>
  );
}
