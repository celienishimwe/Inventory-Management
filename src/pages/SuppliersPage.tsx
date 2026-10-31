import React, { useEffect, useState, useCallback } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import { Plus, Search, Edit2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import api from '../lib/api';
import { Supplier } from '../types';

interface ContactForm {
  name: string; email?: string; phone?: string; address?: string; contactPerson?: string;
}

export default function SuppliersPage() {
  const [data, setData] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Supplier | null>(null);
  const { register, handleSubmit, reset } = useForm<ContactForm>();

  const fetch = useCallback(async () => {
    setLoading(true);
    try { const r = await api.get('/suppliers', { params: { search } }); setData(r.data.data?.data ?? r.data.data ?? r.data ?? []); }
    catch { toast.error('Failed to load suppliers'); }
    finally { setLoading(false); }
  }, [search]);

  useEffect(() => { fetch(); }, [fetch]);
  const openCreate = () => { setEditing(null); reset({}); setShowModal(true); };
  const openEdit = (s: Supplier) => { setEditing(s); reset(s); setShowModal(true); };

  const onSubmit = async (form: ContactForm) => {
    try {
      if (editing) { await api.patch(`/suppliers/${editing.id}`, form); toast.success('Supplier updated'); }
      else { await api.post('/suppliers', form); toast.success('Supplier created'); }
      setShowModal(false); fetch();
    } catch { toast.error('Failed to save'); }
  };

  const columns = [
    { key: 'name', header: 'Supplier Name' },
    { key: 'email', header: 'Email', render: (r: Supplier) => r.email ?? '—' },
    { key: 'phone', header: 'Phone', render: (r: Supplier) => r.phone ?? '—' },
    { key: 'contactPerson', header: 'Contact Person', render: (r: Supplier) => r.contactPerson ?? '—' },
    { key: 'createdAt', header: 'Joined', render: (r: Supplier) => new Date(r.createdAt).toLocaleDateString() },
    { key: 'actions', header: '', render: (r: Supplier) => <button className="btn-primary btn-sm" onClick={() => openEdit(r)}><Edit2 size={13} /></button> },
  ];

  return (
    <DashboardLayout title="Suppliers">
      <div className="page-header">
        <div><div className="page-title">Suppliers</div><div className="page-subtitle">Manage your supply chain contacts</div></div>
        <button className="btn-primary" onClick={openCreate}><Plus size={16} /> Add Supplier</button>
      </div>
      <div className="card">
        <div style={{ marginBottom: 14 }}>
          <div className="search-bar" style={{ maxWidth: 320 }}>
            <Search size={15} color="#94a3b8" />
            <input placeholder="Search suppliers…" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        </div>
        <DataTable columns={columns as never} data={data as never} loading={loading} emptyMessage="No suppliers found" />
      </div>
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editing ? 'Edit Supplier' : 'Add Supplier'}
        footer={<><button className="btn-secondary" onClick={() => setShowModal(false)}>Cancel</button><button className="btn-primary" form="sup-form" type="submit">Save</button></>}>
        <form id="sup-form" onSubmit={handleSubmit(onSubmit)}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div style={{ gridColumn: '1/-1' }}><label className="form-label">Supplier Name *</label><input className="form-input" {...register('name', { required: 'Required' })} /></div>
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
