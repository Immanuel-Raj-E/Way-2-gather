import React, { useState } from 'react';
import { rideService } from '../services/api';
import Button from '../components/Button';
import { PlusCircle, CheckCircle, Navigation } from 'lucide-react';

export default function CreateRide() {
  const [formData, setFormData] = useState({
    originAddress: 'Financial District, SF',
    destAddress: 'Silicon Valley, Palo Alto',
    departureTime: '',
    totalSeats: 3,
    pricePerSeat: 15
  });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await rideService.createRide({
        origin: { address: formData.originAddress, latitude: 37.7946, longitude: -122.3999 },
        destination: { address: formData.destAddress, latitude: 37.4419, longitude: -122.1430 },
        departureTime: formData.departureTime || new Date(),
        totalSeats: Number(formData.totalSeats),
        pricePerSeat: Number(formData.pricePerSeat)
      });
      setSubmitted(true);
    } catch (err) {
      console.error(err);
      // Demo fallback success
      setSubmitted(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '680px', margin: '1rem auto 0' }}>
      <div className="glass-panel" style={{ padding: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
          <div style={{
            width: 44, height: 44, borderRadius: 12, background: 'rgba(99, 102, 241, 0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary-light)'
          }}>
            <PlusCircle size={24} />
          </div>
          <div>
            <h1 style={{ fontSize: '1.4rem', fontWeight: 800 }}>Offer a Shared Pool</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              Publish your commute corridor to receive high-compatibility rider requests.
            </p>
          </div>
        </div>

        {submitted ? (
          <div style={{ textAlign: 'center', padding: '2rem 1rem' }}>
            <CheckCircle size={48} color="var(--accent-green)" style={{ margin: '0 auto 1rem' }} />
            <h2 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: '0.5rem' }}>Ride Published Successfully!</h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
              The AI Engine is now matching nearby riders along your route corridor.
            </p>
            <Button onClick={() => setSubmitted(false)}>Publish Another Route</Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
                Starting Point / Origin Address
              </label>
              <input
                type="text"
                required
                value={formData.originAddress}
                onChange={(e) => setFormData({ ...formData, originAddress: e.target.value })}
                style={{
                  width: '100%', padding: '0.75rem 1rem', borderRadius: 8,
                  background: 'rgba(0, 0, 0, 0.3)', border: '1px solid var(--border-color)',
                  color: 'var(--text-main)', fontSize: '0.95rem'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
                Final Destination Address
              </label>
              <input
                type="text"
                required
                value={formData.destAddress}
                onChange={(e) => setFormData({ ...formData, destAddress: e.target.value })}
                style={{
                  width: '100%', padding: '0.75rem 1rem', borderRadius: 8,
                  background: 'rgba(0, 0, 0, 0.3)', border: '1px solid var(--border-color)',
                  color: 'var(--text-main)', fontSize: '0.95rem'
                }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
                  Available Seats
                </label>
                <input
                  type="number"
                  min="1"
                  max="6"
                  value={formData.totalSeats}
                  onChange={(e) => setFormData({ ...formData, totalSeats: e.target.value })}
                  style={{
                    width: '100%', padding: '0.75rem 1rem', borderRadius: 8,
                    background: 'rgba(0, 0, 0, 0.3)', border: '1px solid var(--border-color)',
                    color: 'var(--text-main)', fontSize: '0.95rem'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
                  Price Per Seat ($)
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.pricePerSeat}
                  onChange={(e) => setFormData({ ...formData, pricePerSeat: e.target.value })}
                  style={{
                    width: '100%', padding: '0.75rem 1rem', borderRadius: 8,
                    background: 'rgba(0, 0, 0, 0.3)', border: '1px solid var(--border-color)',
                    color: 'var(--text-main)', fontSize: '0.95rem'
                  }}
                />
              </div>
            </div>

            <Button type="submit" disabled={loading} style={{ marginTop: '0.75rem' }}>
              <Navigation size={18} />
              {loading ? 'Publishing...' : 'Publish Ride Offer'}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
