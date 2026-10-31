import React, { useEffect, useState, useCallback } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import { InventoryBalance } from '../types';
import api from '../lib/api';
import { toast } from 'react-toastify';
import { Search, RefreshCw, CheckCircle2, AlertTriangle } from 'lucide-react';

export default function InventoryBalancesPage() {
  const [data, setData] = useState<InventoryBalance[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [reconciling, setReconciling] = useState(false);
  const [reconciliationModal, setReconciliationModal] = useState(false);
  const [reconciliationData, setReconciliationData] = useState<any>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const r = await api.get('/inventory/balances', { params: { search } });
      setData(r.data.data?.data ?? r.data.data ?? r.data ?? []);
    } catch {
      toast.error('Failed to load inventory balances');
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  const handleReconcile = async () => {
    setReconciling(true);
    try {
      const res = await api.get('/inventory/reconciliation');
      setReconciliationData(res.data?.data ?? res.data);
      setReconciliationModal(true);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg ?? 'Reconciliation check failed');
    } finally {
      setReconciling(false);
    }
  };

  const getAvailableClass = (available: string) => {
    const v = parseFloat(available);
    if (v <= 0) return 'badge-danger';
    if (v < 10) return 'badge-warning';
    return 'badge-success';
  };

  const columns = [
    { key: 'product', header: 'Product', render: (r: InventoryBalance) => r.product?.name ?? r.productId },
    { key: 'warehouse', header: 'Warehouse', render: (r: InventoryBalance) => r.warehouse?.name ?? r.warehouseId },
    { key: 'onHand', header: 'On Hand', render: (r: InventoryBalance) => <strong>{r.onHand}</strong> },
    { key: 'reserved', header: 'Reserved', render: (r: InventoryBalance) => <span style={{ color: '#d97706' }}>{r.reserved}</span> },
    {
      key: 'available', header: 'Available',
      render: (r: InventoryBalance) => <span className={`badge ${getAvailableClass(r.available)}`}>{r.available}</span>,
    },
    { key: 'sku', header: 'SKU', render: (r: InventoryBalance) => r.product?.sku ?? '—' },
  ];

  return (
    <DashboardLayout title="Inventory Balances">
      <div className="page-header">
        <div>
          <h1 className="page-title">Inventory Balances</h1>
          <p className="page-subtitle">On-hand, reserved, and available stock across warehouse locations</p>
        </div>
        <button
          className="btn-secondary"
          onClick={handleReconcile}
          disabled={reconciling}
        >
          <RefreshCw size={15} className={reconciling ? 'animate-spin' : ''} />
          {reconciling ? 'Reconciling…' : 'Run Ledger Reconciliation'}
        </button>
      </div>

      <div className="card">
        <div style={{ marginBottom: 14 }}>
          <div className="search-bar" style={{ maxWidth: 320 }}>
            <Search size={15} color="#94a3b8" />
            <input placeholder="Search products…" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        </div>
        <DataTable columns={columns as never} data={data as never} loading={loading} emptyMessage="No inventory records found" />
      </div>

      <Modal
        isOpen={reconciliationModal}
        onClose={() => setReconciliationModal(false)}
        title="Inventory Reconciliation Audit"
        size="md"
      >
        {reconciliationData && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              {reconciliationData.isBalanced !== false ? (
                <div style={{ color: '#16a34a', display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700 }}>
                  <CheckCircle2 size={22} />
                  <span>Inventory Balances Match Movement Ledger</span>
                </div>
              ) : (
                <div style={{ color: '#dc2626', display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700 }}>
                  <AlertTriangle size={22} />
                  <span>Variance Detected in Inventory Ledger</span>
                </div>
              )}
            </div>

            <div style={{ background: '#f8fafc', borderRadius: 8, padding: 14, fontSize: 13, lineHeight: 1.6 }}>
              <p><strong>Total Balance Units:</strong> {reconciliationData.totalBalanceUnits ?? 'Balanced'}</p>
              <p><strong>Total Ledger Units:</strong> {reconciliationData.totalLedgerUnits ?? 'Balanced'}</p>
              <p><strong>Discrepancies:</strong> {reconciliationData.discrepancies?.length ?? 0} found</p>
            </div>
          </div>
        )}
      </Modal>
    </DashboardLayout>
  );
}
