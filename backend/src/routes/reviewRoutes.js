const express = require('express');
const router = express.Router();
const reviewCtrl = require('../controllers/reviewCtrl');

router.post('/submit', reviewCtrl.submitReview);
router.get('/user/:id', reviewCtrl.getUserReviews);

module.exports = router;
