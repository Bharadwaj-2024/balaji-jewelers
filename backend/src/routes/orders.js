// src/routes/orders.js
const router = require('express').Router();
const c      = require('../controllers/orderController');
const { protect, adminOnly } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');

router.post('/',                  protect, asyncHandler(c.createOrder));
router.get('/',                   protect, asyncHandler(c.getMyOrders));
router.get('/:id',                protect, asyncHandler(c.getOrderById));
router.put('/:id/status',         protect, adminOnly, asyncHandler(c.updateOrderStatus));

module.exports = router;
