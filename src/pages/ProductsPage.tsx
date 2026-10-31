import React, { useEffect, useState, useCallback } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import { Plus, Search, Edit2, Trash2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import api from '../lib/api';
import { Product, Category, Unit } from '../types';

interface ProductForm {
  name: string;
  sku?: string;
  barcode?: string;
  description?: string;
  categoryId?: string;
  unitId?: string;
  costPrice: string;
  sellingPrice: string;
  reorderLevel: number;
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [page, setPage] = useState(1);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<ProductForm>();

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/products', { params: { search, page, limit: 20 } });
      setProducts(data.data?.data ?? data.data ?? data ?? []);
    } catch { toast.error('Failed to load products'); }
    finally { setLoading(false); }
  }, [search, page]);

  useEffect(() => {
    fetchProducts();
    api.get('/categories').then(({ data }) => setCategories(data.data?.data ?? data.data ?? [])).catch(() => {});
    api.get('/units').then(({ data }) => setUnits(data.data?.data ?? data.data ?? [])).catch(() => {});
  }, [fetchProducts]);

  const openCreate = () => { setEditing(null); reset({}); setShowModal(true); };
  const openEdit = (p: Product) => {
    setEditing(p);
    reset({ name: p.name, sku: p.sku, barcode: p.barcode, description: p.description, categoryId: p.categoryId, unitId: p.unitId, costPrice: p.costPrice, sellingPrice: p.sellingPrice, reorderLevel: p.reorderLevel });
    setShowModal(true);
  };

  const onSubmit = async (form: ProductForm) => {
    try {
      if (editing) {
        await api.patch(`/products/${editing.id}`, form);
        toast.success('Product updated');
      } else {
        await api.post('/products', form);
        toast.success('Product created');
      }
      setShowModal(false);
      fetchProducts();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg ?? 'Failed to save product');
    }
  };

  const handleDelete = async (p: Product) => {
    if (!confirm(`Archive product "${p.name}"?`)) return;
    try {
      await api.delete(`/products/${p.id}`);
      toast.success('Product archived');
      fetchProducts();
    } catch { toast.error('Failed to archive'); }
  };

  const columns = [
    { key: 'sku', header: 'SKU', width: '110px' },
    { key: 'name', header: 'Name' },
    { key: 'category', header: 'Category', render: (r: Product) => r.category?.name ?? '—' },
    { key: 'sellingPrice', header: 'Sell Price', render: (r: Product) => `$${r.sellingPrice}` },
    { key: 'costPrice', header: 'Cost Price', render: (r: Product) => `$${r.costPrice}` },
    { key: 'reorderLevel', header: 'Reorder Lvl' },
    {
      key: 'isActive', header: 'Status',
      render: (r: Product) => (
        <span className={`badge ${r.isActive ? 'badge-success' : 'badge-danger'}`}>
          {r.isActive ? 'Active' : 'Archived'}
        </span>
      ),
    },
    {
      key: 'actions', header: '',
      render: (r: Product) => (
        <div style={{ display: 'flex', gap: 6 }}>
          <button className="btn-primary btn-sm" onClick={(e) => { e.stopPropagation(); openEdit(r); }}>
            <Edit2 size={13} />
          </button>
          <button className="btn-danger btn-sm" onClick={(e) => { e.stopPropagation(); handleDelete(r); }}>
            <Trash2 size={13} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <DashboardLayout title="Products">
      <div className="page-header">
        <div>
          <div className="page-title">Products</div>
          <div className="page-subtitle">Manage your product catalog</div>
        </div>
        <button className="btn-primary" onClick={openCreate}><Plus size={16} /> Add Product</button>
      </div>

      <div className="card">
        <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
          <div className="search-bar" style={{ flex: 1 }}>
            <Search size={15} color="#94a3b8" />
            <input placeholder="Search products…" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
          </div>
        </div>
        <DataTable columns={columns as never} data={products as never} loading={loading} emptyMessage="No products found" />
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editing ? 'Edit Product' : 'Create Product'}
        footer={
          <>
            <button className="btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
            <button className="btn-primary" form="product-form" type="submit">Save</button>
          </>
        }>
        <form id="product-form" onSubmit={handleSubmit(onSubmit)}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div style={{ gridColumn: '1/-1' }}>
              <label className="form-label">Product Name *</label>
              <input className="form-input" {...register('name', { required: 'Required' })} />
              {errors.name && <p style={{ color: '#ef4444', fontSize: 12, marginTop: 3 }}>{errors.name.message}</p>}
            </div>
            <div>
              <label className="form-label">SKU (auto if blank)</label>
              <input className="form-input" placeholder="AUTO-SKU" {...register('sku')} />
            </div>
            <div>
              <label className="form-label">Barcode</label>
              <input className="form-input" {...register('barcode')} />
            </div>
            <div>
              <label className="form-label">Category</label>
              <select className="form-input" {...register('categoryId')}>
                <option value="">Select category</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="form-label">Unit</label>
              <select className="form-input" {...register('unitId')}>
                <option value="">Select unit</option>
                {units.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
            </div>
            <div>
              <label className="form-label">Cost Price *</label>
              <input className="form-input" placeholder="0.00" {...register('costPrice', { required: 'Required' })} />
            </div>
            <div>
              <label className="form-label">Selling Price *</label>
              <input className="form-input" placeholder="0.00" {...register('sellingPrice', { required: 'Required' })} />
            </div>
            <div>
              <label className="form-label">Reorder Level</label>
              <input type="number" className="form-input" defaultValue={0} {...register('reorderLevel')} />
            </div>
            <div style={{ gridColumn: '1/-1' }}>
              <label className="form-label">Description</label>
              <textarea className="form-input" rows={2} {...register('description')} />
            </div>
          </div>
        </form>
      </Modal>
    </DashboardLayout>
  );
}
