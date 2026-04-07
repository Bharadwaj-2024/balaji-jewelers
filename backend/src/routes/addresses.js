// src/routes/addresses.js
const router = require('express').Router();
const c      = require('../controllers/misc');
const { protect } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');

router.get('/',        protect, asyncHandler(c.getAddresses));
router.post('/',       protect, asyncHandler(c.addAddress));
router.put('/:id',     protect, asyncHandler(c.updateAddress));
router.delete('/:id',  protect, asyncHandler(c.deleteAddress));

module.exports = router;
