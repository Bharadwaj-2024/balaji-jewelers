// src/routes/wishlist.js
const router = require('express').Router();
const c      = require('../controllers/misc');
const { protect } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');

router.get('/',                      protect, asyncHandler(c.getWishlist));
router.post('/add',                  protect, asyncHandler(c.addToWishlist));
router.delete('/remove/:productId',  protect, asyncHandler(c.removeFromWishlist));

module.exports = router;
