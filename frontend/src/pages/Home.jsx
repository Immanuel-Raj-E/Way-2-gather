import React, { useState } from 'react';
import { rideService } from '../services/api';
import MatchCard from '../components/MatchCard';
import MapView from '../components/MapView';
import LiveRideTracker from '../components/LiveRideTracker';
import Button from '../components/Button';
import { Search, Compass, ShieldCheck, Zap, Cpu, Sparkles, Filter } from 'lucide-react';

export default function Home() {
  const [pickup, setPickup] = useState('Market St & 4th St, San Francisco');
  const [dropoff, setDropoff] = useState('Mission District, San Francisco');
  const [preferredTime, setPreferredTime] = useState('');
  const [seatsNeeded, setSeatsNeeded] = useState(1);
  const [loading, setLoading] = useState(false);
  const [matches, setMatches] = useState([]);
  const [totalHardFiltered, setTotalHardFiltered] = useState(null);

  // Active Handshake / Ride State
  const [activeRide, setActiveRide] = useState(null);
  const [activeRequest, setActiveRequest] = useState(null);

  const handleSearch = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await rideService.findMatches({
        origin: { address: pickup, latitude: 37.7858, longitude: -122.4065 },
        destination: { address: dropoff, latitude: 37.7599, longitude: -122.4148 },
        preferredTime: preferredTime || new Date().toISOString(),
        seatsNeeded: Number(seatsNeeded)
      });
      setMatches(res.data.matches || []);
      setTotalHardFiltered(res.data.total_hard_filtered || res.data.matches?.length || 0);
    } catch (err) {
      console.error('Failed to find matches', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRequestPool = async (match) => {
    try {
      const res = await rideService.requestRide({
        rideId: match.id || match._id,
        origin: { address: pickup, latitude: 37.7858, longitude: -122.4065 },
        destination: { address: dropoff, latitude: 37.7599, longitude: -122.4148 },
        seatsNeeded: Number(seatsNeeded),
        featureVector: match.features_6d,
        matchAcceptanceProbability: match.match_acceptance_probability
      });
      setActiveRide(match);
      setActiveRequest(res.data.request || { _id: 'demo_req_1', status: 'pending' });
    } catch (err) {
      setActiveRide(match);
      setActiveRequest({ _id: 'demo_req_1', status: 'pending' });
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Hero Header */}
      <div style={{ textAlign: 'center', padding: '1rem 0' }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
          padding: '0.4rem 1.1rem', borderRadius: 9999, background: 'rgba(99, 102, 241, 0.15)',
          border: '1px solid rgba(99, 102, 241, 0.35)', color: 'var(--primary-light)',
          fontSize: '0.85rem', fontWeight: 700, marginBottom: '1rem'
        }}>
          <Cpu size={15} /> Microservice Carpooling Architecture (Node + FastAPI + XGBoost)
        </div>
        <h1 style={{ fontSize: '2.6rem', fontWeight: 800, lineHeight: 1.2, marginBottom: '0.8rem', letterSpacing: '-0.02em' }}>
          Predictive Ride-Pooling with <br />
          <span style={{
            background: 'linear-gradient(135deg, #818cf8 0%, #06b6d4 100%)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'
          }}>
            AI Match Acceptance & Live Safety Corridor
          </span>
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '1.05rem', maxWidth: '720px', margin: '0 auto' }}>
          Instant Mongo hard-filtering, 6-feature vector geospatial calculations, XGBoost acceptance scoring, WebSocket handshakes with OTP locks, and live GPS deviation alerts.
        </p>
      </div>

      {/* Active Live Ride Banner / Tracker */}
      {activeRide && (
        <LiveRideTracker 
          activeRide={activeRide}
          activeRequest={activeRequest}
          onComplete={() => {
            setActiveRide(null);
            setActiveRequest(null);
          }}
        />
      )}

      {/* Seeker Search Form */}
      <div className="glass-panel" style={{ maxWidth: '960px', margin: '0 auto', width: '100%' }}>
        <form onSubmit={handleSearch} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr)) auto', gap: '1rem', alignItems: 'flex-end' }}>
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
              placeholder="Dropoff destination"
              style={{
                width: '100%', padding: '0.75rem 1rem', borderRadius: 8,
                background: 'rgba(0, 0, 0, 0.35)', border: '1px solid var(--border-color)',
                color: 'var(--text-main)', fontSize: '0.9rem'
              }}
            />
          </div>

          <div style={{ maxWidth: '120px' }}>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
              Seats
            </label>
            <input
              type="number"
              min="1"
              max="4"
              value={seatsNeeded}
              onChange={(e) => setSeatsNeeded(e.target.value)}
              style={{
                width: '100%', padding: '0.75rem 1rem', borderRadius: 8,
                background: 'rgba(0, 0, 0, 0.35)', border: '1px solid var(--border-color)',
                color: 'var(--text-main)', fontSize: '0.9rem'
              }}
            />
          </div>

          <Button type="submit" disabled={loading} style={{ height: '44px' }}>
            <Search size={18} />
            {loading ? 'Running AI Inference...' : 'Match Rides'}
          </Button>
        </form>
      </div>

      {/* Main Corridor Map & AI Match Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(320px, 1.15fr) minmax(320px, 1fr)', gap: '1.5rem' }}>
        <MapView 
          origin={{ address: pickup }}
          destination={{ address: dropoff }}
          matches={matches}
        />

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>
              {matches.length > 0 ? `Ranked Pool Matches (${matches.length})` : 'Available Pools'}
            </h2>
            {totalHardFiltered !== null && (
              <span className="badge-tag">
                <Filter size={12} style={{ marginRight: 4 }} /> {totalHardFiltered} candidates survived hard-filtering
              </span>
            )}
          </div>

          {matches.length === 0 ? (
            <div className="glass-panel" style={{ textAlign: 'center', padding: '3.5rem 1.5rem' }}>
              <Compass size={44} color="var(--text-muted)" style={{ margin: '0 auto 1rem' }} />
              <div style={{ fontWeight: 700, marginBottom: '0.5rem' }}>No active search query</div>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                Click "Match Rides" to trigger the Node MongoDB hard-filtering and the Python FastAPI XGBoost scoring engine.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {matches.map((m, idx) => (
                <MatchCard 
                  key={m.id || idx} 
                  match={m} 
                  isRequested={activeRide?.id === m.id || activeRide?._id === m.id}
                  onRequest={handleRequestPool} 
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
