import React, { useEffect, useState, useCallback } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import api from '../lib/api';
import { OrgUser, Role } from '../types';

interface UserForm { firstName: string; lastName: string; email: string; password?: string; roleId: string; }

export default function UsersPage() {
  const [users, setUsers] = useState<OrgUser[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<OrgUser | null>(null);
  const { register, handleSubmit, reset } = useForm<UserForm>();

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const [ur, rr] = await Promise.all([api.get('/users'), api.get('/roles')]);
      setUsers(ur.data.data?.data ?? ur.data.data ?? ur.data ?? []);
      setRoles(rr.data.data?.data ?? rr.data.data ?? rr.data ?? []);
    } catch { toast.error('Failed to load users'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const openCreate = () => { setEditing(null); reset({}); setShowModal(true); };
  const openEdit = (u: OrgUser) => { setEditing(u); reset({ firstName: u.firstName, lastName: u.lastName, email: u.email, roleId: u.roleId }); setShowModal(true); };

  const onSubmit = async (form: UserForm) => {
    try {
      if (editing) {
        await api.patch(`/users/${editing.id}`, { roleId: form.roleId, status: 'ACTIVE' });
        toast.success('User updated');
      } else {
        await api.post('/users', form);
        toast.success('User created');
      }
      setShowModal(false); fetch();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg ?? 'Failed to save user');
    }
  };

  const columns = [
    { key: 'name', header: 'Name', render: (r: OrgUser) => `${r.firstName} ${r.lastName}` },
    { key: 'email', header: 'Email' },
    { key: 'role', header: 'Role', render: (r: OrgUser) => r.role?.name ?? '—' },
    {
      key: 'status', header: 'Status',
      render: (r: OrgUser) => <span className={`badge ${r.status === 'ACTIVE' ? 'badge-success' : 'badge-danger'}`}>{r.status}</span>,
    },
    { key: 'createdAt', header: 'Joined', render: (r: OrgUser) => new Date(r.createdAt).toLocaleDateString() },
    { key: 'actions', header: '', render: (r: OrgUser) => <button className="btn-primary btn-sm" onClick={() => openEdit(r)}><Edit2 size={13} /></button> },
  ];

  return (
    <DashboardLayout title="Users">
      <div className="page-header">
        <div><div className="page-title">Users</div><div className="page-subtitle">Manage organization members and roles</div></div>
        <button className="btn-primary" onClick={openCreate}><Plus size={16} /> Invite User</button>
      </div>
      <div className="card">
        <DataTable columns={columns as never} data={users as never} loading={loading} emptyMessage="No users found" />
      </div>
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editing ? 'Edit User' : 'Invite User'}
        footer={<><button className="btn-secondary" onClick={() => setShowModal(false)}>Cancel</button><button className="btn-primary" form="user-form" type="submit">Save</button></>}>
        <form id="user-form" onSubmit={handleSubmit(onSubmit)}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div><label className="form-label">First Name *</label><input className="form-input" {...register('firstName', { required: 'Required' })} /></div>
            <div><label className="form-label">Last Name *</label><input className="form-input" {...register('lastName', { required: 'Required' })} /></div>
            <div style={{ gridColumn: '1/-1' }}><label className="form-label">Email *</label><input type="email" className="form-input" {...register('email', { required: 'Required' })} /></div>
            {!editing && <div style={{ gridColumn: '1/-1' }}><label className="form-label">Password *</label><input type="password" className="form-input" {...register('password', { required: !editing })} /></div>}
            <div style={{ gridColumn: '1/-1' }}>
              <label className="form-label">Role *</label>
              <select className="form-input" {...register('roleId', { required: 'Required' })}>
                <option value="">Select role</option>
                {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
              </select>
            </div>
          </div>
        </form>
      </Modal>
    </DashboardLayout>
  );
}
