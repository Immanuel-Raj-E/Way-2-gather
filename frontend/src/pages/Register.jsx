import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import Button from '../components/Button';
import { 
  User, Mail, Lock, Phone, Calendar, ShieldCheck, 
  AlertCircle, Upload, FileText, CheckCircle2 
} from 'lucide-react';

export default function Register() {
  const navigate = useNavigate();
  const { login: setAuthSession } = useAuth() || {};

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    gender: 'Female',
    age: 21,
    role: 'both'
  });

  const [documentFile, setDocumentFile] = useState(null);
  const [documentPreview, setDocumentPreview] = useState(null);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setDocumentFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setDocumentPreview(reader.result);
      };
      reader.readAsDataURL(file);
      setErrors(prev => ({ ...prev, document: null }));
    }
  };

  const validate = () => {
    const errs = {};
    if (!formData.name.trim()) errs.name = 'Full legal name is required';
    
    const emailRegex = /^\S+@\S+\.\S+$/;
    if (!formData.email) errs.email = 'Email address is required';
    else if (!emailRegex.test(formData.email)) errs.email = 'Please enter a valid email';

    const cleanPhone = formData.phone.replace(/[\s-]/g, '');
    if (!formData.phone) errs.phone = 'Phone number is required';
    else if (cleanPhone.length < 10) errs.phone = 'Phone number must be at least 10 digits';

    if (!formData.password) errs.password = 'Password is required';
    else if (formData.password.length < 6) errs.password = 'Password must be at least 6 characters';

    if (formData.password !== formData.confirmPassword) {
      errs.confirmPassword = 'Passwords do not match';
    }

    if (Number(formData.age) < 18) {
      errs.age = 'You must be at least 18 years old';
    }

    if (!documentPreview) {
      errs.document = 'Government ID document upload is mandatory for KYC';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError(null);

    if (!validate()) return;

    setLoading(true);
    try {
      const res = await authService.register({
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
        gender: formData.gender,
        age: Number(formData.age),
        role: formData.role,
        documentIdUrl: documentPreview || 'https://syncride.app/documents/verified_id.pdf'
      });

      if (res.data.token) {
        localStorage.setItem('syncride_token', res.data.token);
      }
      navigate('/dashboard');
    } catch (err) {
      setServerError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '540px', margin: '2rem auto', width: '100%' }}>
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
            Join way-2-gather
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
            Verified Peer-to-Peer Carpooling Network in Tamil Nadu
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
          {/* Full Name */}
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.3rem' }}>
              Full Legal Name
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                className="input-light"
                placeholder="e.g. Priya Sharma"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                style={{ paddingLeft: '2.4rem' }}
              />
              <User size={16} color="var(--text-muted)" style={{ position: 'absolute', left: 12, top: 13 }} />
            </div>
            {errors.name && <span style={{ color: '#dc2626', fontSize: '0.75rem' }}>{errors.name}</span>}
          </div>

          {/* Email & Phone */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.9rem' }}>
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

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.3rem' }}>
                Phone Number
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="tel"
                  className="input-light"
                  placeholder="9876543210"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  style={{ paddingLeft: '2.4rem' }}
                />
                <Phone size={16} color="var(--text-muted)" style={{ position: 'absolute', left: 12, top: 13 }} />
              </div>
              {errors.phone && <span style={{ color: '#dc2626', fontSize: '0.75rem' }}>{errors.phone}</span>}
            </div>
          </div>

          {/* Age & Gender */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.9rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.3rem' }}>
                Age (18+)
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="number"
                  min="18"
                  max="99"
                  className="input-light"
                  value={formData.age}
                  onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                  style={{ paddingLeft: '2.4rem' }}
                />
                <Calendar size={16} color="var(--text-muted)" style={{ position: 'absolute', left: 12, top: 13 }} />
              </div>
              {errors.age && <span style={{ color: '#dc2626', fontSize: '0.75rem' }}>{errors.age}</span>}
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.3rem' }}>
                Gender
              </label>
              <select
                className="input-light"
                value={formData.gender}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
              >
                <option value="Female">Female</option>
                <option value="Male">Male</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          {/* Mandatory KYC Government ID Upload */}
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.3rem' }}>
              Upload Government ID (e.g., Aadhaar / ID Card) *
            </label>
            <div style={{
              border: '2px dashed var(--border-color)',
              padding: '1.1rem',
              borderRadius: 8,
              textAlign: 'center',
              background: '#f8fafc',
              cursor: 'pointer'
            }}>
              <input
                type="file"
                id="docUpload"
                accept="image/*,application/pdf"
                onChange={handleFileChange}
                style={{ display: 'none' }}
              />
              <label htmlFor="docUpload" style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem' }}>
                {documentFile ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary)', fontWeight: 700 }}>
                    <CheckCircle2 size={20} />
                    <span>{documentFile.name} (Ready for Verification)</span>
                  </div>
                ) : (
                  <>
                    <Upload size={24} color="var(--primary)" />
                    <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)' }}>
                      Click to Browse Government ID Document
                    </span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      Supports PNG, JPG, PDF (Encrypted & securely stored)
                    </span>
                  </>
                )}
              </label>
            </div>
            {errors.document && <span style={{ color: '#dc2626', fontSize: '0.75rem' }}>{errors.document}</span>}
          </div>

          {/* Password & Confirm Password */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.9rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.3rem' }}>
                Password
              </label>
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

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.3rem' }}>
                Confirm Password
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="password"
                  className="input-light"
                  placeholder="••••••••"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  style={{ paddingLeft: '2.4rem' }}
                />
                <Lock size={16} color="var(--text-muted)" style={{ position: 'absolute', left: 12, top: 13 }} />
              </div>
              {errors.confirmPassword && <span style={{ color: '#dc2626', fontSize: '0.75rem' }}>{errors.confirmPassword}</span>}
            </div>
          </div>

          <Button type="submit" variant="primary" disabled={loading} style={{ marginTop: '0.5rem', width: '100%' }}>
            {loading ? 'Verifying ID & Registering...' : 'Upload ID & Complete Registration'}
          </Button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          Already registered?{' '}
          <Link to="/login" style={{ color: 'var(--primary)', fontWeight: 700 }}>
            Sign In here
          </Link>
        </div>
      </div>
    </div>
  );
}
