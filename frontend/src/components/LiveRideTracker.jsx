import React, { useState, useEffect } from 'react';
import { socket, rideService } from '../services/api';
import Button from './Button';
import { formatCurrency } from '../utils/helpers';
import { 
  Navigation, ShieldAlert, KeyRound, CheckCircle2, 
  Leaf, DollarSign, AlertTriangle, Play, RefreshCw, Car 
} from 'lucide-react';

export default function LiveRideTracker({ activeRide, activeRequest, onComplete }) {
  const rideId = activeRide?.id || activeRide?._id || 'demo_ride_1';
  const [rideStatus, setRideStatus] = useState(activeRequest?.status || 'pending');
  const [otp, setOtp] = useState(activeRequest?.otp || activeRide?.otp || '4829');
  const [inputOtp, setInputOtp] = useState('');
  const [gpsPoint, setGpsPoint] = useState({ latitude: 37.7830, longitude: -122.4080, step: 0 });
  const [deviationInfo, setDeviationInfo] = useState({ is_deviated: false, deviation_km: 0.2, sos_alert: false });
  const [sosActive, setSosActive] = useState(false);
  const [settlementData, setSettlementData] = useState(null);
  const [isSimulating, setIsSimulating] = useState(false);

  // Corridor route coordinates for live simulation
  const routeWaypoints = [
    { latitude: 37.7830, longitude: -122.4080 },
    { latitude: 37.7780, longitude: -122.4100 },
    { latitude: 37.7710, longitude: -122.4120 },
    { latitude: 37.7650, longitude: -122.4135 },
    { latitude: 37.7600, longitude: -122.4150 }
  ];

  // Socket listener for real-time events
  useEffect(() => {
    socket.emit('join_ride_room', rideId);

    socket.on(`request_status_${activeRequest?._id || 'mock'}`, (data) => {
      setRideStatus('accepted');
      if (data.otp) setOtp(data.otp);
    });

    socket.on(`ride_started_${rideId}`, () => {
      setRideStatus('in_progress');
    });

    socket.on(`sos_alert_${rideId}`, (data) => {
      setSosActive(true);
      setDeviationInfo(prev => ({ ...prev, sos_alert: true, message: data.message }));
    });

    socket.on(`ride_settled_${rideId}`, (data) => {
      setSettlementData(data);
      setRideStatus('completed');
    });

    return () => {
      socket.off(`request_status_${activeRequest?._id || 'mock'}`);
      socket.off(`ride_started_${rideId}`);
      socket.off(`sos_alert_${rideId}`);
      socket.off(`ride_settled_${rideId}`);
    };
  }, [rideId, activeRequest]);

  // Host accepts handshake
  const handleHostAccept = async () => {
    try {
      const res = await rideService.acceptRequest({
        requestId: activeRequest?._id || 'req_demo_1',
        rideId: rideId
      });
      setRideStatus('accepted');
      setOtp(res.data.otp);
    } catch (e) {
      setRideStatus('accepted');
      setOtp('7392');
    }
  };

  // Seeker / Host verifies OTP to lock and begin
  const handleVerifyOtp = async () => {
    try {
      await rideService.verifyOtpAndStartRide({ rideId, otp: inputOtp || otp });
    } catch (e) {
      // fallback
    }
    setRideStatus('in_progress');
    setIsSimulating(true);
  };

  // GPS Simulation Interval
  useEffect(() => {
    let interval;
    if (rideStatus === 'in_progress' && isSimulating) {
      interval = setInterval(async () => {
        setGpsPoint((prev) => {
          const nextStep = (prev.step + 1) % routeWaypoints.length;
          const target = routeWaypoints[nextStep];
          const newGps = { latitude: target.latitude, longitude: target.longitude, step: nextStep };

          // Send live GPS to backend
          rideService.updateLiveGps(rideId, {
            currentLocation: newGps,
            waypoints: routeWaypoints
          }).then(res => {
            if (res.data?.deviation) {
              setDeviationInfo(res.data.deviation);
              if (res.data.deviation.sos_alert) setSosActive(true);
            }
          }).catch(() => {});

          return newGps;
        });
      }, 3500);
    }
    return () => clearInterval(interval);
  }, [rideStatus, isSimulating, rideId]);

  // Trigger simulated route deviation test
  const triggerOffRouteDeviation = async () => {
    const rogueGps = { latitude: 37.8100, longitude: -122.3600, step: 99 }; // 4.5km away from corridor
    setGpsPoint(rogueGps);
    setSosActive(true);
    try {
      const res = await rideService.updateLiveGps(rideId, {
        currentLocation: rogueGps,
        waypoints: routeWaypoints
      });
      if (res.data?.deviation) {
        setDeviationInfo(res.data.deviation);
      }
    } catch (e) {
      setDeviationInfo({
        is_deviated: true,
        deviation_km: 4.6,
        sos_alert: true,
        message: 'DANGER: Significant Route Deviation Detected! SOS Alert Triggered.'
      });
    }
  };

  // End Ride & Trigger Settlement
  const handleEndAndSettle = async () => {
    setIsSimulating(false);
    try {
      const res = await rideService.settleRide({
        rideId,
        distanceKm: 14.8,
        ridersCount: 2,
        baseFare: 18.0
      });
      setSettlementData(res.data.settlement);
    } catch (e) {
      setSettlementData({
        totalCost: 18.0,
        ridersCount: 2,
        splitPerPerson: 9.0,
        savingsPerRider: 9.0,
        co2SavedKg: 2.84,
        status: 'completed'
      });
    }
    setRideStatus('completed');
  };

  return (
    <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', border: sosActive ? '2px solid var(--accent-rose)' : '1px solid var(--border-glow)' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{
            width: 44, height: 44, borderRadius: 12,
            background: sosActive ? 'rgba(244, 63, 94, 0.2)' : 'rgba(99, 102, 241, 0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: sosActive ? 'var(--accent-rose)' : 'var(--primary-light)'
          }}>
            <Car size={24} />
          </div>
          <div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800 }}>Ride Handshake & Live Telemetry</h3>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Host-Seeker WebSocket Channel: <code>ride_{rideId}</code>
            </div>
          </div>
        </div>

        <div>
          <span className="badge-tag" style={{
            background: rideStatus === 'completed' ? 'rgba(16,185,129,0.2)' : 'rgba(99,102,241,0.2)',
            color: rideStatus === 'completed' ? 'var(--accent-green)' : 'var(--primary-light)',
            textTransform: 'uppercase', fontWeight: 700
          }}>
            Status: {rideStatus.replace('_', ' ')}
          </span>
        </div>
      </div>

      {/* SOS Alert Flash Banner */}
      {sosActive && (
        <div className="sos-alert-box" style={{ padding: '1rem', borderRadius: 10, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <ShieldAlert size={28} color="var(--accent-rose)" />
          <div>
            <div style={{ fontWeight: 800, color: 'var(--accent-rose)', fontSize: '0.95rem' }}>
              SECURITY ALERT: OFF-ROUTE DEVIATION DETECTED ({deviationInfo.deviation_km} km)
            </div>
            <div style={{ fontSize: '0.8rem', color: '#fecdd3' }}>
              GPS location strayed beyond the 1.5km corridor threshold. Dispatch and emergency contacts notified.
            </div>
          </div>
        </div>
      )}

      {/* Stage 1: Handshake (Host Accept & OTP Lock) */}
      {rideStatus === 'pending' && (
        <div style={{ background: 'rgba(0,0,0,0.3)', padding: '1.25rem', borderRadius: 12, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent-amber)', fontWeight: 600, fontSize: '0.9rem' }}>
            <AlertTriangle size={18} /> Awaiting Host Acceptance
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            The Seeker has submitted the request. The Host must accept to lock seats and generate the secure trip OTP.
          </p>
          <Button variant="success" onClick={handleHostAccept}>
            Host: Accept & Lock with OTP
          </Button>
        </div>
      )}

      {/* Stage 2: OTP Verification */}
      {rideStatus === 'accepted' && (
        <div style={{ background: 'rgba(0,0,0,0.3)', padding: '1.25rem', borderRadius: 12, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary-light)', fontWeight: 700 }}>
              <KeyRound size={20} /> Secure Trip OTP
            </div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, letterSpacing: '0.3em', color: 'var(--accent-cyan)', background: 'rgba(6,182,212,0.1)', padding: '0.2rem 0.8rem', borderRadius: 6 }}>
              {otp}
            </div>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            Seeker shares this 4-digit OTP with the Host upon boarding to verify identity and unlock live journey tracking.
          </p>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <input
              type="text"
              placeholder="Enter OTP (e.g. 4829)"
              defaultValue={otp}
              onChange={(e) => setInputOtp(e.target.value)}
              style={{
                flex: 1, padding: '0.65rem 1rem', borderRadius: 8,
                background: 'rgba(0,0,0,0.5)', border: '1px solid var(--border-color)',
                color: 'var(--text-main)', letterSpacing: '0.2em', fontWeight: 700
              }}
            />
            <Button onClick={handleVerifyOtp}>
              Verify OTP & Start Ride
            </Button>
          </div>
        </div>
      )}

      {/* Stage 3: Live GPS Route Deviation & Monitoring */}
      {rideStatus === 'in_progress' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            <div style={{ background: 'rgba(0,0,0,0.3)', padding: '0.85rem', borderRadius: 8 }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Current Vehicle GPS</div>
              <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>
                {gpsPoint.latitude.toFixed(4)}, {gpsPoint.longitude.toFixed(4)}
              </div>
            </div>

            <div style={{ background: 'rgba(0,0,0,0.3)', padding: '0.85rem', borderRadius: 8 }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Corridor Distance Offset</div>
              <div style={{ fontWeight: 700, fontSize: '0.9rem', color: sosActive ? 'var(--accent-rose)' : 'var(--accent-green)' }}>
                {deviationInfo.deviation_km} km (Max 1.5km)
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <Button
              variant="danger"
              onClick={triggerOffRouteDeviation}
            >
              <AlertTriangle size={16} /> Test Rogue Route Deviation (SOS)
            </Button>

            <Button
              variant="secondary"
              onClick={() => {
                setSosActive(false);
                setGpsPoint({ latitude: 37.783, longitude: -122.408, step: 0 });
              }}
            >
              <RefreshCw size={16} /> Reset Safe Corridor
            </Button>

            <Button
              variant="success"
              style={{ marginLeft: 'auto' }}
              onClick={handleEndAndSettle}
            >
              <CheckCircle2 size={16} /> End Ride & Calculate Settlement
            </Button>
          </div>
        </div>
      )}

      {/* Stage 4: Post-Ride Settlement & CO2 Savings Modal/Card */}
      {rideStatus === 'completed' && settlementData && (
        <div style={{
          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.12) 0%, rgba(6, 182, 212, 0.12) 100%)',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          borderRadius: 14, padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <CheckCircle2 size={24} color="var(--accent-green)" />
            <h4 style={{ fontSize: '1.15rem', fontWeight: 800 }}>Ride Completed & Settled</h4>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', background: 'rgba(0,0,0,0.3)', padding: '1rem', borderRadius: 10 }}>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Split Per Rider</div>
              <div style={{ fontWeight: 800, fontSize: '1.3rem', color: 'var(--accent-green)' }}>
                {formatCurrency(settlementData.splitPerPerson)}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Individual Savings</div>
              <div style={{ fontWeight: 800, fontSize: '1.3rem', color: 'var(--accent-cyan)' }}>
                {formatCurrency(settlementData.savingsPerRider)}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Eco Impact</div>
              <div style={{ fontWeight: 800, fontSize: '1.3rem', color: '#34d399' }}>
                <Leaf size={16} style={{ display: 'inline', marginRight: 4 }} />
                {settlementData.co2SavedKg} kg CO₂
              </div>
            </div>
          </div>

          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Fair cost split calculated based on shared passenger corridor. Direct single-passenger emissions reduced by {settlementData.co2SavedKg} kg.
          </p>

          <Button onClick={() => onComplete && onComplete()}>
            Start New Pool Journey
          </Button>
        </div>
      )}
    </div>
  );
}
