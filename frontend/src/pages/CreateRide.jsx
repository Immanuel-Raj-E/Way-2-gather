import React, { useState } from 'react';
import { rideService } from '../services/api';
import LocationAutocomplete from '../components/LocationAutocomplete';
import Button from '../components/Button';
import { PlusCircle, CheckCircle, Navigation, MapPin, Users, Zap } from 'lucide-react';

export default function CreateRide({ kycUser, onOpenKyc }) {
  const [formData, setFormData] = useState({
    originAddress: '',
    originCoords: null,
    destAddress: '',
    destCoords: null,
    totalSeats: 3,
    isWomenOnly: false
  });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.originAddress.trim()) {
      setError('Please specify a starting point / origin.');
      return;
    }
    if (!formData.destAddress.trim()) {
      setError('Please specify a final destination.');
      return;
    }

    setLoading(true);
    setError(null);

    const origCoords = formData.originCoords || [80.2707, 13.0827];
    const dstCoords = formData.destCoords || [80.2220, 12.8310];

    try {
      await rideService.createRide({
        origin: { 
          address: formData.originAddress, 
          latitude: origCoords[1], 
          longitude: origCoords[0] 
        },
        destination: { 
          address: formData.destAddress, 
          latitude: dstCoords[1], 
          longitude: dstCoords[0] 
        },
        driverId: kycUser?.id || kycUser?._id,
        departureTime: new Date().toISOString(),
        totalSeats: Math.min(6, Math.max(1, Number(formData.totalSeats))),
        availableSeats: Math.min(6, Math.max(1, Number(formData.totalSeats))),
        pricePerKm: 10,
        isWomenOnly: Boolean(formData.isWomenOnly)
      });
      setSubmitted(true);
    } catch (err) {
      console.error('Ride creation error:', err);
      setError(err.response?.data?.message || 'Failed to publish ride. Please verify inputs.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '640px', margin: '1rem auto 0' }}>
      <div className="white-panel" style={{ padding: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
          <div style={{
            width: 44, height: 44, borderRadius: 12, background: 'var(--primary-light)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)'
          }}>
            <PlusCircle size={24} />
          </div>
          <div>
            <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-main)' }}>Offer a Shared Pool (Host)</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              Publish your Tamil Nadu commute route corridor. Rate is strictly <b>₹10 per km</b>.
            </p>
          </div>
        </div>

        {error && (
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', padding: '0.75rem 1rem', borderRadius: 8, fontSize: '0.85rem', marginBottom: '1rem' }}>
            {error}
          </div>
        )}

        {submitted ? (
          <div style={{ textAlign: 'center', padding: '2.5rem 1rem' }}>
            <CheckCircle size={56} color="var(--primary)" style={{ margin: '0 auto 1.25rem' }} />
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '1.5rem' }}>
              Ride Published Successfully!
            </h2>
            <Button variant="primary" onClick={() => setSubmitted(false)}>
              Publish Another Route
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* Predictive Starting Point */}
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.4rem' }}>
                Starting Point / Origin (Tamil Nadu Autocomplete)
              </label>
              <LocationAutocomplete
                value={formData.originAddress}
                placeholder="Type pickup location (e.g. Chennai Central, Tambaram)"
                icon={MapPin}
                iconColor="var(--primary)"
                onChange={(address) => setFormData(prev => ({ ...prev, originAddress: address }))}
                onSelect={(loc) => setFormData(prev => ({
                  ...prev,
                  originAddress: loc.address,
                  originCoords: [loc.longitude, loc.latitude]
                }))}
              />
            </div>

            {/* Predictive Destination */}
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.4rem' }}>
                Final Destination (Tamil Nadu Autocomplete)
              </label>
              <LocationAutocomplete
                value={formData.destAddress}
                placeholder="Type destination location (e.g. Siruseri SIPCOT, OMR)"
                icon={Navigation}
                iconColor="var(--accent-sky)"
                onChange={(address) => setFormData(prev => ({ ...prev, destAddress: address }))}
                onSelect={(loc) => setFormData(prev => ({
                  ...prev,
                  destAddress: loc.address,
                  destCoords: [loc.longitude, loc.latitude]
                }))}
              />
            </div>

            {/* Passenger Seats Selection (Max 6) */}
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.4rem' }}>
                Passenger Seats (Max 6)
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="number"
                  min="1"
                  max="6"
                  className="input-light"
                  value={formData.totalSeats}
                  onChange={(e) => setFormData({ ...formData, totalSeats: Math.min(6, Math.max(1, Number(e.target.value))) })}
                  style={{ paddingLeft: '2.4rem' }}
                />
                <Users size={16} color="var(--text-muted)" style={{ position: 'absolute', left: 12, top: 13 }} />
              </div>
            </div>

            {/* Women-Only Pool Toggle */}
            <div style={{ background: '#f8fafc', padding: '0.85rem', borderRadius: 8, border: '1px solid var(--border-color)' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={formData.isWomenOnly}
                  onChange={(e) => setFormData({ ...formData, isWomenOnly: e.target.checked })}
                  style={{ width: 18, height: 18, accentColor: 'var(--primary)' }}
                />
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)' }}>
                  🛡️ Women-Only Safe Pool (Only female seekers can match)
                </span>
              </label>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--primary-light)', padding: '0.75rem 1rem', borderRadius: 8, border: '1px solid #a7f3d0' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#065f46' }}>
                <Zap size={14} style={{ display: 'inline', marginRight: 4 }} />
                Fixed P2P Rate: ₹10 per km
              </span>
              <span style={{ fontSize: '0.75rem', color: '#047857' }}>
                Automated Fair Cost-Sharing (Max 6 Seats)
              </span>
            </div>

            <Button type="submit" variant="primary" disabled={loading} style={{ marginTop: '0.5rem' }}>
              <Navigation size={18} />
              {loading ? 'Publishing to MongoDB...' : 'Publish Ride to Live Network'}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
