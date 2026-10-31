import React, { useEffect, useState } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import api from '../lib/api';
import { OrganizationSettings } from '../types';
import { Save, Building2, Key, ShieldCheck, Globe, MapPin, Image, Clock, CheckSquare, Coins } from 'lucide-react';

interface OrgSettingsForm {
  businessName: string;
  address: string;
  logoUrl: string;
  timezone: string;
  allowNegativeStock: boolean;
  requirePurchaseApproval: boolean;
  requireSeparationOfDuties: boolean;
}

interface PasswordForm {
  currentPassword: string;
  newPassword: string;
  confirmNewPassword: string;
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<'ORG' | 'SECURITY'>('ORG');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [changingPass, setChangingPass] = useState(false);
  const [orgData, setOrgData] = useState<OrganizationSettings | null>(null);

  const { register: regSettings, handleSubmit: handleSettingsSubmit, reset: resetSettings } = useForm<OrgSettingsForm>();
  const { register: regPass, handleSubmit: handlePassSubmit, reset: resetPass, watch: watchPass, formState: { errors: passErrors } } = useForm<PasswordForm>();

  useEffect(() => {
    api.get('/organization/settings')
      .then(({ data }) => {
        const s: OrganizationSettings = data.data ?? data;
        setOrgData(s);
        resetSettings({
          businessName: s.businessName || s.name || '',
          address: s.address || '',
          logoUrl: s.logoUrl || '',
          timezone: s.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
          allowNegativeStock: Boolean(s.allowNegativeStock),
          requirePurchaseApproval: s.requirePurchaseApproval !== undefined ? s.requirePurchaseApproval : true,
          requireSeparationOfDuties: s.requireSeparationOfDuties !== undefined ? s.requireSeparationOfDuties : true,
        });
      })
      .catch(() => toast.error('Failed to load organization settings'))
      .finally(() => setLoading(false));
  }, [resetSettings]);

  const onSettingsSubmit = async (form: OrgSettingsForm) => {
    setSaving(true);
    try {
      const payload = {
        businessName: form.businessName.trim(),
        address: form.address?.trim() || '',
        logoUrl: form.logoUrl?.trim() || '',
        timezone: form.timezone?.trim() || 'UTC',
        allowNegativeStock: Boolean(form.allowNegativeStock),
        requirePurchaseApproval: Boolean(form.requirePurchaseApproval),
        requireSeparationOfDuties: Boolean(form.requireSeparationOfDuties),
      };

      await api.patch('/organization/settings', payload);
      toast.success('Organization settings updated successfully');
    } catch (err: any) {
      const respData = err?.response?.data;
      let msg = respData?.message;

      if (Array.isArray(respData?.errors) && respData.errors.length > 0) {
        msg = respData.errors.map((e: any) => e.message ? `${e.field ? e.field + ': ' : ''}${e.message}` : (typeof e === 'string' ? e : JSON.stringify(e))).join('; ');
      } else if (typeof respData?.error === 'string') {
        msg = respData.error;
      }

      toast.error(msg ?? 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const onPasswordSubmit = async (data: PasswordForm) => {
    setChangingPass(true);
    try {
      await api.post('/auth/password/change', {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });
      toast.success('Password changed successfully');
      resetPass();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg ?? 'Failed to change password');
    } finally {
      setChangingPass(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout title="Settings">
        <div style={{ textAlign: 'center', padding: 80 }}>
          <div className="animate-spin" style={{ width: 36, height: 36, margin: '0 auto', border: '3px solid #e2e8f0', borderTopColor: '#193849', borderRadius: '50%' }} />
          <p style={{ marginTop: 14, color: '#64748b', fontSize: 13 }}>Loading settings…</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Settings">
      {/* Centered Middle Container */}
      <div style={{ maxWidth: 760, margin: '0 auto', width: '100%' }}>
        {/* Page Header */}
        <div className="page-header" style={{ marginBottom: 20 }}>
          <div>
            <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Building2 size={24} color="#193849" /> Organization & Account Settings
            </h1>
            <p className="page-subtitle">Configure business profile, operational policies, and security credentials</p>
          </div>
        </div>

        {/* Tab Buttons */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
          <button
            type="button"
            className={`btn-secondary ${activeTab === 'ORG' ? 'btn-primary' : ''}`}
            onClick={() => setActiveTab('ORG')}
          >
            <Building2 size={15} /> Organization Profile & Policies
          </button>
          <button
            type="button"
            className={`btn-secondary ${activeTab === 'SECURITY' ? 'btn-primary' : ''}`}
            onClick={() => setActiveTab('SECURITY')}
          >
            <Key size={15} /> Change Password
          </button>
        </div>

        {activeTab === 'ORG' ? (
          <div className="card" style={{ padding: '28px 32px' }}>
            {/* Currency & Metadata Snapshot */}
            {orgData && (
              <div style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: 12,
                padding: '14px 18px',
                marginBottom: 24,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 12,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Coins size={18} color="#0d9488" />
                  <div>
                    <div style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em' }}>
                      Organization Currencies
                    </div>
                    <div style={{ fontSize: 13, color: '#1e293b', fontWeight: 600 }}>
                      Trading Currency: <span className="badge badge-teal" style={{ marginLeft: 4 }}>{orgData.currency || 'Not configured'}</span>
                      <span style={{ margin: '0 8px', color: '#cbd5e1' }}>•</span>
                      Base Currency: <span className="badge badge-info" style={{ marginLeft: 4 }}>{orgData.baseCurrency || 'Not configured'}</span>
                    </div>
                  </div>
                </div>

                {orgData.organizationSlug && (
                  <div style={{ fontSize: 12, color: '#64748b' }}>
                    Slug: <code style={{ background: '#e2e8f0', padding: '2px 6px', borderRadius: 4, fontWeight: 600 }}>{orgData.organizationSlug}</code>
                  </div>
                )}
              </div>
            )}

            <form onSubmit={handleSettingsSubmit(onSettingsSubmit)}>
              {/* Business Name */}
              <div style={{ marginBottom: 18 }}>
                <label className="form-label">Business Name *</label>
                <div style={{ position: 'relative' }}>
                  <Building2 size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                  <input
                    className="form-input"
                    style={{ paddingLeft: 38 }}
                    placeholder="e.g. Mwendo Traders Ltd"
                    {...regSettings('businessName', { required: 'Business name is required' })}
                  />
                </div>
              </div>

              {/* Timezone & Logo URL Row */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 18 }}>
                <div>
                  <label className="form-label">Timezone</label>
                  <div style={{ position: 'relative' }}>
                    <Clock size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                    <input
                      className="form-input"
                      style={{ paddingLeft: 38 }}
                      placeholder="e.g. Africa/Nairobi, UTC"
                      {...regSettings('timezone')}
                    />
                  </div>
                </div>

                <div>
                  <label className="form-label">Logo URL</label>
                  <div style={{ position: 'relative' }}>
                    <Image size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                    <input
                      className="form-input"
                      style={{ paddingLeft: 38 }}
                      placeholder="https://example.com/logo.png"
                      {...regSettings('logoUrl')}
                    />
                  </div>
                </div>
              </div>

              {/* Physical Address */}
              <div style={{ marginBottom: 24 }}>
                <label className="form-label">Physical Business Address</label>
                <div style={{ position: 'relative' }}>
                  <MapPin size={16} style={{ position: 'absolute', left: 12, top: 14, color: '#94a3b8' }} />
                  <textarea
                    className="form-input"
                    rows={2}
                    style={{ paddingLeft: 38 }}
                    placeholder="Plot 42, Haile Selassie Ave, Nairobi, Kenya"
                    {...regSettings('address')}
                  />
                </div>
              </div>

              {/* Inventory & Operational Policies Section */}
              <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: 20, marginBottom: 24 }}>
                <h3 style={{ fontSize: 14, fontWeight: 700, color: '#163140', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <CheckSquare size={16} color="#0d9488" /> Operational & Inventory Policies
                </h3>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {/* Allow Negative Stock */}
                  <label style={{
                    display: 'flex', alignItems: 'flex-start', gap: 12, cursor: 'pointer',
                    background: '#f8fafc', padding: '12px 16px', borderRadius: 10, border: '1px solid #edf2f7',
                  }}>
                    <input
                      type="checkbox"
                      style={{ marginTop: 3, width: 16, height: 16, accentColor: '#193849' }}
                      {...regSettings('allowNegativeStock')}
                    />
                    <div>
                      <div style={{ fontSize: 13.5, fontWeight: 600, color: '#1e293b' }}>
                        Allow Negative Stock
                      </div>
                      <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
                        Permits order dispatches and inventory issues even when available physical stock drops below zero.
                      </div>
                    </div>
                  </label>

                  {/* Require Purchase Approval */}
                  <label style={{
                    display: 'flex', alignItems: 'flex-start', gap: 12, cursor: 'pointer',
                    background: '#f8fafc', padding: '12px 16px', borderRadius: 10, border: '1px solid #edf2f7',
                  }}>
                    <input
                      type="checkbox"
                      style={{ marginTop: 3, width: 16, height: 16, accentColor: '#193849' }}
                      {...regSettings('requirePurchaseApproval')}
                    />
                    <div>
                      <div style={{ fontSize: 13.5, fontWeight: 600, color: '#1e293b' }}>
                        Require Purchase Approval
                      </div>
                      <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
                        Draft purchase orders must undergo formal authorization before goods receipts can be generated.
                      </div>
                    </div>
                  </label>

                  {/* Require Separation of Duties */}
                  <label style={{
                    display: 'flex', alignItems: 'flex-start', gap: 12, cursor: 'pointer',
                    background: '#f8fafc', padding: '12px 16px', borderRadius: 10, border: '1px solid #edf2f7',
                  }}>
                    <input
                      type="checkbox"
                      style={{ marginTop: 3, width: 16, height: 16, accentColor: '#193849' }}
                      {...regSettings('requireSeparationOfDuties')}
                    />
                    <div>
                      <div style={{ fontSize: 13.5, fontWeight: 600, color: '#1e293b' }}>
                        Require Separation of Duties
                      </div>
                      <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
                        Enforces compliance: users who create purchase orders or inventory transfers cannot approve their own submissions.
                      </div>
                    </div>
                  </label>
                </div>
              </div>

              {/* Submit Button */}
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button type="submit" className="btn-primary" disabled={saving} style={{ padding: '10px 24px', fontSize: 14 }}>
                  <Save size={16} />
                  {saving ? 'Updating Settings…' : 'Save Organization Settings'}
                </button>
              </div>
            </form>
          </div>
        ) : (
          <div className="card" style={{ padding: '28px 32px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
              <div style={{
                width: 44, height: 44, borderRadius: 12,
                background: '#e6f7ed', display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <ShieldCheck size={24} color="#15803d" />
              </div>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: '#163140' }}>Update Account Password</h3>
                <p style={{ fontSize: 12.5, color: '#64748b' }}>Change the credentials used to log in to your tenant account</p>
              </div>
            </div>

            <form onSubmit={handlePassSubmit(onPasswordSubmit)}>
              <div style={{ marginBottom: 16 }}>
                <label className="form-label">Current Password *</label>
                <input
                  type="password"
                  className="form-input"
                  placeholder="••••••••"
                  {...regPass('currentPassword', { required: 'Current password is required' })}
                />
              </div>

              <div style={{ marginBottom: 16 }}>
                <label className="form-label">New Password *</label>
                <input
                  type="password"
                  className="form-input"
                  placeholder="At least 8 characters"
                  {...regPass('newPassword', {
                    required: 'New password is required',
                    minLength: { value: 8, message: 'Minimum 8 characters' },
                  })}
                />
                {passErrors.newPassword && (
                  <p style={{ color: '#ef4444', fontSize: 12, marginTop: 4 }}>{passErrors.newPassword.message}</p>
                )}
              </div>

              <div style={{ marginBottom: 24 }}>
                <label className="form-label">Confirm New Password *</label>
                <input
                  type="password"
                  className="form-input"
                  placeholder="Repeat new password"
                  {...regPass('confirmNewPassword', {
                    required: 'Please confirm new password',
                    validate: (v) => v === watchPass('newPassword') || 'Passwords do not match',
                  })}
                />
                {passErrors.confirmNewPassword && (
                  <p style={{ color: '#ef4444', fontSize: 12, marginTop: 4 }}>{passErrors.confirmNewPassword.message}</p>
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button type="submit" className="btn-primary" disabled={changingPass} style={{ padding: '10px 24px', fontSize: 14 }}>
                  <Key size={16} />
                  {changingPass ? 'Updating Password…' : 'Change Password'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
