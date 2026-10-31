import React, { useEffect, useState, useCallback } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import DataTable from '../components/DataTable';
import { InventoryValuationItem } from '../types';
import api from '../lib/api';
import { toast } from 'react-toastify';

export default function InventoryValuationPage() {
  const [data, setData] = useState<InventoryValuationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState('0');

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const r = await api.get('/reports/inventory-valuation');
      const items = r.data.data?.data ?? r.data.data ?? r.data ?? [];
      setData(items);
      const sum = items.reduce((acc: number, i: InventoryValuationItem) => acc + parseFloat(i.totalValue ?? '0'), 0);
      setTotal(sum.toFixed(2));
    } catch { toast.error('Failed to load valuation report'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const columns = [
    { key: 'product', header: 'Product', render: (r: InventoryValuationItem) => r.product?.name ?? r.productId },
    { key: 'sku', header: 'SKU', render: (r: InventoryValuationItem) => r.product?.sku ?? '—' },
    { key: 'onHand', header: 'On Hand Qty' },
    { key: 'averageCost', header: 'Avg Cost', render: (r: InventoryValuationItem) => `$${parseFloat(r.averageCost).toFixed(4)}` },
    { key: 'totalValue', header: 'Total Value', render: (r: InventoryValuationItem) => <strong>${parseFloat(r.totalValue).toFixed(2)}</strong> },
  ];

  return (
    <DashboardLayout title="Inventory Valuation">
      <div className="page-header">
        <div><div className="page-title">Inventory Valuation</div><div className="page-subtitle">Current on-hand inventory snapshot</div></div>
        <div className="card" style={{ padding: '12px 20px', background: 'linear-gradient(135deg, #2d6a8a, #4db6ac)' }}>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.8)' }}>Total Inventory Value</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#fff' }}>${parseFloat(total).toLocaleString()}</div>
        </div>
      </div>
      <div className="card">
        <DataTable columns={columns as never} data={data as never} loading={loading} emptyMessage="No inventory valuation data" />
      </div>
    </DashboardLayout>
  );
}
