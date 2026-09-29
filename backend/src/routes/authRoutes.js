const express = require('express');
const router = express.Router();
const authCtrl = require('../controllers/authCtrl');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/register', authCtrl.register);
router.post('/login', authCtrl.login);
router.get('/profile', authMiddleware, authCtrl.getProfile);

module.exports = router;
