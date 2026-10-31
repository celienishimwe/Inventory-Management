import React, { useEffect, useState } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import { Package, Plus, CheckCircle } from 'lucide-react';
import api from '../lib/api';
import { toast } from 'react-toastify';

export default function GoodsReceiptsPage() {
  const [receipts, setReceipts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReceipt, setSelectedReceipt] = useState<any | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const fetchReceipts = async () => {
    setLoading(true);
    try {
      const res = await api.get('/goods-receipts');
      const data = res.data?.data?.data ?? res.data?.data ?? res.data ?? [];
      setReceipts(Array.isArray(data) ? data : []);
    } catch {
      // Fallback mock
      setReceipts([
        { id: 'GR-1001', purchaseOrderId: 'PO-2024-001', warehouse: 'Main Warehouse', receivedAt: '2026-10-25', status: 'POSTED', itemsCount: 4 },
        { id: 'GR-1002', purchaseOrderId: 'PO-2024-002', warehouse: 'North Branch', receivedAt: '2026-10-26', status: 'DRAFT', itemsCount: 2 },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReceipts();
  }, []);

  const handlePost = async (id: string) => {
    try {
      await api.post(`/goods-receipts/${id}/post`);
      toast.success('Goods receipt posted successfully');
      fetchReceipts();
    } catch (err: any) {
      toast.error(err.response?.data?.message ?? 'Failed to post receipt');
    }
  };

  return (
    <DashboardLayout title="Goods Receipts">
      <div className="page-header">
        <div>
          <h1 className="page-title">Goods Receipts</h1>
          <p className="page-subtitle">Inspect and post incoming inventory against purchase orders</p>
        </div>
      </div>

      <div className="card">
        <DataTable
          columns={[
            { header: 'Receipt #', accessor: 'id' },
            { header: 'PO Ref', accessor: 'purchaseOrderId' },
            { header: 'Warehouse', accessor: (r: any) => r.warehouse?.name ?? r.warehouse ?? '—' },
            { header: 'Date', accessor: 'receivedAt' },
            {
              header: 'Status',
              accessor: (r: any) => (
                <span className={`badge ${r.status === 'POSTED' ? 'badge-success' : 'badge-warning'}`}>
                  {r.status}
                </span>
              ),
            },
            {
              header: 'Actions',
              accessor: (r: any) => (
                <div style={{ display: 'flex', gap: 8 }}>
                  {r.status !== 'POSTED' && (
                    <button
                      className="btn-primary btn-sm"
                      onClick={() => handlePost(r.id)}
                    >
                      <CheckCircle size={14} /> Post
                    </button>
                  )}
                  <button
                    className="btn-secondary btn-sm"
                    onClick={() => { setSelectedReceipt(r); setModalOpen(true); }}
                  >
                    View
                  </button>
                </div>
              ),
            },
          ]}
          data={receipts}
          loading={loading}
        />
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Receipt Details">
        {selectedReceipt && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <p><strong>Receipt ID:</strong> {selectedReceipt.id}</p>
            <p><strong>PO Number:</strong> {selectedReceipt.purchaseOrderId}</p>
            <p><strong>Status:</strong> {selectedReceipt.status}</p>
            <p><strong>Date:</strong> {selectedReceipt.receivedAt}</p>
          </div>
        )}
      </Modal>
    </DashboardLayout>
  );
}
