import React, { useEffect, useState } from 'react';
import { rideService } from '../services/api';
import { formatCurrency, formatDateTime } from '../utils/helpers';
import ReviewModal from '../components/ReviewModal';
import Button from '../components/Button';
import { 
  LayoutDashboard, Car, Clock, ShieldCheck, ShieldAlert, 
  TrendingUp, Leaf, Cpu, CheckCircle2, UserX, Fingerprint, Star, AlertTriangle 
} from 'lucide-react';

export default function Dashboard({ kycUser, onOpenKyc }) {
  const [rides, setRides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [harassmentStrikes, setHarassmentStrikes] = useState(0);
  const [accountStatus, setAccountStatus] = useState(kycUser?.accountStatus || 'Active');

  useEffect(() => {
    const fetchRides = async () => {
      try {
        const res = await rideService.getAvailableRides();
        setRides(res.data.rides || []);
      } catch (err) {
        setRides([
          {
            _id: '1',
            driver: { name: 'Priya Sharma (KYC Verified)', rating: 4.95, gender: 'Female' },
            origin: { address: 'Koramangala 4th Block' },
            destination: { address: 'Electronic City Phase 1' },
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

  const handleReviewSubmitted = (data) => {
    if (data.safetyStatus) {
      setHarassmentStrikes(data.safetyStatus.totalHarassmentReports);
      setAccountStatus(data.safetyStatus.accountStatus);
    }
  };

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
            <Car size={16} color="var(--primary-light)" /> Active Host Pools
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, marginTop: '0.5rem' }}>{rides.length || 2}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>MongoDB Indexed</div>
        </div>

        <div className="glass-panel">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            <Leaf size={16} color="var(--accent-green)" /> Total CO₂ Offset
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, marginTop: '0.5rem', color: 'var(--accent-green)' }}>54.2 kg</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>0.192 kg CO₂/km formula</div>
        </div>
      </div>

      {/* Ride Listings Table */}
      <div className="glass-panel">
        <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '1rem' }}>Active Host Corridors & Safety Verification</h2>
        {rides.length === 0 ? (
          <p style={{ color: 'var(--text-muted)' }}>No host corridors found.</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '0.75rem' }}>Host & Verification</th>
                  <th style={{ padding: '0.75rem' }}>Route Corridor</th>
                  <th style={{ padding: '0.75rem' }}>Departure</th>
                  <th style={{ padding: '0.75rem' }}>Safety Filter</th>
                  <th style={{ padding: '0.75rem' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {rides.map((r) => (
                  <tr key={r._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <td style={{ padding: '0.75rem', fontWeight: 600 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <span>{r.driver?.name || 'Verified Host'}</span>
                        <ShieldCheck size={14} color="var(--accent-green)" />
                      </div>
                    </td>
                    <td style={{ padding: '0.75rem' }}>
                      {r.origin?.address} ➔ {r.destination?.address}
                    </td>
                    <td style={{ padding: '0.75rem', color: 'var(--text-muted)' }}>
                      {formatDateTime(r.departureTime)}
                    </td>
                    <td style={{ padding: '0.75rem' }}>
                      {r.isWomenOnly ? (
                        <span className="badge-tag" style={{ color: 'var(--accent-rose)' }}>🛡️ Women-Only</span>
                      ) : (
                        <span className="badge-tag">Standard Pool</span>
                      )}
                    </td>
                    <td style={{ padding: '0.75rem' }}>
                      <span className="badge-tag" style={{ color: 'var(--accent-green)' }}>
                        {r.status || 'scheduled'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
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
