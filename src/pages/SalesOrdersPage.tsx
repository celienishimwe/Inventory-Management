import React, { useEffect, useState, useCallback } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import { Plus, CheckCircle, XCircle, Ban } from 'lucide-react';
import { useForm, useFieldArray } from 'react-hook-form';
import { toast } from 'react-toastify';
import api from '../lib/api';
import { SalesOrder, Customer, Warehouse, Product } from '../types';

type SOStatus = SalesOrder['status'];

const STATUS_BADGE: Record<SOStatus, string> = {
  DRAFT: 'badge-gray', CONFIRMED: 'badge-info', RESERVED: 'badge-teal',
  DISPATCHED: 'badge-success', CANCELLED: 'badge-danger',
};

interface SOForm {
  customerId: string;
  warehouseId: string;
  notes?: string;
  lines: { productId: string; quantity: string }[];
}

export default function SalesOrdersPage() {
  const [data, setData] = useState<SalesOrder[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState('');

  const { register, handleSubmit, reset, control } = useForm<SOForm>({
    defaultValues: { lines: [{ productId: '', quantity: '' }] },
  });
  const { fields, append, remove } = useFieldArray({ control, name: 'lines' });

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const r = await api.get('/sales-orders', { params: { status: selectedStatus || undefined } });
      setData(r.data.data?.data ?? r.data.data ?? r.data ?? []);
    } catch { toast.error('Failed to load sales orders'); }
    finally { setLoading(false); }
  }, [selectedStatus]);

  useEffect(() => {
    fetch();
    api.get('/customers').then(({ data: r }) => setCustomers(r.data?.data ?? r.data ?? r ?? [])).catch(() => {});
    api.get('/warehouses').then(({ data: r }) => setWarehouses(r.data?.data ?? r.data ?? r ?? [])).catch(() => {});
    api.get('/products', { params: { limit: 100 } }).then(({ data: r }) => setProducts(r.data?.data ?? r.data ?? r ?? [])).catch(() => {});
  }, [fetch]);

  const onSubmit = async (form: SOForm) => {
    try {
      await api.post('/sales-orders', form);
      toast.success('Sales order created');
      setShowModal(false); reset(); fetch();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg ?? 'Failed to create SO');
    }
  };

  const doAction = async (id: string, action: string, msg: string) => {
    try { await api.post(`/sales-orders/${id}/${action}`); toast.success(msg); fetch(); }
    catch (err: unknown) {
      const m = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(m ?? `Failed: ${action}`);
    }
  };

  const columns = [
    { key: 'referenceNumber', header: 'Reference' },
    { key: 'customer', header: 'Customer', render: (r: SalesOrder) => r.customer?.name ?? '—' },
    { key: 'warehouse', header: 'Warehouse', render: (r: SalesOrder) => r.warehouse?.name ?? '—' },
    { key: 'status', header: 'Status', render: (r: SalesOrder) => <span className={`badge ${STATUS_BADGE[r.status]}`}>{r.status}</span> },
    { key: 'totalAmount', header: 'Total', render: (r: SalesOrder) => `$${r.totalAmount ?? '0'}` },
    { key: 'createdAt', header: 'Date', render: (r: SalesOrder) => new Date(r.createdAt).toLocaleDateString() },
    {
      key: 'actions', header: '',
      render: (r: SalesOrder) => (
        <div style={{ display: 'flex', gap: 4 }}>
          {r.status === 'DRAFT' && <button className="btn-primary btn-sm" onClick={() => doAction(r.id, 'confirm', 'Confirmed')}><CheckCircle size={13} /> Confirm</button>}
          {r.status === 'CONFIRMED' && <button className="btn-primary btn-sm" onClick={() => doAction(r.id, 'reserve', 'Reserved')}>Reserve</button>}
          {r.status === 'RESERVED' && <button className="btn-primary btn-sm" onClick={() => doAction(r.id, 'dispatch', 'Dispatched')}>Dispatch</button>}
          {['DRAFT', 'CONFIRMED', 'RESERVED'].includes(r.status) && (
            <button className="btn-danger btn-sm" onClick={() => doAction(r.id, 'cancel', 'Cancelled')}><Ban size={13} /></button>
          )}
        </div>
      ),
    },
  ];

  return (
    <DashboardLayout title="Sales Orders">
      <div className="page-header">
        <div><div className="page-title">Sales Orders</div><div className="page-subtitle">Track customer orders and fulfillment</div></div>
        <button className="btn-primary" onClick={() => { reset(); setShowModal(true); }}><Plus size={16} /> New Order</button>
      </div>
      <div className="card">
        <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
          <select className="form-input" style={{ width: 160 }} value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value)}>
            <option value="">All Statuses</option>
            {['DRAFT', 'CONFIRMED', 'RESERVED', 'DISPATCHED', 'CANCELLED'].map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <DataTable columns={columns as never} data={data as never} loading={loading} emptyMessage="No sales orders found" />
      </div>
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Create Sales Order" size="lg"
        footer={<><button className="btn-secondary" onClick={() => setShowModal(false)}>Cancel</button><button className="btn-primary" form="so-form" type="submit">Create</button></>}>
        <form id="so-form" onSubmit={handleSubmit(onSubmit)}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 16 }}>
            <div>
              <label className="form-label">Customer *</label>
              <select className="form-input" {...register('customerId', { required: 'Required' })}>
                <option value="">Select customer</option>
                {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="form-label">Warehouse *</label>
              <select className="form-input" {...register('warehouseId', { required: 'Required' })}>
                <option value="">Select warehouse</option>
                {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
              </select>
            </div>
            <div style={{ gridColumn: '1/-1' }}>
              <label className="form-label">Notes</label>
              <textarea className="form-input" rows={2} {...register('notes')} />
            </div>
          </div>
          <div style={{ marginBottom: 10, fontWeight: 700, fontSize: 13, color: '#1e293b' }}>Order Lines</div>
          {fields.map((field, i) => (
            <div key={field.id} style={{ display: 'grid', gridTemplateColumns: '1fr 100px 40px', gap: 8, marginBottom: 8 }}>
              <select className="form-input" {...register(`lines.${i}.productId`, { required: true })}>
                <option value="">Product</option>
                {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
              <input className="form-input" placeholder="Qty" {...register(`lines.${i}.quantity`, { required: true })} />
              <button type="button" className="btn-danger btn-sm" onClick={() => remove(i)} style={{ height: 38 }}>✕</button>
            </div>
          ))}
          <button type="button" className="btn-secondary btn-sm" onClick={() => append({ productId: '', quantity: '' })}>
            <Plus size={13} /> Add Line
          </button>
        </form>
      </Modal>
    </DashboardLayout>
  );
}
