import React, { useEffect, useState, useCallback } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import api from '../lib/api';
import { Category } from '../types';

interface CatForm { name: string; description?: string; }

export default function CategoriesPage() {
  const [data, setData] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const { register, handleSubmit, reset } = useForm<CatForm>();

  const fetch = useCallback(async () => {
    setLoading(true);
    try { const r = await api.get('/categories'); setData(r.data.data?.data ?? r.data.data ?? r.data ?? []); }
    catch { toast.error('Failed to load categories'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const openCreate = () => { setEditing(null); reset({}); setShowModal(true); };
  const openEdit = (c: Category) => { setEditing(c); reset({ name: c.name, description: c.description }); setShowModal(true); };

  const onSubmit = async (form: CatForm) => {
    try {
      if (editing) { await api.patch(`/categories/${editing.id}`, form); toast.success('Category updated'); }
      else { await api.post('/categories', form); toast.success('Category created'); }
      setShowModal(false); fetch();
    } catch { toast.error('Failed to save category'); }
  };

  const handleDelete = async (c: Category) => {
    if (!confirm(`Delete "${c.name}"?`)) return;
    try { await api.delete(`/categories/${c.id}`); toast.success('Deleted'); fetch(); }
    catch { toast.error('Cannot delete — might be in use'); }
  };

  const columns = [
    { key: 'name', header: 'Category Name' },
    { key: 'description', header: 'Description', render: (r: Category) => r.description ?? '—' },
    { key: 'createdAt', header: 'Created', render: (r: Category) => new Date(r.createdAt).toLocaleDateString() },
    {
      key: 'actions', header: '', render: (r: Category) => (
        <div style={{ display: 'flex', gap: 6 }}>
          <button className="btn-primary btn-sm" onClick={() => openEdit(r)}><Edit2 size={13} /></button>
          <button className="btn-danger btn-sm" onClick={() => handleDelete(r)}><Trash2 size={13} /></button>
        </div>
      ),
    },
  ];

  return (
    <DashboardLayout title="Categories">
      <div className="page-header">
        <div><div className="page-title">Categories</div><div className="page-subtitle">Organize products by category</div></div>
        <button className="btn-primary" onClick={openCreate}><Plus size={16} /> Add Category</button>
      </div>
      <div className="card">
        <DataTable columns={columns as never} data={data as never} loading={loading} emptyMessage="No categories yet" />
      </div>
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editing ? 'Edit Category' : 'Create Category'}
        size="sm"
        footer={<><button className="btn-secondary" onClick={() => setShowModal(false)}>Cancel</button><button className="btn-primary" form="cat-form" type="submit">Save</button></>}>
        <form id="cat-form" onSubmit={handleSubmit(onSubmit)}>
          <div style={{ marginBottom: 14 }}><label className="form-label">Name *</label><input className="form-input" {...register('name', { required: 'Required' })} /></div>
          <div><label className="form-label">Description</label><textarea className="form-input" rows={2} {...register('description')} /></div>
        </form>
      </Modal>
    </DashboardLayout>
  );
}
