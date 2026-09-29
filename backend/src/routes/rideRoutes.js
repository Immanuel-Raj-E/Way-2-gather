const express = require('express');
const router = express.Router();
const rideCtrl = require('../controllers/rideCtrl');
const authMiddleware = require('../middleware/authMiddleware');

// Public / Matching
router.get('/', rideCtrl.getAvailableRides);
router.post('/match', rideCtrl.findMatches);

// Host & Seeker Handshake
router.post('/create', rideCtrl.createRide);
router.post('/request', rideCtrl.requestRide);
router.post('/accept', rideCtrl.acceptRequest);
router.post('/verify-otp', rideCtrl.verifyOtpAndStartRide);

// Live Ride & Tracking
router.post('/:rideId/live-gps', rideCtrl.updateLiveGps);

// Settlement
router.post('/settle', rideCtrl.settleRide);

module.exports = router;
