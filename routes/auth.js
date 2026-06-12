const express = require('express');
const router = express.Router();
const { signup, verifyOtp, signin, me, logout } = require('../controllers/authController');
const { verifyToken } = require('../middlewares/authMiddleware');

router.post('/signup', signup);
router.post('/verify-otp', verifyOtp);
router.post('/signin', signin);
router.get('/me', verifyToken, me);
router.post('/logout', logout);

module.exports = router;
