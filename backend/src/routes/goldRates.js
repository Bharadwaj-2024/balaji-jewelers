// src/routes/goldRates.js
const router = require('express').Router();
const c      = require('../controllers/misc');
const { protect, adminOnly } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');

router.get('/',   asyncHandler(c.getGoldRates));
router.put('/',   protect, adminOnly, asyncHandler(c.updateGoldRates));

module.exports = router;
