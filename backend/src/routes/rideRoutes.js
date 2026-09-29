const express = require('express');
const router = express.Router();
const rideCtrl = require('../controllers/rideCtrl');
const { requireActiveAndVerified } = require('../middleware/authMiddleware');

// Search & Matching
router.get('/', rideCtrl.getAvailableRides);
router.post('/match', rideCtrl.findMatches);

// Protected Lifecycle Routes (Requires Active & KYC Verified User)
router.post('/create', requireActiveAndVerified, rideCtrl.createRide);
router.post('/request', requireActiveAndVerified, rideCtrl.requestRide);

// Passenger OTP & Drop-off
router.post('/:id/verify-passenger-otp', rideCtrl.verifyPassengerOtp);
router.post('/:id/dropoff', rideCtrl.dropoffPassenger);

module.exports = router;
