// src/middleware/errorHandler.js
const errorHandler = (err, req, res, next) => {
  console.error(`[ERROR] ${req.method} ${req.path}:`, err.message);

  // Multer errors
  if (err.name === 'MulterError') {
    return res.status(400).json({ success: false, message: err.message });
  }

  // MySQL duplicate entry
  if (err.code === 'ER_DUP_ENTRY') {
    const field = err.sqlMessage?.match(/key '(.+)'/)?.[1] || 'field';
    return res.status(409).json({ success: false, message: `Duplicate entry for ${field}.` });
  }

  // Joi / express-validator
  if (err.isJoi) {
    return res.status(400).json({ success: false, message: err.details[0].message });
  }

  const status = err.statusCode || err.status || 500;
  res.status(status).json({
    success: false,
    message: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

// Wrap async route handlers to catch errors
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = { errorHandler, asyncHandler };
