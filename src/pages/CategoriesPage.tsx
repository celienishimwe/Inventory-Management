import React, { useEffect, useState, useCallback } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import ConfirmModal from '../components/ConfirmModal';
import { Plus, Edit2, Trash2, Search, FolderTree, Eye, RefreshCw, AlertCircle } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import api from '../lib/api';
import { Category } from '../types';

interface CategoryForm {
  name: string;
  description?: string;
}

function extractErrorMessage(err: any, fallback: string): string {
  if (err?.code === 'ECONNABORTED' || err?.message?.includes('timeout')) {
    return 'The backend server took too long to respond (Render cold start). Please click Refresh in a moment.';
  }
  if (err?.message === 'Network Error' || !err?.response) {
    return 'Backend connection was reset. The server on Render is restarting or waking up.';
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

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState('');
  
  // Modals
  const [showFormModal, setShowFormModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [viewingCategory, setViewingCategory] = useState<Category | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Delete state
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);
  const [deleting, setDeleting] = useState(false);

  const { register, handleSubmit, reset, setError, formState: { errors } } = useForm<CategoryForm>();

  // ── 1. GET /categories ────────────────────────────────────────────────────────
  const fetchCategories = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/categories');
      const payload = res.data;
      let list: Category[] = [];

      if (Array.isArray(payload)) {
        list = payload;
      } else if (Array.isArray(payload?.data)) {
        list = payload.data;
      } else if (Array.isArray(payload?.data?.data)) {
        list = payload.data.data;
      }

      setCategories(list);
    } catch (err: any) {
      console.error('Failed to fetch categories:', err);
      toast.error(extractErrorMessage(err, 'Failed to load categories'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  // ── 2. GET /categories/{id} ────────────────────────────────────────────────────
  const handleViewCategory = async (cat: Category) => {
    setViewingCategory(cat);
    setShowDetailModal(true);
    setLoadingDetail(true);
    try {
      const res = await api.get(`/categories/${cat.id}`);
      const detailed = res.data?.data ?? res.data;
      if (detailed && detailed.id) {
        setViewingCategory(detailed);
      }
    } catch (err: any) {
      console.warn('Could not fetch fresh category details:', err);
    } finally {
      setLoadingDetail(false);
    }
  };

  // ── 3. Open Create & Edit ─────────────────────────────────────────────────────
  const openCreateModal = () => {
    setEditingCategory(null);
    reset({ name: '', description: '' });
    setShowFormModal(true);
  };

  const openEditModal = async (cat: Category) => {
    setEditingCategory(cat);
    reset({ name: cat.name, description: cat.description || '' });
    setShowFormModal(true);

    // Fetch latest category details by ID
    try {
      const res = await api.get(`/categories/${cat.id}`);
      const fresh = res.data?.data ?? res.data;
      if (fresh && fresh.id) {
        setEditingCategory(fresh);
        reset({ name: fresh.name, description: fresh.description || '' });
      }
    } catch {
      // keep existing fallback
    }
  };

  // ── 4. POST /categories & PATCH /categories/{id} ─────────────────────────────
  const onSubmit = async (formData: CategoryForm) => {
    setSubmitting(true);
    const payload = {
      name: formData.name.trim(),
    };

    try {
      if (editingCategory) {
        // PATCH /categories/{id}
        await api.patch(`/categories/${editingCategory.id}`, payload);
        toast.success(`Category "${payload.name}" updated successfully`);
      } else {
        // POST /categories
        await api.post('/categories', payload);
        toast.success(`Category "${payload.name}" created successfully`);
      }

      setShowFormModal(false);
      reset();
      fetchCategories();
    } catch (err: any) {
      const errorMsg = extractErrorMessage(err, 'Failed to save category');
      
      // If server returned field validation errors, map to form
      const fieldErrors = err?.response?.data?.errors;
      if (Array.isArray(fieldErrors)) {
        fieldErrors.forEach((fe: any) => {
          if (fe.field === 'name') setError('name', { message: fe.message });
          if (fe.field === 'description') setError('description', { message: fe.message });
        });
      }
      
      toast.error(errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  // ── 5. DELETE /categories/{id} (Professional Confirmation) ───────────────────
  const confirmDeleteCategory = async () => {
    if (!categoryToDelete) return;
    setDeleting(true);

    try {
      await api.delete(`/categories/${categoryToDelete.id}`);
      toast.success(`Category "${categoryToDelete.name}" deleted successfully`);
      setCategories(prev => prev.filter(c => c.id !== categoryToDelete.id));
      setCategoryToDelete(null);
    } catch (err: any) {
      console.error('Delete error:', err);
      const msg = extractErrorMessage(err, 'Failed to delete category. It may be in use by products.');
      toast.error(msg);
    } finally {
      setDeleting(false);
    }
  };

  // ── Filter Categories ────────────────────────────────────────────────────────
  const filteredCategories = categories.filter(c => {
    const q = search.toLowerCase().trim();
    if (!q) return true;
    return (
      c.name?.toLowerCase().includes(q) ||
      c.id.toLowerCase().includes(q)
    );
  });

  const columns = [
    {
      key: 'name',
      header: 'Category Name',
      render: (r: Category) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 34, height: 34, borderRadius: 8,
            background: '#e0f2fe', color: '#0284c7',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            <FolderTree size={17} />
          </div>
          <div>
            <div style={{ fontWeight: 600, color: '#163140' }}>{r.name}</div>
            <div style={{ fontSize: 11, color: '#94a3b8' }}>ID: {r.id.substring(0, 8)}…</div>
          </div>
        </div>
      ),
    },
    {
      key: 'id',
      header: 'Category UUID',
      render: (r: Category) => (
        <span style={{ fontSize: 12, color: '#64748b', fontFamily: 'monospace' }}>
          {r.id}
        </span>
      ),
    },
    {
      key: 'createdAt',
      header: 'Created Date',
      render: (r: Category) => (
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
      width: '140px',
      render: (r: Category) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {/* View Details (GET /categories/{id}) */}
          <button
            type="button"
            className="topbar-icon-btn"
            style={{ width: 30, height: 30, borderRadius: 6 }}
            onClick={() => handleViewCategory(r)}
            title="View Details"
          >
            <Eye size={14} color="#0284c7" />
          </button>

          {/* Edit (PATCH /categories/{id}) */}
          <button
            type="button"
            className="topbar-icon-btn"
            style={{ width: 30, height: 30, borderRadius: 6 }}
            onClick={() => openEditModal(r)}
            title="Edit Category"
          >
            <Edit2 size={14} color="#1b3a4b" />
          </button>

          {/* Delete (DELETE /categories/{id}) via Professional Modal */}
          <button
            type="button"
            className="topbar-icon-btn"
            style={{ width: 30, height: 30, borderRadius: 6 }}
            onClick={() => setCategoryToDelete(r)}
            title="Delete Category"
          >
            <Trash2 size={14} color="#ef4444" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <DashboardLayout title="Categories">
      {/* Header */}
      <div className="page-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h1 className="page-title" style={{ fontSize: 20, fontWeight: 800, color: '#163140' }}>
            Product Categories
          </h1>
          <p className="page-subtitle" style={{ fontSize: 13, color: '#64748b', marginTop: 2 }}>
            Manage category taxonomy for your organization's products
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button
            type="button"
            className="btn-secondary"
            onClick={fetchCategories}
            disabled={loading}
            title="Refresh categories"
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
            <span>Add Category</span>
          </button>
        </div>
      </div>

      {/* Stats Quick Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 20 }}>
        <div className="quick-view-card">
          <div className="quick-view-icon" style={{ background: '#e0f2fe', color: '#0284c7' }}>
            <FolderTree size={20} />
          </div>
          <div>
            <div className="quick-view-value">{categories.length}</div>
            <div className="quick-view-label">Total Categories</div>
          </div>
        </div>
        <div className="quick-view-card">
          <div className="quick-view-icon" style={{ background: '#e6f7f2', color: '#10b981' }}>
            <RefreshCw size={20} />
          </div>
          <div>
            <div className="quick-view-value">{filteredCategories.length}</div>
            <div className="quick-view-label">Filtered Results</div>
          </div>
        </div>
        <div className="quick-view-card">
          <div className="quick-view-icon" style={{ background: '#fef3c7', color: '#d97706' }}>
            <FolderTree size={20} />
          </div>
          <div>
            <div className="quick-view-value">
              {categories.length > 0 ? 'Active' : 'Empty'}
            </div>
            <div className="quick-view-label">Catalog Status</div>
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
              placeholder="Search category name, description…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div style={{ fontSize: 12.5, color: '#64748b' }}>
            Showing <b>{filteredCategories.length}</b> of <b>{categories.length}</b> categories
          </div>
        </div>

        {/* Data Table */}
        <DataTable
          columns={columns as never}
          data={filteredCategories as never}
          loading={loading}
          emptyMessage={
            search
              ? `No categories matching "${search}"`
              : 'No categories created yet. Click "+ Add Category" to create your first one.'
          }
        />
      </div>

      {/* Create / Edit Category Modal */}
      <Modal
        isOpen={showFormModal}
        onClose={() => !submitting && setShowFormModal(false)}
        title={editingCategory ? 'Edit Product Category' : 'Create Product Category'}
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
              form="category-form"
              className="btn-primary"
              disabled={submitting}
            >
              {submitting ? 'Saving…' : (editingCategory ? 'Update Category' : 'Create Category')}
            </button>
          </>
        }
      >
        <form id="category-form" onSubmit={handleSubmit(onSubmit)}>
          {/* Category Name */}
          <div style={{ marginBottom: 16 }}>
            <label className="form-label">
              Category Name <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Beverages, Electronics, Raw Materials"
              {...register('name', {
                required: 'Category name is required',
                minLength: { value: 2, message: 'Must be at least 2 characters' },
              })}
            />
            {errors.name && (
              <p style={{ color: '#ef4444', fontSize: 12, marginTop: 4 }}>
                {errors.name.message}
              </p>
            )}
          </div>
        </form>
      </Modal>

      {/* Category Detail Modal (GET /categories/{id}) */}
      <Modal
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        title="Category Details"
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
        {viewingCategory && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
              <div style={{
                width: 44, height: 44, borderRadius: 10,
                background: '#e0f2fe', color: '#0284c7',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <FolderTree size={22} />
              </div>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: '#163140', margin: 0 }}>
                  {viewingCategory.name}
                </h3>
                <span style={{ fontSize: 12, color: '#94a3b8' }}>
                  UUID: {viewingCategory.id}
                </span>
              </div>
            </div>

            <div style={{ background: '#f8fafc', borderRadius: 8, padding: '12px 14px', marginBottom: 14 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 4 }}>
                Status
              </div>
              <div style={{ fontSize: 13, color: '#334155', lineHeight: 1.5, display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981', display: 'inline-block' }} />
                <span>Active category in current organization</span>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div style={{ background: '#f8fafc', borderRadius: 8, padding: '10px 12px' }}>
                <div style={{ fontSize: 11, color: '#94a3b8' }}>Created At</div>
                <div style={{ fontSize: 12.5, fontWeight: 600, color: '#163140', marginTop: 2 }}>
                  {viewingCategory.createdAt ? new Date(viewingCategory.createdAt).toLocaleString() : '—'}
                </div>
              </div>
              <div style={{ background: '#f8fafc', borderRadius: 8, padding: '10px 12px' }}>
                <div style={{ fontSize: 11, color: '#94a3b8' }}>Last Updated</div>
                <div style={{ fontSize: 12.5, fontWeight: 600, color: '#163140', marginTop: 2 }}>
                  {viewingCategory.updatedAt ? new Date(viewingCategory.updatedAt).toLocaleString() : '—'}
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Professional Confirmation Modal */}
      <ConfirmModal
        isOpen={!!categoryToDelete}
        onClose={() => !deleting && setCategoryToDelete(null)}
        onConfirm={confirmDeleteCategory}
        title="Delete Product Category"
        message="Are you sure you want to permanently delete this product category? Products in this category may be affected."
        itemName={categoryToDelete?.name}
        confirmLabel="Delete Category"
        cancelLabel="Cancel"
        loading={deleting}
        danger={true}
      />
    </DashboardLayout>
  );
}
