import React, { useEffect, useState, useCallback } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import {
  Plus,
  Search,
  Edit2,
  Eye,
  RefreshCw,
  Users,
  Mail,
  Phone,
  MapPin,
  FileText,
  CreditCard,
  Receipt,
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import api from '../lib/api';
import { Customer, SalesOrder } from '../types';

// ── Types ──────────────────────────────────────────────────────────────────────
interface CustomerForm {
  code: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  country?: string;
  taxId?: string;
  notes?: string;
  contactName?: string;
  paymentTerms?: string;
}

// ── Error Helper ───────────────────────────────────────────────────────────────
function extractErrorMessage(err: any, fallback: string): string {
  if (err?.code === 'ECONNABORTED' || err?.message?.includes('timeout')) {
    return 'Backend took too long to respond. Please try again.';
  }
  if (err?.message === 'Network Error' || !err?.response) {
    return 'Unable to reach the server. Please check your connection.';
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

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);

  // Modals
  const [showFormModal, setShowFormModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [viewingCustomer, setViewingCustomer] = useState<Customer | null>(null);

  // Sales history for viewing modal (GET /customers/{id}/sales)
  const [sales, setSales] = useState<SalesOrder[]>([]);
  const [loadingSales, setLoadingSales] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<CustomerForm>();

  // ── 1. GET /customers ────────────────────────────────────────────────────────
  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, any> = { page, pageSize };
      if (search.trim()) params.search = search.trim();

      const res = await api.get('/customers', { params });
      const payload = res.data;
      const list: Customer[] =
        payload?.data?.data ?? payload?.data ?? (Array.isArray(payload) ? payload : []);
      setCustomers(Array.isArray(list) ? list : []);
    } catch (err: any) {
      toast.error(extractErrorMessage(err, 'Failed to load customers'));
    } finally {
      setLoading(false);
    }
  }, [search, page, pageSize]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  // ── 2. GET /customers/{id} & GET /customers/{id}/sales ───────────────────────
  const openViewDetails = async (c: Customer) => {
    setViewingCustomer(c);
    setSales([]);
    setShowDetailModal(true);
    setLoadingSales(true);

    try {
      // Fetch fresh details
      const detailRes = await api.get(`/customers/${c.id}`);
      const freshData = detailRes.data?.data ?? detailRes.data;
      if (freshData && freshData.id) {
        setViewingCustomer(freshData);
      }
    } catch (err) {
      console.warn('Could not fetch latest customer details:', err);
    }

    try {
      // Fetch sales history
      const salesRes = await api.get(`/customers/${c.id}/sales`);
      const salesList =
        salesRes.data?.data?.data ??
        salesRes.data?.data ??
        (Array.isArray(salesRes.data) ? salesRes.data : []);
      setSales(Array.isArray(salesList) ? salesList : []);
    } catch (err) {
      console.warn('Could not fetch customer sales history:', err);
    } finally {
      setLoadingSales(false);
    }
  };

  // ── 3. Open Create & Edit Modals ─────────────────────────────────────────────
  const openCreate = () => {
    setEditingCustomer(null);
    reset({
      code: `CUST-${String(customers.length + 1).padStart(3, '0')}`,
      name: '',
      contactName: '',
      email: '',
      phone: '',
      country: 'Rwanda',
      taxId: '',
      paymentTerms: 'Immediate',
      address: '',
      notes: '',
    });
    setShowFormModal(true);
  };

  const openEdit = async (c: Customer) => {
    setEditingCustomer(c);
    reset({
      code: c.code || '',
      name: c.name || '',
      contactName: c.contactName ?? c.contactPerson ?? '',
      email: c.email ?? '',
      phone: c.phone ?? '',
      country: c.country || 'Rwanda',
      taxId: c.taxId ?? '',
      paymentTerms: c.paymentTerms ?? '',
      address: c.address ?? '',
      notes: c.notes ?? '',
    });
    setShowFormModal(true);

    try {
      const res = await api.get(`/customers/${c.id}`);
      const fresh = res.data?.data ?? res.data;
      if (fresh) {
        reset({
          code: fresh.code || c.code || '',
          name: fresh.name || c.name || '',
          contactName: fresh.contactName ?? fresh.contactPerson ?? c.contactName ?? '',
          email: fresh.email ?? c.email ?? '',
          phone: fresh.phone ?? c.phone ?? '',
          country: fresh.country || c.country || 'Rwanda',
          taxId: fresh.taxId ?? c.taxId ?? '',
          paymentTerms: fresh.paymentTerms ?? c.paymentTerms ?? '',
          address: fresh.address ?? c.address ?? '',
          notes: fresh.notes ?? c.notes ?? '',
        });
      }
    } catch {
      // Ignore background fetch failure, c is already loaded
    }
  };

  // ── 4. POST /customers & PATCH /customers/{id} ──────────────────────────────
  // Backend OpenAPI Schema (CounterpartyInput / CounterpartyUpdate):
  //   • required: ["code", "name"]
  //   • additionalProperties: false (do not send extra keys)
  const onSubmit = async (form: CustomerForm) => {
    setSubmitting(true);

    const payload: Record<string, any> = {
      code: form.code.trim(),
      name: form.name.trim(),
    };

    if (form.email?.trim()) payload.email = form.email.trim();
    if (form.phone?.trim()) payload.phone = form.phone.trim();
    if (form.address?.trim()) payload.address = form.address.trim();
    if (form.country?.trim()) payload.country = form.country.trim();
    if (form.taxId?.trim()) payload.taxId = form.taxId.trim();
    if (form.notes?.trim()) payload.notes = form.notes.trim();
    if (form.contactName?.trim()) payload.contactName = form.contactName.trim();
    if (form.paymentTerms?.trim()) payload.paymentTerms = form.paymentTerms.trim();

    try {
      if (editingCustomer) {
        await api.patch(`/customers/${editingCustomer.id}`, payload);
        toast.success(`Customer "${payload.name}" updated successfully`);
      } else {
        await api.post('/customers', payload);
        toast.success(`Customer "${payload.name}" created successfully`);
      }
      setShowFormModal(false);
      reset();
      fetchCustomers();
    } catch (err: any) {
      const msg = extractErrorMessage(err, 'Failed to save customer');

      // Surface backend field errors
      const fieldErrors = err?.response?.data?.errors;
      if (Array.isArray(fieldErrors)) {
        fieldErrors.forEach((fe: any) => {
          if (fe.field) {
            setError(fe.field as keyof CustomerForm, { message: fe.message });
          }
        });
      }

      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  // ── Table Columns ──────────────────────────────────────────────────────────
  const columns = [
    {
      key: 'name',
      header: 'Customer',
      render: (r: Customer) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 8,
              background: '#e0f7f6',
              color: '#0d9488',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Users size={18} />
          </div>
          <div>
            <div style={{ fontWeight: 600, color: '#163140' }}>{r.name}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
              <span
                style={{
                  fontSize: 10.5,
                  padding: '1px 6px',
                  borderRadius: 4,
                  background: '#f1f5f9',
                  color: '#475569',
                  fontWeight: 600,
                }}
              >
                {r.code || 'NO-CODE'}
              </span>
              <span style={{ fontSize: 11, color: '#94a3b8' }}>
                {r.country || 'Rwanda'}
              </span>
            </div>
          </div>
        </div>
      ),
    },
    {
      key: 'contactName',
      header: 'Contact Person',
      render: (r: Customer) => (
        <span style={{ fontSize: 13, color: '#334155', fontWeight: 500 }}>
          {r.contactName || r.contactPerson || '—'}
        </span>
      ),
    },
    {
      key: 'contactInfo',
      header: 'Email & Phone',
      render: (r: Customer) => (
        <div style={{ fontSize: 12, display: 'flex', flexDirection: 'column', gap: 2 }}>
          {r.email ? (
            <span style={{ color: '#0284c7', display: 'flex', alignItems: 'center', gap: 4 }}>
              <Mail size={12} /> {r.email}
            </span>
          ) : (
            <span style={{ color: '#94a3b8' }}>No email</span>
          )}
          {r.phone && (
            <span style={{ color: '#64748b', display: 'flex', alignItems: 'center', gap: 4 }}>
              <Phone size={12} /> {r.phone}
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'taxId',
      header: 'Tax ID / TIN',
      render: (r: Customer) => (
        <span style={{ fontSize: 12.5, color: '#475569' }}>
          {r.taxId ? (
            <code style={{ background: '#f8fafc', padding: '2px 6px', borderRadius: 4 }}>
              {r.taxId}
            </code>
          ) : (
            '—'
          )}
        </span>
      ),
    },
    {
      key: 'paymentTerms',
      header: 'Payment Terms',
      render: (r: Customer) => (
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            padding: '2px 8px',
            borderRadius: 6,
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            color: '#334155',
            fontSize: 11.5,
            fontWeight: 500,
          }}
        >
          <CreditCard size={11} color="#64748b" />
          {r.paymentTerms || 'Standard'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: '',
      width: '100px',
      render: (r: Customer) => (
        <div style={{ display: 'flex', gap: 6 }}>
          <button
            className="topbar-icon-btn"
            style={{ width: 30, height: 30, borderRadius: 6 }}
            onClick={(e) => {
              e.stopPropagation();
              openViewDetails(r);
            }}
            title="View Details & Sales History"
          >
            <Eye size={14} color="#0d9488" />
          </button>
          <button
            className="topbar-icon-btn"
            style={{ width: 30, height: 30, borderRadius: 6 }}
            onClick={(e) => {
              e.stopPropagation();
              openEdit(r);
            }}
            title="Edit Customer"
          >
            <Edit2 size={14} color="#0284c7" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <DashboardLayout title="Customers">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <div className="page-title">Customers</div>
          <div className="page-subtitle">Manage client accounts, credit terms, and order history</div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            className="btn-secondary"
            onClick={fetchCustomers}
            disabled={loading}
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <RefreshCw size={15} />
            Refresh
          </button>
          <button className="btn-primary" onClick={openCreate}>
            <Plus size={16} /> Add Customer
          </button>
        </div>
      </div>

      {/* Quick Stats Cards in Columns */}
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
          <div className="quick-view-icon" style={{ background: '#e0f7f6', color: '#0d9488' }}>
            <Users size={20} />
          </div>
          <div>
            <div className="quick-view-value">{customers.length}</div>
            <div className="quick-view-label">Total Customers</div>
          </div>
        </div>

        <div className="quick-view-card">
          <div className="quick-view-icon" style={{ background: '#dcfce7', color: '#16a34a' }}>
            <Phone size={20} />
          </div>
          <div>
            <div className="quick-view-value">
              {customers.filter((c) => c.phone || c.email).length}
            </div>
            <div className="quick-view-label">With Direct Contact</div>
          </div>
        </div>

        <div className="quick-view-card">
          <div className="quick-view-icon" style={{ background: '#fef9c3', color: '#ca8a04' }}>
            <MapPin size={20} />
          </div>
          <div>
            <div className="quick-view-value">
              {customers.filter((c) => (c.country || 'Rwanda').toLowerCase() === 'rwanda').length}
            </div>
            <div className="quick-view-label">Domestic (Rwanda)</div>
          </div>
        </div>

        <div className="quick-view-card">
          <div className="quick-view-icon" style={{ background: '#ede9fe', color: '#7c3aed' }}>
            <FileText size={20} />
          </div>
          <div>
            <div className="quick-view-value">
              {customers.filter((c) => c.taxId).length}
            </div>
            <div className="quick-view-label">Registered Tax IDs</div>
          </div>
        </div>
      </div>

      {/* Main Table Card */}
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
              placeholder="Search customer name or code…"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </div>
          <div style={{ fontSize: 12.5, color: '#64748b' }}>
            Showing <b>{customers.length}</b> customers — Page <b>{page}</b>
          </div>
        </div>

        <DataTable
          columns={columns as never}
          data={customers as never}
          loading={loading}
          emptyMessage={
            search
              ? `No customers matching "${search}"`
              : 'No customers registered yet. Click "+ Add Customer" to create one.'
          }
        />

        {/* Pagination */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12, gap: 8 }}>
          {page > 1 && (
            <button
              className="btn-secondary"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={loading}
            >
              ← Previous
            </button>
          )}
          {customers.length === pageSize && (
            <button
              className="btn-secondary"
              onClick={() => setPage((p) => p + 1)}
              disabled={loading}
            >
              Next →
            </button>
          )}
        </div>
      </div>

      {/* Create / Edit Customer Modal */}
      <Modal
        isOpen={showFormModal}
        onClose={() => !submitting && setShowFormModal(false)}
        title={editingCustomer ? 'Edit Customer' : 'Add Customer'}
        size="md"
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
              form="customer-form"
              className="btn-primary"
              disabled={submitting}
            >
              {submitting
                ? 'Saving…'
                : editingCustomer
                ? 'Update Customer'
                : 'Create Customer'}
            </button>
          </>
        }
      >
        <form id="customer-form" onSubmit={handleSubmit(onSubmit)}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            {/* Code */}
            <div>
              <label className="form-label">
                Customer Code <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. CUST-001"
                {...register('code', {
                  required: 'Customer code is required',
                  maxLength: { value: 40, message: 'Max 40 characters' },
                })}
              />
              {errors.code && (
                <p style={{ color: '#ef4444', fontSize: 12, marginTop: 3 }}>
                  {errors.code.message}
                </p>
              )}
            </div>

            {/* Name */}
            <div>
              <label className="form-label">
                Customer / Business Name <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Kigali Fresh Market Ltd"
                {...register('name', {
                  required: 'Customer name is required',
                  maxLength: { value: 160, message: 'Max 160 characters' },
                })}
              />
              {errors.name && (
                <p style={{ color: '#ef4444', fontSize: 12, marginTop: 3 }}>
                  {errors.name.message}
                </p>
              )}
            </div>

            {/* Contact Person */}
            <div>
              <label className="form-label">Contact Person</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Sarah Uwase"
                {...register('contactName')}
              />
            </div>

            {/* Email */}
            <div>
              <label className="form-label">Email Address</label>
              <input
                type="email"
                className="form-input"
                placeholder="procurement@client.com"
                {...register('email')}
              />
            </div>

            {/* Phone */}
            <div>
              <label className="form-label">Phone Number</label>
              <input
                type="text"
                className="form-input"
                placeholder="+250 788 654 321"
                {...register('phone')}
              />
            </div>

            {/* Country */}
            <div>
              <label className="form-label">Country</label>
              <input
                type="text"
                className="form-input"
                defaultValue="Rwanda"
                placeholder="Rwanda"
                {...register('country')}
              />
            </div>

            {/* Tax ID / TIN */}
            <div>
              <label className="form-label">Tax ID / TIN</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. 100987654"
                {...register('taxId')}
              />
            </div>

            {/* Payment Terms */}
            <div>
              <label className="form-label">Payment Terms</label>
              <select className="form-input" {...register('paymentTerms')}>
                <option value="Immediate">Immediate / Cash</option>
                <option value="Net 15">Net 15</option>
                <option value="Net 30">Net 30</option>
                <option value="Net 60">Net 60</option>
                <option value="Cash on Delivery">Cash on Delivery (COD)</option>
              </select>
            </div>

            {/* Address */}
            <div style={{ gridColumn: '1/-1' }}>
              <label className="form-label">Delivery / Billing Address</label>
              <textarea
                className="form-input"
                rows={2}
                placeholder="Street address, building, city…"
                {...register('address')}
              />
            </div>

            {/* Notes */}
            <div style={{ gridColumn: '1/-1' }}>
              <label className="form-label">Notes</label>
              <textarea
                className="form-input"
                rows={2}
                placeholder="Delivery instructions, customer preferences…"
                {...register('notes')}
              />
            </div>
          </div>
        </form>
      </Modal>

      {/* View Customer Details & Sales History Modal */}
      <Modal
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        title={viewingCustomer ? `Customer: ${viewingCustomer.name}` : 'Customer Details'}
        size="lg"
        footer={
          <button className="btn-secondary" onClick={() => setShowDetailModal(false)}>
            Close
          </button>
        }
      >
        {viewingCustomer && (
          <div>
            {/* Overview Card */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: 12,
                background: '#f8fafc',
                padding: 16,
                borderRadius: 10,
                border: '1px solid #e2e8f0',
                marginBottom: 20,
              }}
            >
              <div>
                <div style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase' }}>Customer Code</div>
                <div style={{ fontWeight: 700, color: '#0f172a', fontSize: 14 }}>{viewingCustomer.code}</div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase' }}>Contact Person</div>
                <div style={{ fontWeight: 600, color: '#334155', fontSize: 13 }}>
                  {viewingCustomer.contactName || viewingCustomer.contactPerson || '—'}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase' }}>Email</div>
                <div style={{ fontSize: 13, color: '#0284c7' }}>{viewingCustomer.email || '—'}</div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase' }}>Phone</div>
                <div style={{ fontSize: 13, color: '#334155' }}>{viewingCustomer.phone || '—'}</div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase' }}>Country</div>
                <div style={{ fontSize: 13, color: '#334155' }}>{viewingCustomer.country || 'Rwanda'}</div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase' }}>Tax ID</div>
                <div style={{ fontSize: 13, color: '#334155' }}>{viewingCustomer.taxId || '—'}</div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase' }}>Payment Terms</div>
                <div style={{ fontSize: 13, color: '#0d9488', fontWeight: 600 }}>
                  {viewingCustomer.paymentTerms || 'Standard'}
                </div>
              </div>
              {viewingCustomer.address && (
                <div style={{ gridColumn: '1/-1' }}>
                  <div style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase' }}>Address</div>
                  <div style={{ fontSize: 13, color: '#334155' }}>{viewingCustomer.address}</div>
                </div>
              )}
              {viewingCustomer.notes && (
                <div style={{ gridColumn: '1/-1' }}>
                  <div style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase' }}>Notes</div>
                  <div style={{ fontSize: 13, color: '#64748b', fontStyle: 'italic' }}>
                    {viewingCustomer.notes}
                  </div>
                </div>
              )}
            </div>

            {/* Sales History Section (GET /customers/{id}/sales) */}
            <div style={{ marginTop: 10 }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: 10,
                }}
              >
                <div style={{ fontWeight: 700, color: '#163140', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Receipt size={16} color="#0d9488" />
                  Sales History
                </div>
                <div style={{ fontSize: 12, color: '#64748b' }}>
                  {sales.length} recorded orders
                </div>
              </div>

              {loadingSales ? (
                <div style={{ textAlign: 'center', padding: 20, color: '#94a3b8' }}>
                  Loading sales history…
                </div>
              ) : sales.length === 0 ? (
                <div
                  style={{
                    background: '#f8fafc',
                    border: '1px dashed #cbd5e1',
                    borderRadius: 8,
                    padding: '24px 16px',
                    textAlign: 'center',
                    color: '#64748b',
                    fontSize: 13,
                  }}
                >
                  No sales orders found for this customer yet.
                </div>
              ) : (
                <div style={{ maxHeight: 240, overflowY: 'auto' }}>
                  <table className="data-table" style={{ fontSize: 12.5 }}>
                    <thead>
                      <tr>
                        <th>Reference</th>
                        <th>Status</th>
                        <th>Total Amount</th>
                        <th>Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sales.map((so) => (
                        <tr key={so.id}>
                          <td style={{ fontWeight: 600 }}>{so.referenceNumber || so.id.slice(0, 8)}</td>
                          <td>
                            <span className="badge badge-success">{so.status}</span>
                          </td>
                          <td style={{ fontWeight: 700, color: '#059669' }}>
                            ${parseFloat(String(so.totalAmount || 0)).toFixed(2)}
                          </td>
                          <td style={{ color: '#64748b' }}>
                            {new Date(so.createdAt).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>
    </DashboardLayout>
  );
}
