// src/routes/admin.js
const router = require('express').Router();
const c      = require('../controllers/misc');
const oc     = require('../controllers/orderController');
const { protect, adminOnly } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');

router.use(protect, adminOnly);

router.get('/stats',   asyncHandler(c.getAdminStats));
router.get('/users',   asyncHandler(c.getAdminUsers));
router.get('/orders',  asyncHandler(oc.getAllOrders));

module.exports = router;
