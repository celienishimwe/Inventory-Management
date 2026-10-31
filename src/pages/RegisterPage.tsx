import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import { Eye, EyeOff, Lock, Mail, Package, User, Building2, Globe } from 'lucide-react';
import api from '../lib/api';

interface RegisterForm {
  organizationName: string;
  organizationSlug: string;
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export default function RegisterPage() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<RegisterForm>({
    defaultValues: {
      organizationName: '',
      organizationSlug: '',
      fullName: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  const handleOrgNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setValue('organizationName', val, { shouldValidate: true });
    if (!slugManuallyEdited) {
      setValue('organizationSlug', slugify(val), { shouldValidate: true });
    }
  };

  const onSubmit = async (data: RegisterForm) => {
    setLoading(true);
    try {
      const payload = {
        organizationName: data.organizationName.trim(),
        organizationSlug: data.organizationSlug.trim().toLowerCase(),
        fullName: data.fullName.trim(),
        email: data.email.trim().toLowerCase(),
        password: data.password,
      };

      await api.post('/auth/register', payload);
      localStorage.setItem('lastOrganizationSlug', payload.organizationSlug);
      toast.success('Organization registered successfully! Please log in.');
      navigate('/login');
    } catch (err: any) {
      const respData = err?.response?.data;
      let msg = respData?.message;

      if (Array.isArray(respData?.errors) && respData.errors.length > 0) {
        msg = respData.errors.map((e: any) => typeof e === 'string' ? e : e.message ?? JSON.stringify(e)).join('; ');
      } else if (Array.isArray(respData?.details) && respData.details.length > 0) {
        msg = respData.details.map((e: any) => typeof e === 'string' ? e : e.message ?? JSON.stringify(e)).join('; ');
      } else if (typeof respData?.error === 'string') {
        msg = respData.error;
      }

      toast.error(msg ?? 'Registration failed. Please check your inputs and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-bg">
      <div className="login-card fade-in" style={{ maxWidth: 500 }}>
        {/* Header Branding */}
        <div style={{ textAlign: 'center', marginBottom: 22 }}>
          <div style={{
            width: 56, height: 56, borderRadius: 14,
            background: 'linear-gradient(135deg, #193849, #4db6ac)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 10px',
            boxShadow: '0 8px 24px rgba(25,56,73,0.3)',
          }}>
            <Package size={26} color="#fff" />
          </div>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: '#163140' }}>
            Register Organization
          </h2>
          <p style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>
            Create your tenant space and set up the primary owner account
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
          {/* Organization Name */}
          <div style={{ marginBottom: 14 }}>
            <label className="form-label">Organization Name *</label>
            <div style={{ position: 'relative' }}>
              <Building2 size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              <input
                className="form-input"
                style={{ paddingLeft: 38 }}
                placeholder="Mwendo Traders Ltd"
                {...register('organizationName', {
                  required: 'Organization name is required',
                  onChange: handleOrgNameChange,
                })}
              />
            </div>
            {errors.organizationName && <p style={{ color: '#ef4444', fontSize: 12, marginTop: 4 }}>{errors.organizationName.message}</p>}
          </div>

          {/* Organization Slug */}
          <div style={{ marginBottom: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5 }}>
              <label className="form-label" style={{ margin: 0 }}>Organization Slug *</label>
              <span style={{ fontSize: 11, color: '#94a3b8' }}>URL Identifier (lowercase letters, numbers, hyphens)</span>
            </div>
            <div style={{ position: 'relative' }}>
              <Globe size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              <input
                className="form-input"
                style={{ paddingLeft: 38 }}
                placeholder="mwendo-traders"
                {...register('organizationSlug', {
                  required: 'Organization slug is required',
                  pattern: {
                    value: /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
                    message: 'Slug must contain only lowercase alphanumeric characters and hyphens',
                  },
                  onChange: () => setSlugManuallyEdited(true),
                })}
              />
            </div>
            {errors.organizationSlug && <p style={{ color: '#ef4444', fontSize: 12, marginTop: 4 }}>{errors.organizationSlug.message}</p>}
          </div>

          {/* Full Name */}
          <div style={{ marginBottom: 14 }}>
            <label className="form-label">Full Name *</label>
            <div style={{ position: 'relative' }}>
              <User size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              <input
                className="form-input"
                style={{ paddingLeft: 38 }}
                placeholder="Nirmal Kumar"
                {...register('fullName', { required: 'Full name is required' })}
              />
            </div>
            {errors.fullName && <p style={{ color: '#ef4444', fontSize: 12, marginTop: 4 }}>{errors.fullName.message}</p>}
          </div>

          {/* Email */}
          <div style={{ marginBottom: 14 }}>
            <label className="form-label">Work Email *</label>
            <div style={{ position: 'relative' }}>
              <Mail size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              <input
                type="email"
                className="form-input"
                style={{ paddingLeft: 38 }}
                placeholder="owner@mwendotraders.com"
                {...register('email', {
                  required: 'Email is required',
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: 'Invalid email address',
                  },
                })}
              />
            </div>
            {errors.email && <p style={{ color: '#ef4444', fontSize: 12, marginTop: 4 }}>{errors.email.message}</p>}
          </div>

          {/* Password */}
          <div style={{ marginBottom: 14 }}>
            <label className="form-label">Password *</label>
            <div style={{ position: 'relative' }}>
              <Lock size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              <input
                type={showPassword ? 'text' : 'password'}
                className="form-input"
                style={{ paddingLeft: 38, paddingRight: 38 }}
                placeholder="Minimum 8 characters"
                {...register('password', {
                  required: 'Password is required',
                  minLength: { value: 8, message: 'Password must be at least 8 characters long' },
                })}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8',
                }}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {errors.password && <p style={{ color: '#ef4444', fontSize: 12, marginTop: 4 }}>{errors.password.message}</p>}
          </div>

          {/* Confirm Password */}
          <div style={{ marginBottom: 22 }}>
            <label className="form-label">Confirm Password *</label>
            <div style={{ position: 'relative' }}>
              <Lock size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              <input
                type="password"
                className="form-input"
                style={{ paddingLeft: 38 }}
                placeholder="Re-enter password"
                {...register('confirmPassword', {
                  required: 'Please confirm password',
                  validate: (v) => v === watch('password') || 'Passwords do not match',
                })}
              />
            </div>
            {errors.confirmPassword && <p style={{ color: '#ef4444', fontSize: 12, marginTop: 4 }}>{errors.confirmPassword.message}</p>}
          </div>

          {/* Submit */}
          <button
            type="submit"
            className="btn-primary"
            disabled={loading}
            style={{ width: '100%', justifyContent: 'center', padding: '12px', fontSize: 15 }}
          >
            {loading ? 'Creating Organization…' : 'Register Organization'}
          </button>
        </form>

        {/* Link to login */}
        <p style={{ textAlign: 'center', marginTop: 18, fontSize: 13, color: '#64748b' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: '#193849', fontWeight: 700, textDecoration: 'none' }}>
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
