import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import Button from '../components/Button';
import { Mail, Lock, ShieldCheck, AlertCircle, ArrowRight } from 'lucide-react';

export default function Login() {
  const navigate = useNavigate();
  const { login: setAuthSession } = useAuth() || {};

  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState(null);

  const validate = () => {
    const errs = {};
    const emailRegex = /^\S+@\S+\.\S+$/;
    if (!formData.email) errs.email = 'Email address is required';
    else if (!emailRegex.test(formData.email)) errs.email = 'Please enter a valid email';

    if (!formData.password) errs.password = 'Password is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError(null);

    if (!validate()) return;

    setLoading(true);
    try {
      if (setAuthSession) {
        await setAuthSession(formData.email, formData.password);
      } else {
        const res = await authService.login({
          email: formData.email,
          password: formData.password
        });
        if (res.data.token) {
          localStorage.setItem('way2gather_token', res.data.token);
        }
      }
      navigate('/');
    } catch (err) {
      setServerError(err.response?.data?.message || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoSignIn = async (email = 'imman8046@gmail.com') => {
    setLoading(true);
    setServerError(null);
    try {
      if (setAuthSession) {
        await setAuthSession(email, 'password123');
      } else {
        const fallbackUser = {
          id: 'usr_demo_101',
          name: 'Immanuel Raj E',
          email,
          gender: 'Male',
          phone: '+91 98765 43210',
          kycStatus: 'verified',
          isVerified: true,
          driverRating: 5.0,
          seekerRating: 5.0,
          safetyProfile: { accountStatus: 'Active', harassmentReports: 0 }
        };
        localStorage.setItem('way2gather_token', 'demo_session_token_' + Date.now());
        localStorage.setItem('way2gather_user', JSON.stringify(fallbackUser));
      }
      navigate('/');
    } catch (err) {
      setServerError('Demo sign-in failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '440px', margin: '3rem auto', width: '100%' }}>
      <div className="white-panel" style={{ padding: '2.25rem' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
          <div style={{
            width: 48, height: 48, borderRadius: 12,
            background: 'var(--primary-light)', color: 'var(--primary)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 0.75rem'
          }}>
            <ShieldCheck size={28} />
          </div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-main)' }}>
            Welcome Back
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
            Sign in to your <b>way-2-gather</b> account
          </p>
        </div>

        {serverError && (
          <div style={{
            background: '#fef2f2', border: '1px solid #fecaca',
            color: '#b91c1c', padding: '0.75rem 1rem', borderRadius: 8,
            fontSize: '0.85rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem'
          }}>
            <AlertCircle size={16} />
            <span>{serverError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
          {/* Email */}
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.3rem' }}>
              Email Address
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="email"
                className="input-light"
                placeholder="priya@example.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                style={{ paddingLeft: '2.4rem' }}
              />
              <Mail size={16} color="var(--text-muted)" style={{ position: 'absolute', left: 12, top: 13 }} />
            </div>
            {errors.email && <span style={{ color: '#dc2626', fontSize: '0.75rem' }}>{errors.email}</span>}
          </div>

          {/* Password */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.3rem' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-main)' }}>
                Password
              </label>
              <a href="#forgot" style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 600 }}>
                Forgot?
              </a>
            </div>
            <div style={{ position: 'relative' }}>
              <input
                type="password"
                className="input-light"
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                style={{ paddingLeft: '2.4rem' }}
              />
              <Lock size={16} color="var(--text-muted)" style={{ position: 'absolute', left: 12, top: 13 }} />
            </div>
            {errors.password && <span style={{ color: '#dc2626', fontSize: '0.75rem' }}>{errors.password}</span>}
          </div>

          <Button type="submit" variant="primary" disabled={loading} style={{ marginTop: '0.5rem', width: '100%' }}>
            {loading ? 'Authenticating...' : 'Sign In to Dashboard'}
          </Button>

          <div style={{ marginTop: '0.75rem', textAlign: 'center' }}>
            <button
              type="button"
              onClick={() => handleDemoSignIn('imman8046@gmail.com')}
              style={{
                width: '100%',
                padding: '0.65rem 1rem',
                background: '#f8fafc',
                border: '1px solid var(--border-color)',
                borderRadius: 8,
                fontSize: '0.85rem',
                fontWeight: 700,
                color: 'var(--primary)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = '#f1f5f9'}
              onMouseLeave={(e) => e.currentTarget.style.background = '#f8fafc'}
            >
              <span>⚡</span>
              <span>1-Click Verified Login (Immanuel Raj E)</span>
            </button>
          </div>
        </form>

        <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          Don't have an account?{' '}
          <Link to="/register" style={{ color: 'var(--primary)', fontWeight: 700 }}>
            Register here
          </Link>
        </div>
      </div>
    </div>
  );
}
