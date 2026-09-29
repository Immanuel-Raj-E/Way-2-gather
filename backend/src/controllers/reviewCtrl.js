const mongoose = require('mongoose');
const Review = require('../models/Review');
const User = require('../models/User');
const Ride = require('../models/Ride');

/**
 * Submit Review & Update Separate Driver/Seeker Rating
 * POST /api/reviews/submit
 */
const submitReview = async (req, res, next) => {
  try {
    const { 
      targetUserId, 
      tripId, 
      rating, 
      targetRole = 'driver', // 'driver' or 'seeker'
      isHarassment = false, 
      harassmentCategory = 'None',
      comments = '' 
    } = req.body;

    const reviewerId = req.user ? req.user.id : null;
    const numericRating = Math.max(1, Math.min(5, Number(rating) || 5));

    if (!targetUserId) {
      return res.status(400).json({ success: false, message: 'Target user ID is required.' });
    }

    const isValidTargetId = mongoose.Types.ObjectId.isValid(targetUserId);

    // 1. Save Review Record
    const review = await Review.create({
      reviewer: reviewerId && mongoose.Types.ObjectId.isValid(reviewerId) ? reviewerId : new mongoose.Types.ObjectId(),
      targetUserId: isValidTargetId ? targetUserId : new mongoose.Types.ObjectId(),
      tripId: tripId || 'trip_live',
      rating: numericRating,
      isHarassment: Boolean(isHarassment),
      harassmentCategory: isHarassment ? harassmentCategory : 'None',
      comments
    });

    let autoBanTriggered = false;
    let targetUser = null;

    if (isValidTargetId) {
      targetUser = await User.findById(targetUserId);
    }

    if (targetUser) {
      // 2. Separate Driver & Seeker Rating Calculation
      if (targetRole === 'driver') {
        const currentScore = targetUser.driverRating || 5.0;
        const currentCount = targetUser.totalDriverRatings || 0;
        const updatedDriverRating = Math.round(((currentScore * currentCount + numericRating) / (currentCount + 1)) * 10) / 10;
        targetUser.driverRating = updatedDriverRating;
        targetUser.totalDriverRatings = currentCount + 1;
      } else {
        const currentScore = targetUser.seekerRating || 5.0;
        const currentCount = targetUser.totalSeekerRatings || 0;
        const updatedSeekerRating = Math.round(((currentScore * currentCount + numericRating) / (currentCount + 1)) * 10) / 10;
        targetUser.seekerRating = updatedSeekerRating;
        targetUser.totalSeekerRatings = currentCount + 1;
      }

      // 3. Automated Harassment Strike Engine
      if (numericRating <= 2 && (isHarassment === true || isHarassment === 'true')) {
        targetUser.safetyProfile.harassmentReports = (targetUser.safetyProfile.harassmentReports || 0) + 1;

        if (targetUser.safetyProfile.harassmentReports >= 5) {
          targetUser.safetyProfile.accountStatus = 'Blocked';
          targetUser.safetyProfile.blockedAt = new Date();
          targetUser.safetyProfile.banReason = 'Exceeded maximum threshold of 5 severe safety strikes.';
          autoBanTriggered = true;

          // Cancel future rides
          await Ride.updateMany(
            { driver: targetUserId, status: { $in: ['scheduled', 'locked'] } },
            { status: 'cancelled' }
          );
        }
      }

      await targetUser.save();
    }

    res.status(201).json({
      success: true,
      message: autoBanTriggered 
        ? 'Review logged. User accumulated 5 strikes and has been PERMANENTLY BLOCKED.'
        : 'Review submitted successfully.',
      review,
      updatedRatings: {
        driverRating: targetUser ? targetUser.driverRating : numericRating,
        seekerRating: targetUser ? targetUser.seekerRating : numericRating
      }
    });
  } catch (error) {
    next(error);
  }
};

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
