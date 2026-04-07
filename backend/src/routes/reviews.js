// src/routes/reviews.js
const router = require('express').Router();
const c      = require('../controllers/misc');
const { protect, optionalAuth } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');

router.get('/:productId',   optionalAuth, asyncHandler(c.getReviews));
router.post('/:productId',  protect,      asyncHandler(c.addReview));

module.exports = router;
