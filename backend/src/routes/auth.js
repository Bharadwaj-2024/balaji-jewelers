// src/routes/auth.js
const router = require('express').Router();
const c      = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');

router.post('/register',         asyncHandler(c.register));
router.post('/login',            asyncHandler(c.login));
router.post('/logout',           c.logout);
router.get('/me',                protect, asyncHandler(c.getMe));
router.put('/update-profile',    protect, asyncHandler(c.updateProfile));
router.put('/change-password',   protect, asyncHandler(c.changePassword));

module.exports = router;
