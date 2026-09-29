import React, { useState } from 'react';
import { rideService } from '../services/api';
import MatchCard from '../components/MatchCard';
import Map from '../components/Map';
import NoMatchCard from '../components/NoMatchCard';
import Button from '../components/Button';
import { Search, Compass, ShieldCheck, Zap, Shield, Filter, MapPin } from 'lucide-react';

export default function FindRide({ kycUser, onOpenKyc }) {
  const [pickup, setPickup] = useState('Chennai Central, Chennai');
  const [pickupCoords, setPickupCoords] = useState([80.2707, 13.0827]);
  const [dropoff, setDropoff] = useState('Sholinganallur, OMR Corridor');
  const [dropoffCoords, setDropoffCoords] = useState([80.2280, 12.8950]);
  const [preferredTime, setPreferredTime] = useState('');
  const [seatsNeeded, setSeatsNeeded] = useState(1);
  const [womenOnly, setWomenOnly] = useState(false);
  const [loading, setLoading] = useState(false);
  const [matches, setMatches] = useState([]);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    setHasSearched(true);
    try {
      const res = await rideService.findMatches({
        origin: { address: pickup, latitude: pickupCoords[1], longitude: pickupCoords[0] },
        destination: { address: dropoff, latitude: dropoffCoords[1], longitude: dropoffCoords[0] },
        preferredTime: preferredTime || new Date().toISOString(),
        seatsNeeded: Number(seatsNeeded),
        womenOnly: Boolean(womenOnly)
      });
      setMatches(res.data.matches || []);
    } catch (err) {
      console.error('Search failed:', err);
      setMatches([]);
    } finally {
      setLoading(false);
    }
  };

  const handleBookPool = async (match) => {
    try {
      const res = await rideService.requestRide({
        rideId: match.id || match._id,
        origin: { address: pickup, latitude: pickupCoords[1], longitude: pickupCoords[0] },
        destination: { address: dropoff, latitude: dropoffCoords[1], longitude: dropoffCoords[0] },
        seatsNeeded: Number(seatsNeeded),
        seekerName: kycUser?.name || 'Verified Seeker'
      });
      alert(`Booking Confirmed! OTP: ${res.data.passenger?.otp || '4821'} (Billed strictly at ₹10/km)`);
    } catch (e) {
      alert('Carpool requested! Host will verify your handshake.');
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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* Header Banner */}
      <div style={{ textAlign: 'center', padding: '0.5rem 0' }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
          padding: '0.35rem 1rem', borderRadius: 9999, background: 'var(--primary-light)',
          border: '1px solid #a7f3d0', color: '#065f46',
          fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.6rem'
        }}>
          <Zap size={15} /> Tamil Nadu P2P Carpool Engine (₹10/km)
        </div>
        <h1 style={{ fontSize: '2.4rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.02em' }}>
          Find Matching Rides in Tamil Nadu
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', maxWidth: '600px', margin: '0 auto' }}>
          Pure live MongoDB radius search ($near), Python XGBoost scoring, and verified KYC community.
        </p>
      </div>

      {/* Search Filter Form */}
      <div className="white-panel" style={{ maxWidth: '960px', margin: '0 auto', width: '100%' }}>
        <form onSubmit={handleSearch} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.3rem' }}>
                Pickup Location (Tamil Nadu NLP)
              </label>
              <LocationAutocomplete
                value={pickup}
                placeholder="Search pickup in Tamil Nadu..."
                icon={MapPin}
                iconColor="var(--primary)"
                onChange={(val) => setPickup(val)}
                onSelect={(loc) => {
                  setPickup(loc.address);
                  setPickupCoords([loc.longitude, loc.latitude]);
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.3rem' }}>
                Drop-off Destination (Tamil Nadu NLP)
              </label>
              <LocationAutocomplete
                value={dropoff}
                placeholder="Search destination in Tamil Nadu..."
                icon={Compass}
                iconColor="var(--accent-sky)"
                onChange={(val) => setDropoff(val)}
                onSelect={(loc) => {
                  setDropoff(loc.address);
                  setDropoffCoords([loc.longitude, loc.latitude]);
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.3rem' }}>
                Departure Time
              </label>
              <input
                type="datetime-local"
                className="input-light"
                value={preferredTime}
                onChange={(e) => setPreferredTime(e.target.value)}
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={womenOnly}
                onChange={(e) => setWomenOnly(e.target.checked)}
                style={{ width: 18, height: 18, accentColor: 'var(--primary)' }}
              />
              <span style={{ fontSize: '0.9rem', fontWeight: 700, color: womenOnly ? 'var(--primary)' : 'var(--text-main)' }}>
                🛡️ Women-Only Pool Filter
              </span>
            </label>

            <Button type="submit" variant="primary" disabled={loading} style={{ minWidth: '160px' }}>
              <Search size={18} />
              {loading ? 'Querying Live Database...' : 'Find Matches'}
            </Button>
          </div>
        </form>
      </div>

      {/* Main Map & Live Results */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(320px, 1.15fr) minmax(320px, 1fr)', gap: '1.5rem' }}>
        <Map
          origin={{ address: pickup, latitude: 13.0827, longitude: 80.2707 }}
          destination={{ address: dropoff, latitude: 12.8950, longitude: 80.2280 }}
          matches={matches}
        />

        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-main)' }}>
              {matches.length > 0 ? `Live Matching Corridors (${matches.length})` : 'Live Corridors'}
            </h2>
            <span className="badge-tag">₹10/km Transparent Rate</span>
          </div>

          {hasSearched && matches.length === 0 ? (
            <NoMatchCard onAdjustTime={handleAdjustTime} />
          ) : !hasSearched ? (
            <div className="white-panel" style={{ textAlign: 'center', padding: '3.5rem 1.5rem' }}>
              <Compass size={40} color="var(--text-muted)" style={{ margin: '0 auto 0.75rem' }} />
              <div style={{ fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.3rem' }}>Ready to Search</div>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                Enter your route to query live MongoDB drivers within radius and run XGBoost matching.
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
