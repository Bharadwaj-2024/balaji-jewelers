// src/routes/cart.js
const router = require('express').Router();
const c      = require('../controllers/misc');
const { protect } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');
router.get('/',           protect, asyncHandler(c.getCart));
router.post('/add',       protect, asyncHandler(c.addToCart));
router.put('/update/:id', protect, asyncHandler(c.updateCartItem));
router.delete('/remove/:id', protect, asyncHandler(c.removeFromCart));
router.delete('/clear',   protect, asyncHandler(c.clearCart));
module.exports = router;
