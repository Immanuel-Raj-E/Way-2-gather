import React, { useState } from 'react';
import { Bell, Clock, Sparkles, CheckCircle2 } from 'lucide-react';
import Button from './Button';

export default function NoMatchCard({ onAdjustTime, onSetAlert }) {
  const [alertSubscribed, setAlertSubscribed] = useState(false);

  const handleNotifyClick = () => {
    setAlertSubscribed(true);
    if (onSetAlert) onSetAlert();
  };

  return (
    <div className="glass-panel" style={{
      textAlign: 'center',
      padding: '2.5rem 1.8rem',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '1rem',
      border: '1px dashed rgba(255, 255, 255, 0.15)'
    }}>
      <div style={{
        width: 56,
        height: 56,
        borderRadius: '50%',
        background: 'rgba(245, 158, 11, 0.15)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '1.6rem'
      }}>
        😔
      </div>

      <div>
        <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '0.35rem' }}>
          No rides heading that way right now. 😔
        </h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', maxWidth: '440px' }}>
          No active hosts are currently travelling along this corridor for the selected time window. Don't worry, we've got you covered.
        </p>
      </div>

      {alertSubscribed ? (
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.5rem',
          background: 'rgba(16, 185, 129, 0.15)',
          color: 'var(--accent-green)',
          padding: '0.6rem 1.2rem',
          borderRadius: 9999,
          fontSize: '0.85rem',
          fontWeight: 700
        }}>
          <CheckCircle2 size={16} /> Notification active! We'll alert you as soon as a host posts this route.
        </div>
      ) : (
        <div style={{ display: 'flex', gap: '0.8rem', flexWrap: 'wrap', justifyContent: 'center', marginTop: '0.5rem' }}>
          <Button variant="primary" onClick={handleNotifyClick}>
            <Bell size={16} /> Notify me if a ride pops up
          </Button>

          <Button variant="secondary" onClick={() => onAdjustTime && onAdjustTime()}>
            <Clock size={16} /> Try a different time
          </Button>
        </div>
      )}

      {/* Quick Time Shift Suggestions */}
      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.8rem', flexWrap: 'wrap', justifyContent: 'center' }}>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', alignSelf: 'center', marginRight: '0.3rem' }}>
          Quick Presets:
        </span>
        <button
          onClick={() => onAdjustTime && onAdjustTime(60)}
          style={{
            background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)',
            color: 'var(--text-main)', padding: '0.3rem 0.7rem', borderRadius: 6,
            fontSize: '0.75rem', cursor: 'pointer'
          }}
        >
          +1 Hour
        </button>
        <button
          onClick={() => onAdjustTime && onAdjustTime(120)}
          style={{
            background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)',
            color: 'var(--text-main)', padding: '0.3rem 0.7rem', borderRadius: 6,
            fontSize: '0.75rem', cursor: 'pointer'
          }}
        >
          +2 Hours
        </button>
        <button
          onClick={() => onAdjustTime && onAdjustTime('morning')}
          style={{
            background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)',
            color: 'var(--text-main)', padding: '0.3rem 0.7rem', borderRadius: 6,
            fontSize: '0.75rem', cursor: 'pointer'
          }}
        >
          Tomorrow 8:30 AM
        </button>
      </div>
    </div>
  );
}
