// src/routes/coupons.js
const router = require('express').Router();
const c      = require('../controllers/misc');
const { protect, adminOnly } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');

router.get('/',        protect, adminOnly, asyncHandler(c.getCoupons));
router.post('/validate', protect, asyncHandler(c.validateCoupon));

module.exports = router;
