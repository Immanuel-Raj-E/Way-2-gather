import React from 'react';
import { Map, Navigation } from 'lucide-react';

export default function MapView({ origin, destination, matches = [] }) {
  return (
    <div className="glass-panel" style={{ minHeight: '340px', position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', border: '1px dashed rgba(99, 102, 241, 0.4)' }}>
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
        background: 'radial-gradient(circle at 50% 50%, rgba(99, 102, 241, 0.08) 0%, transparent 70%)',
        pointerEvents: 'none'
      }} />

      <div style={{
        width: 64, height: 64, borderRadius: '50%', background: 'rgba(99, 102, 241, 0.15)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)',
        marginBottom: '1rem'
      }}>
        <Map size={32} />
      </div>

      <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.4rem' }}>
        Interactive Route & Heatmap Layer
      </h3>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', maxWidth: '420px', textAlign: 'center' }}>
        {origin && destination 
          ? `Visualizing optimal corridor from "${origin.address || 'Origin'}" to "${destination.address || 'Destination'}" with ${matches.length} compatible pools.`
          : 'Enter your pickup and drop-off coordinates to compute detour scores and visualize matching driver trajectories.'}
      </p>

      {matches.length > 0 && (
        <div style={{ marginTop: '1.2rem', display: 'flex', gap: '0.8rem', alignItems: 'center', background: 'rgba(255,255,255,0.04)', padding: '0.5rem 1rem', borderRadius: '9999px', fontSize: '0.85rem' }}>
          <Navigation size={15} color="var(--accent-green)" />
          <span>{matches.length} compatible pooling routes dynamically calculated</span>
        </div>
      )}
    </div>
  );
}
