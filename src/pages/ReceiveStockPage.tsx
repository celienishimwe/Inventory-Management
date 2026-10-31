import React, { useState, useEffect } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import Modal from '../components/Modal';
import { Plus, PackageCheck, Send, SlidersHorizontal } from 'lucide-react';
import { useForm, useFieldArray } from 'react-hook-form';
import { toast } from 'react-toastify';
import api from '../lib/api';

interface InventoryActionForm {
  warehouseId: string;
  locationId?: string;
  reference?: string;
  reason?: string;
  lines: { productId: string; quantity: string; unitCost?: string }[];
}

export default function ReceiveStockPage() {
  const [activeTab, setActiveTab] = useState<'RECEIVE' | 'ISSUE' | 'IMMEDIATE_ADJ'>('RECEIVE');
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);

  const { register, handleSubmit, reset, control } = useForm<InventoryActionForm>({
    defaultValues: { lines: [{ productId: '', quantity: '', unitCost: '' }] },
  });
  const { fields, append, remove } = useFieldArray({ control, name: 'lines' });

  useEffect(() => {
    api.get('/warehouses').then(r => setWarehouses(r.data?.data?.data ?? r.data?.data ?? r.data ?? [])).catch(() => {});
    api.get('/products', { params: { limit: 100 } }).then(r => setProducts(r.data?.data?.data ?? r.data?.data ?? r.data ?? [])).catch(() => {});
  }, []);

  const onSubmit = async (form: InventoryActionForm) => {
    try {
      if (activeTab === 'RECEIVE') {
        await api.post('/inventory/receive', form);
        toast.success('Stock received and inventory weighted-average cost updated');
      } else if (activeTab === 'ISSUE') {
        await api.post('/inventory/issue', form);
        toast.success('Stock issued successfully');
      } else {
        await api.post('/inventory/adjustments', form);
        toast.success('Immediate reasoned stock adjustment applied');
      }
      setShowModal(false);
      reset();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg ?? 'Operation failed');
    }
  };

  const openAction = (tab: 'RECEIVE' | 'ISSUE' | 'IMMEDIATE_ADJ') => {
    setActiveTab(tab);
    reset({ warehouseId: '', reference: '', reason: '', lines: [{ productId: '', quantity: '', unitCost: '' }] });
    setShowModal(true);
  };

  return (
    <DashboardLayout title="Inventory Operations">
      <div className="page-header">
        <div>
          <h1 className="page-title">Stock Movements & Operations</h1>
          <p className="page-subtitle">Atomically receive stock, issue inventory, or post immediate stock adjustments</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
        {/* Receive Stock Card */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{
              width: 48, height: 48, borderRadius: 12, background: '#e0f7f6', color: '#0f766e',
              display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14,
            }}>
              <PackageCheck size={24} />
            </div>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: '#163140', marginBottom: 6 }}>Receive Stock</h3>
            <p style={{ fontSize: 13, color: '#64748b', lineHeight: 1.5, marginBottom: 20 }}>
              Receive stock atomically into warehouse inventory and automatically update the weighted-average cost per unit.
            </p>
          </div>
          <button className="btn-primary" onClick={() => openAction('RECEIVE')}>
            <Plus size={15} /> Receive Stock
          </button>
        </div>

        {/* Issue Stock Card */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{
              width: 48, height: 48, borderRadius: 12, background: '#e0f2fe', color: '#0369a1',
              display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14,
            }}>
              <Send size={24} />
            </div>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: '#163140', marginBottom: 6 }}>Issue Stock</h3>
            <p style={{ fontSize: 13, color: '#64748b', lineHeight: 1.5, marginBottom: 20 }}>
              Issue available stock from a warehouse location without reducing inventory below confirmed reserved quantities.
            </p>
          </div>
          <button className="btn-secondary" onClick={() => openAction('ISSUE')}>
            <Send size={15} /> Issue Stock
          </button>
        </div>

        {/* Immediate Adjustment Card */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{
              width: 48, height: 48, borderRadius: 12, background: '#fef3c7', color: '#b45309',
              display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14,
            }}>
              <SlidersHorizontal size={24} />
            </div>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: '#163140', marginBottom: 6 }}>Immediate Adjustment</h3>
            <p style={{ fontSize: 13, color: '#64748b', lineHeight: 1.5, marginBottom: 20 }}>
              Post an immediate reasoned stock adjustment directly to balances and immutable ledger for authorized managers.
            </p>
          </div>
          <button className="btn-secondary" onClick={() => openAction('IMMEDIATE_ADJ')}>
            <SlidersHorizontal size={15} /> Post Adjustment
          </button>
        </div>
      </div>

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={
          activeTab === 'RECEIVE' ? 'Receive Stock Atomically' :
          activeTab === 'ISSUE' ? 'Issue Available Stock' : 'Immediate Stock Adjustment'
        }
        size="lg"
        footer={
          <>
            <button className="btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
            <button className="btn-primary" form="inv-action-form" type="submit">Submit</button>
          </>
        }
      >
        <form id="inv-action-form" onSubmit={handleSubmit(onSubmit)}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 16 }}>
            <div>
              <label className="form-label">Warehouse *</label>
              <select className="form-input" {...register('warehouseId', { required: 'Required' })}>
                <option value="">Select warehouse</option>
                {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
              </select>
            </div>
            <div>
              <label className="form-label">Reference Number</label>
              <input className="form-input" placeholder="e.g. GR-2024-001 or PO Ref" {...register('reference')} />
            </div>
            {activeTab === 'IMMEDIATE_ADJ' && (
              <div style={{ gridColumn: '1/-1' }}>
                <label className="form-label">Reason *</label>
                <input className="form-input" placeholder="Reason for inventory correction" {...register('reason', { required: true })} />
              </div>
            )}
          </div>

          <div style={{ marginBottom: 10, fontWeight: 700, fontSize: 13 }}>Items</div>
          {fields.map((field, i) => (
            <div key={field.id} style={{ display: 'grid', gridTemplateColumns: activeTab === 'RECEIVE' ? '1fr 100px 110px 40px' : '1fr 110px 40px', gap: 8, marginBottom: 8 }}>
              <select className="form-input" {...register(`lines.${i}.productId`, { required: true })}>
                <option value="">Select Product</option>
                {products.map(p => <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>)}
              </select>
              <input className="form-input" placeholder="Quantity" {...register(`lines.${i}.quantity`, { required: true })} />
              {activeTab === 'RECEIVE' && (
                <input className="form-input" placeholder="Unit cost" {...register(`lines.${i}.unitCost`, { required: true })} />
              )}
              <button type="button" className="btn-danger btn-sm" onClick={() => remove(i)}>✕</button>
            </div>
          ))}
          <button type="button" className="btn-secondary btn-sm" onClick={() => append({ productId: '', quantity: '', unitCost: '' })}>
            <Plus size={13} /> Add Product Line
          </button>
        </form>
      </Modal>
    </DashboardLayout>
  );
}
