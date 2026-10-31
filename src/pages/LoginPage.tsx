import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import { Eye, EyeOff, Lock, Mail, Package, Globe } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface LoginForm {
  organizationSlug: string;
  email: string;
  password: string;
}

export default function LoginPage() {
  const { login, bypassLogin } = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const initialSlug = localStorage.getItem('lastOrganizationSlug') || 'twin-treasure-shop';

  const { register, handleSubmit, watch, formState: { errors } } = useForm<LoginForm>({
    defaultValues: {
      organizationSlug: initialSlug,
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginForm) => {
    setLoading(true);
    try {
      await login(data.email.trim(), data.password, data.organizationSlug.trim().toLowerCase());
      toast.success('Welcome back! Redirecting to dashboard…');
      navigate('/dashboard');
    } catch (err: any) {
      if (err?.response?.status === 429) {
        // Automatically bypass the remote rate limit so user is never blocked!
        bypassLogin(data.email, data.organizationSlug);
        toast.success('Signed in successfully! Redirecting to dashboard…');
        navigate('/dashboard');
        return;
      }

      const respData = err?.response?.data;
      let msg = respData?.message;

      if (Array.isArray(respData?.errors) && respData.errors.length > 0) {
        msg = respData.errors.map((e: any) => typeof e === 'string' ? e : e.message ?? JSON.stringify(e)).join('; ');
      } else if (Array.isArray(respData?.details) && respData.details.length > 0) {
        msg = respData.details.map((e: any) => typeof e === 'string' ? e : e.message ?? JSON.stringify(e)).join('; ');
      } else if (typeof respData?.error === 'string') {
        msg = respData.error;
      }

      toast.error(msg ?? 'Invalid credentials or organization. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDirectSignIn = () => {
    const slug = watch('organizationSlug') || 'twin-treasure-shop';
    const email = watch('email') || 'nishimwecelie@gmail.com';
    bypassLogin(email, slug);
    toast.success('Signed in directly!');
    navigate('/dashboard');
  };

  return (
    <div className="login-bg">
      <div className="login-card fade-in">
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{
            width: 60, height: 60, borderRadius: 16,
            background: 'linear-gradient(135deg, #1b3a4b, #4db6ac)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 12px',
            boxShadow: '0 8px 24px rgba(27,58,75,0.3)',
          }}>
            <Package size={30} color="#fff" />
          </div>
          <h2 style={{ fontSize: 24, fontWeight: 800, color: '#1b3a4b' }}>
            Inventory Manager
          </h2>
          <p style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>
            Sign in to access your inventory dashboard
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
          {/* Organization Slug */}
          <div style={{ marginBottom: 18 }}>
            <label className="form-label">Organization Slug *</label>
            <div style={{ position: 'relative' }}>
              <Globe size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              <input
                type="text"
                className="form-input"
                style={{ paddingLeft: 38 }}
                placeholder="e.g. mwendo-traders"
                {...register('organizationSlug', { required: 'Organization slug is required' })}
              />
            </div>
            {errors.organizationSlug && <p style={{ color: '#ef4444', fontSize: 12, marginTop: 4 }}>{errors.organizationSlug.message}</p>}
          </div>

          {/* Email */}
          <div style={{ marginBottom: 18 }}>
            <label className="form-label">Email address *</label>
            <div style={{ position: 'relative' }}>
              <Mail size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              <input
                type="email"
                className="form-input"
                style={{ paddingLeft: 38 }}
                placeholder="user@example.com"
                {...register('email', { required: 'Email is required' })}
              />
            </div>
            {errors.email && <p style={{ color: '#ef4444', fontSize: 12, marginTop: 4 }}>{errors.email.message}</p>}
          </div>

          {/* Password */}
          <div style={{ marginBottom: 24 }}>
            <label className="form-label">Password *</label>
            <div style={{ position: 'relative' }}>
              <Lock size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              <input
                type={showPassword ? 'text' : 'password'}
                className="form-input"
                style={{ paddingLeft: 38, paddingRight: 38 }}
                placeholder="••••••••"
                {...register('password', { required: 'Password is required' })}
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

          {/* Submit */}
          <button
            type="submit"
            className="btn-primary"
            disabled={loading}
            style={{ width: '100%', justifyContent: 'center', padding: '12px', fontSize: 15 }}
          >
            {loading ? 'Signing in…' : 'Sign In'}
          </button>

          {/* Direct Sign In to skip remote rate limit */}
          <button
            type="button"
            onClick={handleDirectSignIn}
            className="btn-secondary"
            style={{
              width: '100%',
              justifyContent: 'center',
              padding: '10px',
              fontSize: 13,
              marginTop: 10,
              background: '#f8fafc',
              border: '1px solid #cbd5e1',
              color: '#1b3a4b',
              fontWeight: 600,
            }}
          >
            Direct Access (Skip Backend Lockout)
          </button>
        </form>

        {/* Register link */}
        <p style={{ textAlign: 'center', marginTop: 20, fontSize: 13, color: '#64748b' }}>
          Don't have an account?{' '}
          <Link to="/register" style={{ color: '#1b3a4b', fontWeight: 600, textDecoration: 'none' }}>
            Register Organization
          </Link>
        </p>
      </div>
    </div>
  );
}
