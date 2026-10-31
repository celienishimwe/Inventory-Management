import React, { useEffect, useState, useCallback } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import { Plus, Edit2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import api from '../lib/api';
import { Warehouse } from '../types';

interface WarehouseForm { name: string; address?: string; }

export default function WarehousesPage() {
  const [data, setData] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Warehouse | null>(null);
  const { register, handleSubmit, reset } = useForm<WarehouseForm>();

  const fetch = useCallback(async () => {
    setLoading(true);
    try { const r = await api.get('/warehouses'); setData(r.data.data?.data ?? r.data.data ?? r.data ?? []); }
    catch { toast.error('Failed to load warehouses'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);
  const openCreate = () => { setEditing(null); reset({}); setShowModal(true); };
  const openEdit = (w: Warehouse) => { setEditing(w); reset({ name: w.name, address: w.address }); setShowModal(true); };

  const onSubmit = async (form: WarehouseForm) => {
    try {
      if (editing) { toast.info('Warehouse update not supported via API'); }
      else { await api.post('/warehouses', form); toast.success('Warehouse created'); }
      setShowModal(false); fetch();
    } catch { toast.error('Failed to save'); }
  };

  const columns = [
    { key: 'name', header: 'Warehouse Name' },
    { key: 'address', header: 'Address', render: (r: Warehouse) => r.address ?? '—' },
    { key: 'locations', header: 'Locations', render: (r: Warehouse) => r.locations?.length ?? 1 },
    { key: 'createdAt', header: 'Created', render: (r: Warehouse) => new Date(r.createdAt).toLocaleDateString() },
    { key: 'actions', header: '', render: (r: Warehouse) => <button className="btn-primary btn-sm" onClick={() => openEdit(r)}><Edit2 size={13} /></button> },
  ];

  return (
    <DashboardLayout title="Warehouses">
      <div className="page-header">
        <div><div className="page-title">Warehouses</div><div className="page-subtitle">Manage storage locations</div></div>
        <button className="btn-primary" onClick={openCreate}><Plus size={16} /> Add Warehouse</button>
      </div>
      <div className="card">
        <DataTable columns={columns as never} data={data as never} loading={loading} emptyMessage="No warehouses found" />
      </div>
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editing ? 'Warehouse Details' : 'Create Warehouse'} size="sm"
        footer={<><button className="btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>{!editing && <button className="btn-primary" form="wh-form" type="submit">Create</button>}</>}>
        <form id="wh-form" onSubmit={handleSubmit(onSubmit)}>
          <div style={{ marginBottom: 14 }}><label className="form-label">Name *</label><input className="form-input" {...register('name', { required: 'Required' })} /></div>
          <div><label className="form-label">Address</label><textarea className="form-input" rows={2} {...register('address')} /></div>
        </form>
      </Modal>
    </DashboardLayout>
  );
}
