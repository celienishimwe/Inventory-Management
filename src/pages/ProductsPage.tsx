import React, { useEffect, useState, useCallback } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import ConfirmModal from '../components/ConfirmModal';
import { Plus, Search, Edit2, Trash2, Package, RefreshCw, Tag } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import api from '../lib/api';
import { Product, Category, Unit } from '../types';

// ── Types ──────────────────────────────────────────────────────────────────────
interface ProductForm {
  name: string;
  sku?: string;
  barcode?: string;
  description?: string;
  categoryId?: string;
  unitId: string;
  costPrice?: string;
  sellingPrice: string;
  reorderLevel?: string;
}

// ── Error helpers ──────────────────────────────────────────────────────────────
function extractErrorMessage(err: any, fallback: string): string {
  if (err?.code === 'ECONNABORTED' || err?.message?.includes('timeout')) {
    return 'Backend took too long to respond. Please try again.';
  }
  if (err?.message === 'Network Error' || !err?.response) {
    return 'Unable to reach the server. Check your connection.';
  }
  const d = err?.response?.data;
  if (!d) return err?.message || fallback;
  if (Array.isArray(d.errors) && d.errors.length > 0) {
    return d.errors
      .map((e: any) => (e.field ? `${e.field}: ${e.message}` : e.message ?? JSON.stringify(e)))
      .join('; ');
  }
  if (typeof d.message === 'string' && d.message) return d.message;
  if (typeof d.error === 'string' && d.error) return d.error;
  return fallback;
}

// ── Component ──────────────────────────────────────────────────────────────────
export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [productToArchive, setProductToArchive] = useState<Product | null>(null);
  const [archiving, setArchiving] = useState(false);

  const { register, handleSubmit, reset, setError, formState: { errors } } = useForm<ProductForm>();

  // ── 1. GET /products ──────────────────────────────────────────────────────────
  // Swagger uses `pageSize` (not `limit`). Sending `limit` causes 400.
  // Empty `search=""` can also cause backend validation failures — omit when blank.
  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, any> = { page, pageSize: 20 };
      if (search.trim()) params.search = search.trim();

      const { data } = await api.get('/products', { params });
      const list: Product[] = data?.data?.data ?? data?.data ?? data ?? [];
      setProducts(Array.isArray(list) ? list : []);
    } catch (err: any) {
      toast.error(extractErrorMessage(err, 'Failed to load products'));
    } finally {
      setLoading(false);
    }
  }, [search, page]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Load categories & units (these endpoints take NO query parameters)
  useEffect(() => {
    api
      .get('/categories')
      .then(({ data }) => {
        const list = Array.isArray(data) ? data : data?.data?.data ?? data?.data ?? [];
        setCategories(Array.isArray(list) ? list : []);
      })
      .catch(() => {});

    api
      .get('/units')
      .then(({ data }) => {
        const list = Array.isArray(data) ? data : data?.data?.data ?? data?.data ?? [];
        setUnits(Array.isArray(list) ? list : []);
      })
      .catch(() => {});
  }, []);

  // ── 2. Open modals ────────────────────────────────────────────────────────────
  const openCreate = () => {
    setEditing(null);
    reset({
      name: '',
      sku: '',
      barcode: '',
      description: '',
      categoryId: '',
      unitId: units[0]?.id || '',
      costPrice: '',
      sellingPrice: '',
      reorderLevel: '0',
    });
    setShowModal(true);
  };

  const openEdit = (p: Product) => {
    setEditing(p);
    reset({
      name: p.name,
      sku: p.sku ?? '',
      barcode: p.barcode ?? '',
      description: p.description ?? '',
      categoryId: p.categoryId ?? '',
      unitId: p.unitId ?? '',
      costPrice: String(p.purchaseCost ?? p.costPrice ?? ''),
      sellingPrice: String(p.sellingPrice ?? ''),
      reorderLevel: String(p.reorderLevel ?? '0'),
    });
    setShowModal(true);
  };

  // ── 3. POST /products & PATCH /products/{id} ──────────────────────────────────
  // Backend OpenAPI Schema (ProductInput / ProductUpdate):
  //   • required: ["name", "unitId"]
  //   • additionalProperties: false (rejects unknown keys like "costPrice")
  //   • purchaseCost: DecimalMoney string (^\d{1,16}(\.\d{1,4})?$)
  //   • sellingPrice: DecimalMoney string (^\d{1,16}(\.\d{1,4})?$)
  //   • reorderLevel: string (e.g. "0" or "5.000")
  const onSubmit = async (form: ProductForm) => {
    setSubmitting(true);

    const payload: Record<string, any> = {
      name: form.name.trim(),
      unitId: form.unitId,
    };

    // Selling Price (decimal string)
    const cleanSelling = (form.sellingPrice || '').replace(/[$, ]/g, '').trim();
    if (cleanSelling) {
      payload.sellingPrice = cleanSelling;
    }

    // Purchase Cost / Cost Price (backend key is "purchaseCost", NOT "costPrice")
    const cleanCost = (form.costPrice || '').replace(/[$, ]/g, '').trim();
    if (cleanCost) {
      payload.purchaseCost = cleanCost;
    }

    // Reorder level (must be string)
    const cleanReorder = (form.reorderLevel !== undefined && form.reorderLevel !== '')
      ? String(form.reorderLevel).trim()
      : '0';
    payload.reorderLevel = cleanReorder;

    // Optional fields — only include if non-empty string to avoid UUID / format errors
    if (form.sku?.trim()) payload.sku = form.sku.trim();
    if (form.barcode?.trim()) payload.barcode = form.barcode.trim();
    if (form.description?.trim()) payload.description = form.description.trim();
    if (form.categoryId?.trim()) payload.categoryId = form.categoryId.trim();

    try {
      if (editing) {
        await api.patch(`/products/${editing.id}`, payload);
        toast.success(`Product "${payload.name}" updated successfully`);
      } else {
        await api.post('/products', payload);
        toast.success(`Product "${payload.name}" created successfully`);
      }
      setShowModal(false);
      reset();
      fetchProducts();
    } catch (err: any) {
      const msg = extractErrorMessage(err, 'Failed to save product');

      // Surface backend field errors into react-hook-form
      const fieldErrors = err?.response?.data?.errors;
      if (Array.isArray(fieldErrors)) {
        fieldErrors.forEach((fe: any) => {
          // Map backend "purchaseCost" error to the "costPrice" form input
          const targetField = fe.field === 'purchaseCost' ? 'costPrice' : fe.field;
          if (targetField) {
            setError(targetField as keyof ProductForm, { message: fe.message });
          }
        });
      }

      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  // ── 4. DELETE /products/{id} (Archive) ───────────────────────────────────────
  const confirmArchive = async () => {
    if (!productToArchive) return;
    setArchiving(true);
    try {
      await api.delete(`/products/${productToArchive.id}`);
      toast.success(`Product "${productToArchive.name}" archived successfully`);
      setProductToArchive(null);
      fetchProducts();
    } catch (err: any) {
      toast.error(extractErrorMessage(err, 'Failed to archive product'));
    } finally {
      setArchiving(false);
    }
  };

  // ── Table columns ─────────────────────────────────────────────────────────────
  const columns = [
    {
      key: 'name',
      header: 'Product',
      render: (r: Product) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 8,
            background: '#ede9fe', color: '#7c3aed',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <Package size={17} />
          </div>
          <div>
            <div style={{ fontWeight: 600, color: '#163140' }}>{r.name}</div>
            <div style={{ fontSize: 11, color: '#94a3b8' }}>SKU: {r.sku || '—'}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'category',
      header: 'Category',
      render: (r: Product) => (
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: 4,
          padding: '2px 8px', borderRadius: 6,
          background: '#f1f5f9', color: '#475569', fontSize: 12, fontWeight: 500,
        }}>
          <Tag size={11} />
          {r.category?.name ?? '—'}
        </span>
      ),
    },
    {
      key: 'sellingPrice',
      header: 'Sell Price',
      render: (r: Product) => (
        <span style={{ fontWeight: 700, color: '#059669' }}>
          ${parseFloat(String(r.sellingPrice || 0)).toFixed(2)}
        </span>
      ),
    },
    {
      key: 'costPrice',
      header: 'Cost Price',
      render: (r: Product) => (
        <span style={{ color: '#64748b' }}>
          ${parseFloat(String(r.purchaseCost ?? r.costPrice ?? 0)).toFixed(2)}
        </span>
      ),
    },
    {
      key: 'reorderLevel',
      header: 'Reorder Lvl',
      render: (r: Product) => (
        <span style={{ fontSize: 13, color: '#334155' }}>{r.reorderLevel ?? 0}</span>
      ),
    },
    {
      key: 'isActive',
      header: 'Status',
      render: (r: Product) => (
        <span className={`badge ${r.isActive ? 'badge-success' : 'badge-danger'}`}>
          {r.isActive ? 'Active' : 'Archived'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: '',
      width: '100px',
      render: (r: Product) => (
        <div style={{ display: 'flex', gap: 6 }}>
          <button
            className="topbar-icon-btn"
            style={{ width: 30, height: 30, borderRadius: 6 }}
            onClick={(e) => { e.stopPropagation(); openEdit(r); }}
            title="Edit"
          >
            <Edit2 size={14} color="#0284c7" />
          </button>
          <button
            className="topbar-icon-btn"
            style={{ width: 30, height: 30, borderRadius: 6 }}
            onClick={(e) => { e.stopPropagation(); setProductToArchive(r); }}
            title="Archive"
          >
            <Trash2 size={14} color="#ef4444" />
          </button>
        </div>
      ),
    },
  ];

  // ── Render ─────────────────────────────────────────────────────────────────────
  return (
    <DashboardLayout title="Products">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <div className="page-title">Products</div>
          <div className="page-subtitle">Manage your product catalog</div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            className="btn-secondary"
            onClick={fetchProducts}
            disabled={loading}
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <RefreshCw size={15} />
            Refresh
          </button>
          <button className="btn-primary" onClick={openCreate}>
            <Plus size={16} /> Add Product
          </button>
        </div>
      </div>

      {/* Quick stats */}
      <div
        className="quick-view-row"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 16,
          marginBottom: 20,
        }}
      >
        <div className="quick-view-card">
          <div className="quick-view-icon" style={{ background: '#ede9fe', color: '#7c3aed' }}>
            <Package size={20} />
          </div>
          <div>
            <div className="quick-view-value">{products.length}</div>
            <div className="quick-view-label">Total Products</div>
          </div>
        </div>
        <div className="quick-view-card">
          <div className="quick-view-icon" style={{ background: '#dcfce7', color: '#16a34a' }}>
            <Package size={20} />
          </div>
          <div>
            <div className="quick-view-value">{products.filter(p => p.isActive).length}</div>
            <div className="quick-view-label">Active</div>
          </div>
        </div>
        <div className="quick-view-card">
          <div className="quick-view-icon" style={{ background: '#fef9c3', color: '#ca8a04' }}>
            <Tag size={20} />
          </div>
          <div>
            <div className="quick-view-value">{categories.length}</div>
            <div className="quick-view-label">Categories</div>
          </div>
        </div>
        <div className="quick-view-card">
          <div className="quick-view-icon" style={{ background: '#fee2e2', color: '#dc2626' }}>
            <Package size={20} />
          </div>
          <div>
            <div className="quick-view-value">
              {products.filter(p => p.isActive === false).length}
            </div>
            <div className="quick-view-label">Archived</div>
          </div>
        </div>
      </div>

      {/* Table card */}
      <div className="card">
        {/* Toolbar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div style={{ position: 'relative', width: 300 }}>
            <Search
              size={15}
              style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}
            />
            <input
              type="text"
              className="form-input"
              style={{ paddingLeft: 36, height: 36, fontSize: 13 }}
              placeholder="Search by name, SKU…"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            />
          </div>
          <div style={{ fontSize: 12.5, color: '#64748b' }}>
            Showing <b>{products.length}</b> products — Page <b>{page}</b>
          </div>
        </div>

        <DataTable
          columns={columns as never}
          data={products as never}
          loading={loading}
          emptyMessage={
            search
              ? `No products matching "${search}"`
              : 'No products yet. Click "+ Add Product" to create one.'
          }
        />

        {/* Pagination */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12, gap: 8 }}>
          {page > 1 && (
            <button className="btn-secondary" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={loading}>
              ← Previous
            </button>
          )}
          {products.length === 20 && (
            <button className="btn-secondary" onClick={() => setPage(p => p + 1)} disabled={loading}>
              Next →
            </button>
          )}
        </div>
      </div>

      {/* Create / Edit Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => !submitting && setShowModal(false)}
        title={editing ? 'Edit Product' : 'Create Product'}
        size="md"
        footer={
          <>
            <button
              type="button"
              className="btn-secondary"
              disabled={submitting}
              onClick={() => setShowModal(false)}
            >
              Cancel
            </button>
            <button
              type="submit"
              form="product-form"
              className="btn-primary"
              disabled={submitting}
            >
              {submitting ? 'Saving…' : editing ? 'Update Product' : 'Create Product'}
            </button>
          </>
        }
      >
        <form id="product-form" onSubmit={handleSubmit(onSubmit)}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>

            {/* Product Name — full width */}
            <div style={{ gridColumn: '1/-1' }}>
              <label className="form-label">
                Product Name <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Organic Brown Rice"
                {...register('name', { required: 'Product name is required' })}
              />
              {errors.name && <p style={{ color: '#ef4444', fontSize: 12, marginTop: 3 }}>{errors.name.message}</p>}
            </div>

            {/* SKU */}
            <div>
              <label className="form-label">
                SKU
                <span style={{ fontSize: 11, color: '#94a3b8', fontWeight: 400, marginLeft: 6 }}>(auto-generated if blank)</span>
              </label>
              <input type="text" className="form-input" placeholder="AUTO-SKU" {...register('sku')} />
            </div>

            {/* Barcode */}
            <div>
              <label className="form-label">Barcode</label>
              <input type="text" className="form-input" placeholder="e.g. 1234567890128" {...register('barcode')} />
            </div>

            {/* Category */}
            <div>
              <label className="form-label">Category</label>
              <select className="form-input" {...register('categoryId')}>
                <option value="">— Select category —</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>

            {/* Unit */}
            <div>
              <label className="form-label">
                Unit of Measure <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <select
                className="form-input"
                {...register('unitId', { required: 'Unit of measure is required' })}
              >
                <option value="">— Select unit —</option>
                {units.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.symbol || u.abbreviation || '—'})
                  </option>
                ))}
              </select>
              {errors.unitId && <p style={{ color: '#ef4444', fontSize: 12, marginTop: 3 }}>{errors.unitId.message}</p>}
            </div>

            {/* Cost Price */}
            <div>
              <label className="form-label">
                Cost Price
                <span style={{ fontSize: 11, color: '#94a3b8', fontWeight: 400, marginLeft: 6 }}>(purchase cost)</span>
              </label>
              <input
                type="text"
                inputMode="decimal"
                className="form-input"
                placeholder="e.g. 10000"
                {...register('costPrice', {
                  pattern: {
                    value: /^\d+(\.\d{1,4})?$/,
                    message: 'Enter a valid decimal (e.g. 10000 or 10000.00)',
                  },
                })}
              />
              {errors.costPrice && <p style={{ color: '#ef4444', fontSize: 12, marginTop: 3 }}>{errors.costPrice.message}</p>}
            </div>

            {/* Selling Price */}
            <div>
              <label className="form-label">
                Selling Price <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                type="text"
                inputMode="decimal"
                className="form-input"
                placeholder="e.g. 15000"
                {...register('sellingPrice', {
                  required: 'Selling price is required',
                  pattern: {
                    value: /^\d+(\.\d{1,4})?$/,
                    message: 'Enter a valid decimal (e.g. 15000 or 15000.00)',
                  },
                })}
              />
              {errors.sellingPrice && <p style={{ color: '#ef4444', fontSize: 12, marginTop: 3 }}>{errors.sellingPrice.message}</p>}
            </div>

            {/* Reorder Level */}
            <div>
              <label className="form-label">
                Reorder Level
                <span style={{ fontSize: 11, color: '#94a3b8', fontWeight: 400, marginLeft: 6 }}>(min. stock qty)</span>
              </label>
              <input
                type="text"
                inputMode="numeric"
                className="form-input"
                placeholder="e.g. 5"
                {...register('reorderLevel')}
              />
            </div>

            {/* Description */}
            <div style={{ gridColumn: '1/-1' }}>
              <label className="form-label">Description</label>
              <textarea
                className="form-input" rows={2}
                placeholder="Optional product description…"
                {...register('description')}
              />
            </div>

          </div>
        </form>
      </Modal>

      {/* Archive Confirmation Modal */}
      <ConfirmModal
        isOpen={!!productToArchive}
        onClose={() => !archiving && setProductToArchive(null)}
        onConfirm={confirmArchive}
        title="Archive Product"
        message="Are you sure you want to archive this product? Historical data is preserved but it will no longer appear in active orders."
        itemName={productToArchive?.name}
        confirmLabel="Archive Product"
        cancelLabel="Cancel"
        loading={archiving}
        danger={true}
      />
    </DashboardLayout>
  );
}

