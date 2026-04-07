// src/routes/categories.js
const router = require('express').Router();
const c      = require('../controllers/misc');
const { protect, adminOnly } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');

router.get('/',   asyncHandler(c.getCategories));
router.post('/',  protect, adminOnly, asyncHandler(c.createCategory));

module.exports = router;
