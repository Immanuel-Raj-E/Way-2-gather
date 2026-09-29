const jwt = require('jsonwebtoken');
const User = require('../models/User');

const authMiddleware = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Authorization token missing or invalid' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'super_secret_syncride_jwt_token_2026');
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Token expired or invalid', error: error.message });
  }
};

/**
 * Middleware: Requires that user has verified KYC and is NOT blocked
 */
const requireActiveAndVerified = async (req, res, next) => {
  try {
    const userId = req.user?.id || req.body?.userId || req.headers['x-user-id'];

    // Bypass check for guest / demo runs if no specific DB user id is supplied
    if (!userId || userId.startsWith('guest') || userId.startsWith('demo')) {
      return next();
    }

    const user = await User.findById(userId);
    if (!user) {
      return next(); // Proceed if demo/in-memory mock
    }

    // 1. Check Safety Ban Status
    if (user.safetyProfile?.accountStatus === 'Blocked') {
      return res.status(403).json({
        success: false,
        accountBlocked: true,
        message: 'Access Denied: Your account has been permanently blocked due to multiple severe safety violations.',
        reason: user.safetyProfile.banReason
      });
    }

    if (user.safetyProfile?.accountStatus === 'Suspended') {
      return res.status(403).json({
        success: false,
        accountSuspended: true,
        message: 'Access Restricted: Your account is currently suspended pending safety review.'
      });
    }

    // 2. Check KYC Verification
    if (!user.kycDetails || user.kycDetails.isVerified === false) {
      return res.status(403).json({
        success: false,
        kycRequired: true,
        message: 'KYC Verification Required: You must complete government Aadhar KYC verification before creating or booking shared rides.'
      });
    }

    req.verifiedUser = user;
    next();
  } catch (error) {
    next(error);
  }
};

module.exports = {
  authMiddleware,
  requireActiveAndVerified
};
