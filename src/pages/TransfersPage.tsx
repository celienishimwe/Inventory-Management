import React, { useEffect, useState, useCallback } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import { Plus, CheckCircle, Ban } from 'lucide-react';
import { useForm, useFieldArray } from 'react-hook-form';
import { toast } from 'react-toastify';
import api from '../lib/api';
import { Transfer } from '../types';

type TStatus = Transfer['status'];
const STATUS_BADGE: Record<TStatus, string> = {
  DRAFT: 'badge-gray', SUBMITTED: 'badge-info', APPROVED: 'badge-teal',
  IN_TRANSIT: 'badge-warning', RECEIVED: 'badge-success', CANCELLED: 'badge-danger',
};

interface TransferForm {
  sourceWarehouseId: string;
  destinationWarehouseId: string;
  notes?: string;
  lines: { productId: string; quantity: string }[];
}

export default function TransfersPage() {
  const [data, setData] = useState<Transfer[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const { register, handleSubmit, reset, control } = useForm<TransferForm>({
    defaultValues: { lines: [{ productId: '', quantity: '' }] },
  });
  const { fields, append, remove } = useFieldArray({ control, name: 'lines' });

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const r = await api.get('/inventory/transfers');
      setData(r.data.data?.data ?? r.data.data ?? r.data ?? []);
    } catch { toast.error('Failed to load transfers'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const onSubmit = async (form: TransferForm) => {
    try { await api.post('/inventory/transfers', form); toast.success('Transfer created'); setShowModal(false); reset(); fetch(); }
    catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg ?? 'Failed to create transfer');
    }
  };

  const doAction = async (id: string, action: string, msg: string) => {
    try { await api.post(`/inventory/transfers/${id}/${action}`); toast.success(msg); fetch(); }
    catch { toast.error(`Failed: ${action}`); }
  };

  const columns = [
    { key: 'referenceNumber', header: 'Reference' },
    { key: 'sourceWarehouse', header: 'From', render: (r: Transfer) => r.sourceWarehouse?.name ?? r.sourceWarehouseId },
    { key: 'destinationWarehouse', header: 'To', render: (r: Transfer) => r.destinationWarehouse?.name ?? r.destinationWarehouseId },
    { key: 'status', header: 'Status', render: (r: Transfer) => <span className={`badge ${STATUS_BADGE[r.status]}`}>{r.status}</span> },
    { key: 'createdAt', header: 'Date', render: (r: Transfer) => new Date(r.createdAt).toLocaleDateString() },
    {
      key: 'actions', header: '',
      render: (r: Transfer) => (
        <div style={{ display: 'flex', gap: 4 }}>
          {r.status === 'DRAFT' && <button className="btn-primary btn-sm" onClick={() => doAction(r.id, 'submit', 'Submitted')}><CheckCircle size={13} /> Submit</button>}
          {r.status === 'SUBMITTED' && <button className="btn-primary btn-sm" onClick={() => doAction(r.id, 'approve', 'Approved')}>Approve</button>}
          {r.status === 'APPROVED' && <button className="btn-primary btn-sm" onClick={() => doAction(r.id, 'dispatch', 'Dispatched')}>Dispatch</button>}
          {r.status === 'IN_TRANSIT' && <button className="btn-primary btn-sm" onClick={() => doAction(r.id, 'receive', 'Received')}>Receive</button>}
          {['DRAFT', 'SUBMITTED', 'APPROVED'].includes(r.status) && (
            <button className="btn-danger btn-sm" onClick={() => doAction(r.id, 'cancel', 'Cancelled')}><Ban size={13} /></button>
          )}
        </div>
      ),
    },
  ];

  return (
    <DashboardLayout title="Transfers">
      <div className="page-header">
        <div><div className="page-title">Inventory Transfers</div><div className="page-subtitle">Inter-warehouse stock transfers</div></div>
        <button className="btn-primary" onClick={() => { reset(); setShowModal(true); }}><Plus size={16} /> New Transfer</button>
      </div>
      <div className="card">
        <DataTable columns={columns as never} data={data as never} loading={loading} emptyMessage="No transfers found" />
      </div>
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Create Transfer" size="lg"
        footer={<><button className="btn-secondary" onClick={() => setShowModal(false)}>Cancel</button><button className="btn-primary" form="tr-form" type="submit">Create</button></>}>
        <form id="tr-form" onSubmit={handleSubmit(onSubmit)}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 16 }}>
            <div><label className="form-label">Source Warehouse ID *</label><input className="form-input" {...register('sourceWarehouseId', { required: 'Required' })} /></div>
            <div><label className="form-label">Destination Warehouse ID *</label><input className="form-input" {...register('destinationWarehouseId', { required: 'Required' })} /></div>
            <div style={{ gridColumn: '1/-1' }}><label className="form-label">Notes</label><textarea className="form-input" rows={2} {...register('notes')} /></div>
          </div>
          <div style={{ marginBottom: 10, fontWeight: 700, fontSize: 13 }}>Items</div>
          {fields.map((field, i) => (
            <div key={field.id} style={{ display: 'grid', gridTemplateColumns: '1fr 90px 40px', gap: 8, marginBottom: 8 }}>
              <input className="form-input" placeholder="Product ID" {...register(`lines.${i}.productId`, { required: true })} />
              <input className="form-input" placeholder="Qty" {...register(`lines.${i}.quantity`, { required: true })} />
              <button type="button" className="btn-danger btn-sm" onClick={() => remove(i)} style={{ height: 38 }}>✕</button>
            </div>
          ))}
          <button type="button" className="btn-secondary btn-sm" onClick={() => append({ productId: '', quantity: '' })}><Plus size={13} /> Add Item</button>
        </form>
      </Modal>
    </DashboardLayout>
  );
}
