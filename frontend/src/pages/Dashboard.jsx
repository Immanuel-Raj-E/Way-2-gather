import React, { useEffect, useState } from 'react';
import { socket, rideService } from '../services/api';
import { formatCurrency, formatDateTime } from '../utils/helpers';
import ReviewModal from '../components/ReviewModal';
import ActiveTripMap from '../components/ActiveTripMap';
import Button from '../components/Button';
import { 
  LayoutDashboard, Car, Clock, ShieldCheck, ShieldAlert, 
  TrendingUp, Leaf, Cpu, CheckCircle2, UserX, Fingerprint, Star, Play, MapPin, UserPlus 
} from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Dashboard({ kycUser, onOpenKyc }) {
  const [rides, setRides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [harassmentStrikes, setHarassmentStrikes] = useState(0);
  const [accountStatus, setAccountStatus] = useState(kycUser?.accountStatus || 'Active');
  const [driverRating, setDriverRating] = useState(kycUser?.driverRating || 5.0);
  const [seekerRating, setSeekerRating] = useState(kycUser?.seekerRating || 5.0);

  // Active Ride State for Map Transition
  const [activeRide, setActiveRide] = useState(null);

  useEffect(() => {
    socket.on('ride_started', (data) => {
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
        console.warn('Failed to load rides from MongoDB:', err.message);
        setRides([]);
      } finally {
        setLoading(false);
      }
    };
    fetchRides();
  }, []);

  const handleHostAcceptRide = (ride) => {
    const rideId = ride._id || ride.id || 'ride_live_101';
    
    socket.emit('accept_ride', {
      rideId,
      hostId: ride.driver?._id || 'host_curr',
      seekerId: 'seeker_live',
      rideDetails: {
        origin: ride.startLocation ? { latitude: ride.startLocation.coordinates[1], longitude: ride.startLocation.coordinates[0], address: ride.startLocation.address } : { latitude: 13.0827, longitude: 80.2707, address: 'Chennai Central' },
        destination: ride.endLocation ? { latitude: ride.endLocation.coordinates[1], longitude: ride.endLocation.coordinates[0], address: ride.endLocation.address } : { latitude: 12.8950, longitude: 80.2280, address: 'OMR Corridor' },
        hostName: ride.driver?.name || 'Rider',
        vehicle: ride.vehicle || { plateNumber: 'TN-01-AB-1234', model: 'Sedan' }
      }
    });

    setActiveRide({
      rideId,
      hostLocation: ride.startLocation ? [ride.startLocation.coordinates[0], ride.startLocation.coordinates[1]] : [80.2707, 13.0827],
      seekerLocation: ride.endLocation ? [ride.endLocation.coordinates[0], ride.endLocation.coordinates[1]] : [80.2280, 12.8950],
      hostName: ride.driver?.name || 'Rider',
      vehicle: ride.vehicle || { plateNumber: 'TN-01-AB-1234', model: 'Sedan' }
    });
  };

  const handleReviewSubmitted = (data) => {
    if (data.safetyStatus) {
      setHarassmentStrikes(data.safetyStatus.totalHarassmentReports);
      setAccountStatus(data.safetyStatus.accountStatus);
    }
    if (data.updatedRatings) {
      setDriverRating(data.updatedRatings.driverRating);
      setSeekerRating(data.updatedRatings.seekerRating);
    }
  };

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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-main)' }}>
            User Dashboard & Verified Telemetry
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Live MongoDB driver routes, separate ratings, and ₹10/km cost-split telemetry in Tamil Nadu.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.8rem' }}>
          <Button variant="secondary" onClick={() => setIsReviewOpen(true)}>
            <Star size={16} /> Submit Trip Feedback
          </Button>
          <Link to="/create-ride" className="btn btn-primary">
            + Offer a Ride (Host)
          </Link>
        </div>
      </div>

      {/* User Trust & Dual Rating Profile Card */}
      <div className="white-panel" style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.25rem',
        borderLeft: '4px solid var(--primary)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{
            width: 48, height: 48, borderRadius: '50%',
            background: 'var(--primary-light)', display: 'flex',
            alignItems: 'center', justifyContent: 'center', color: 'var(--primary)'
          }}>
            <ShieldCheck size={26} />
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-main)' }}>
                {kycUser?.name || 'Verified Member'}
              </h3>
              <span className="badge-score">
                ✓ Government ID Verified
              </span>
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
              Tamil Nadu P2P Member • Account Standing: <b style={{ color: 'var(--primary)' }}>{accountStatus}</b>
            </div>
          </div>
        </div>

        {/* Dual Ratings Display: Driver Rating vs Seeker Rating */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', background: '#f8fafc', padding: '0.75rem 1.25rem', borderRadius: 10, border: '1px solid var(--border-color)' }}>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Driver Rating</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary)' }}>
              ⭐ {driverRating.toFixed(1)} / 5.0
            </div>
          </div>

          <div style={{ width: 1, height: 32, background: 'var(--border-color)' }} />

          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Seeker Rating</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--accent-sky)' }}>
              ⭐ {seekerRating.toFixed(1)} / 5.0
            </div>
          </div>

          <div style={{ width: 1, height: 32, background: 'var(--border-color)' }} />

          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Safety Strikes</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: harassmentStrikes > 0 ? '#dc2626' : 'var(--primary)' }}>
              {harassmentStrikes} / 5
            </div>
          </div>
        </div>
      </div>

      {/* Live Available Rides (Host Handshake) */}
      <div className="white-panel">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem' }}>
          <div>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-main)' }}>
              Active Scheduled Pools in Tamil Nadu
            </h2>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Live rides fetched dynamically from MongoDB. Rate is strictly <b>₹10 per km</b>.
            </p>
          </div>
        </div>

        {rides.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem 1.5rem', background: '#f8fafc', borderRadius: 10, border: '1px dashed var(--border-color)' }}>
            <Car size={36} color="var(--text-muted)" style={{ margin: '0 auto 0.5rem' }} />
            <div style={{ fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.3rem' }}>No Active Rides Found</div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1rem' }}>
              Be the first to publish a ride in Chennai or across Tamil Nadu!
            </p>
            <Link to="/create-ride" className="btn btn-primary" style={{ display: 'inline-flex' }}>
              Publish New Route (Host)
            </Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
            {rides.map((r) => (
              <div
                key={r._id}
                style={{
                  background: '#ffffff', border: '1px solid var(--border-color)',
                  padding: '1.1rem', borderRadius: 10, display: 'flex', justifyContent: 'space-between',
                  alignItems: 'center', flexWrap: 'wrap', gap: '1rem', boxShadow: 'var(--shadow-sm)'
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                    <span style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--text-main)' }}>
                      {r.driver?.name || 'Rider'}
                    </span>
                    <span className="badge-score" style={{ fontSize: '0.75rem' }}>
                      ⭐ Driver: {r.driver?.driverRating || 5.0}
                    </span>
                    {r.isWomenOnly && (
                      <span className="badge-tag" style={{ color: '#be123c', background: '#ffe4e6' }}>
                        🛡️ Women-Only
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    Route: <b>{r.startLocation?.address || r.origin?.address || 'Origin'}</b> ➔ <b>{r.endLocation?.address || r.destination?.address || 'Destination'}</b>
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--primary)', marginTop: '0.2rem', fontWeight: 600 }}>
                    Departure: {formatDateTime(r.departureTime)} • {r.availableSeats} seats open • ₹10/km
                  </div>
                </div>

                <Button
                  variant="primary"
                  onClick={() => handleHostAcceptRide(r)}
                  style={{ padding: '0.6rem 1.2rem', fontSize: '0.85rem' }}
                >
                  <Play size={15} fill="white" /> Launch Live Map
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Review Modal */}
      <ReviewModal
        isOpen={isReviewOpen}
        onClose={() => setIsReviewOpen(false)}
        targetUser={{ id: 'mock_target_1', name: 'Fellow Traveler' }}
        onReviewSubmitted={handleReviewSubmitted}
      />
    </div>
  );
}
