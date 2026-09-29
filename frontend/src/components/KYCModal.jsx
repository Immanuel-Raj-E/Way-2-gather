import React, { useState } from 'react';
import { userService } from '../services/api';
import Button from './Button';
import { ShieldCheck, Lock, AlertCircle, CheckCircle2, User, Phone, Calendar, Fingerprint } from 'lucide-react';

export default function KYCModal({ isOpen, onClose, onVerified, initialData = {} }) {
  const [formData, setFormData] = useState({
    name: initialData.name || 'Priya Sharma',
    age: initialData.age || 22,
    gender: initialData.gender || 'Female',
    phoneNumber: initialData.phoneNumber || '+91-98765-43210',
    aadharNumber: ''
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successData, setSuccessData] = useState(null);

  if (!isOpen) return null;

  // Auto-format Aadhar: XXXX - XXXX - XXXX
  const handleAadharChange = (e) => {
    const rawValue = e.target.value.replace(/\D/g, '').slice(0, 12);
    let formatted = '';
    for (let i = 0; i < rawValue.length; i++) {
      if (i > 0 && i % 4 === 0) formatted += ' - ';
      formatted += rawValue[i];
    }
    setFormData({ ...formData, aadharNumber: formatted });
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const rawAadhar = formData.aadharNumber.replace(/[\s-]/g, '');

    // Client-side validations
    if (rawAadhar.length !== 12) {
      setError('Aadhar number must be exactly 12 numeric digits.');
      return;
    }

    if (Number(formData.age) < 18) {
      setError('You must be at least 18 years of age to register.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await userService.verifyKyc('user_curr_101', {
        name: formData.name,
        age: Number(formData.age),
        gender: formData.gender,
        phoneNumber: formData.phoneNumber,
        aadharNumber: rawAadhar
      });

      setSuccessData(res.data.user);
      if (onVerified) {
        onVerified(res.data.user);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'KYC Verification failed. Please check your details.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '540px' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
          <div style={{
            width: 46, height: 46, borderRadius: 12,
            background: 'rgba(16, 185, 129, 0.18)', display: 'flex',
            alignItems: 'center', justifyContent: 'center', color: 'var(--accent-green)'
          }}>
            <ShieldCheck size={26} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.3rem', fontWeight: 800 }}>Mandatory Identity Verification (KYC)</h2>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              100% verified network for passenger & host safety.
            </p>
          </div>
        </div>

        {/* Success State */}
        {successData ? (
          <div style={{ textAlign: 'center', padding: '1.5rem 0' }}>
            <CheckCircle2 size={56} color="var(--accent-green)" style={{ margin: '0 auto 1rem' }} />
            <h3 style={{ fontSize: '1.3rem', fontWeight: 800, marginBottom: '0.5rem' }}>KYC Verified Successfully!</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.2rem' }}>
              Your identity has been securely verified and protected.
            </p>

            <div style={{
              background: 'rgba(0,0,0,0.3)', padding: '1rem', borderRadius: 10,
              fontSize: '0.85rem', textAlign: 'left', marginBottom: '1.5rem', border: '1px solid var(--border-color)'
            }}>
              <div><b>Name:</b> {successData.name}</div>
              <div><b>Age & Gender:</b> {successData.age} yrs • {successData.gender}</div>
              <div><b>Masked ID:</b> <code style={{ color: 'var(--accent-cyan)' }}>{successData.aadharMasked}</code></div>
              <div><b>Status:</b> <span style={{ color: 'var(--accent-green)', fontWeight: 700 }}>✓ Active & Verified</span></div>
            </div>

            <Button onClick={onClose} style={{ width: '100%' }}>
              Continue to way-2-gather Dashboard
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
            {/* Error Banner */}
            {error && (
              <div style={{
                background: 'rgba(244, 63, 94, 0.15)', border: '1px solid var(--accent-rose)',
                padding: '0.75rem 1rem', borderRadius: 8, color: 'var(--accent-rose)',
                fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem'
              }}>
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}

            {/* Name */}
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.3rem' }}>
                Full Legal Name
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Priya Sharma"
                  style={{
                    width: '100%', padding: '0.7rem 1rem 0.7rem 2.4rem', borderRadius: 8,
                    background: 'rgba(0, 0, 0, 0.35)', border: '1px solid var(--border-color)',
                    color: 'var(--text-main)', fontSize: '0.9rem'
                  }}
                />
                <User size={16} color="var(--text-muted)" style={{ position: 'absolute', left: 10, top: 12 }} />
              </div>
            </div>

            {/* Age & Gender Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.3rem' }}>
                  Age (Must be ≥ 18)
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="number"
                    min="18"
                    max="100"
                    required
                    value={formData.age}
                    onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                    style={{
                      width: '100%', padding: '0.7rem 1rem 0.7rem 2.4rem', borderRadius: 8,
                      background: 'rgba(0, 0, 0, 0.35)', border: '1px solid var(--border-color)',
                      color: 'var(--text-main)', fontSize: '0.9rem'
                    }}
                  />
                  <Calendar size={16} color="var(--text-muted)" style={{ position: 'absolute', left: 10, top: 12 }} />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.3rem' }}>
                  Gender
                </label>
                <select
                  value={formData.gender}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                  style={{
                    width: '100%', padding: '0.7rem 1rem', borderRadius: 8,
                    background: 'rgba(0, 0, 0, 0.35)', border: '1px solid var(--border-color)',
                    color: 'var(--text-main)', fontSize: '0.9rem'
                  }}
                >
                  <option value="Female">Female</option>
                  <option value="Male">Male</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            {/* Phone */}
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.3rem' }}>
                Verified Phone Number
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="tel"
                  required
                  value={formData.phoneNumber}
                  onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                  placeholder="+91-98765-43210"
                  style={{
                    width: '100%', padding: '0.7rem 1rem 0.7rem 2.4rem', borderRadius: 8,
                    background: 'rgba(0, 0, 0, 0.35)', border: '1px solid var(--border-color)',
                    color: 'var(--text-main)', fontSize: '0.9rem'
                  }}
                />
                <Phone size={16} color="var(--text-muted)" style={{ position: 'absolute', left: 10, top: 12 }} />
              </div>
            </div>

            {/* Aadhar Input with Auto-Formatting */}
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.3rem' }}>
                12-Digit Aadhar Card Number
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  required
                  value={formData.aadharNumber}
                  onChange={handleAadharChange}
                  placeholder="5421 - 8920 - 4821"
                  style={{
                    width: '100%', padding: '0.75rem 1rem 0.75rem 2.4rem', borderRadius: 8,
                    background: 'rgba(0, 0, 0, 0.45)', border: '1px solid var(--border-glow)',
                    color: 'var(--accent-cyan)', fontSize: '1.05rem', letterSpacing: '0.12em', fontWeight: 700
                  }}
                />
                <Fingerprint size={18} color="var(--accent-cyan)" style={{ position: 'absolute', left: 10, top: 14 }} />
              </div>
            </div>

            {/* Security Guarantee Note */}
            <div style={{
              background: 'rgba(99, 102, 241, 0.1)', padding: '0.65rem 0.85rem', borderRadius: 8,
              fontSize: '0.75rem', color: '#c7d2fe', display: 'flex', alignItems: 'center', gap: '0.5rem'
            }}>
              <Lock size={15} color="var(--primary-light)" />
              <span>
                <b>Privacy & Data Protection:</b> Your government ID number is securely encrypted and never shared in plain text.
              </span>
            </div>

            {/* Modal Actions */}
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
              <Button type="button" variant="secondary" onClick={onClose} style={{ flex: 1 }}>
                Cancel
              </Button>
              <Button type="submit" variant="success" disabled={loading} style={{ flex: 2 }}>
                <ShieldCheck size={18} />
                {loading ? 'Cryptographically Verifying...' : 'Submit & Verify KYC'}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
