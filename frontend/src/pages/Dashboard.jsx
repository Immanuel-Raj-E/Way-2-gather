import React, { useEffect, useState } from 'react';
import { socket, rideService } from '../services/api';
import { formatCurrency, formatDateTime } from '../utils/helpers';
import ReviewModal from '../components/ReviewModal';
import ActiveTripMap from '../components/ActiveTripMap';
import Button from '../components/Button';
import { 
  LayoutDashboard, Car, Clock, ShieldCheck, ShieldAlert, 
  TrendingUp, Leaf, Cpu, CheckCircle2, UserX, Fingerprint, Star, Play, MapPin 
} from 'lucide-react';

export default function Dashboard({ kycUser, onOpenKyc }) {
  const [rides, setRides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [harassmentStrikes, setHarassmentStrikes] = useState(0);
  const [accountStatus, setAccountStatus] = useState(kycUser?.accountStatus || 'Active');

  // Step 3: Active Ride State for Map Transition
  const [activeRide, setActiveRide] = useState(null);

  // Listen for Socket.io ride_started event
  useEffect(() => {
    socket.on('ride_started', (data) => {
      console.log('[Socket.io UI Event]: ride_started received -> Transitioning to Mapbox Live Map', data);
      setActiveRide(data);
    });

    return () => {
      socket.off('ride_started');
    };
  }, []);

  useEffect(() => {
    const fetchRides = async () => {
      try {
        const res = await rideService.getAvailableRides();
        setRides(res.data.rides || []);
      } catch (err) {
        setRides([
          {
            _id: 'ride_blr_101',
            driver: { name: 'Priya Sharma (KYC Verified)', rating: 4.95, gender: 'Female' },
            origin: { address: 'Koramangala 4th Block', latitude: 12.9340, longitude: 77.6280 },
            destination: { address: 'Electronic City Phase 1', latitude: 12.8450, longitude: 77.6600 },
            departureTime: new Date(Date.now() + 15 * 60000).toISOString(),
            availableSeats: 2,
            pricePerSeat: 10,
            status: 'scheduled',
            isWomenOnly: true
          }
        ]);
      } finally {
        setLoading(false);
      }
    };
    fetchRides();
  }, []);

  const handleHostAcceptRide = (ride) => {
    const rideId = ride._id || ride.id || 'ride_blr_101';
    
    // Emit accept_ride via Socket.io to trigger backend and mutual app transition
    socket.emit('accept_ride', {
      rideId,
      hostId: 'host_priya_sharma',
      seekerId: 'seeker_ananya_reddy',
      rideDetails: {
        origin: ride.origin,
        destination: ride.destination,
        hostName: ride.driver?.name || 'Priya Sharma',
        vehicle: { plateNumber: 'KA-01-MJ-8821', model: 'Honda City' }
      }
    });

    // Immediate state transition for local client
    setActiveRide({
      rideId,
      hostLocation: [77.6280, 12.9340],
      seekerLocation: [77.6600, 12.8450],
      hostName: ride.driver?.name || 'Priya Sharma',
      vehicle: { plateNumber: 'KA-01-MJ-8821', model: 'Honda City' }
    });
  };

  const handleReviewSubmitted = (data) => {
    if (data.safetyStatus) {
      setHarassmentStrikes(data.safetyStatus.totalHarassmentReports);
      setAccountStatus(data.safetyStatus.accountStatus);
    }
  };

  // STEP 3: If activeRide is present, unmount normal dashboard and render Fullscreen Mapbox ActiveTripMap
  if (activeRide) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <ActiveTripMap
          activeRide={activeRide}
          userRole="host"
          onEndTrip={() => setActiveRide(null)}
        />
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.9rem', fontWeight: 800 }}>Driver, Passenger & Safety Telemetry</h1>
          <p style={{ color: 'var(--text-muted)' }}>
            Real-time KYC authentication status, automated harassment strike monitoring, and corridor telemetry.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.8rem' }}>
          <Button variant="secondary" onClick={() => setIsReviewOpen(true)}>
            <Star size={16} /> Submit Safety Feedback / Strike
          </Button>
        </div>
      </div>

      {/* KYC & Safety Profile Card */}
      <div className="glass-panel" style={{
        background: accountStatus === 'Blocked'
          ? 'rgba(244, 63, 94, 0.15)'
          : 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(99, 102, 241, 0.1) 100%)',
        border: accountStatus === 'Blocked' ? '2px solid var(--accent-rose)' : '1px solid var(--border-glow)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{
            width: 48, height: 48, borderRadius: '50%',
            background: accountStatus === 'Blocked' ? 'rgba(244, 63, 94, 0.2)' : 'rgba(16, 185, 129, 0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: accountStatus === 'Blocked' ? 'var(--accent-rose)' : 'var(--accent-green)'
          }}>
            {accountStatus === 'Blocked' ? <UserX size={26} /> : <ShieldCheck size={26} />}
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>{kycUser?.name || 'Priya Sharma'}</h3>
              {kycUser?.isVerified ? (
                <span className="badge-score high" style={{ fontSize: '0.75rem' }}>
                  ✓ Aadhar KYC Verified ({kycUser?.aadharMasked || '********8821'})
                </span>
              ) : (
                <span className="badge-tag" style={{ color: 'var(--accent-rose)', cursor: 'pointer' }} onClick={onOpenKyc}>
                  ⚠️ KYC Pending - Click to Verify
                </span>
              )}
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              SHA-256 Government ID Hash Secured • Safety Standing: <b>{accountStatus}</b>
            </div>
          </div>
        </div>

        {/* Safety Harassment Strike Monitor */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.2rem' }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Harassment Strikes (Max 5)</div>
            <div style={{
              fontSize: '1.3rem', fontWeight: 800,
              color: harassmentStrikes >= 5 ? 'var(--accent-rose)' : harassmentStrikes > 2 ? 'var(--accent-amber)' : 'var(--accent-green)'
            }}>
              {harassmentStrikes} / 5 Strikes
            </div>
          </div>

          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Account Safety Status</div>
            <span className="badge-tag" style={{
              background: accountStatus === 'Blocked' ? 'rgba(244,63,94,0.2)' : 'rgba(16,185,129,0.2)',
              color: accountStatus === 'Blocked' ? 'var(--accent-rose)' : 'var(--accent-green)',
              fontWeight: 800
            }}>
              {accountStatus.toUpperCase()}
            </span>
          </div>
        </div>
      </div>

      {/* Match Cards with Host "Accept" Socket.io Handshake Trigger */}
      <div className="glass-panel" style={{ border: '1px solid var(--border-glow)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem' }}>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Pending Carpool Requests (Host Handshake)</h2>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Click "Accept & Launch Live Map" to emit <code>accept_ride</code> via Socket.io and transition both users into Mapbox live tracking.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {rides.map((r) => (
            <div
              key={r._id}
              style={{
                background: 'rgba(0,0,0,0.35)', border: '1px solid var(--border-color)',
                padding: '1.2rem', borderRadius: 12, display: 'flex', justifyContent: 'space-between',
                alignItems: 'center', flexWrap: 'wrap', gap: '1rem'
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.3rem' }}>
                  <span style={{ fontWeight: 800, fontSize: '1.05rem' }}>{r.driver?.name || 'Verified Host'}</span>
                  {r.isWomenOnly && (
                    <span className="badge-tag" style={{ color: 'var(--accent-rose)' }}>🛡️ Women-Only</span>
                  )}
                  <span className="badge-score high" style={{ fontSize: '0.7rem' }}>99.2% Fit</span>
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  Route: <b>{r.origin?.address}</b> ➔ <b>{r.destination?.address}</b>
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--accent-cyan)', marginTop: '0.2rem' }}>
                  Departure: {formatDateTime(r.departureTime)} • {r.availableSeats} seats open
                </div>
              </div>

              {/* Host Socket Accept Trigger */}
              <Button
                variant="success"
                onClick={() => handleHostAcceptRide(r)}
                style={{ padding: '0.65rem 1.3rem', fontSize: '0.95rem' }}
              >
                <Play size={16} fill="white" /> Accept & Launch Live Map (Socket.io)
              </Button>
            </div>
          ))}
        </div>
      </div>

      {/* Metrics Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
        <div className="glass-panel">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            <Fingerprint size={16} color="var(--accent-green)" /> Identity Security
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, marginTop: '0.5rem', color: 'var(--accent-green)' }}>
            100% KYC
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>SHA-256 Aadhar Hash</div>
        </div>

        <div className="glass-panel">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            <ShieldAlert size={16} color="var(--accent-rose)" /> Automated Ban Rule
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, marginTop: '0.5rem', color: 'var(--accent-rose)' }}>
            5 Strikes
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Instant Irreversible Ban</div>
        </div>

        <div className="glass-panel">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            <Leaf size={16} color="var(--accent-green)" /> Total CO₂ Offset
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, marginTop: '0.5rem', color: 'var(--accent-green)' }}>54.2 kg</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>0.192 kg CO₂/km formula</div>
        </div>
      </div>

      {/* Review Modal */}
      <ReviewModal
        isOpen={isReviewOpen}
        onClose={() => setIsReviewOpen(false)}
        targetUser={{ id: 'mock_target_1', name: 'Rogue Passenger' }}
        onReviewSubmitted={handleReviewSubmitted}
      />
    </div>
  );
}
