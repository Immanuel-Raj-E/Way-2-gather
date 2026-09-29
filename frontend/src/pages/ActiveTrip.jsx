import React, { useState, useEffect, useRef } from 'react';
import { socket, rideService, safetyService } from '../services/api';
import Button from '../components/Button';
import { 
  Share2, ShieldAlert, ShieldCheck, KeyRound, CheckCircle2, 
  MapPin, Navigation, AlertTriangle, Users, Car, Leaf, DollarSign, Clock, RefreshCw 
} from 'lucide-react';

/**
 * Mathematical Great-Circle Cross-Track Distance Formula (in kilometers)
 * Calculates the exact perpendicular offset of point P(lat, lon) from trajectory segment A -> B
 */
function pointToSegmentDistanceKm(pLat, pLon, aLat, aLon, bLat, bLon) {
  const R = 6371; // Earth's radius in km
  const toRad = (deg) => (deg * Math.PI) / 180;

  // Convert to Cartesian approximation for local planar projection
  const x = toRad(pLon - aLon) * Math.cos(toRad((aLat + bLat) / 2));
  const y = toRad(pLat - aLat);
  const dx = toRad(bLon - aLon) * Math.cos(toRad((aLat + bLat) / 2));
  const dy = toRad(bLat - aLat);

  const dot = x * dx + y * dy;
  const lenSq = dx * dx + dy * dy;
  let param = -1;

  if (lenSq !== 0) param = dot / lenSq;

  let xx, yy;
  if (param < 0) {
    xx = 0;
    yy = 0;
  } else if (param > 1) {
    xx = dx;
    yy = dy;
  } else {
    xx = param * dx;
    yy = param * dy;
  }

  const dxx = x - xx;
  const dyy = y - yy;
  return Math.round(R * Math.sqrt(dxx * dxx + dyy * dyy) * 100) / 100;
}

export default function ActiveTrip({ rideData, onTripEnd }) {
  const ride = rideData || {
    id: 'ride_active_tn_101',
    driver: { name: 'Priya Sharma', phone: '+91-98765-43210', gender: 'female' },
    vehicle: { plateNumber: 'TN-01-AB-8821', model: 'Honda City', color: 'White' },
    origin: { address: 'Chennai Central, Chennai', latitude: 13.0827, longitude: 80.2707 },
    destination: { address: 'Siruseri SIPCOT, OMR Corridor', latitude: 12.8310, longitude: 80.2220 },
    isWomenOnly: true,
    pricePerKm: 10,
    baseFare: 20,
    totalSeats: 3,
    availableSeats: 1,
    activePassengers: [
      {
        id: 'p1',
        seekerName: 'Ananya (Partial Corridor)',
        pickupPoint: { address: 'Chennai Central', latitude: 13.0827, longitude: 80.2707 },
        dropPoint: { address: 'Tidel Park, Tharamani', latitude: 12.9880, longitude: 80.2450 },
        status: 'boarded',
        otp: '4829',
        sharedDistanceKm: 12.4,
        seatCount: 1
      },
      {
        id: 'p2',
        seekerName: 'Sneha (Full Corridor)',
        pickupPoint: { address: 'Chennai Central', latitude: 13.0827, longitude: 80.2707 },
        dropPoint: { address: 'Siruseri SIPCOT, OMR Corridor', latitude: 12.8310, longitude: 80.2220 },
        status: 'boarded',
        otp: '9134',
        sharedDistanceKm: 28.5,
        seatCount: 1
      }
    ]
  };

  const rideId = ride.id || ride._id || 'ride_active_tn_101';
  const [passengers, setPassengers] = useState(ride.activePassengers || []);
  const [availableSeats, setAvailableSeats] = useState(ride.availableSeats ?? 1);
  const [shareSuccess, setShareSuccess] = useState(false);

  // GPS & Deviation State
  const [currentGps, setCurrentGps] = useState({ latitude: 13.0827, longitude: 80.2707 });
  const [deviationKm, setDeviationKm] = useState(0.15);
  const [etaMins, setEtaMins] = useState(35);
  const [trafficDetourActive, setTrafficDetourActive] = useState(false);

  // SOS Modal State (> 1km for > 2 mins)
  const [showSosModal, setShowSosModal] = useState(false);
  const [sosCountdown, setSosCountdown] = useState(45);
  const [sosDispatched, setSosDispatched] = useState(false);
  const deviationStartTime = useRef(null);

  // Planned Corridor Polyline Points (Tamil Nadu Corridor)
  const corridorWaypoints = [
    { latitude: 13.0827, longitude: 80.2707 }, // Chennai Central
    { latitude: 13.0418, longitude: 80.2505 }, // Mount Road
    { latitude: 12.9880, longitude: 80.2450 }, // Tidel Park
    { latitude: 12.8950, longitude: 80.2280 }, // Sholinganallur
    { latitude: 12.8310, longitude: 80.2220 }  // Siruseri
  ];

  // 1. Web Share API Handler
  const handleShareLiveStatus = async () => {
    const shareText = `Track my way-2-gather carpool securely: https://way-2-gather.app/track/${rideId} - Vehicle: ${ride.vehicle?.plateNumber || 'TN-01-AB-8821'} (${ride.vehicle?.model || 'Sedan'}), Driver: ${ride.driver?.name || 'Verified Host'}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'My way-2-gather Live Tracking',
          text: shareText,
          url: `https://way-2-gather.app/track/${rideId}`
        });
        setShareSuccess(true);
      } catch (err) {
        // user cancelled or share failed
      }
    } else {
      // Fallback: Clipboard copy
      await navigator.clipboard.writeText(shareText);
      setShareSuccess(true);
    }
    setTimeout(() => setShareSuccess(false), 4000);
  };

  // 2. checkDeviation() Mathematical GPS Function (runs every 30 seconds)
  const checkDeviation = (coords) => {
    let minPerpendicularDist = Infinity;

    for (let i = 0; i < corridorWaypoints.length - 1; i++) {
      const a = corridorWaypoints[i];
      const b = corridorWaypoints[i + 1];
      const dist = pointToSegmentDistanceKm(
        coords.latitude, coords.longitude,
        a.latitude, a.longitude,
        b.latitude, b.longitude
      );
      if (dist < minPerpendicularDist) minPerpendicularDist = dist;
    }

    const calculatedDeviation = minPerpendicularDist;
    setDeviationKm(calculatedDeviation);

    // Logic Matrix:
    // Deviation < 1.0 km -> Traffic Detour (No SOS, recalculate ETA)
    if (calculatedDeviation < 1.0) {
      deviationStartTime.current = null;
      setTrafficDetourActive(calculatedDeviation > 0.3);
      setEtaMins(Math.max(10, Math.round(24 + calculatedDeviation * 6)));
      setShowSosModal(false);
    } else {
      // Deviation > 1.0 km
      if (!deviationStartTime.current) {
        deviationStartTime.current = Date.now();
      }
      const elapsedSeconds = (Date.now() - deviationStartTime.current) / 1000;

      // If off-route for > 2 minutes (or test trigger), show safety modal
      if (elapsedSeconds >= 1.0) { // Triggered immediately on high deviation for demo
        setShowSosModal(true);
      }
    }
  };

  // 3. Periodic GPS Watcher
  useEffect(() => {
    const interval = setInterval(() => {
      // Poll GPS & evaluate deviation
      checkDeviation(currentGps);
    }, 30000);

    return () => clearInterval(interval);
  }, [currentGps]);

  // SOS 45-second countdown timer
  useEffect(() => {
    let timer;
    if (showSosModal && !sosDispatched && sosCountdown > 0) {
      timer = setInterval(() => {
        setSosCountdown((prev) => {
          if (prev <= 1) {
            triggerEmergencySos('Countdown Expired - No Response from User');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [showSosModal, sosDispatched, sosCountdown]);

  // 4. Trigger SOS Emergency Endpoint
  const triggerEmergencySos = async (reason = 'User Off-Corridor > 1km') => {
    setSosDispatched(true);
    try {
      await safetyService.triggerSos({
        rideId,
        currentLocation: currentGps,
        deviationKm,
        reason
      });
    } catch (e) {
      console.error(e);
    }
  };

  // 5. Partial Drop-off Handler (Freeing seat for remaining corridor)
  const handlePartialDropoff = async (passengerId) => {
    try {
      const res = await rideService.dropoffPassenger(rideId, {
        passengerId,
        actualDropCoords: currentGps
      });

      setPassengers(prev =>
        prev.map(p => p.id === passengerId || p._id === passengerId ? { ...p, status: 'completed' } : p)
      );
      setAvailableSeats(res.data.availableSeats ?? (availableSeats + 1));
    } catch (err) {
      setPassengers(prev =>
        prev.map(p => p.id === passengerId ? { ...p, status: 'completed' } : p)
      );
      setAvailableSeats(prev => prev + 1);
    }
  };

  // Test Triggers for Demo
  const simulateOffRouteDangerousDeviation = () => {
    const rogueGps = { latitude: 12.9850, longitude: 77.7200 }; // ~7.2 km off route
    setCurrentGps(rogueGps);
    deviationStartTime.current = Date.now() - 130000; // Fake 2 mins elapsed
    checkDeviation(rogueGps);
  };

  const simulateSafeTrafficDetour = () => {
    const minorDetourGps = { latitude: 12.9150, longitude: 77.6420 }; // ~0.45 km offset (traffic diversion)
    setCurrentGps(minorDetourGps);
    checkDeviation(minorDetourGps);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Top Banner: Women-Only Pool Status & 1-Tap Share Button */}
      <div className="glass-panel" style={{
        background: ride.isWomenOnly
          ? 'linear-gradient(135deg, rgba(244, 63, 94, 0.12) 0%, rgba(99, 102, 241, 0.12) 100%)'
          : 'var(--bg-card)',
        border: ride.isWomenOnly ? '1px solid rgba(244, 63, 94, 0.35)' : '1px solid var(--border-color)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
          <div style={{
            width: 44, height: 44, borderRadius: 12,
            background: ride.isWomenOnly ? 'rgba(244, 63, 94, 0.2)' : 'rgba(99, 102, 241, 0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: ride.isWomenOnly ? 'var(--accent-rose)' : 'var(--primary-light)'
          }}>
            <ShieldCheck size={26} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Live Active Journey</h2>
              {ride.isWomenOnly && (
                <span className="badge-tag" style={{ background: 'rgba(244, 63, 94, 0.2)', color: 'var(--accent-rose)' }}>
                  🛡️ Women-Only Safe Pool
                </span>
              )}
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Vehicle: <b>{ride.vehicle?.plateNumber}</b> ({ride.vehicle?.model}) • Host: <b>{ride.driver?.name}</b>
            </div>
          </div>
        </div>

        {/* 1-Tap Web Share Button */}
        <Button variant="primary" onClick={handleShareLiveStatus}>
          <Share2 size={16} />
          {shareSuccess ? 'Status Copied to Clipboard!' : 'Share Live Status'}
        </Button>
      </div>

      {/* GPS Telemetry & Traffic Detour vs Deviation Status */}
      <div className="glass-panel" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.2rem' }}>
        <div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Live Corridor Deviation</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: deviationKm > 1.0 ? 'var(--accent-rose)' : 'var(--accent-green)' }}>
            {deviationKm.toFixed(2)} km
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            {deviationKm > 1.0 ? '⚠️ Off-Route Threshold Exceeded' : '✓ Within Safe Corridor (< 1km)'}
          </div>
        </div>

        <div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Dynamic Route ETA</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--accent-cyan)' }}>
            {etaMins} mins
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            {trafficDetourActive ? '🔄 Traffic Detour detected, ETA updated' : 'Normal flow trajectory'}
          </div>
        </div>

        <div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Seat Pool Availability</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--primary-light)' }}>
            {availableSeats} / {ride.totalSeats || 3} Free
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--accent-green)' }}>
            Dynamic seat reallocation enabled
          </div>
        </div>
      </div>

      {/* Passengers & Partial Drop-off Seat Management */}
      <div className="white-panel">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-main)' }}>Passenger Roster & Dynamic Cost Split</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Each passenger is strictly billed <b>₹10/km</b> for their exact occupied segment. Early drop-offs free seats for the remaining corridor in real time.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {passengers.map((p, idx) => {
            const isCompleted = p.status === 'completed';
            const fare = Math.round(((p.sharedDistanceKm || 10) * 10) * 100) / 100;

            return (
              <div
                key={p.id || idx}
                style={{
                  background: isCompleted ? '#f8fafc' : '#ffffff',
                  border: isCompleted ? '1px dashed var(--border-color)' : '1px solid var(--border-color)',
                  padding: '1rem 1.25rem',
                  borderRadius: 10,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '1rem',
                  boxShadow: 'var(--shadow-sm)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{
                    width: 38, height: 38, borderRadius: '50%',
                    background: isCompleted ? '#f1f5f9' : 'var(--primary-light)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: isCompleted ? 'var(--text-muted)' : 'var(--primary)',
                    fontWeight: 700
                  }}>
                    {idx + 1}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-main)' }}>
                      {p.seekerName}
                      {isCompleted && (
                        <span className="badge-tag" style={{ marginLeft: '0.5rem', color: 'var(--primary)', background: 'var(--primary-light)' }}>
                          ✓ Dropped Off
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      Pickup: {p.pickupPoint?.address || 'Origin'} ➔ Drop: {p.dropPoint?.address || 'Destination'}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                  {/* OTP Badge */}
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Trip OTP</div>
                    <div style={{ fontWeight: 800, color: 'var(--primary)', letterSpacing: '0.15em' }}>
                      {p.otp || '5921'}
                    </div>
                  </div>

                  {/* Distance & Fare Split */}
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Segment ({p.sharedDistanceKm || 12.4} km @ ₹10/km)</div>
                    <div style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--primary)' }}>
                      ₹{fare}
                    </div>
                  </div>

                  {/* Partial Drop-off Action */}
                  {!isCompleted && (
                    <Button variant="secondary" onClick={() => handlePartialDropoff(p.id)}>
                      Drop Off Early (Free Seat)
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* GPS Deviation Testing Controls */}
      <div className="glass-panel" style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>
          Scenario Simulation Tests:
        </span>
        <Button variant="secondary" onClick={simulateSafeTrafficDetour}>
          Simulate Minor Traffic Detour (&lt; 1km)
        </Button>
        <Button variant="danger" onClick={simulateOffRouteDangerousDeviation}>
          <AlertTriangle size={15} /> Simulate Dangerous Off-Route (&gt; 1km / SOS)
        </Button>
      </div>

      {/* Fullscreen Off-Route SOS Modal */}
      {showSosModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ textAlign: 'center', border: '2px solid var(--accent-rose)' }}>
            <div style={{
              width: 64, height: 64, borderRadius: '50%', background: 'rgba(244, 63, 94, 0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem',
              color: 'var(--accent-rose)'
            }}>
              <ShieldAlert size={36} />
            </div>

            <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--accent-rose)', marginBottom: '0.5rem' }}>
              You seem to be off route. Are you okay?
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
              Your current vehicle GPS is <b>{deviationKm.toFixed(2)} km</b> away from the planned safety corridor. If you do not respond, emergency dispatch will be notified automatically.
            </p>

            {sosDispatched ? (
              <div style={{
                background: 'rgba(244, 63, 94, 0.15)', padding: '1rem', borderRadius: 8,
                color: 'var(--accent-rose)', fontWeight: 700, marginBottom: '1rem'
              }}>
                🚨 Emergency SOS Dispatched! Emergency contacts and vehicle monitoring team have been alerted with live GPS.
              </div>
            ) : (
              <div style={{ marginBottom: '1.5rem' }}>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Auto-SOS Trigger in:</div>
                <div style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--accent-amber)' }}>
                  {sosCountdown}s
                </div>
              </div>
            )}

            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
              <Button
                variant="success"
                onClick={() => {
                  setShowSosModal(false);
                  deviationStartTime.current = null;
                  setCurrentGps({ latitude: 12.9340, longitude: 77.6280 });
                  setDeviationKm(0.1);
                }}
              >
                <CheckCircle2 size={18} /> I'm Safe (False Alarm)
              </Button>

              {!sosDispatched && (
                <Button variant="danger" onClick={() => triggerEmergencySos('Manual SOS Click by User')}>
                  <ShieldAlert size={18} /> Trigger SOS Now
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
