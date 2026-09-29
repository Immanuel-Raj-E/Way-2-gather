import React, { useState } from 'react';
import { rideService } from '../services/api';
import MatchCard from '../components/MatchCard';
import MapView from '../components/MapView';
import NoMatchCard from '../components/NoMatchCard';
import ActiveTrip from './ActiveTrip';
import Button from '../components/Button';
import { Search, Compass, ShieldCheck, Zap, Shield, Filter, Sparkles } from 'lucide-react';

export default function FindRide() {
  const [pickup, setPickup] = useState('Koramangala 4th Block, Bangalore');
  const [dropoff, setDropoff] = useState('Electronic City Phase 1, Bangalore');
  const [preferredTime, setPreferredTime] = useState('');
  const [seatsNeeded, setSeatsNeeded] = useState(1);
  const [womenOnly, setWomenOnly] = useState(false);
  const [loading, setLoading] = useState(false);
  const [matches, setMatches] = useState([]);
  const [hasSearched, setHasSearched] = useState(false);

  // Active Trip State
  const [activeTripData, setActiveTripData] = useState(null);

  const handleSearch = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    setHasSearched(true);
    try {
      const res = await rideService.findMatches({
        origin: { address: pickup, latitude: 12.9340, longitude: 77.6280 },
        destination: { address: dropoff, latitude: 12.8450, longitude: 77.6600 },
        preferredTime: preferredTime || new Date().toISOString(),
        seatsNeeded: Number(seatsNeeded),
        womenOnly: Boolean(womenOnly)
      });
      setMatches(res.data.matches || []);
    } catch (err) {
      console.error('Failed to find matches', err);
      setMatches([]);
    } finally {
      setLoading(false);
    }
  };

  const handleBookPool = async (match) => {
    try {
      const res = await rideService.requestRide({
        rideId: match.id || match._id,
        origin: { address: pickup, latitude: 12.9340, longitude: 77.6280 },
        destination: { address: dropoff, latitude: 12.8450, longitude: 77.6600 },
        seatsNeeded: Number(seatsNeeded),
        seekerName: 'Priya (Seeker)',
        seekerGender: womenOnly ? 'female' : 'unspecified'
      });

      // Launch active trip state
      setActiveTripData({
        id: match.id || match._id,
        driver: { name: match.driver_name, rating: match.driver_rating, gender: match.driver_gender },
        vehicle: match.vehicle || { plateNumber: 'KA-01-MJ-8821', model: 'Honda City', color: 'Silver' },
        origin: match.origin,
        destination: match.destination,
        isWomenOnly: match.is_women_only || womenOnly,
        totalSeats: match.total_seats || 3,
        availableSeats: match.available_seats || 2,
        activePassengers: [
          {
            id: 'p_curr',
            seekerName: 'Priya (Seeker)',
            pickupPoint: { address: pickup, latitude: 12.9340, longitude: 77.6280 },
            dropPoint: { address: dropoff, latitude: 12.8450, longitude: 77.6600 },
            status: 'boarded',
            otp: res.data.passenger?.otp || '7821',
            sharedDistanceKm: 18.2,
            seatCount: Number(seatsNeeded)
          }
        ]
      });
    } catch (e) {
      // Demo active trip fallback
      setActiveTripData({
        id: match.id || 'demo_101',
        driver: { name: match.driver_name || 'Priya Sharma', rating: 4.95, gender: 'female' },
        vehicle: match.vehicle || { plateNumber: 'KA-01-MJ-8821', model: 'Honda City', color: 'Silver' },
        origin: match.origin,
        destination: match.destination,
        isWomenOnly: womenOnly,
        totalSeats: 3,
        availableSeats: 2,
        activePassengers: [
          {
            id: 'p_curr',
            seekerName: 'Priya (Seeker)',
            pickupPoint: { address: pickup, latitude: 12.9340, longitude: 77.6280 },
            dropPoint: { address: dropoff, latitude: 12.8450, longitude: 77.6600 },
            status: 'boarded',
            otp: '4829',
            sharedDistanceKm: 18.2,
            seatCount: 1
          }
        ]
      });
    }
  };

  const handleAdjustTime = (preset) => {
    const now = new Date();
    if (typeof preset === 'number') {
      now.setMinutes(now.getMinutes() + preset);
    } else if (preset === 'morning') {
      now.setDate(now.getDate() + 1);
      now.setHours(8, 30, 0, 0);
    } else {
      now.setHours(now.getHours() + 1);
    }
    setPreferredTime(now.toISOString().slice(0, 16));
    handleSearch();
  };

  if (activeTripData) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Button variant="secondary" onClick={() => setActiveTripData(null)}>
            ← Back to Search
          </Button>
        </div>
        <ActiveTrip rideData={activeTripData} onTripEnd={() => setActiveTripData(null)} />
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Header Banner */}
      <div style={{ textAlign: 'center', padding: '1rem 0 0.5rem' }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
          padding: '0.35rem 1rem', borderRadius: 9999, background: 'rgba(99, 102, 241, 0.15)',
          border: '1px solid rgba(99, 102, 241, 0.3)', color: 'var(--primary-light)',
          fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.8rem'
        }}>
          <Zap size={15} /> AI Match Engine & Women's Safe Corridor
        </div>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 800, lineHeight: 1.2, marginBottom: '0.6rem' }}>
          Find Your Smart Shared Pool
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '1rem', maxWidth: '640px', margin: '0 auto' }}>
          Real-time corridor matching, ₹5/km exact segment pricing, multi-passenger OTP security, and instant women-only pools.
        </p>
      </div>

      {/* Search Filter Form */}
      <div className="glass-panel" style={{ maxWidth: '980px', margin: '0 auto', width: '100%' }}>
        <form onSubmit={handleSearch} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                Pickup Location
              </label>
              <input
                type="text"
                value={pickup}
                onChange={(e) => setPickup(e.target.value)}
                placeholder="Pickup address"
                style={{
                  width: '100%', padding: '0.75rem 1rem', borderRadius: 8,
                  background: 'rgba(0, 0, 0, 0.35)', border: '1px solid var(--border-color)',
                  color: 'var(--text-main)', fontSize: '0.9rem'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                Drop-off Destination
              </label>
              <input
                type="text"
                value={dropoff}
                onChange={(e) => setDropoff(e.target.value)}
                placeholder="Destination address"
                style={{
                  width: '100%', padding: '0.75rem 1rem', borderRadius: 8,
                  background: 'rgba(0, 0, 0, 0.35)', border: '1px solid var(--border-color)',
                  color: 'var(--text-main)', fontSize: '0.9rem'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                Departure Window
              </label>
              <input
                type="datetime-local"
                value={preferredTime}
                onChange={(e) => setPreferredTime(e.target.value)}
                style={{
                  width: '100%', padding: '0.75rem 1rem', borderRadius: 8,
                  background: 'rgba(0, 0, 0, 0.35)', border: '1px solid var(--border-color)',
                  color: 'var(--text-main)', fontSize: '0.9rem'
                }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '1rem' }}>
            {/* Women-Only Pool Toggle */}
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={womenOnly}
                onChange={(e) => setWomenOnly(e.target.checked)}
                style={{ width: 18, height: 18, accentColor: 'var(--accent-rose)' }}
              />
              <span style={{ fontSize: '0.9rem', fontWeight: 700, color: womenOnly ? 'var(--accent-rose)' : 'var(--text-main)' }}>
                🛡️ Women-Only Pool Barrier
              </span>
              <span className="badge-tag" style={{ fontSize: '0.7rem' }}>
                Verified Female Hosts Only
              </span>
            </label>

            <Button type="submit" disabled={loading} style={{ minWidth: '160px' }}>
              <Search size={18} />
              {loading ? 'Analyzing Corridor...' : 'Find Matches'}
            </Button>
          </div>
        </form>
      </div>

      {/* Main Content: Map & Ranked Matches OR Graceful No Match */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(320px, 1.15fr) minmax(320px, 1fr)', gap: '1.5rem' }}>
        <MapView
          origin={{ address: pickup }}
          destination={{ address: dropoff }}
          matches={matches}
        />

        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>
              {matches.length > 0 ? `Matching Corridors (${matches.length})` : 'Search Results'}
            </h2>
            {womenOnly && (
              <span className="badge-tag" style={{ color: 'var(--accent-rose)', background: 'rgba(244,63,94,0.15)' }}>
                Filter: Women-Only Enabled
              </span>
            )}
          </div>

          {/* Graceful No Match Condition */}
          {hasSearched && matches.length === 0 ? (
            <NoMatchCard onAdjustTime={handleAdjustTime} />
          ) : !hasSearched ? (
            <div className="glass-panel" style={{ textAlign: 'center', padding: '3.5rem 1.5rem' }}>
              <Compass size={40} color="var(--text-muted)" style={{ margin: '0 auto 1rem' }} />
              <div style={{ fontWeight: 700, marginBottom: '0.4rem' }}>Ready to match</div>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                Enter your commute endpoints to calculate detour metrics, 6D feature vectors, and dynamic cost split.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {matches.map((m, idx) => (
                <MatchCard
                  key={m.id || idx}
                  match={m}
                  onRequest={() => handleBookPool(m)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
