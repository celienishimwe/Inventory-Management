import React, { useEffect, useState, useCallback } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import { Plus, Search, Eye, CheckCircle, XCircle, Ban } from 'lucide-react';
import { useForm, useFieldArray } from 'react-hook-form';
import { toast } from 'react-toastify';
import api from '../lib/api';
import { PurchaseOrder, Supplier, Warehouse, Product } from '../types';

type POStatus = PurchaseOrder['status'];

const STATUS_BADGE: Record<POStatus, string> = {
  DRAFT: 'badge-gray', SUBMITTED: 'badge-info', APPROVED: 'badge-success',
  REJECTED: 'badge-danger', CANCELLED: 'badge-danger', RECEIVED: 'badge-teal',
};

interface POForm {
  supplierId: string;
  warehouseId: string;
  orderType: 'LOCAL' | 'IMPORT';
  notes?: string;
  lines: { productId: string; quantity: string; unitCost: string }[];
}

export default function PurchaseOrdersPage() {
  const [data, setData] = useState<PurchaseOrder[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState('');

  const { register, handleSubmit, reset, control } = useForm<POForm>({
    defaultValues: { orderType: 'LOCAL', lines: [{ productId: '', quantity: '', unitCost: '' }] },
  });
  const { fields, append, remove } = useFieldArray({ control, name: 'lines' });

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const r = await api.get('/purchase-orders', { params: { status: selectedStatus || undefined } });
      setData(r.data.data?.data ?? r.data.data ?? r.data ?? []);
    } catch { toast.error('Failed to load purchase orders'); }
    finally { setLoading(false); }
  }, [selectedStatus]);

  useEffect(() => {
    fetch();
    api.get('/suppliers').then(({ data: r }) => setSuppliers(r.data?.data ?? r.data ?? r ?? [])).catch(() => {});
    api.get('/warehouses').then(({ data: r }) => setWarehouses(r.data?.data ?? r.data ?? r ?? [])).catch(() => {});
    api.get('/products', { params: { pageSize: 100 } }).then(({ data: r }) => setProducts(r.data?.data ?? r.data ?? r ?? [])).catch(() => {});
  }, [fetch]);

  const onSubmit = async (form: POForm) => {
    try {
      await api.post('/purchase-orders', form);
      toast.success('Purchase order created');
      setShowModal(false); reset(); fetch();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg ?? 'Failed to create PO');
    }
  };

  const doAction = async (id: string, action: string, successMsg: string) => {
    try {
      await api.post(`/purchase-orders/${id}/${action}`);
      toast.success(successMsg); fetch();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg ?? `Failed to ${action}`);
    }
  };

  const columns = [
    { key: 'referenceNumber', header: 'Reference' },
    { key: 'supplier', header: 'Supplier', render: (r: PurchaseOrder) => r.supplier?.name ?? '—' },
    { key: 'orderType', header: 'Type', render: (r: PurchaseOrder) => <span className="badge badge-info">{r.orderType}</span> },
    { key: 'status', header: 'Status', render: (r: PurchaseOrder) => <span className={`badge ${STATUS_BADGE[r.status]}`}>{r.status}</span> },
    { key: 'totalAmount', header: 'Total', render: (r: PurchaseOrder) => `$${r.totalAmount ?? '0'}` },
    { key: 'createdAt', header: 'Date', render: (r: PurchaseOrder) => new Date(r.createdAt).toLocaleDateString() },
    {
      key: 'actions', header: '',
      render: (r: PurchaseOrder) => (
        <div style={{ display: 'flex', gap: 4 }}>
          {r.status === 'DRAFT' && <button className="btn-primary btn-sm" onClick={() => doAction(r.id, 'submit', 'Submitted')}><CheckCircle size={13} /> Submit</button>}
          {r.status === 'SUBMITTED' && <button className="btn-primary btn-sm" onClick={() => doAction(r.id, 'approve', 'Approved')}><CheckCircle size={13} /> Approve</button>}
          {r.status === 'SUBMITTED' && <button className="btn-danger btn-sm" onClick={() => doAction(r.id, 'reject', 'Rejected')}><XCircle size={13} /> Reject</button>}
          {['DRAFT', 'SUBMITTED', 'APPROVED'].includes(r.status) && (
            <button className="btn-danger btn-sm" onClick={() => doAction(r.id, 'cancel', 'Cancelled')}><Ban size={13} /></button>
          )}
        </div>
      ),
    },
  ];

  return (
    <DashboardLayout title="Purchase Orders">
      <div className="page-header">
        <div><div className="page-title">Purchase Orders</div><div className="page-subtitle">Manage procurement orders</div></div>
        <button className="btn-primary" onClick={() => { reset(); setShowModal(true); }}><Plus size={16} /> New PO</button>
      </div>

      <div className="card">
        <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
          <div className="search-bar" style={{ flex: 1 }}>
            <input placeholder="Search…" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <select className="form-input" style={{ width: 160 }} value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value)}>
            <option value="">All Statuses</option>
            {['DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED', 'CANCELLED', 'RECEIVED'].map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <DataTable columns={columns as never} data={data as never} loading={loading} emptyMessage="No purchase orders found" />
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Create Purchase Order" size="lg"
        footer={<><button className="btn-secondary" onClick={() => setShowModal(false)}>Cancel</button><button className="btn-primary" form="po-form" type="submit">Create PO</button></>}>
        <form id="po-form" onSubmit={handleSubmit(onSubmit)}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 16 }}>
            <div>
              <label className="form-label">Supplier *</label>
              <select className="form-input" {...register('supplierId', { required: 'Required' })}>
                <option value="">Select supplier</option>
                {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label className="form-label">Order Type</label>
              <select className="form-input" {...register('orderType')}>
                <option value="LOCAL">Local</option>
                <option value="IMPORT">Import</option>
              </select>
            </div>
            <div style={{ gridColumn: '1/-1' }}>
              <label className="form-label">Notes</label>
              <textarea className="form-input" rows={2} {...register('notes')} />
            </div>
          </div>

          <div style={{ marginBottom: 12, fontWeight: 700, fontSize: 13, color: '#1e293b' }}>Order Lines</div>
          {fields.map((field, i) => (
            <div key={field.id} style={{ display: 'grid', gridTemplateColumns: '1fr 100px 100px 40px', gap: 8, marginBottom: 8 }}>
              <select className="form-input" {...register(`lines.${i}.productId`, { required: true })}>
                <option value="">Product</option>
                {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
              <input className="form-input" placeholder="Qty" {...register(`lines.${i}.quantity`, { required: true })} />
              <input className="form-input" placeholder="Unit cost" {...register(`lines.${i}.unitCost`, { required: true })} />
              <button type="button" className="btn-danger btn-sm" onClick={() => remove(i)} style={{ height: 38 }}>✕</button>
            </div>
          ))}
          <button type="button" className="btn-secondary btn-sm" onClick={() => append({ productId: '', quantity: '', unitCost: '' })}>
            <Plus size={13} /> Add Line
          </button>
        </form>
      </Modal>
    </DashboardLayout>
  );
}
