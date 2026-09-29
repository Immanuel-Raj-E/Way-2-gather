import React, { useState } from 'react';
import { reviewService } from '../services/api';
import Button from './Button';
import { Star, ShieldAlert, CheckCircle2, UserX, User, Car } from 'lucide-react';

export default function ReviewModal({ isOpen, onClose, targetUser, tripId, onReviewSubmitted }) {
  const [rating, setRating] = useState(5);
  const [targetRole, setTargetRole] = useState('driver'); // 'driver' or 'seeker'
  const [isHarassment, setIsHarassment] = useState(false);
  const [harassmentCategory, setHarassmentCategory] = useState('Safety Violation');
  const [comments, setComments] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await reviewService.submitReview({
        targetUserId: targetUser?.id || targetUser?._id || 'mock_target_user_1',
        tripId: tripId || 'trip_demo_101',
        rating: Number(rating),
        targetRole,
        isHarassment: Boolean(isHarassment),
        harassmentCategory: isHarassment ? harassmentCategory : 'None',
        comments
      });

      setResult(res.data);
      if (onReviewSubmitted) onReviewSubmitted(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '500px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1rem' }}>
          <Star size={24} color="#f59e0b" fill="#f59e0b" />
          <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)' }}>
            Trip Review & Feedback
          </h3>
        </div>

        {result ? (
          <div style={{ textAlign: 'center', padding: '1rem 0' }}>
            {result.safetyStatus?.autoBanTriggered ? (
              <div style={{ background: '#fef2f2', border: '1px solid #fecaca', padding: '1.2rem', borderRadius: 12, marginBottom: '1.2rem' }}>
                <UserX size={44} color="#dc2626" style={{ margin: '0 auto 0.75rem' }} />
                <h4 style={{ color: '#b91c1c', fontWeight: 800, fontSize: '1.15rem' }}>
                  AUTOMATED SAFETY BAN TRIGGERED (5 Strikes)
                </h4>
                <p style={{ fontSize: '0.85rem', color: '#7f1d1d', marginTop: '0.4rem' }}>
                  Target user has reached 5 severe safety reports and has been <b>PERMANENTLY BLOCKED</b> from way-2-gather.
                </p>
              </div>
            ) : (
              <div style={{ textAlign: 'center', marginBottom: '1.2rem' }}>
                <CheckCircle2 size={48} color="#059669" style={{ margin: '0 auto 0.5rem' }} />
                <h4 style={{ fontWeight: 800, fontSize: '1.15rem', color: 'var(--text-main)' }}>Rating Submitted!</h4>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.3rem' }}>
                  Updated {targetRole === 'driver' ? 'Driver Rating' : 'Seeker Rating'}: ⭐ <b>{result.updatedRatings?.[targetRole === 'driver' ? 'driverRating' : 'seekerRating'] || rating}</b>
                </p>
              </div>
            )}

            <Button onClick={onClose} variant="primary" style={{ width: '100%' }}>
              Close
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* Target Role Selector */}
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.3rem' }}>
                You are reviewing:
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setTargetRole('driver')}
                  style={{
                    padding: '0.5rem', borderRadius: 8,
                    border: targetRole === 'driver' ? '2px solid var(--primary)' : '1px solid var(--border-color)',
                    background: targetRole === 'driver' ? 'var(--primary-light)' : '#ffffff',
                    color: targetRole === 'driver' ? '#065f46' : 'var(--text-muted)',
                    fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem'
                  }}
                >
                  <Car size={16} /> Driver (Host)
                </button>
                <button
                  type="button"
                  onClick={() => setTargetRole('seeker')}
                  style={{
                    padding: '0.5rem', borderRadius: 8,
                    border: targetRole === 'seeker' ? '2px solid var(--primary)' : '1px solid var(--border-color)',
                    background: targetRole === 'seeker' ? 'var(--primary-light)' : '#ffffff',
                    color: targetRole === 'seeker' ? '#065f46' : 'var(--text-muted)',
                    fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem'
                  }}
                >
                  <User size={16} /> Passenger (Seeker)
                </button>
              </div>
            </div>

            {/* Stars */}
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.3rem' }}>
                Score:
              </label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => {
                      setRating(star);
                      if (star <= 2) setIsHarassment(true);
                      else setIsHarassment(false);
                    }}
                    style={{
                      background: 'none', border: 'none', cursor: 'pointer',
                      fontSize: '1.75rem', color: star <= rating ? '#f59e0b' : '#cbd5e1'
                    }}
                  >
                    ★
                  </button>
                ))}
              </div>
            </div>

            {/* Harassment Checkbox */}
            <div style={{
              background: isHarassment ? '#fef2f2' : '#f8fafc',
              border: isHarassment ? '1px solid #fecaca' : '1px solid var(--border-color)',
              padding: '0.85rem', borderRadius: 8
            }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={isHarassment}
                  onChange={(e) => setIsHarassment(e.target.checked)}
                  style={{ width: 18, height: 18, accentColor: '#dc2626' }}
                />
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: isHarassment ? '#b91c1c' : 'var(--text-main)' }}>
                  ⚠️ Report Harassment / Dangerous Behavior
                </span>
              </label>

              {isHarassment && (
                <div style={{ marginTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  <select
                    value={harassmentCategory}
                    onChange={(e) => setHarassmentCategory(e.target.value)}
                    className="input-light"
                    style={{ fontSize: '0.85rem', padding: '0.5rem' }}
                  >
                    <option value="Verbal">Verbal Misconduct</option>
                    <option value="Inappropriate Behavior">Inappropriate Behavior</option>
                    <option value="Safety Violation">Route Deviation / Reckless Driving</option>
                    <option value="Physical">Physical Threat</option>
                  </select>
                  <span style={{ fontSize: '0.7rem', color: '#991b1b' }}>
                    Note: Rating ≤ 2 + Harassment assigns a severe strike. 5 strikes trigger an automated permanent ban.
                  </span>
                </div>
              )}
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.3rem' }}>
                Comments (Optional)
              </label>
              <textarea
                rows={3}
                className="input-light"
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                placeholder="Share your experience..."
              />
            </div>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <Button type="button" variant="secondary" onClick={onClose} style={{ flex: 1 }}>
                Cancel
              </Button>
              <Button type="submit" variant={isHarassment ? 'danger' : 'primary'} disabled={loading} style={{ flex: 2 }}>
                {loading ? 'Submitting...' : 'Submit Rating'}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
