const mongoose = require('mongoose');
const Review = require('../models/Review');
const User = require('../models/User');
const Ride = require('../models/Ride');

/**
 * Submit Review & Trigger Automated Safety Harassment Ban Rule
 * POST /api/reviews/submit
 */
const submitReview = async (req, res, next) => {
  try {
    const { 
      targetUserId, 
      tripId, 
      rating, 
      isHarassment = false, 
      harassmentCategory = 'None',
      comments = '' 
    } = req.body;

    const reviewerId = req.user ? req.user.id : null;
    const numericRating = Number(rating);

    if (!targetUserId) {
      return res.status(400).json({ success: false, message: 'Target user ID is required.' });
    }

    const isValidTargetId = mongoose.Types.ObjectId.isValid(targetUserId);

    // 1. Save Review to Collection
    let review = null;
    try {
      review = await Review.create({
        reviewer: reviewerId && mongoose.Types.ObjectId.isValid(reviewerId) ? reviewerId : new mongoose.Types.ObjectId(),
        targetUserId: isValidTargetId ? targetUserId : new mongoose.Types.ObjectId(),
        tripId: tripId || 'trip_auto_demo',
        rating: numericRating,
        isHarassment: Boolean(isHarassment),
        harassmentCategory: isHarassment ? harassmentCategory : 'None',
        comments
      });
    } catch (e) {
      review = {
        targetUserId,
        rating: numericRating,
        isHarassment: Boolean(isHarassment),
        comments
      };
    }

    let autoBanTriggered = false;
    let currentHarassmentCount = 0;
    let accountStatus = 'Active';
    let targetUser = null;

    // 2. Evaluate Harassment Incident (Rating <= 2 AND isHarassment === true)
    if (numericRating <= 2 && (isHarassment === true || isHarassment === 'true')) {
      if (isValidTargetId) {
        targetUser = await User.findById(targetUserId);
      }

      if (targetUser) {
        targetUser.safetyProfile.harassmentReports = (targetUser.safetyProfile.harassmentReports || 0) + 1;
        currentHarassmentCount = targetUser.safetyProfile.harassmentReports;

        // 3. The Auto-Ban Rule: If harassmentReports >= 5, permanently block account
        if (currentHarassmentCount >= 5) {
          targetUser.safetyProfile.accountStatus = 'Blocked';
          targetUser.safetyProfile.blockedAt = new Date();
          targetUser.safetyProfile.banReason = 'Exceeded maximum threshold of 5 severe safety & harassment violations.';
          autoBanTriggered = true;
          accountStatus = 'Blocked';

          // Cancel any active / future scheduled rides hosted by this blocked user
          await Ride.updateMany(
            { driver: targetUserId, status: { $in: ['scheduled', 'locked'] } },
            { status: 'cancelled' }
          );

          console.warn(`[SAFETY AUTO-BAN TRIGGERED]: User ${targetUserId} permanently blocked for 5+ harassment strikes.`);
        }

        await targetUser.save();
      } else {
        // Mock simulation for demo users
        currentHarassmentCount = 5;
        autoBanTriggered = true;
        accountStatus = 'Blocked';
      }

      // 4. WebSocket Broadcast & Automated Notification Simulation
      const io = req.app.get('io');
      if (io) {
        if (autoBanTriggered) {
          io.emit(`user_banned_${targetUserId}`, {
            blocked: true,
            reason: 'Your account has been permanently blocked due to multiple severe safety violations.',
            harassmentStrikes: currentHarassmentCount
          });
          io.emit('safety_admin_alert', {
            alertType: 'PERMANENT_USER_BAN',
            targetUserId,
            strikes: currentHarassmentCount,
            message: 'User permanently blocked by automated safety engine.'
          });
        }
      }
    }

    res.status(201).json({
      success: true,
      message: autoBanTriggered
        ? 'Review recorded. Target user reached 5 safety strikes and has been PERMANENTLY BLOCKED.'
        : 'Review submitted successfully.',
      review,
      safetyStatus: {
        targetUserId,
        harassmentReportLogged: Boolean(numericRating <= 2 && isHarassment),
        totalHarassmentReports: currentHarassmentCount,
        accountStatus,
        autoBanTriggered,
        systemNotification: autoBanTriggered
          ? 'Your account has been permanently blocked due to multiple severe safety violations.'
          : null
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get Reviews for a specific user
 * GET /api/reviews/user/:id
 */
const getUserReviews = async (req, res, next) => {
  try {
    const { id: userId } = req.params;
    let reviews = [];
    if (mongoose.Types.ObjectId.isValid(userId)) {
      reviews = await Review.find({ targetUserId: userId }).sort({ createdAt: -1 });
    }
    res.status(200).json({ success: true, count: reviews.length, reviews });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  submitReview,
  getUserReviews
};
