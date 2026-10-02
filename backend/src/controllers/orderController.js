// src/controllers/orderController.js
const pool = require('../config/db');

// POST /api/orders — Create order
exports.createOrder = async (req, res) => {
  const { address_id, items, payment_method, coupon_code, notes } = req.body;
  const user_id = req.user.id;

  if (!items?.length) {
    return res.status(400).json({ success: false, message: 'Order must contain at least one item.' });
  }
  const addressId = Number(address_id);
  if (!Number.isInteger(addressId) || addressId < 1) {
    return res.status(400).json({ success: false, message: 'A valid delivery address is required.' });
  }
  const validPaymentMethods = ['cod', 'upi', 'card', 'razorpay'];
  const paymentMethod = payment_method || 'cod';
  if (!validPaymentMethods.includes(paymentMethod)) {
    return res.status(400).json({ success: false, message: 'Invalid payment method.' });
  }

  // Combine duplicate items and reject invalid or negative quantities before
  // opening the transaction.
  const itemMap = new Map();
  for (const item of items) {
    const productId = Number(item.product_id);
    const quantity = Number(item.quantity);
    if (!Number.isInteger(productId) || productId < 1 || !Number.isInteger(quantity) || quantity < 1) {
      return res.status(400).json({ success: false, message: 'Every order item must have a valid product and positive quantity.' });
    }
    itemMap.set(productId, (itemMap.get(productId) || 0) + quantity);
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [addresses] = await conn.execute(
      'SELECT id FROM addresses WHERE id = ? AND user_id = ? FOR UPDATE',
      [addressId, user_id]
    );
    if (!addresses.length) {
      const error = new Error('Delivery address was not found for this account.');
      error.statusCode = 400;
      throw error;
    }

    const [rates] = await conn.execute('SELECT * FROM gold_rates ORDER BY id DESC LIMIT 1 FOR UPDATE');
    if (!rates.length) {
      const error = new Error('Gold rates are unavailable. Please try again later.');
      error.statusCode = 503;
      throw error;
    }
    const rate = rates[0];
    let subtotal = 0;
    let makingTotal = 0;
    const orderItems = [];

    for (const [productId, quantity] of itemMap.entries()) {
      const [rows] = await conn.execute('SELECT * FROM products WHERE id = ? FOR UPDATE', [productId]);
      if (!rows.length || rows[0].stock_quantity < quantity) {
        const error = new Error(`Product ID ${productId} is unavailable in the requested quantity.`);
        error.statusCode = 400;
        throw error;
      }
      const product = rows[0];
      const goldRate = Number(product.purity === '22k' ? rate.rate_22k : product.purity === '18k' ? rate.rate_18k : rate.rate_14k);
      const price = Math.round(Number(product.gold_weight) * goldRate + Number(product.making_charges));
      subtotal += price * quantity;
      makingTotal += Number(product.making_charges) * quantity;
      orderItems.push({ product_id: product.id, quantity, price, gold_rate: goldRate });
    }

    let discount = 0;
    let appliedCoupon = null;
    const normalizedCoupon = String(coupon_code || '').trim().toUpperCase();
    if (normalizedCoupon) {
      const [coupons] = await conn.execute(
        `SELECT * FROM coupons
         WHERE code = ? AND is_active = 1
           AND (expires_at IS NULL OR expires_at > NOW())
           AND used_count < max_uses AND min_order <= ?
         FOR UPDATE`,
        [normalizedCoupon, subtotal]
      );
      if (!coupons.length) {
        const error = new Error('Invalid or expired coupon.');
        error.statusCode = 400;
        throw error;
      }
      appliedCoupon = coupons[0];
      discount = appliedCoupon.discount_type === 'percent'
        ? Math.round(subtotal * Number(appliedCoupon.discount_value) / 100)
        : Number(appliedCoupon.discount_value);
    }

    const gst = Math.round((subtotal - discount) * 0.03);
    const shipping = subtotal > 10000 ? 0 : 299;
    const total = subtotal - discount + gst + shipping;

    const [orderResult] = await conn.execute(
      `INSERT INTO orders (user_id, address_id, subtotal, making_charges, gst, shipping, total_amount, payment_method, coupon_code, discount, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [user_id, addressId, subtotal, makingTotal, gst, shipping, total, paymentMethod, appliedCoupon ? normalizedCoupon : null, discount, notes || null]
    );

    const orderId = orderResult.insertId;

    for (const item of orderItems) {
      await conn.execute(
        'INSERT INTO order_items (order_id, product_id, quantity, price, gold_rate) VALUES (?, ?, ?, ?, ?)',
        [orderId, item.product_id, item.quantity, item.price, item.gold_rate]
      );
      await conn.execute('UPDATE products SET stock_quantity = stock_quantity - ? WHERE id = ?', [item.quantity, item.product_id]);
    }

    if (appliedCoupon) {
      await conn.execute('UPDATE coupons SET used_count = used_count + 1 WHERE id = ?', [appliedCoupon.id]);
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
  const validPaymentStatuses = ['pending','paid','failed'];
  if (status && !valid.includes(status)) {
    return res.status(400).json({ success: false, message: 'Invalid status.' });
  }
  if (payment_status && !validPaymentStatuses.includes(payment_status)) {
    return res.status(400).json({ success: false, message: 'Invalid payment status.' });
  }
  if (!status && !payment_status) {
    return res.status(400).json({ success: false, message: 'No order fields to update.' });
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [existing] = await conn.execute('SELECT status FROM orders WHERE id = ? FOR UPDATE', [id]);
    if (!existing.length) {
      await conn.rollback();
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }
    if (existing[0].status === 'cancelled' && status && status !== 'cancelled') {
      await conn.rollback();
      return res.status(409).json({ success: false, message: 'A cancelled order cannot be reopened.' });
    }

    const updates = [];
    const values = [];
    if (status) { updates.push('status = ?'); values.push(status); }
    if (payment_status) { updates.push('payment_status = ?'); values.push(payment_status); }
    values.push(id);
    await conn.execute(`UPDATE orders SET ${updates.join(', ')} WHERE id = ?`, values);

    if (status === 'cancelled' && existing[0].status !== 'cancelled') {
      const [orderItems] = await conn.execute('SELECT product_id, quantity FROM order_items WHERE order_id = ?', [id]);
      for (const item of orderItems) {
        await conn.execute('UPDATE products SET stock_quantity = stock_quantity + ? WHERE id = ?', [item.quantity, item.product_id]);
      }
    }
    await conn.commit();
    res.json({ success: true, message: 'Order status updated.' });
  } catch (error) {
    await conn.rollback();
    throw error;
  } finally {
    conn.release();
  }
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
