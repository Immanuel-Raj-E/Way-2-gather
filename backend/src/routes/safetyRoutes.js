const express = require('express');
const router = express.Router();
const safetyCtrl = require('../controllers/safetyCtrl');

router.post('/sos', safetyCtrl.triggerSos);

module.exports = router;
