// ============================================================
// Balaji Jewellers — Express Server
// ============================================================
require('dotenv').config();
const express        = require('express');
const cors           = require('cors');
const helmet         = require('helmet');
const compression    = require('compression');
const rateLimit      = require('express-rate-limit');
const cookieParser   = require('cookie-parser');
const morgan         = require('morgan');

const authRoutes      = require('./src/routes/auth');
const productRoutes   = require('./src/routes/products');
const categoryRoutes  = require('./src/routes/categories');
const cartRoutes      = require('./src/routes/cart');
const wishlistRoutes  = require('./src/routes/wishlist');
const orderRoutes     = require('./src/routes/orders');
const reviewRoutes    = require('./src/routes/reviews');
const goldRoutes      = require('./src/routes/goldRates');
const addressRoutes   = require('./src/routes/addresses');
const adminRoutes     = require('./src/routes/admin');
const couponRoutes    = require('./src/routes/coupons');
const { errorHandler } = require('./src/middleware/errorHandler');

const app = express();

// ── Security ──────────────────────────────────────────────
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(compression());
app.use(cookieParser());
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// ── CORS ──────────────────────────────────────────────────
const allowedOrigins = (process.env.FRONTEND_URL || 'http://localhost:3000')
  .split(',')
  .map(origin => origin.trim())
  .filter(Boolean);

app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error('Origin is not allowed by CORS.'));
  },
  credentials: true,
  methods: ['GET','POST','PUT','DELETE','PATCH','OPTIONS'],
}));

// ── Rate Limiting ─────────────────────────────────────────
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  message: { success: false, message: 'Too many requests. Please try again later.' },
});
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { success: false, message: 'Too many auth attempts. Please try again later.' },
});

app.use('/api/', limiter);
app.use('/api/auth/', authLimiter);

// ── Body Parsing ──────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ── Static Files ──────────────────────────────────────────
app.use('/uploads', express.static('uploads'));

// ── Routes ────────────────────────────────────────────────
app.use('/api/auth',       authRoutes);
app.use('/api/products',   productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/cart',       cartRoutes);
app.use('/api/wishlist',   wishlistRoutes);
app.use('/api/orders',     orderRoutes);
app.use('/api/reviews',    reviewRoutes);
app.use('/api/gold-rates', goldRoutes);
app.use('/api/addresses',  addressRoutes);
app.use('/api/admin',      adminRoutes);
app.use('/api/coupons',    couponRoutes);

// ── Health Check ──────────────────────────────────────────
app.get('/health', async (req, res) => {
  try {
    const pool = require('./src/config/db');
    await pool.query('SELECT 1');
    res.json({ status: 'OK', database: 'connected', timestamp: new Date() });
  } catch (_) {
    res.status(503).json({ status: 'DEGRADED', database: 'disconnected', timestamp: new Date() });
  }
});

// ── 404 ───────────────────────────────────────────────────
app.use((req, res) => res.status(404).json({ success: false, message: 'Route not found' }));

// ── Global Error Handler ──────────────────────────────────
app.use(errorHandler);

// ── Start ─────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`\n🪙  Balaji Jewellers API running on port ${PORT}`);
    console.log(`📦  Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🌐  Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:3000'}\n`);
  });
}

module.exports = app;
