import React, { useEffect, useState, useCallback } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import api from '../lib/api';
import { Unit } from '../types';

interface UnitForm { name: string; abbreviation: string; }

export default function UnitsPage() {
  const [data, setData] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Unit | null>(null);
  const { register, handleSubmit, reset } = useForm<UnitForm>();

  const fetch = useCallback(async () => {
    setLoading(true);
    try { const r = await api.get('/units'); setData(r.data.data?.data ?? r.data.data ?? r.data ?? []); }
    catch { toast.error('Failed to load units'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);
  const openCreate = () => { setEditing(null); reset({}); setShowModal(true); };
  const openEdit = (u: Unit) => { setEditing(u); reset({ name: u.name, abbreviation: u.abbreviation }); setShowModal(true); };

  const onSubmit = async (form: UnitForm) => {
    try {
      if (editing) { await api.patch(`/units/${editing.id}`, form); toast.success('Unit updated'); }
      else { await api.post('/units', form); toast.success('Unit created'); }
      setShowModal(false); fetch();
    } catch { toast.error('Failed to save'); }
  };

  const handleDelete = async (u: Unit) => {
    if (!confirm(`Delete "${u.name}"?`)) return;
    try { await api.delete(`/units/${u.id}`); toast.success('Deleted'); fetch(); }
    catch { toast.error('Cannot delete — might be in use'); }
  };

  const columns = [
    { key: 'name', header: 'Unit Name' },
    { key: 'abbreviation', header: 'Abbreviation' },
    { key: 'createdAt', header: 'Created', render: (r: Unit) => new Date(r.createdAt).toLocaleDateString() },
    {
      key: 'actions', header: '', render: (r: Unit) => (
        <div style={{ display: 'flex', gap: 6 }}>
          <button className="btn-primary btn-sm" onClick={() => openEdit(r)}><Edit2 size={13} /></button>
          <button className="btn-danger btn-sm" onClick={() => handleDelete(r)}><Trash2 size={13} /></button>
        </div>
      ),
    },
  ];

  return (
    <DashboardLayout title="Units of Measure">
      <div className="page-header">
        <div><div className="page-title">Units of Measure</div><div className="page-subtitle">Manage measurement units</div></div>
        <button className="btn-primary" onClick={openCreate}><Plus size={16} /> Add Unit</button>
      </div>
      <div className="card">
        <DataTable columns={columns as never} data={data as never} loading={loading} emptyMessage="No units yet" />
      </div>
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editing ? 'Edit Unit' : 'Create Unit'} size="sm"
        footer={<><button className="btn-secondary" onClick={() => setShowModal(false)}>Cancel</button><button className="btn-primary" form="unit-form" type="submit">Save</button></>}>
        <form id="unit-form" onSubmit={handleSubmit(onSubmit)}>
          <div style={{ marginBottom: 14 }}><label className="form-label">Unit Name *</label><input className="form-input" placeholder="Kilogram" {...register('name', { required: 'Required' })} /></div>
          <div><label className="form-label">Abbreviation *</label><input className="form-input" placeholder="kg" {...register('abbreviation', { required: 'Required' })} /></div>
        </form>
      </Modal>
    </DashboardLayout>
  );
}
