// src/controllers/orderController.js
const pool = require('../config/db');

// POST /api/orders — Create order
exports.createOrder = async (req, res) => {
  const { address_id, items, payment_method, coupon_code, notes } = req.body;
  const user_id = req.user.id;

  if (!items?.length) {
    return res.status(400).json({ success: false, message: 'Order must contain at least one item.' });
  }

  // Fetch current gold rate
  const [rates] = await pool.execute('SELECT * FROM gold_rates ORDER BY id DESC LIMIT 1');
  const rate    = rates[0];

  let subtotal       = 0;
  let makingTotal    = 0;
  const orderItems   = [];

  for (const item of items) {
    const [rows] = await pool.execute('SELECT * FROM products WHERE id = ? AND stock_quantity >= ?', [item.product_id, item.quantity]);
    if (!rows.length) {
      return res.status(400).json({ success: false, message: `Product ID ${item.product_id} is out of stock.` });
    }
    const p       = rows[0];
    const goldRate = p.purity === '22k' ? rate.rate_22k : p.purity === '18k' ? rate.rate_18k : rate.rate_14k;
    const price   = Math.round(p.gold_weight * goldRate + p.making_charges);
    subtotal      += price * item.quantity;
    makingTotal   += p.making_charges * item.quantity;
    orderItems.push({ product_id: p.id, quantity: item.quantity, price, gold_rate: goldRate });
  }

  // Coupon validation
  let discount = 0;
  if (coupon_code) {
    const [coupons] = await pool.execute(
      'SELECT * FROM coupons WHERE code = ? AND is_active = 1 AND (expires_at IS NULL OR expires_at > NOW()) AND used_count < max_uses AND min_order <= ?',
      [coupon_code, subtotal]
    );
    if (coupons.length) {
      const c = coupons[0];
      discount = c.discount_type === 'percent' ? Math.round(subtotal * c.discount_value / 100) : c.discount_value;
      await pool.execute('UPDATE coupons SET used_count = used_count + 1 WHERE id = ?', [c.id]);
    }
  }

  const gst      = Math.round((subtotal - discount) * 0.03);
  const shipping  = subtotal > 10000 ? 0 : 299;
  const total     = subtotal - discount + gst + shipping;

  // Create order
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [orderResult] = await conn.execute(
      `INSERT INTO orders (user_id, address_id, subtotal, making_charges, gst, shipping, total_amount, payment_method, coupon_code, discount, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [user_id, address_id, subtotal, makingTotal, gst, shipping, total, payment_method || 'cod', coupon_code || null, discount, notes || null]
    );

    const orderId = orderResult.insertId;

    for (const item of orderItems) {
      await conn.execute(
        'INSERT INTO order_items (order_id, product_id, quantity, price, gold_rate) VALUES (?, ?, ?, ?, ?)',
        [orderId, item.product_id, item.quantity, item.price, item.gold_rate]
      );
      await conn.execute('UPDATE products SET stock_quantity = stock_quantity - ? WHERE id = ?', [item.quantity, item.product_id]);
    }

    // Clear cart
    const [cart] = await conn.execute('SELECT id FROM cart WHERE user_id = ?', [user_id]);
    if (cart.length) await conn.execute('DELETE FROM cart_items WHERE cart_id = ?', [cart[0].id]);

    await conn.commit();
    res.status(201).json({ success: true, message: 'Order placed successfully.', orderId, total });
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};

// GET /api/orders — User's orders
exports.getMyOrders = async (req, res) => {
  const [orders] = await pool.execute(
    `SELECT o.*, GROUP_CONCAT(p.name SEPARATOR ', ') AS product_names
     FROM orders o
     LEFT JOIN order_items oi ON oi.order_id = o.id
     LEFT JOIN products p ON p.id = oi.product_id
     WHERE o.user_id = ?
     GROUP BY o.id
     ORDER BY o.created_at DESC`,
    [req.user.id]
  );
  res.json({ success: true, data: orders });
};

// GET /api/orders/:id — Single order detail
exports.getOrderById = async (req, res) => {
  const { id } = req.params;

  const [orders] = await pool.execute(
    'SELECT o.*, a.full_name, a.phone, a.address_line1, a.address_line2, a.city, a.state, a.pincode FROM orders o LEFT JOIN addresses a ON a.id = o.address_id WHERE o.id = ? AND (o.user_id = ? OR ? = "admin")',
    [id, req.user.id, req.user.role]
  );

  if (!orders.length) return res.status(404).json({ success: false, message: 'Order not found.' });

  const [items] = await pool.execute(
    `SELECT oi.*, p.name, p.purity, p.gold_weight,
     (SELECT image_url FROM product_images WHERE product_id = p.id AND is_primary = 1 LIMIT 1) AS image
     FROM order_items oi JOIN products p ON p.id = oi.product_id WHERE oi.order_id = ?`,
    [id]
  );

  res.json({ success: true, data: { ...orders[0], items } });
};

// PUT /api/orders/:id/status (admin)
exports.updateOrderStatus = async (req, res) => {
  const { id }     = req.params;
  const { status, payment_status } = req.body;

  const valid = ['pending','processing','shipped','delivered','cancelled'];
  if (status && !valid.includes(status)) {
    return res.status(400).json({ success: false, message: 'Invalid status.' });
  }

  const updates = [];
  const values  = [];
  if (status)         { updates.push('status = ?');         values.push(status); }
  if (payment_status) { updates.push('payment_status = ?'); values.push(payment_status); }

  values.push(id);
  await pool.execute(`UPDATE orders SET ${updates.join(', ')} WHERE id = ?`, values);

  // Restore stock if cancelled
  if (status === 'cancelled') {
    const [items] = await pool.execute('SELECT product_id, quantity FROM order_items WHERE order_id = ?', [id]);
    for (const item of items) {
      await pool.execute('UPDATE products SET stock_quantity = stock_quantity + ? WHERE id = ?', [item.quantity, item.product_id]);
    }
  }

  res.json({ success: true, message: 'Order status updated.' });
};

// GET /api/admin/orders (admin)
exports.getAllOrders = async (req, res) => {
  const { status, page = 1, limit = 20 } = req.query;
  const offset = (parseInt(page) - 1) * parseInt(limit);

  let conditions = ['1=1'];
  const params   = [];
  if (status) { conditions.push('o.status = ?'); params.push(status); }

  const [orders] = await pool.execute(
    `SELECT o.*, u.name AS user_name, u.email AS user_email,
     COUNT(oi.id) AS item_count
     FROM orders o
     JOIN users u ON u.id = o.user_id
     LEFT JOIN order_items oi ON oi.order_id = o.id
     WHERE ${conditions.join(' AND ')}
     GROUP BY o.id
     ORDER BY o.created_at DESC
     LIMIT ? OFFSET ?`,
    [...params, parseInt(limit), offset]
  );

  const [[{total}]] = await pool.execute(
    `SELECT COUNT(*) AS total FROM orders o WHERE ${conditions.join(' AND ')}`, params
  );

  res.json({ success: true, data: orders, pagination: { total, page: parseInt(page), totalPages: Math.ceil(total / parseInt(limit)) } });
};
