import React, { useEffect, useState, useCallback } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import { Plus, Search, Edit2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import api from '../lib/api';
import { Customer } from '../types';

interface ContactForm { name: string; email?: string; phone?: string; address?: string; contactPerson?: string; }

export default function CustomersPage() {
  const [data, setData] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Customer | null>(null);
  const { register, handleSubmit, reset } = useForm<ContactForm>();

  const fetch = useCallback(async () => {
    setLoading(true);
    try { const r = await api.get('/customers', { params: { search } }); setData(r.data.data?.data ?? r.data.data ?? r.data ?? []); }
    catch { toast.error('Failed to load customers'); }
    finally { setLoading(false); }
  }, [search]);

  useEffect(() => { fetch(); }, [fetch]);
  const openCreate = () => { setEditing(null); reset({}); setShowModal(true); };
  const openEdit = (c: Customer) => { setEditing(c); reset(c); setShowModal(true); };

  const onSubmit = async (form: ContactForm) => {
    try {
      if (editing) { await api.patch(`/customers/${editing.id}`, form); toast.success('Customer updated'); }
      else { await api.post('/customers', form); toast.success('Customer created'); }
      setShowModal(false); fetch();
    } catch { toast.error('Failed to save'); }
  };

  const columns = [
    { key: 'name', header: 'Customer Name' },
    { key: 'email', header: 'Email', render: (r: Customer) => r.email ?? '—' },
    { key: 'phone', header: 'Phone', render: (r: Customer) => r.phone ?? '—' },
    { key: 'contactPerson', header: 'Contact Person', render: (r: Customer) => r.contactPerson ?? '—' },
    { key: 'createdAt', header: 'Joined', render: (r: Customer) => new Date(r.createdAt).toLocaleDateString() },
    { key: 'actions', header: '', render: (r: Customer) => <button className="btn-primary btn-sm" onClick={() => openEdit(r)}><Edit2 size={13} /></button> },
  ];

  return (
    <DashboardLayout title="Customers">
      <div className="page-header">
        <div><div className="page-title">Customers</div><div className="page-subtitle">Manage your customer database</div></div>
        <button className="btn-primary" onClick={openCreate}><Plus size={16} /> Add Customer</button>
      </div>
      <div className="card">
        <div style={{ marginBottom: 14 }}>
          <div className="search-bar" style={{ maxWidth: 320 }}>
            <Search size={15} color="#94a3b8" />
            <input placeholder="Search customers…" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        </div>
        <DataTable columns={columns as never} data={data as never} loading={loading} emptyMessage="No customers found" />
      </div>
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editing ? 'Edit Customer' : 'Add Customer'}
        footer={<><button className="btn-secondary" onClick={() => setShowModal(false)}>Cancel</button><button className="btn-primary" form="cust-form" type="submit">Save</button></>}>
        <form id="cust-form" onSubmit={handleSubmit(onSubmit)}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div style={{ gridColumn: '1/-1' }}><label className="form-label">Customer Name *</label><input className="form-input" {...register('name', { required: 'Required' })} /></div>
            <div><label className="form-label">Email</label><input type="email" className="form-input" {...register('email')} /></div>
            <div><label className="form-label">Phone</label><input className="form-input" {...register('phone')} /></div>
            <div><label className="form-label">Contact Person</label><input className="form-input" {...register('contactPerson')} /></div>
            <div style={{ gridColumn: '1/-1' }}><label className="form-label">Address</label><textarea className="form-input" rows={2} {...register('address')} /></div>
          </div>
        </form>
      </Modal>
    </DashboardLayout>
  );
}
