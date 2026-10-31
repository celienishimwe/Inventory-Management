import React, { useEffect, useState, useCallback } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import ConfirmModal from '../components/ConfirmModal';
import { Plus, Edit2, Trash2, Search, Scale, Eye, RefreshCw } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import api from '../lib/api';
import { Unit } from '../types';

interface UnitForm {
  name: string;
  symbol: string;
  abbreviation?: string;
}

function extractErrorMessage(err: any, fallback: string): string {
  if (err?.code === 'ECONNABORTED' || err?.message?.includes('timeout')) {
    return 'The backend server took too long to respond. Please refresh.';
  }
  if (err?.message === 'Network Error' || !err?.response) {
    return 'Unable to reach backend server. Please check your connection.';
  }

  const respData = err?.response?.data;
  if (!respData) return err?.message || fallback;

  if (Array.isArray(respData.errors) && respData.errors.length > 0) {
    return respData.errors
      .map((e: any) => (e.field ? `${e.field}: ${e.message}` : e.message ?? JSON.stringify(e)))
      .join('; ');
  }
  if (Array.isArray(respData.details) && respData.details.length > 0) {
    return respData.details
      .map((e: any) => e.message ?? JSON.stringify(e))
      .join('; ');
  }
  if (typeof respData.message === 'string' && respData.message) {
    return respData.message;
  }
  if (typeof respData.error === 'string' && respData.error) {
    return respData.error;
  }
  return fallback;
}

export default function UnitsPage() {
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState('');

  // Modals
  const [showFormModal, setShowFormModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [editingUnit, setEditingUnit] = useState<Unit | null>(null);
  const [viewingUnit, setViewingUnit] = useState<Unit | null>(null);

  // Professional Delete Modal State
  const [unitToDelete, setUnitToDelete] = useState<Unit | null>(null);
  const [deleting, setDeleting] = useState(false);

  const { register, handleSubmit, reset, setError, formState: { errors } } = useForm<UnitForm>();

  // ── 1. GET /units ─────────────────────────────────────────────────────────────
  const fetchUnits = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/units');
      const payload = res.data;
      let list: Unit[] = [];

      if (Array.isArray(payload)) {
        list = payload;
      } else if (Array.isArray(payload?.data)) {
        list = payload.data;
      } else if (Array.isArray(payload?.data?.data)) {
        list = payload.data.data;
      }

      setUnits(list);
    } catch (err: any) {
      console.error('Failed to load units:', err);
      toast.error(extractErrorMessage(err, 'Failed to load units of measure'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUnits();
  }, [fetchUnits]);

  // ── 2. GET /units/{id} ─────────────────────────────────────────────────────────
  const handleViewUnit = async (u: Unit) => {
    setViewingUnit(u);
    setShowDetailModal(true);
    try {
      const res = await api.get(`/units/${u.id}`);
      const fresh = res.data?.data ?? res.data;
      if (fresh && fresh.id) {
        setViewingUnit(fresh);
      }
    } catch (err: any) {
      console.warn('Could not fetch fresh unit details:', err);
    }
  };

  // ── 3. Open Create & Edit ──────────────────────────────────────────────────────
  const openCreateModal = () => {
    setEditingUnit(null);
    reset({ name: '', symbol: '' });
    setShowFormModal(true);
  };

  const openEditModal = async (u: Unit) => {
    setEditingUnit(u);
    const existingSymbol = u.symbol || u.abbreviation || '';
    reset({ name: u.name, symbol: existingSymbol });
    setShowFormModal(true);

    try {
      const res = await api.get(`/units/${u.id}`);
      const fresh = res.data?.data ?? res.data;
      if (fresh && fresh.id) {
        setEditingUnit(fresh);
        reset({ name: fresh.name, symbol: fresh.symbol || fresh.abbreviation || '' });
      }
    } catch {
      // keep current fallback
    }
  };

  // ── 4. POST /units & PATCH /units/{id} ──────────────────────────────────────────
  const onSubmit = async (formData: UnitForm) => {
    setSubmitting(true);
    const resolvedSymbol = (formData.symbol || formData.abbreviation || '').trim();
    const payload = {
      name: formData.name.trim(),
      symbol: resolvedSymbol,
    };

    try {
      if (editingUnit) {
        // PATCH /units/{id}
        await api.patch(`/units/${editingUnit.id}`, payload);
        toast.success(`Unit "${payload.name}" updated successfully`);
      } else {
        // POST /units
        await api.post('/units', payload);
        toast.success(`Unit "${payload.name}" created successfully`);
      }

      setShowFormModal(false);
      reset();
      fetchUnits();
    } catch (err: any) {
      const msg = extractErrorMessage(err, 'Failed to save unit');

      const fieldErrors = err?.response?.data?.errors;
      if (Array.isArray(fieldErrors)) {
        fieldErrors.forEach((fe: any) => {
          if (fe.field === 'name') setError('name', { message: fe.message });
          if (fe.field === 'symbol') setError('symbol', { message: fe.message });
        });
      }

      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  // ── 5. DELETE /units/{id} (Professional Confirmation) ─────────────────────────
  const confirmDeleteUnit = async () => {
    if (!unitToDelete) return;
    setDeleting(true);

    try {
      await api.delete(`/units/${unitToDelete.id}`);
      toast.success(`Unit "${unitToDelete.name}" deleted successfully`);
      setUnits(prev => prev.filter(u => u.id !== unitToDelete.id));
      setUnitToDelete(null);
    } catch (err: any) {
      console.error('Delete error:', err);
      const msg = extractErrorMessage(err, 'Cannot delete unit. It may be assigned to existing products.');
      toast.error(msg);
    } finally {
      setDeleting(false);
    }
  };

  // ── Search Filter ─────────────────────────────────────────────────────────────
  const filteredUnits = units.filter(u => {
    const q = search.toLowerCase().trim();
    if (!q) return true;
    return (
      u.name?.toLowerCase().includes(q) ||
      u.symbol?.toLowerCase().includes(q) ||
      u.abbreviation?.toLowerCase().includes(q) ||
      u.id?.toLowerCase().includes(q)
    );
  });

  const columns = [
    {
      key: 'name',
      header: 'Unit Name',
      render: (r: Unit) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 34, height: 34, borderRadius: 8,
            background: '#e0f7f6', color: '#0d9488',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            <Scale size={17} />
          </div>
          <div>
            <div style={{ fontWeight: 600, color: '#163140' }}>{r.name}</div>
            <div style={{ fontSize: 11, color: '#94a3b8' }}>ID: {r.id.substring(0, 8)}…</div>
          </div>
        </div>
      ),
    },
    {
      key: 'symbol',
      header: 'Symbol',
      render: (r: Unit) => (
        <span style={{
          display: 'inline-block',
          padding: '3px 9px',
          borderRadius: 6,
          background: '#f1f5f9',
          color: '#334155',
          fontWeight: 700,
          fontSize: 12,
        }}>
          {r.symbol || r.abbreviation}
        </span>
      ),
    },
    {
      key: 'id',
      header: 'Unit UUID',
      render: (r: Unit) => (
        <span style={{ fontSize: 12, color: '#64748b', fontFamily: 'monospace' }}>
          {r.id}
        </span>
      ),
    },
    {
      key: 'createdAt',
      header: 'Created Date',
      render: (r: Unit) => (
        <span style={{ fontSize: 12.5, color: '#64748b' }}>
          {r.createdAt ? new Date(r.createdAt).toLocaleDateString(undefined, {
            year: 'numeric', month: 'short', day: 'numeric',
          }) : '—'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      width: '130px',
      render: (r: Unit) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {/* View Details */}
          <button
            type="button"
            className="topbar-icon-btn"
            style={{ width: 30, height: 30, borderRadius: 6 }}
            onClick={() => handleViewUnit(r)}
            title="View Details"
          >
            <Eye size={14} color="#0284c7" />
          </button>

          {/* Edit */}
          <button
            type="button"
            className="topbar-icon-btn"
            style={{ width: 30, height: 30, borderRadius: 6 }}
            onClick={() => openEditModal(r)}
            title="Edit Unit"
          >
            <Edit2 size={14} color="#1b3a4b" />
          </button>

          {/* Delete via Professional Modal */}
          <button
            type="button"
            className="topbar-icon-btn"
            style={{ width: 30, height: 30, borderRadius: 6 }}
            onClick={() => setUnitToDelete(r)}
            title="Delete Unit"
          >
            <Trash2 size={14} color="#ef4444" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <DashboardLayout title="Units of Measure">
      {/* Header */}
      <div className="page-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h1 className="page-title" style={{ fontSize: 20, fontWeight: 800, color: '#163140' }}>
            Units of Measure
          </h1>
          <p className="page-subtitle" style={{ fontSize: 13, color: '#64748b', marginTop: 2 }}>
            Manage measuring standards (e.g. Kilograms, Liters, Pieces) for products and inventory
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button
            type="button"
            className="btn-secondary"
            onClick={fetchUnits}
            disabled={loading}
            title="Refresh units"
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 12px' }}
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>
          <button
            type="button"
            className="btn-primary"
            onClick={openCreateModal}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px' }}
          >
            <Plus size={16} />
            <span>Add Unit</span>
          </button>
        </div>
      </div>

      {/* Stats Quick Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 20 }}>
        <div className="quick-view-card">
          <div className="quick-view-icon" style={{ background: '#e0f7f6', color: '#0d9488' }}>
            <Scale size={20} />
          </div>
          <div>
            <div className="quick-view-value">{units.length}</div>
            <div className="quick-view-label">Total Units Defined</div>
          </div>
        </div>
        <div className="quick-view-card">
          <div className="quick-view-icon" style={{ background: '#e0f2fe', color: '#0284c7' }}>
            <RefreshCw size={20} />
          </div>
          <div>
            <div className="quick-view-value">{filteredUnits.length}</div>
            <div className="quick-view-label">Filtered Results</div>
          </div>
        </div>
        <div className="quick-view-card">
          <div className="quick-view-icon" style={{ background: '#e6f7ed', color: '#10b981' }}>
            <Scale size={20} />
          </div>
          <div>
            <div className="quick-view-value">
              {units.length > 0 ? 'Active' : 'Empty'}
            </div>
            <div className="quick-view-label">Unit Registry Status</div>
          </div>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="card">
        {/* Table Toolbar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div style={{ position: 'relative', width: 280 }}>
            <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            <input
              type="text"
              className="form-input"
              style={{ paddingLeft: 36, height: 36, fontSize: 13 }}
              placeholder="Search unit name, abbreviation…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div style={{ fontSize: 12.5, color: '#64748b' }}>
            Showing <b>{filteredUnits.length}</b> of <b>{units.length}</b> units
          </div>
        </div>

        {/* Data Table */}
        <DataTable
          columns={columns as never}
          data={filteredUnits as never}
          loading={loading}
          emptyMessage={
            search
              ? `No units matching "${search}"`
              : 'No units of measure created yet. Click "+ Add Unit" to create one.'
          }
        />
      </div>

      {/* Create / Edit Unit Modal */}
      <Modal
        isOpen={showFormModal}
        onClose={() => !submitting && setShowFormModal(false)}
        title={editingUnit ? 'Edit Unit of Measure' : 'Create Unit of Measure'}
        size="sm"
        footer={
          <>
            <button
              type="button"
              className="btn-secondary"
              disabled={submitting}
              onClick={() => setShowFormModal(false)}
            >
              Cancel
            </button>
            <button
              type="submit"
              form="unit-form"
              className="btn-primary"
              disabled={submitting}
            >
              {submitting ? 'Saving…' : (editingUnit ? 'Update Unit' : 'Create Unit')}
            </button>
          </>
        }
      >
        <form id="unit-form" onSubmit={handleSubmit(onSubmit)}>
          {/* Unit Name */}
          <div style={{ marginBottom: 16 }}>
            <label className="form-label">
              Unit Name <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Kilogram, Liter, Piece, Box"
              {...register('name', {
                required: 'Unit name is required',
                minLength: { value: 2, message: 'Must be at least 2 characters' },
              })}
            />
            {errors.name && (
              <p style={{ color: '#ef4444', fontSize: 12, marginTop: 4 }}>
                {errors.name.message}
              </p>
            )}
          </div>

          {/* Symbol */}
          <div style={{ marginBottom: 8 }}>
            <label className="form-label">
              Unit Symbol <span style={{ color: '#ef4444' }}>*</span>
              <span style={{ fontSize: 11, color: '#94a3b8', fontWeight: 400, marginLeft: 6 }}>
                (Abbreviation e.g. kg, pcs, L)
              </span>
            </label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. kg, L, pcs, bx"
              {...register('symbol', {
                required: 'Symbol is required',
                minLength: { value: 1, message: 'Must be at least 1 character' },
                maxLength: { value: 10, message: 'Maximum 10 characters' },
              })}
            />
            {errors.symbol && (
              <p style={{ color: '#ef4444', fontSize: 12, marginTop: 4 }}>
                {errors.symbol.message}
              </p>
            )}
          </div>
        </form>
      </Modal>

      {/* Unit Detail Modal (GET /units/{id}) */}
      <Modal
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        title="Unit Details"
        size="sm"
        footer={
          <button
            type="button"
            className="btn-primary"
            onClick={() => setShowDetailModal(false)}
          >
            Close
          </button>
        }
      >
        {viewingUnit && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
              <div style={{
                width: 44, height: 44, borderRadius: 10,
                background: '#e0f7f6', color: '#0d9488',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Scale size={22} />
              </div>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: '#163140', margin: 0 }}>
                  {viewingUnit.name} ({viewingUnit.symbol || viewingUnit.abbreviation})
                </h3>
                <span style={{ fontSize: 12, color: '#94a3b8' }}>
                  UUID: {viewingUnit.id}
                </span>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div style={{ background: '#f8fafc', borderRadius: 8, padding: '10px 12px' }}>
                <div style={{ fontSize: 11, color: '#94a3b8' }}>Created At</div>
                <div style={{ fontSize: 12.5, fontWeight: 600, color: '#163140', marginTop: 2 }}>
                  {viewingUnit.createdAt ? new Date(viewingUnit.createdAt).toLocaleString() : '—'}
                </div>
              </div>
              <div style={{ background: '#f8fafc', borderRadius: 8, padding: '10px 12px' }}>
                <div style={{ fontSize: 11, color: '#94a3b8' }}>Last Updated</div>
                <div style={{ fontSize: 12.5, fontWeight: 600, color: '#163140', marginTop: 2 }}>
                  {viewingUnit.updatedAt ? new Date(viewingUnit.updatedAt).toLocaleString() : '—'}
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Professional Confirmation Modal */}
      <ConfirmModal
        isOpen={!!unitToDelete}
        onClose={() => !deleting && setUnitToDelete(null)}
        onConfirm={confirmDeleteUnit}
        title="Delete Unit of Measure"
        message="Are you sure you want to permanently delete this unit of measure? Products using this unit may be affected."
        itemName={unitToDelete ? `${unitToDelete.name} (${unitToDelete.symbol || unitToDelete.abbreviation})` : undefined}
        confirmLabel="Delete Unit"
        cancelLabel="Cancel"
        loading={deleting}
        danger={true}
      />
    </DashboardLayout>
  );
}
