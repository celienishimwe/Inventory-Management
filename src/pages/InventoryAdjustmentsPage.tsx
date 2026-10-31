import React, { useEffect, useState, useCallback } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import { Plus, CheckCircle, Ban, ArrowUpRight } from 'lucide-react';
import { useForm, useFieldArray } from 'react-hook-form';
import api from '../lib/api';
import { toast } from 'react-toastify';

interface AdjustmentForm {
  warehouseId: string;
  reason: string;
  lines: { productId: string; delta: string }[];
}

export default function InventoryAdjustmentsPage() {
  const [data, setData] = useState<any[]>([]);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const { register, handleSubmit, reset, control } = useForm<AdjustmentForm>({
    defaultValues: { warehouseId: '', reason: '', lines: [{ productId: '', delta: '' }] },
  });
  const { fields, append, remove } = useFieldArray({ control, name: 'lines' });

  const fetchAdjustments = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/inventory/adjustment-requests');
      const items = res.data?.data?.data ?? res.data?.data ?? res.data ?? [];
      setData(Array.isArray(items) ? items : []);
    } catch {
      toast.error('Failed to load inventory adjustment requests');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAdjustments();
    api.get('/warehouses').then(r => setWarehouses(r.data?.data?.data ?? r.data?.data ?? r.data ?? [])).catch(() => {});
    api.get('/products', { params: { limit: 100 } }).then(r => setProducts(r.data?.data?.data ?? r.data?.data ?? r.data ?? [])).catch(() => {});
  }, [fetchAdjustments]);

  const onSubmit = async (form: AdjustmentForm) => {
    try {
      await api.post('/inventory/adjustment-requests', form);
      toast.success('Adjustment request created');
      setShowModal(false);
      reset();
      fetchAdjustments();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg ?? 'Failed to create adjustment request');
    }
  };

  const doAction = async (id: string, action: string, msg: string) => {
    try {
      await api.post(`/inventory/adjustment-requests/${id}/${action}`);
      toast.success(msg);
      fetchAdjustments();
    } catch (err: unknown) {
      const m = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(m ?? `Failed to ${action} adjustment`);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'DRAFT': return 'badge-gray';
      case 'SUBMITTED': return 'badge-info';
      case 'APPROVED': return 'badge-teal';
      case 'POSTED': return 'badge-success';
      case 'CANCELLED': return 'badge-danger';
      default: return 'badge-gray';
    }
  };

  return (
    <DashboardLayout title="Inventory Adjustments">
      <div className="page-header">
        <div>
          <h1 className="page-title">Inventory Adjustment Requests</h1>
          <p className="page-subtitle">Stage, approve, and post non-zero inventory delta adjustments</p>
        </div>
        <button className="btn-primary" onClick={() => { reset(); setShowModal(true); }}>
          <Plus size={16} /> New Adjustment Request
        </button>
      </div>

      <div className="card">
        <DataTable
          columns={[
            { header: 'Adjustment ID', accessor: 'id' },
            { header: 'Warehouse', accessor: (r: any) => r.warehouse?.name ?? r.warehouseId ?? '—' },
            { header: 'Reason', accessor: (r: any) => r.reason ?? '—' },
            {
              header: 'Status',
              accessor: (r: any) => (
                <span className={`badge ${getStatusBadge(r.status)}`}>
                  {r.status}
                </span>
              ),
            },
            { header: 'Created', accessor: (r: any) => r.createdAt ? new Date(r.createdAt).toLocaleDateString() : '—' },
            {
              header: 'Actions',
              accessor: (r: any) => (
                <div style={{ display: 'flex', gap: 6 }}>
                  {r.status === 'DRAFT' && (
                    <button className="btn-primary btn-sm" onClick={() => doAction(r.id, 'submit', 'Submitted for approval')}>
                      <ArrowUpRight size={13} /> Submit
                    </button>
                  )}
                  {r.status === 'SUBMITTED' && (
                    <button className="btn-primary btn-sm" onClick={() => doAction(r.id, 'approve', 'Adjustment approved')}>
                      <CheckCircle size={13} /> Approve
                    </button>
                  )}
                  {r.status === 'APPROVED' && (
                    <button className="btn-primary btn-sm" onClick={() => doAction(r.id, 'post', 'Adjustment posted to inventory')}>
                      <CheckCircle size={13} /> Post to Stock
                    </button>
                  )}
                  {['DRAFT', 'SUBMITTED', 'APPROVED'].includes(r.status) && (
                    <button className="btn-danger btn-sm" onClick={() => doAction(r.id, 'cancel', 'Adjustment cancelled')}>
                      <Ban size={13} />
                    </button>
                  )}
                </div>
              ),
            },
          ]}
          data={data}
          loading={loading}
          emptyMessage="No adjustment requests found"
        />
      </div>

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Create Adjustment Request"
        size="lg"
        footer={
          <>
            <button className="btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
            <button className="btn-primary" form="adj-form" type="submit">Create Request</button>
          </>
        }
      >
        <form id="adj-form" onSubmit={handleSubmit(onSubmit)}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 16 }}>
            <div>
              <label className="form-label">Warehouse *</label>
              <select className="form-input" {...register('warehouseId', { required: 'Required' })}>
                <option value="">Select warehouse</option>
                {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
              </select>
            </div>
            <div>
              <label className="form-label">Reason *</label>
              <input className="form-input" placeholder="e.g. Audit variance, damage write-off" {...register('reason', { required: 'Required' })} />
            </div>
          </div>

          <div style={{ marginBottom: 10, fontWeight: 700, fontSize: 13 }}>Items (Delta: + for addition, - for reduction)</div>
          {fields.map((field, i) => (
            <div key={field.id} style={{ display: 'grid', gridTemplateColumns: '1fr 120px 40px', gap: 8, marginBottom: 8 }}>
              <select className="form-input" {...register(`lines.${i}.productId`, { required: true })}>
                <option value="">Select Product</option>
                {products.map(p => <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>)}
              </select>
              <input className="form-input" placeholder="Delta (+/- Qty)" {...register(`lines.${i}.delta`, { required: true })} />
              <button type="button" className="btn-danger btn-sm" onClick={() => remove(i)}>✕</button>
            </div>
          ))}
          <button type="button" className="btn-secondary btn-sm" onClick={() => append({ productId: '', delta: '' })}>
            <Plus size={13} /> Add Line
          </button>
        </form>
      </Modal>
    </DashboardLayout>
  );
}
