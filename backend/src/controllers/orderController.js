// src/controllers/orderController.js
const pool = require('../config/db');

// ── Helper: generate invoice number BJ-YYYY-NNNNN ─────────────
const genInvoiceNo = (orderId) => {
  const year = new Date().getFullYear();
  return `BJ-${year}-${String(orderId).padStart(5, '0')}`;
};

// ── POST /api/orders — Create order + save bill snapshot ───────
exports.createOrder = async (req, res) => {
  const { address_id, items, payment_method, coupon_code, notes } = req.body;
  const user_id = req.user.id;

  if (!items?.length) {
    return res.status(400).json({ success: false, message: 'Order must contain at least one item.' });
  }

  // Fetch current gold rate
  const [rates] = await pool.execute('SELECT * FROM gold_rates ORDER BY id DESC LIMIT 1');
  const rate    = rates[0];

  let subtotal     = 0;
  let makingTotal  = 0;
  const orderItems = [];

  for (const item of items) {
    const [rows] = await pool.execute(
      'SELECT * FROM products WHERE id = ? AND stock_quantity >= ?',
      [item.product_id, item.quantity]
    );
    if (!rows.length) {
      return res.status(400).json({ success: false, message: `Product ID ${item.product_id} is out of stock.` });
    }
    const p        = rows[0];
    const goldRate = p.purity === '22k' ? rate.rate_22k : p.purity === '18k' ? rate.rate_18k : rate.rate_14k;
    const price    = Math.round(p.gold_weight * goldRate + p.making_charges);
    subtotal      += price * item.quantity;
    makingTotal   += p.making_charges * item.quantity;
    orderItems.push({
      product_id:     p.id,
      name:           p.name,
      purity:         p.purity,
      gold_weight:    p.gold_weight,
      making_charges: p.making_charges,
      quantity:       item.quantity,
      price,
      gold_rate:      goldRate,
    });
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

  // Fetch customer + address details for bill snapshot
  const [userRows] = await pool.execute('SELECT name, email, phone FROM users WHERE id = ?', [user_id]);
  const customer   = userRows[0];

  let deliveryAddress = '';
  if (address_id) {
    const [addrRows] = await pool.execute(
      'SELECT full_name, phone, address_line1, address_line2, city, state, pincode FROM addresses WHERE id = ?',
      [address_id]
    );
    if (addrRows.length) {
      const a = addrRows[0];
      deliveryAddress = [
        a.full_name,
        a.phone,
        a.address_line1,
        a.address_line2,
        `${a.city}, ${a.state} - ${a.pincode}`,
      ].filter(Boolean).join('\n');
    }
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // 1. Insert into orders
    const [orderResult] = await conn.execute(
      `INSERT INTO orders
         (user_id, address_id, subtotal, making_charges, gst, shipping, total_amount, payment_method, coupon_code, discount, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [user_id, address_id, subtotal, makingTotal, gst, shipping, total, payment_method || 'cod', coupon_code || null, discount, notes || null]
    );
    const orderId = orderResult.insertId;

    // 2. Insert order_items + decrement stock
    for (const item of orderItems) {
      await conn.execute(
        'INSERT INTO order_items (order_id, product_id, quantity, price, gold_rate) VALUES (?, ?, ?, ?, ?)',
        [orderId, item.product_id, item.quantity, item.price, item.gold_rate]
      );
      await conn.execute(
        'UPDATE products SET stock_quantity = stock_quantity - ? WHERE id = ?',
        [item.quantity, item.product_id]
      );
    }

    // 3. Save bill snapshot in order_bills
    const invoiceNo = genInvoiceNo(orderId);
    await conn.execute(
      `INSERT INTO order_bills
         (order_id, invoice_no, customer_name, customer_email, customer_phone,
          delivery_address, items_json, subtotal, making_charges, discount, gst,
          shipping, total_amount, payment_method, coupon_code)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        orderId,
        invoiceNo,
        customer.name,
        customer.email,
        customer.phone,
        deliveryAddress,
        JSON.stringify(orderItems),
        subtotal,
        makingTotal,
        discount,
        gst,
        shipping,
        total,
        payment_method || 'cod',
        coupon_code || null,
      ]
    );

    // 4. Clear cart
    const [cart] = await conn.execute('SELECT id FROM cart WHERE user_id = ?', [user_id]);
    if (cart.length) await conn.execute('DELETE FROM cart_items WHERE cart_id = ?', [cart[0].id]);

    await conn.commit();
    res.status(201).json({ success: true, message: 'Order placed successfully.', orderId, invoiceNo, total });
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};

// ── GET /api/orders — User's orders ────────────────────────────
exports.getMyOrders = async (req, res) => {
  const [orders] = await pool.execute(
    `SELECT o.*, ob.invoice_no, GROUP_CONCAT(p.name SEPARATOR ', ') AS product_names
     FROM orders o
     LEFT JOIN order_bills ob ON ob.order_id = o.id
     LEFT JOIN order_items oi ON oi.order_id = o.id
     LEFT JOIN products p ON p.id = oi.product_id
     WHERE o.user_id = ?
     GROUP BY o.id
     ORDER BY o.created_at DESC`,
    [req.user.id]
  );
  res.json({ success: true, data: orders });
};

// ── GET /api/orders/:id — Single order detail ──────────────────
exports.getOrderById = async (req, res) => {
  const { id } = req.params;

  const [orders] = await pool.execute(
    `SELECT o.*, ob.invoice_no,
            a.full_name, a.phone, a.address_line1, a.address_line2, a.city, a.state, a.pincode
     FROM orders o
     LEFT JOIN order_bills ob ON ob.order_id = o.id
     LEFT JOIN addresses a ON a.id = o.address_id
     WHERE o.id = ? AND (o.user_id = ? OR ? = 'admin')`,
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

// ── GET /api/orders/:id/invoice — Full bill / invoice ──────────
exports.getInvoice = async (req, res) => {
  const { id } = req.params;

  // Verify ownership (or admin)
  const [orders] = await pool.execute(
    'SELECT id, user_id FROM orders WHERE id = ?',
    [id]
  );
  if (!orders.length) return res.status(404).json({ success: false, message: 'Order not found.' });
  if (orders[0].user_id !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Access denied.' });
  }

  const [bills] = await pool.execute(
    'SELECT * FROM order_bills WHERE order_id = ?',
    [id]
  );

  if (!bills.length) {
    // Fallback: generate from orders + order_items (for old orders placed before this feature)
    const [orderRows] = await pool.execute(
      `SELECT o.*, u.name AS customer_name, u.email AS customer_email, u.phone AS customer_phone,
              a.full_name, a.address_line1, a.address_line2, a.city, a.state, a.pincode
       FROM orders o
       JOIN users u ON u.id = o.user_id
       LEFT JOIN addresses a ON a.id = o.address_id
       WHERE o.id = ?`,
      [id]
    );
    const o = orderRows[0];
    const [itemRows] = await pool.execute(
      'SELECT oi.*, p.name, p.purity, p.gold_weight FROM order_items oi JOIN products p ON p.id = oi.product_id WHERE oi.order_id = ?',
      [id]
    );
    return res.json({
      success: true,
      data: {
        order_id:         o.id,
        invoice_no:       genInvoiceNo(o.id),
        bill_date:        o.created_at,
        customer_name:    o.customer_name,
        customer_email:   o.customer_email,
        customer_phone:   o.customer_phone,
        delivery_address: [o.full_name, o.address_line1, o.address_line2, `${o.city}, ${o.state} - ${o.pincode}`].filter(Boolean).join('\n'),
        items_json:       itemRows,
        subtotal:         o.subtotal,
        making_charges:   o.making_charges,
        discount:         o.discount,
        gst:              o.gst,
        shipping:         o.shipping,
        total_amount:     o.total_amount,
        payment_method:   o.payment_method,
        coupon_code:      o.coupon_code,
      }
    });
  }

  const bill = bills[0];
  // Parse items_json if it came back as string
  if (typeof bill.items_json === 'string') bill.items_json = JSON.parse(bill.items_json);

  res.json({ success: true, data: { ...bill, order_id: parseInt(id) } });
};

// ── PUT /api/orders/:id/status (admin) ─────────────────────────
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

// ── GET /api/admin/orders (admin) ──────────────────────────────
exports.getAllOrders = async (req, res) => {
  const { status, page = 1, limit = 20 } = req.query;
  const offset = (parseInt(page) - 1) * parseInt(limit);

  let conditions = ['1=1'];
  const params   = [];
  if (status) { conditions.push('o.status = ?'); params.push(status); }

  const [orders] = await pool.execute(
    `SELECT o.*, ob.invoice_no, u.name AS user_name, u.email AS user_email,
     COUNT(oi.id) AS item_count
     FROM orders o
     JOIN users u ON u.id = o.user_id
     LEFT JOIN order_bills ob ON ob.order_id = o.id
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
