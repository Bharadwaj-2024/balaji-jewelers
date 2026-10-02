// src/controllers/cartController.js
const pool = require('../config/db');

exports.getCart = async (req, res) => {
  const [cart] = await pool.execute('SELECT id FROM cart WHERE user_id = ?', [req.user.id]);
  if (!cart.length) return res.json({ success: true, data: { items: [], total: 0 } });

  const [items] = await pool.execute(
    `SELECT ci.id, ci.quantity, p.id AS product_id, p.name, p.purity, p.gold_weight, p.making_charges, p.stock_quantity,
     (SELECT image_url FROM product_images WHERE product_id = p.id AND is_primary = 1 LIMIT 1) AS image,
     gr.rate_22k, gr.rate_18k, gr.rate_14k
     FROM cart_items ci
     JOIN products p ON p.id = ci.product_id
     CROSS JOIN (SELECT * FROM gold_rates ORDER BY id DESC LIMIT 1) gr
     WHERE ci.cart_id = ?`,
    [cart[0].id]
  );

  const enriched = items.map(i => {
    const rate  = i.purity === '22k' ? i.rate_22k : i.purity === '18k' ? i.rate_18k : i.rate_14k;
    const price = Math.round(i.gold_weight * rate + i.making_charges);
    return { ...i, price, subtotal: price * i.quantity };
  });

  const total = enriched.reduce((s, i) => s + i.subtotal, 0);
  res.json({ success: true, data: { items: enriched, total } });
};

exports.addToCart = async (req, res) => {
  const productId = Number(req.body.product_id);
  const quantity = Number(req.body.quantity ?? 1);
  if (!Number.isInteger(productId) || productId < 1 || !Number.isInteger(quantity) || quantity < 1) {
    return res.status(400).json({ success: false, message: 'A valid product and positive quantity are required.' });
  }
  const [products] = await pool.execute('SELECT stock_quantity FROM products WHERE id = ?', [productId]);
  if (!products.length) return res.status(404).json({ success: false, message: 'Product not found.' });

  const [cart] = await pool.execute('SELECT id FROM cart WHERE user_id = ?', [req.user.id]);
  let cartId = cart[0]?.id;
  if (!cartId) {
    const [r] = await pool.execute('INSERT INTO cart (user_id) VALUES (?)', [req.user.id]);
    cartId = r.insertId;
  }
  const [[current]] = await pool.execute(
    'SELECT quantity FROM cart_items WHERE cart_id = ? AND product_id = ?',
    [cartId, productId]
  );
  if ((current?.quantity || 0) + quantity > products[0].stock_quantity) {
    return res.status(400).json({ success: false, message: 'Requested quantity exceeds available stock.' });
  }
  await pool.execute(
    'INSERT INTO cart_items (cart_id, product_id, quantity) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE quantity = quantity + ?',
    [cartId, productId, quantity, quantity]
  );
  res.json({ success: true, message: 'Added to cart.' });
};

exports.updateCartItem = async (req, res) => {
  const { id } = req.params;
  const quantity = Number(req.body.quantity);
  if (!Number.isInteger(quantity)) {
    return res.status(400).json({ success: false, message: 'Quantity must be an integer.' });
  }
  if (quantity < 1) {
    await pool.execute(
      'DELETE ci FROM cart_items ci JOIN cart c ON c.id = ci.cart_id WHERE ci.id = ? AND c.user_id = ?',
      [id, req.user.id]
    );
    return res.json({ success: true, message: 'Item removed.' });
  }
  const [rows] = await pool.execute(
    `SELECT p.stock_quantity FROM cart_items ci
     JOIN cart c ON c.id = ci.cart_id
     JOIN products p ON p.id = ci.product_id
     WHERE ci.id = ? AND c.user_id = ?`,
    [id, req.user.id]
  );
  if (!rows.length) return res.status(404).json({ success: false, message: 'Cart item not found.' });
  if (quantity > rows[0].stock_quantity) {
    return res.status(400).json({ success: false, message: 'Requested quantity exceeds available stock.' });
  }
  await pool.execute(
    'UPDATE cart_items ci JOIN cart c ON c.id = ci.cart_id SET ci.quantity = ? WHERE ci.id = ? AND c.user_id = ?',
    [quantity, id, req.user.id]
  );
  res.json({ success: true, message: 'Cart updated.' });
};

exports.removeFromCart = async (req, res) => {
  await pool.execute(
    'DELETE ci FROM cart_items ci JOIN cart c ON c.id = ci.cart_id WHERE ci.id = ? AND c.user_id = ?',
    [req.params.id, req.user.id]
  );
  res.json({ success: true, message: 'Item removed from cart.' });
};

exports.clearCart = async (req, res) => {
  const [cart] = await pool.execute('SELECT id FROM cart WHERE user_id = ?', [req.user.id]);
  if (cart.length) await pool.execute('DELETE FROM cart_items WHERE cart_id = ?', [cart[0].id]);
  res.json({ success: true, message: 'Cart cleared.' });
};

// ─────────────────────────────────────────────────────────
// src/controllers/wishlistController.js
// ─────────────────────────────────────────────────────────
exports.getWishlist = async (req, res) => {
  const [items] = await pool.execute(
    `SELECT w.id, w.created_at, p.id AS product_id, p.name, p.purity, p.gold_weight, p.making_charges, p.is_featured,
     (SELECT image_url FROM product_images WHERE product_id = p.id AND is_primary = 1 LIMIT 1) AS image,
     gr.rate_22k, gr.rate_18k, gr.rate_14k
     FROM wishlist w JOIN products p ON p.id = w.product_id
     CROSS JOIN (SELECT * FROM gold_rates ORDER BY id DESC LIMIT 1) gr
     WHERE w.user_id = ? ORDER BY w.created_at DESC`,
    [req.user.id]
  );
  const enriched = items.map(i => {
    const rate  = i.purity === '22k' ? i.rate_22k : i.purity === '18k' ? i.rate_18k : i.rate_14k;
    return { ...i, price: Math.round(i.gold_weight * rate + i.making_charges) };
  });
  res.json({ success: true, data: enriched });
};

exports.addToWishlist = async (req, res) => {
  const { product_id } = req.body;
  await pool.execute('INSERT IGNORE INTO wishlist (user_id, product_id) VALUES (?, ?)', [req.user.id, product_id]);
  res.json({ success: true, message: 'Added to wishlist.' });
};

exports.removeFromWishlist = async (req, res) => {
  await pool.execute('DELETE FROM wishlist WHERE user_id = ? AND product_id = ?', [req.user.id, req.params.productId]);
  res.json({ success: true, message: 'Removed from wishlist.' });
};

// ─────────────────────────────────────────────────────────
// REVIEWS
// ─────────────────────────────────────────────────────────
exports.getReviews = async (req, res) => {
  const [reviews] = await pool.execute(
    `SELECT r.*, u.name AS user_name FROM reviews r JOIN users u ON u.id = r.user_id WHERE r.product_id = ? ORDER BY r.created_at DESC`,
    [req.params.productId]
  );
  const [stats] = await pool.execute(
    'SELECT COALESCE(AVG(rating),0) AS avg, COUNT(*) AS total FROM reviews WHERE product_id = ?',
    [req.params.productId]
  );
  res.json({ success: true, data: reviews, stats: stats[0] });
};

exports.addReview = async (req, res) => {
  const { rating, comment } = req.body;
  const { productId } = req.params;
  if (!rating || rating < 1 || rating > 5) {
    return res.status(400).json({ success: false, message: 'Rating must be between 1 and 5.' });
  }
  await pool.execute(
    'INSERT INTO reviews (user_id, product_id, rating, comment) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE rating = ?, comment = ?',
    [req.user.id, productId, rating, comment || null, rating, comment || null]
  );
  res.json({ success: true, message: 'Review submitted.' });
};

// ─────────────────────────────────────────────────────────
// GOLD RATES
// ─────────────────────────────────────────────────────────
let cachedRates = null;
let cacheExpiry = 0;

exports.getGoldRates = async (req, res) => {
  const now = Date.now();
  if (cachedRates && now < cacheExpiry) {
    return res.json({ success: true, data: cachedRates, cached: true });
  }
  const [rows] = await pool.execute('SELECT * FROM gold_rates ORDER BY id DESC LIMIT 1');
  cachedRates = rows[0] || null;
  cacheExpiry = now + 60 * 60 * 1000; // 1 hour
  res.json({ success: true, data: cachedRates });
};

exports.updateGoldRates = async (req, res) => {
  const rate_22k = Number(req.body.rate_22k);
  const rate_18k = Number(req.body.rate_18k);
  const rate_14k = Number(req.body.rate_14k);
  if (![rate_22k, rate_18k, rate_14k].every(rate => Number.isFinite(rate) && rate > 0)) {
    return res.status(400).json({ success: false, message: 'All three rates are required.' });
  }
  await pool.execute(
    'INSERT INTO gold_rates (rate_22k, rate_18k, rate_14k, updated_by) VALUES (?, ?, ?, ?)',
    [rate_22k, rate_18k, rate_14k, req.user.id]
  );
  cachedRates = null; // Bust cache
  res.json({ success: true, message: 'Gold rates updated.' });
};

// ─────────────────────────────────────────────────────────
// ADDRESSES
// ─────────────────────────────────────────────────────────
exports.getAddresses = async (req, res) => {
  const [rows] = await pool.execute('SELECT * FROM addresses WHERE user_id = ? ORDER BY is_default DESC', [req.user.id]);
  res.json({ success: true, data: rows });
};

exports.addAddress = async (req, res) => {
  const { full_name, phone, address_line1, address_line2, city, state, pincode, country, is_default } = req.body;
  if (!full_name?.trim() || !phone?.trim() || !address_line1?.trim() || !city?.trim() || !state?.trim() || !/^\d{6}$/.test(String(pincode || ''))) {
    return res.status(400).json({ success: false, message: 'Complete name, phone, address, city, state, and a valid 6-digit pincode are required.' });
  }
  if (is_default) await pool.execute('UPDATE addresses SET is_default = 0 WHERE user_id = ?', [req.user.id]);
  const [result] = await pool.execute(
    'INSERT INTO addresses (user_id, full_name, phone, address_line1, address_line2, city, state, pincode, country, is_default) VALUES (?,?,?,?,?,?,?,?,?,?)',
    [req.user.id, full_name, phone, address_line1, address_line2 || null, city, state, pincode, country || 'India', is_default ? 1 : 0]
  );
  res.status(201).json({ success: true, message: 'Address added.', addressId: result.insertId });
};

exports.updateAddress = async (req, res) => {
  const { id } = req.params;
  const { full_name, phone, address_line1, address_line2, city, state, pincode, country, is_default } = req.body;
  if (!full_name?.trim() || !phone?.trim() || !address_line1?.trim() || !city?.trim() || !state?.trim() || !/^\d{6}$/.test(String(pincode || ''))) {
    return res.status(400).json({ success: false, message: 'Complete name, phone, address, city, state, and a valid 6-digit pincode are required.' });
  }
  if (is_default) await pool.execute('UPDATE addresses SET is_default = 0 WHERE user_id = ?', [req.user.id]);
  await pool.execute(
    'UPDATE addresses SET full_name=?, phone=?, address_line1=?, address_line2=?, city=?, state=?, pincode=?, country=?, is_default=? WHERE id=? AND user_id=?',
    [full_name, phone, address_line1, address_line2 || null, city, state, pincode, country || 'India', is_default ? 1 : 0, id, req.user.id]
  );
  res.json({ success: true, message: 'Address updated.' });
};

exports.deleteAddress = async (req, res) => {
  await pool.execute('DELETE FROM addresses WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
  res.json({ success: true, message: 'Address deleted.' });
};

// ─────────────────────────────────────────────────────────
// ADMIN OVERVIEW
// ─────────────────────────────────────────────────────────
exports.getAdminStats = async (req, res) => {
  const [[orders]]   = await pool.execute("SELECT COUNT(*) AS total, SUM(CASE WHEN status='pending' THEN 1 ELSE 0 END) AS pending FROM orders");
  const [[revenue]]  = await pool.execute("SELECT COALESCE(SUM(total_amount),0) AS total FROM orders WHERE payment_status='paid'");
  const [[products]] = await pool.execute("SELECT COUNT(*) AS total, SUM(CASE WHEN stock_quantity=0 THEN 1 ELSE 0 END) AS out_of_stock FROM products");
  const [[users]]    = await pool.execute("SELECT COUNT(*) AS total FROM users WHERE role='user'");
  const [recentOrders] = await pool.execute(
    "SELECT o.id, u.name AS user_name, o.total_amount, o.status, o.created_at FROM orders o JOIN users u ON u.id=o.user_id ORDER BY o.created_at DESC LIMIT 5"
  );
  res.json({
    success: true,
    data: {
      orders:       { total: orders.total, pending: orders.pending },
      revenue:      revenue.total,
      products:     { total: products.total, outOfStock: products.out_of_stock },
      users:        users.total,
      recentOrders,
    }
  });
};

exports.getAdminUsers = async (req, res) => {
  const [rows] = await pool.execute('SELECT id, name, email, phone, role, created_at FROM users ORDER BY created_at DESC');
  res.json({ success: true, data: rows });
};

// CATEGORIES
exports.getCategories = async (req, res) => {
  const [rows] = await pool.execute(
    'SELECT c.*, COUNT(p.id) AS product_count FROM categories c LEFT JOIN products p ON p.category_id = c.id GROUP BY c.id'
  );
  res.json({ success: true, data: rows });
};

exports.createCategory = async (req, res) => {
  const { name, description, image_url } = req.body;
  const [result] = await pool.execute('INSERT INTO categories (name, description, image_url) VALUES (?,?,?)', [name, description || null, image_url || null]);
  res.status(201).json({ success: true, message: 'Category created.', categoryId: result.insertId });
};

// COUPONS
exports.getCoupons = async (req, res) => {
  const [rows] = await pool.execute('SELECT * FROM coupons ORDER BY created_at DESC');
  res.json({ success: true, data: rows });
};

exports.validateCoupon = async (req, res) => {
  const code = String(req.body.code || '').trim().toUpperCase();
  const order_total = Number(req.body.order_total);
  if (!code || !Number.isFinite(order_total) || order_total < 0) {
    return res.status(400).json({ success: false, message: 'A coupon code and valid order total are required.' });
  }
  const [rows] = await pool.execute(
    'SELECT * FROM coupons WHERE code = ? AND is_active = 1 AND (expires_at IS NULL OR expires_at > NOW()) AND used_count < max_uses AND min_order <= ?',
    [code, order_total]
  );
  if (!rows.length) return res.status(400).json({ success: false, message: 'Invalid or expired coupon.' });
  const c = rows[0];
  const discount = c.discount_type === 'percent' ? Math.round(order_total * c.discount_value / 100) : c.discount_value;
  res.json({ success: true, data: { ...c, discount } });
};
