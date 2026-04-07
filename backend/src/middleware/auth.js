// src/middleware/auth.js — JWT Authentication & Role Guards
const jwt  = require('jsonwebtoken');
const pool = require('../config/db');

// ── Verify JWT ─────────────────────────────────────────────
const protect = async (req, res, next) => {
  try {
    let token;

    // Check Authorization header first, then cookie
    if (req.headers.authorization?.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies?.token) {
      token = req.cookies.token;
    }

    if (!token) {
      return res.status(401).json({ success: false, message: 'Not authenticated. Please log in.' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const [rows] = await pool.execute(
      'SELECT id, name, email, role, phone FROM users WHERE id = ?',
      [decoded.id]
    );

    if (!rows.length) {
      return res.status(401).json({ success: false, message: 'User no longer exists.' });
    }

    req.user = rows[0];
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Session expired. Please log in again.' });
    }
    return res.status(401).json({ success: false, message: 'Invalid token.' });
  }
};

// ── Admin Only ─────────────────────────────────────────────
const adminOnly = (req, res, next) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Access denied. Admins only.' });
  }
  next();
};

// ── Optional Auth (attach user if token present) ───────────
const optionalAuth = async (req, res, next) => {
  try {
    let token;
    if (req.headers.authorization?.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies?.token) {
      token = req.cookies.token;
    }
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const [rows] = await pool.execute('SELECT id, name, email, role FROM users WHERE id = ?', [decoded.id]);
      if (rows.length) req.user = rows[0];
    }
  } catch (_) { /* silent */ }
  next();
};

module.exports = { protect, adminOnly, optionalAuth };
