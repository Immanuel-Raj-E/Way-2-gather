import React, { useState } from 'react';
import { reviewService } from '../services/api';
import Button from './Button';
import { Star, ShieldAlert, AlertTriangle, CheckCircle2, UserX } from 'lucide-react';

export default function ReviewModal({ isOpen, onClose, targetUser, tripId, onReviewSubmitted }) {
  const [rating, setRating] = useState(5);
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
          <Star size={24} color="#fbbf24" fill="#fbbf24" />
          <h3 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Trip Feedback & Safety Review</h3>
        </div>

        {result ? (
          <div style={{ textAlign: 'center', padding: '1rem 0' }}>
            {result.safetyStatus?.autoBanTriggered ? (
              <div style={{ background: 'rgba(244,63,94,0.15)', border: '1px solid var(--accent-rose)', padding: '1.2rem', borderRadius: 12, marginBottom: '1.2rem' }}>
                <UserX size={44} color="var(--accent-rose)" style={{ margin: '0 auto 0.75rem' }} />
                <h4 style={{ color: 'var(--accent-rose)', fontWeight: 800, fontSize: '1.15rem' }}>
                  AUTOMATED SAFETY BAN TRIGGERED (5 Strikes)
                </h4>
                <p style={{ fontSize: '0.85rem', color: '#fecdd3', marginTop: '0.4rem' }}>
                  Target user has accumulated 5 severe harassment reports. Their account is <b>PERMANENTLY BLOCKED</b> and all future rides have been cancelled.
                </p>
              </div>
            ) : (
              <div style={{ textAlign: 'center', marginBottom: '1.2rem' }}>
                <CheckCircle2 size={48} color="var(--accent-green)" style={{ margin: '0 auto 0.5rem' }} />
                <h4 style={{ fontWeight: 700, fontSize: '1.1rem' }}>Thank you for your feedback!</h4>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  Your review helps maintain safety standards across the SyncRide network.
                </p>
              </div>
            )}

            <Button onClick={onClose} style={{ width: '100%' }}>
              Close
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
                Rate Driver / Passenger: {targetUser?.name || 'Traveler'}
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
                      fontSize: '1.6rem', color: star <= rating ? '#fbbf24' : 'rgba(255,255,255,0.2)'
                    }}
                  >
                    ★
                  </button>
                ))}
              </div>
            </div>

            {/* Harassment Checkbox Flag */}
            <div style={{
              background: isHarassment ? 'rgba(244, 63, 94, 0.12)' : 'rgba(0,0,0,0.3)',
              border: isHarassment ? '1px solid var(--accent-rose)' : '1px solid var(--border-color)',
              padding: '0.85rem', borderRadius: 8
            }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={isHarassment}
                  onChange={(e) => setIsHarassment(e.target.checked)}
                  style={{ width: 18, height: 18, accentColor: 'var(--accent-rose)' }}
                />
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: isHarassment ? 'var(--accent-rose)' : 'var(--text-main)' }}>
                  ⚠️ Report Severe Harassment / Safety Violation
                </span>
              </label>

              {isHarassment && (
                <div style={{ marginTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Harassment Category:</label>
                  <select
                    value={harassmentCategory}
                    onChange={(e) => setHarassmentCategory(e.target.value)}
                    style={{
                      padding: '0.5rem', borderRadius: 6, background: 'rgba(0,0,0,0.5)',
                      border: '1px solid var(--border-color)', color: 'var(--text-main)', fontSize: '0.85rem'
                    }}
                  >
                    <option value="Verbal">Verbal Abuse / Intimidation</option>
                    <option value="Inappropriate Behavior">Inappropriate Behavior</option>
                    <option value="Safety Violation">Dangerous Driving / Route Hijack</option>
                    <option value="Physical">Physical Threat</option>
                  </select>
                  <div style={{ fontSize: '0.7rem', color: '#fecdd3' }}>
                    Note: Rating ≤ 2 + Harassment increments safety strike counter. 5 strikes trigger an irreversible <b>Automated Permanent Ban</b>.
                  </div>
                </div>
              )}
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.3rem' }}>
                Comments (Optional)
              </label>
              <textarea
                rows={3}
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                placeholder="Describe your trip experience..."
                style={{
                  width: '100%', padding: '0.65rem 0.85rem', borderRadius: 8,
                  background: 'rgba(0,0,0,0.35)', border: '1px solid var(--border-color)',
                  color: 'var(--text-main)', fontSize: '0.85rem'
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <Button type="button" variant="secondary" onClick={onClose} style={{ flex: 1 }}>
                Cancel
              </Button>
              <Button type="submit" variant={isHarassment ? 'danger' : 'primary'} disabled={loading} style={{ flex: 2 }}>
                {loading ? 'Processing Review...' : isHarassment ? 'Submit Safety Strike' : 'Submit Review'}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
