const express = require('express');
const router = express.Router();
const userCtrl = require('../controllers/userCtrl');

router.post('/:id/verify-kyc', userCtrl.verifyKyc);
router.get('/:id/profile', userCtrl.getUserProfile);

module.exports = router;
