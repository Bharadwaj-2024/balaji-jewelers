// src/controllers/authController.js
const bcrypt = require('bcrypt');
const jwt    = require('jsonwebtoken');
const pool   = require('../config/db');

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure:   process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge:   7 * 24 * 60 * 60 * 1000, // 7 days
};

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });

// POST /api/auth/register
exports.register = async (req, res) => {
  const { name, email, password, phone } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ success: false, message: 'Name, email and password are required.' });
  }
  if (password.length < 8) {
    return res.status(400).json({ success: false, message: 'Password must be at least 8 characters.' });
  }

  const [existing] = await pool.execute('SELECT id FROM users WHERE email = ?', [email]);
  if (existing.length) {
    return res.status(409).json({ success: false, message: 'Email already registered.' });
  }

  const hashed = await bcrypt.hash(password, 12);
  const [result] = await pool.execute(
    'INSERT INTO users (name, email, password, phone) VALUES (?, ?, ?, ?)',
    [name.trim(), email.toLowerCase(), hashed, phone || null]
  );

  // Create empty cart for the user
  await pool.execute('INSERT INTO cart (user_id) VALUES (?)', [result.insertId]);

  const token = signToken(result.insertId);
  res.cookie('token', token, COOKIE_OPTIONS);

  res.status(201).json({
    success: true,
    message: 'Account created successfully.',
    token,
    user: { id: result.insertId, name: name.trim(), email, role: 'user' },
  });
};

// POST /api/auth/login
exports.login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Email and password are required.' });
  }

  const [rows] = await pool.execute('SELECT * FROM users WHERE email = ?', [email.toLowerCase()]);
  if (!rows.length) {
    return res.status(401).json({ success: false, message: 'Invalid email or password.' });
  }

  const user = rows[0];
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    return res.status(401).json({ success: false, message: 'Invalid email or password.' });
  }

  // Ensure cart exists
  const [cart] = await pool.execute('SELECT id FROM cart WHERE user_id = ?', [user.id]);
  if (!cart.length) {
    await pool.execute('INSERT INTO cart (user_id) VALUES (?)', [user.id]);
  }

  const token = signToken(user.id);
  res.cookie('token', token, COOKIE_OPTIONS);

  res.json({
    success: true,
    message: 'Logged in successfully.',
    token,
    user: { id: user.id, name: user.name, email: user.email, role: user.role, phone: user.phone },
  });
};

// POST /api/auth/logout
exports.logout = (req, res) => {
  res.clearCookie('token');
  res.json({ success: true, message: 'Logged out successfully.' });
};

// GET /api/auth/me
exports.getMe = async (req, res) => {
  const [rows] = await pool.execute(
    'SELECT id, name, email, role, phone, created_at FROM users WHERE id = ?',
    [req.user.id]
  );
  res.json({ success: true, user: rows[0] });
};

// PUT /api/auth/update-profile
exports.updateProfile = async (req, res) => {
  const { name, phone } = req.body;
  await pool.execute('UPDATE users SET name = ?, phone = ? WHERE id = ?', [name, phone, req.user.id]);
  res.json({ success: true, message: 'Profile updated.' });
};

// PUT /api/auth/change-password
exports.changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  const [rows] = await pool.execute('SELECT password FROM users WHERE id = ?', [req.user.id]);
  const isMatch = await bcrypt.compare(currentPassword, rows[0].password);
  if (!isMatch) {
    return res.status(400).json({ success: false, message: 'Current password is incorrect.' });
  }
  if (newPassword.length < 8) {
    return res.status(400).json({ success: false, message: 'New password must be at least 8 characters.' });
  }

  const hashed = await bcrypt.hash(newPassword, 12);
  await pool.execute('UPDATE users SET password = ? WHERE id = ?', [hashed, req.user.id]);
  res.json({ success: true, message: 'Password changed successfully.' });
};
