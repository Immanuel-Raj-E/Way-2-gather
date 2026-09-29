const express = require('express');
const router = express.Router();
const rideCtrl = require('../controllers/rideCtrl');

// Search & Matching
router.get('/', rideCtrl.getAvailableRides);
router.post('/match', rideCtrl.findMatches);

// Host & Seeker Lifecycle
router.post('/create', rideCtrl.createRide);
router.post('/request', rideCtrl.requestRide);
router.post('/:id/verify-passenger-otp', rideCtrl.verifyPassengerOtp);
router.post('/:id/dropoff', rideCtrl.dropoffPassenger);

module.exports = router;
