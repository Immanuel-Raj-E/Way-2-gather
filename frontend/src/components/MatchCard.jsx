import React, { useState } from 'react';
import { formatCurrency, formatDateTime } from '../utils/helpers';
import { Sparkles, MapPin, User, ArrowRight, Clock, ShieldCheck, Leaf, ChevronDown, ChevronUp, Cpu } from 'lucide-react';
import Button from './Button';

export default function MatchCard({ match, onRequest, isRequested }) {
  const [showFeatures, setShowFeatures] = useState(false);

  const prob = match.match_acceptance_probability || match.compatibility_score || 85;
  const isHigh = prob >= 80;
  const detourKm = match.detour_km || 1.2;
  const detourMins = match.detour_time_mins || Math.round(detourKm * 1.5);
  const co2Saved = match.co2_saved_kg || Math.round(detourKm * 0.192 * 10) / 10;
  const overlap = Math.round((match.route_overlap_ratio || 0.8) * 100);
  const feats = match.features_6d || {};

  return (
    <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem', position: 'relative' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{
            width: 42, height: 42, borderRadius: '50%', background: 'rgba(99, 102, 241, 0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary-light)'
          }}>
            <User size={22} />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '1rem' }}>{match.driver_name || 'Verified Host'}</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Rating: ⭐ {match.driver_rating || 4.9} • {match.available_seats || 2} seats left
            </div>
          </div>
        </div>

        <div style={{ textAlign: 'right' }}>
          <span className={`badge-score ${isHigh ? 'high' : 'medium'}`}>
            <Sparkles size={14} />
            {prob}% Acceptance
          </span>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
            XGBoost ML Score
          </div>
        </div>
      </div>

      {/* Corridor Points */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', background: 'rgba(0,0,0,0.25)', padding: '0.75rem', borderRadius: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
          <MapPin size={15} color="var(--primary-light)" />
          <span style={{ color: 'var(--text-muted)' }}>From:</span>
          <span style={{ fontWeight: 600 }}>{match.origin?.address || 'Origin Corridor'}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
          <ArrowRight size={15} color="var(--accent-cyan)" />
          <span style={{ color: 'var(--text-muted)' }}>To:</span>
          <span style={{ fontWeight: 600 }}>{match.destination?.address || 'Destination Corridor'}</span>
        </div>
      </div>

      {/* Quick Metrics Badges */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', fontSize: '0.8rem' }}>
        <span className="badge-tag" style={{ color: 'var(--accent-cyan)' }}>
          Detour: +{detourKm} km ({detourMins}m)
        </span>
        <span className="badge-tag" style={{ color: '#a78bfa' }}>
          Corridor Overlap: {overlap}%
        </span>
        <span className="badge-tag" style={{ color: 'var(--accent-green)' }}>
          <Leaf size={12} style={{ marginRight: 3 }} /> {co2Saved} kg CO₂ saved
        </span>
        {match.within_2km_corridor && (
          <span className="badge-tag" style={{ color: '#38bdf8' }}>
            <ShieldCheck size={12} style={{ marginRight: 3 }} /> Within 2km Buffer
          </span>
        )}
      </div>

      {/* 6-Feature Vector Accordion */}
      <div>
        <button
          onClick={() => setShowFeatures(!showFeatures)}
          style={{
            background: 'none', border: 'none', color: 'var(--text-muted)',
            fontSize: '0.75rem', cursor: 'pointer', display: 'flex', alignItems: 'center',
            gap: '0.3rem', padding: '0.2rem 0'
          }}
        >
          <Cpu size={13} color="var(--primary-light)" />
          <span>{showFeatures ? 'Hide 6-Feature Vector' : 'View XGBoost 6-Feature Vector'}</span>
          {showFeatures ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>

        {showFeatures && (
          <div style={{
            marginTop: '0.5rem', padding: '0.65rem', borderRadius: 8,
            background: 'rgba(0,0,0,0.4)', fontSize: '0.75rem', display: 'grid',
            gridTemplateColumns: '1fr 1fr', gap: '0.4rem', border: '1px solid rgba(255,255,255,0.06)'
          }}>
            <div>1. Detour Dist: <b>{feats.detour_distance_km ?? detourKm} km</b></div>
            <div>2. Detour Time: <b>{feats.detour_time_mins ?? detourMins} mins</b></div>
            <div>3. Origin Prox: <b>{feats.origin_proximity_km ?? 0.8} km</b></div>
            <div>4. Dest Prox: <b>{feats.destination_proximity_km ?? 0.6} km</b></div>
            <div>5. Time Gap: <b>{feats.time_difference_mins ?? 5} mins</b></div>
            <div>6. Route Overlap: <b>{feats.route_overlap_ratio ?? 0.82}</b></div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.4rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Estimated Share</div>
          <div style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--accent-green)' }}>
            {formatCurrency(match.price_per_seat || 8.5)}
          </div>
        </div>

        <Button
          variant={isRequested ? 'success' : 'primary'}
          disabled={isRequested}
          onClick={() => onRequest && onRequest(match)}
        >
          {isRequested ? 'Requested (Pending Host)' : 'Request Pool'}
        </Button>
      </div>
    </div>
  );
}
