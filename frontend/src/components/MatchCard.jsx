import React, { useState } from 'react';
import { formatCurrency, formatDateTime } from '../utils/helpers';
import { Sparkles, MapPin, User, ArrowRight, ShieldCheck, Leaf, ChevronDown, ChevronUp, Cpu, Star } from 'lucide-react';
import Button from './Button';

export default function MatchCard({ match, onRequest, isRequested }) {
  const [showFeatures, setShowFeatures] = useState(false);

  const prob = match.match_acceptance_probability || match.compatibility_score || 88;
  const isHigh = prob >= 80;
  const detourKm = match.detour_km || 1.2;
  const detourMins = match.detour_time_mins || Math.round(detourKm * 1.5);
  const co2Saved = match.co2_saved_kg || Math.round(detourKm * 0.192 * 10) / 10;
  const overlap = Math.round((match.route_overlap_ratio || 0.8) * 100);
  const feats = match.features_6d || {};

  // Pricing Rule: ₹10 per km
  const priceKm = match.price_per_km || 10;
  const estimatedFare = Math.round((detourKm * priceKm) * 100) / 100 || 120;

  return (
    <div className="white-panel" style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{
            width: 42, height: 42, borderRadius: '50%', background: 'var(--primary-light)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)'
          }}>
            <User size={22} />
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--text-main)' }}>
              {match.driver_name || 'Verified Host'}
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span>Driver: ⭐ {match.driver_rating || 5.0}</span>
              <span>•</span>
              <span>Seeker: ⭐ {match.seeker_rating || 5.0}</span>
              <span>•</span>
              <span>{match.available_seats || 2} seats open</span>
            </div>
          </div>
        </div>

        <div style={{ textAlign: 'right' }}>
          <span className="badge-score">
            <Sparkles size={14} />
            {prob}% Acceptance
          </span>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
            XGBoost Inference
          </div>
        </div>
      </div>

      {/* Corridor Points */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', background: '#f8fafc', padding: '0.75rem', borderRadius: 8, border: '1px solid var(--border-color)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
          <MapPin size={15} color="var(--primary)" />
          <span style={{ color: 'var(--text-muted)' }}>From:</span>
          <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{match.origin?.address || 'Chennai Central'}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
          <ArrowRight size={15} color="var(--accent-sky)" />
          <span style={{ color: 'var(--text-muted)' }}>To:</span>
          <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{match.destination?.address || 'OMR IT Corridor'}</span>
        </div>
      </div>

      {/* Quick Metrics Badges */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.45rem', fontSize: '0.75rem' }}>
        <span className="badge-tag">
          Detour: +{detourKm} km ({detourMins}m)
        </span>
        <span className="badge-tag">
          Route Overlap: {overlap}%
        </span>
        <span className="badge-tag" style={{ color: 'var(--primary)', background: 'var(--primary-light)' }}>
          <Leaf size={12} style={{ marginRight: 3 }} /> {co2Saved} kg CO₂ saved
        </span>
        <span className="badge-tag" style={{ color: 'var(--accent-sky)' }}>
          Rate: ₹10/km
        </span>
      </div>

      {/* 6-Feature Vector Accordion */}
      <div>
        <button
          onClick={() => setShowFeatures(!showFeatures)}
          style={{
            background: 'none', border: 'none', color: 'var(--text-muted)',
            fontSize: '0.75rem', cursor: 'pointer', display: 'flex', alignItems: 'center',
            gap: '0.3rem', padding: '0.2rem 0', fontWeight: 600
          }}
        >
          <Cpu size={13} color="var(--primary)" />
          <span>{showFeatures ? 'Hide XGBoost Vector' : 'View 6D Feature Vector'}</span>
          {showFeatures ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>

        {showFeatures && (
          <div style={{
            marginTop: '0.4rem', padding: '0.65rem', borderRadius: 8,
            background: '#f8fafc', fontSize: '0.75rem', display: 'grid',
            gridTemplateColumns: '1fr 1fr', gap: '0.4rem', border: '1px solid var(--border-color)',
            color: 'var(--text-main)'
          }}>
            <div>1. Detour Dist: <b>{feats.detour_distance_km ?? detourKm} km</b></div>
            <div>2. Detour Time: <b>{feats.detour_time_mins ?? detourMins} mins</b></div>
            <div>3. Origin Prox: <b>{feats.origin_proximity_km ?? 0.6} km</b></div>
            <div>4. Dest Prox: <b>{feats.destination_proximity_km ?? 0.8} km</b></div>
            <div>5. Time Diff: <b>{feats.time_difference_mins ?? 5} mins</b></div>
            <div>6. Route Overlap: <b>{feats.route_overlap_ratio ?? 0.85}</b></div>
          </div>
        )}
      </div>

      {/* Actions & Fare */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.4rem', borderTop: '1px solid var(--border-color)' }}>
        <div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Estimated Contribution</div>
          <div style={{ fontWeight: 800, fontSize: '1.2rem', color: 'var(--primary)' }}>
            ₹{estimatedFare} <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500 }}>(₹10/km)</span>
          </div>
        </div>

        <Button
          variant={isRequested ? 'secondary' : 'primary'}
          disabled={isRequested}
          onClick={() => onRequest && onRequest(match)}
        >
          {isRequested ? 'Requested (Pending)' : 'Request Pool'}
        </Button>
      </div>
    </div>
  );
}
