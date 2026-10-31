import React, { useEffect, useState, useCallback } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import { Plus, CheckCircle, Ban } from 'lucide-react';
import { useForm, useFieldArray } from 'react-hook-form';
import { toast } from 'react-toastify';
import api from '../lib/api';
import { Return } from '../types';

type RStatus = Return['status'];
const STATUS_BADGE: Record<RStatus, string> = {
  DRAFT: 'badge-gray', SUBMITTED: 'badge-info', APPROVED: 'badge-teal',
  POSTED: 'badge-success', CANCELLED: 'badge-danger',
};

interface ReturnForm {
  type: 'CUSTOMER' | 'SUPPLIER';
  referenceId: string;
  reason?: string;
  lines: { productId: string; quantity: string }[];
}

export default function ReturnsPage() {
  const [data, setData] = useState<Return[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const { register, handleSubmit, reset, control } = useForm<ReturnForm>({
    defaultValues: { type: 'CUSTOMER', lines: [{ productId: '', quantity: '' }] },
  });
  const { fields, append, remove } = useFieldArray({ control, name: 'lines' });

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const r = await api.get('/returns');
      setData(r.data.data?.data ?? r.data.data ?? r.data ?? []);
    } catch { toast.error('Failed to load returns'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const onSubmit = async (form: ReturnForm) => {
    try { await api.post('/returns', form); toast.success('Return created'); setShowModal(false); reset(); fetch(); }
    catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg ?? 'Failed');
    }
  };

  const doAction = async (id: string, action: string, msg: string) => {
    try { await api.post(`/returns/${id}/${action}`); toast.success(msg); fetch(); }
    catch { toast.error(`Failed: ${action}`); }
  };

  const columns = [
    { key: 'referenceNumber', header: 'Reference' },
    { key: 'type', header: 'Type', render: (r: Return) => <span className={`badge ${r.type === 'CUSTOMER' ? 'badge-info' : 'badge-teal'}`}>{r.type}</span> },
    { key: 'status', header: 'Status', render: (r: Return) => <span className={`badge ${STATUS_BADGE[r.status]}`}>{r.status}</span> },
    { key: 'reason', header: 'Reason', render: (r: Return) => r.reason ?? '—' },
    { key: 'createdAt', header: 'Date', render: (r: Return) => new Date(r.createdAt).toLocaleDateString() },
    {
      key: 'actions', header: '',
      render: (r: Return) => (
        <div style={{ display: 'flex', gap: 4 }}>
          {r.status === 'DRAFT' && <button className="btn-primary btn-sm" onClick={() => doAction(r.id, 'submit', 'Submitted')}><CheckCircle size={13} /> Submit</button>}
          {r.status === 'SUBMITTED' && <button className="btn-primary btn-sm" onClick={() => doAction(r.id, 'approve', 'Approved')}>Approve</button>}
          {r.status === 'APPROVED' && <button className="btn-primary btn-sm" onClick={() => doAction(r.id, 'post', 'Posted')}>Post</button>}
          {['DRAFT', 'SUBMITTED', 'APPROVED'].includes(r.status) && (
            <button className="btn-danger btn-sm" onClick={() => doAction(r.id, 'cancel', 'Cancelled')}><Ban size={13} /></button>
          )}
        </div>
      ),
    },
  ];

  return (
    <DashboardLayout title="Returns">
      <div className="page-header">
        <div><div className="page-title">Returns</div><div className="page-subtitle">Customer and supplier return management</div></div>
        <button className="btn-primary" onClick={() => { reset(); setShowModal(true); }}><Plus size={16} /> New Return</button>
      </div>
      <div className="card">
        <DataTable columns={columns as never} data={data as never} loading={loading} emptyMessage="No returns found" />
      </div>
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Create Return" size="lg"
        footer={<><button className="btn-secondary" onClick={() => setShowModal(false)}>Cancel</button><button className="btn-primary" form="ret-form" type="submit">Create</button></>}>
        <form id="ret-form" onSubmit={handleSubmit(onSubmit)}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 16 }}>
            <div>
              <label className="form-label">Return Type *</label>
              <select className="form-input" {...register('type')}>
                <option value="CUSTOMER">Customer Return</option>
                <option value="SUPPLIER">Supplier Return</option>
              </select>
            </div>
            <div>
              <label className="form-label">Linked Reference ID *</label>
              <input className="form-input" placeholder="Sale/Purchase order ID" {...register('referenceId', { required: 'Required' })} />
            </div>
            <div style={{ gridColumn: '1/-1' }}><label className="form-label">Reason</label><textarea className="form-input" rows={2} {...register('reason')} /></div>
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
