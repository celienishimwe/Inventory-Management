import React, { useEffect, useState, useCallback } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import { Plus, Edit2, Trash2, Shield } from 'lucide-react';
import { useForm } from 'react-hook-form';
import api from '../lib/api';
import { toast } from 'react-toastify';

interface RoleForm {
  name: string;
  description?: string;
  permissions?: string[];
}

export default function RolesPage() {
  const [roles, setRoles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<any | null>(null);
  const { register, handleSubmit, reset } = useForm<RoleForm>();

  const fetchRoles = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/roles');
      const data = res.data?.data?.data ?? res.data?.data ?? res.data ?? [];
      setRoles(Array.isArray(data) ? data : []);
    } catch {
      toast.error('Failed to load roles from API');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRoles();
  }, [fetchRoles]);

  const openCreate = () => {
    setEditingRole(null);
    reset({ name: '', description: '' });
    setModalOpen(true);
  };

  const openEdit = (role: any) => {
    setEditingRole(role);
    reset({ name: role.name, description: role.description });
    setModalOpen(true);
  };

  const onSubmit = async (form: RoleForm) => {
    try {
      if (editingRole) {
        await api.patch(`/roles/${editingRole.id}`, form);
        toast.success('Role updated successfully');
      } else {
        await api.post('/roles', form);
        toast.success('Role created successfully');
      }
      setModalOpen(false);
      fetchRoles();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg ?? 'Failed to save role');
    }
  };

  const handleDelete = async (role: any) => {
    if (!confirm(`Are you sure you want to delete role "${role.name}"?`)) return;
    try {
      await api.delete(`/roles/${role.id}`);
      toast.success('Role deleted successfully');
      fetchRoles();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg ?? 'Failed to delete role');
    }
  };

  return (
    <DashboardLayout title="Role Permissions">
      <div className="page-header">
        <div>
          <h1 className="page-title">Roles & Access Control</h1>
          <p className="page-subtitle">Configure operational roles and tenant-scoped permissions</p>
        </div>
        <button className="btn-primary" onClick={openCreate}>
          <Plus size={16} /> Create Role
        </button>
      </div>

      <div className="card">
        <DataTable
          columns={[
            {
              header: 'Role Name',
              accessor: (r: any) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600 }}>
                  <Shield size={16} color="#193849" />
                  <span>{r.name}</span>
                </div>
              ),
            },
            { header: 'Description', accessor: (r: any) => r.description ?? '—' },
            {
              header: 'Permissions',
              accessor: (r: any) => (
                <span className="badge badge-info">
                  {Array.isArray(r.permissions) ? `${r.permissions.length} perms` : 'Custom'}
                </span>
              ),
            },
            {
              header: 'Actions',
              accessor: (r: any) => (
                <div style={{ display: 'flex', gap: 6 }}>
                  <button className="btn-primary btn-sm" onClick={() => openEdit(r)}>
                    <Edit2 size={13} /> Edit
                  </button>
                  <button className="btn-danger btn-sm" onClick={() => handleDelete(r)}>
                    <Trash2 size={13} />
                  </button>
                </div>
              ),
            },
          ]}
          data={roles}
          loading={loading}
          emptyMessage="No roles configured"
        />
      </div>

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingRole ? 'Edit Role' : 'Create Custom Role'}
        footer={
          <>
            <button className="btn-secondary" onClick={() => setModalOpen(false)}>Cancel</button>
            <button className="btn-primary" form="role-form" type="submit">Save Role</button>
          </>
        }
      >
        <form id="role-form" onSubmit={handleSubmit(onSubmit)}>
          <div style={{ marginBottom: 14 }}>
            <label className="form-label">Role Name *</label>
            <input className="form-input" placeholder="e.g. AUDITOR" {...register('name', { required: 'Required' })} />
          </div>
          <div>
            <label className="form-label">Description</label>
            <textarea className="form-input" rows={3} placeholder="Describe duties and access level..." {...register('description')} />
          </div>
        </form>
      </Modal>
    </DashboardLayout>
  );
}
