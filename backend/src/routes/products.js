// src/routes/products.js
const router = require('express').Router();
const c      = require('../controllers/productController');
const { protect, adminOnly } = require('../middleware/auth');
const { upload }  = require('../config/cloudinary');
const { asyncHandler } = require('../middleware/errorHandler');

router.get('/',                         asyncHandler(c.getProducts));
router.get('/:id',                      asyncHandler(c.getProductById));
router.post('/',                        protect, adminOnly, asyncHandler(c.createProduct));
router.put('/:id',                      protect, adminOnly, asyncHandler(c.updateProduct));
router.delete('/:id',                   protect, adminOnly, asyncHandler(c.deleteProduct));
router.post('/:id/images',             protect, adminOnly, upload.array('images', 6), asyncHandler(c.uploadImages));
router.delete('/:id/images/:imageId',  protect, adminOnly, asyncHandler(c.deleteImage));

module.exports = router;
