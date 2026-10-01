// src/controllers/productController.js
const pool           = require('../config/db');
const { cloudinary } = require('../config/cloudinary');

const uploadImageBuffer = (buffer) => new Promise((resolve, reject) => {
  const stream = cloudinary.uploader.upload_stream({
    folder: 'balaji-jewellers',
    resource_type: 'image',
    transformation: [{ width: 800, height: 800, crop: 'limit', quality: 'auto:good' }],
  }, (error, result) => error ? reject(error) : resolve(result));
  stream.end(buffer);
});

// GET /api/products
exports.getProducts = async (req, res) => {
  const {
    category, purity, occasion, is_featured, is_new,
    min_price, max_price, search,
    sort = 'created_at', order = 'DESC',
    page = 1, limit = 12,
  } = req.query;

  let conditions = ['1=1'];
  const params   = [];

  const addListFilter = (column, value) => {
    const values = String(value || '').split(',').map(v => v.trim()).filter(Boolean).slice(0, 20);
    if (!values.length) return;
    conditions.push(`${column} IN (${values.map(() => '?').join(',')})`);
    params.push(...values);
  };
  if (category) addListFilter('p.category_id', category);
  if (purity) addListFilter('p.purity', purity);
  if (occasion) addListFilter('p.occasion', occasion);
  if (is_featured) { conditions.push('p.is_featured = 1'); }
  if (is_new)      { conditions.push('p.is_new = 1'); }
  if (min_price)   { conditions.push('p.price >= ?');        params.push(min_price); }
  if (max_price)   { conditions.push('p.price <= ?');        params.push(max_price); }
  if (search)      {
    conditions.push('(p.name LIKE ? OR p.description LIKE ? OR p.occasion LIKE ?)');
    params.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }

  const allowedSorts  = { price: 'p.price', created_at: 'p.created_at', name: 'p.name', stock: 'p.stock_quantity' };
  const sortCol       = allowedSorts[sort] || 'p.created_at';
  const sortOrder     = order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

  const pageNumber = Math.max(1, Number.parseInt(page, 10) || 1);
  const pageLimit = Math.min(100, Math.max(1, Number.parseInt(limit, 10) || 12));
  const offset = (pageNumber - 1) * pageLimit;

  const sql = `
    SELECT
      p.*,
      c.name AS category_name,
      (SELECT image_url FROM product_images WHERE product_id = p.id AND is_primary = 1 LIMIT 1) AS primary_image,
      (SELECT image_url FROM product_images WHERE product_id = p.id AND is_primary = 0 LIMIT 1) AS hover_image,
      COALESCE(AVG(r.rating), 0) AS avg_rating,
      COUNT(DISTINCT r.id) AS review_count
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
    LEFT JOIN reviews r ON r.product_id = p.id
    WHERE ${conditions.join(' AND ')}
    GROUP BY p.id
    ORDER BY ${sortCol} ${sortOrder}
    LIMIT ? OFFSET ?
  `;
  params.push(pageLimit, offset);

  const [products] = await pool.execute(sql, params);

  const [rateRows] = await pool.execute('SELECT rate_22k, rate_18k, rate_14k FROM gold_rates ORDER BY id DESC LIMIT 1');
  const rates = rateRows[0];
  const pricedProducts = products.map(product => {
    if (!rates || product.gold_weight == null) return product;
    const rate = product.purity === '22k' ? rates.rate_22k : product.purity === '18k' ? rates.rate_18k : rates.rate_14k;
    return {
      ...product,
      base_price: Number(product.price),
      price: Math.round(Number(product.gold_weight) * Number(rate) + Number(product.making_charges || 0)),
    };
  });

  // Total count
  const countSql = `SELECT COUNT(DISTINCT p.id) AS total FROM products p WHERE ${conditions.join(' AND ')}`;
  const [countRows] = await pool.execute(countSql, params.slice(0, -2));
  const total = countRows[0].total;

  res.json({
    success: true,
    data: pricedProducts,
    pagination: {
      total,
      page:       pageNumber,
      limit:      pageLimit,
      totalPages: Math.ceil(total / pageLimit),
    },
  });
};

// GET /api/products/:id
exports.getProductById = async (req, res) => {
  const { id } = req.params;

  const [rows] = await pool.execute(`
    SELECT p.*, c.name AS category_name,
      COALESCE(AVG(r.rating), 0) AS avg_rating,
      COUNT(DISTINCT r.id) AS review_count
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
    LEFT JOIN reviews r ON r.product_id = p.id
    WHERE p.id = ?
    GROUP BY p.id
  `, [id]);

  if (!rows.length) {
    return res.status(404).json({ success: false, message: 'Product not found.' });
  }

  const [images]   = await pool.execute('SELECT * FROM product_images WHERE product_id = ? ORDER BY is_primary DESC, sort_order ASC', [id]);
  const [variants] = await pool.execute('SELECT * FROM product_variants WHERE product_id = ?', [id]);

  const [rateRows] = await pool.execute('SELECT rate_22k, rate_18k, rate_14k FROM gold_rates ORDER BY id DESC LIMIT 1');
  const product = rows[0];
  if (rateRows.length && product.gold_weight != null) {
    const rates = rateRows[0];
    const rate = product.purity === '22k' ? rates.rate_22k : product.purity === '18k' ? rates.rate_18k : rates.rate_14k;
    product.base_price = Number(product.price);
    product.price = Math.round(Number(product.gold_weight) * Number(rate) + Number(product.making_charges || 0));
  }

  res.json({ success: true, data: { ...product, images, variants } });
};

// POST /api/products (admin)
exports.createProduct = async (req, res) => {
  const { name, category_id, price, gold_weight, purity, making_charges, description, occasion, stock_quantity, is_featured, is_new } = req.body;

  if (!name?.trim() || !['14k', '18k', '22k'].includes(purity) || !Number.isFinite(Number(gold_weight)) || Number(gold_weight) <= 0 || !Number.isFinite(Number(price)) || Number(price) < 0) {
    return res.status(400).json({ success: false, message: 'Name, purity, gold weight, and a valid price are required.' });
  }

  const [result] = await pool.execute(
    `INSERT INTO products (name, category_id, price, gold_weight, purity, making_charges, description, occasion, stock_quantity, is_featured, is_new)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [name, category_id, price, gold_weight, purity, making_charges || 0, description, occasion, stock_quantity || 0, is_featured ? 1 : 0, is_new ? 1 : 0]
  );

  res.status(201).json({ success: true, message: 'Product created.', productId: result.insertId });
};

// PUT /api/products/:id (admin)
exports.updateProduct = async (req, res) => {
  const { id } = req.params;
  const fields  = ['name','category_id','price','gold_weight','purity','making_charges','description','occasion','stock_quantity','is_featured','is_new'];
  const updates = [];
  const values  = [];

  fields.forEach(f => {
    if (req.body[f] !== undefined) { updates.push(`${f} = ?`); values.push(req.body[f]); }
  });

  if (!updates.length) return res.status(400).json({ success: false, message: 'No fields to update.' });

  values.push(id);
  await pool.execute(`UPDATE products SET ${updates.join(', ')} WHERE id = ?`, values);
  res.json({ success: true, message: 'Product updated.' });
};

// DELETE /api/products/:id (admin)
exports.deleteProduct = async (req, res) => {
  const { id } = req.params;
  const [[history]] = await pool.execute('SELECT COUNT(*) AS total FROM order_items WHERE product_id = ?', [id]);
  if (history.total > 0) {
    return res.status(409).json({ success: false, message: 'Products with order history cannot be deleted. Set stock to zero instead.' });
  }
  const [images] = await pool.execute('SELECT image_url FROM product_images WHERE product_id = ?', [id]);

  // Delete from Cloudinary
  for (const img of images) {
    const publicId = img.image_url.split('/').pop().split('.')[0];
    await cloudinary.uploader.destroy(`balaji-jewellers/${publicId}`).catch(() => {});
  }

  await pool.execute('DELETE FROM products WHERE id = ?', [id]);
  res.json({ success: true, message: 'Product deleted.' });
};

// POST /api/products/:id/images (admin)
exports.uploadImages = async (req, res) => {
  const { id } = req.params;
  if (!req.files?.length) return res.status(400).json({ success: false, message: 'No images uploaded.' });

  const [products] = await pool.execute('SELECT id FROM products WHERE id = ?', [id]);
  if (!products.length) return res.status(404).json({ success: false, message: 'Product not found.' });

  const isPrimary = req.body.is_primary === 'true';
  if (isPrimary) await pool.execute('UPDATE product_images SET is_primary = 0 WHERE product_id = ?', [id]);

  for (let i = 0; i < req.files.length; i++) {
    const file = req.files[i];
    const uploaded = await uploadImageBuffer(file.buffer);
    await pool.execute(
      'INSERT INTO product_images (product_id, image_url, is_primary, sort_order) VALUES (?, ?, ?, ?)',
      [id, uploaded.secure_url, i === 0 && isPrimary ? 1 : 0, i]
    );
  }

  res.json({ success: true, message: `${req.files.length} image(s) uploaded.` });
};

// DELETE /api/products/:id/images/:imageId (admin)
exports.deleteImage = async (req, res) => {
  const { id, imageId } = req.params;
  const [rows] = await pool.execute('SELECT image_url FROM product_images WHERE id = ? AND product_id = ?', [imageId, id]);
  if (!rows.length) return res.status(404).json({ success: false, message: 'Image not found.' });

  const publicId = rows[0].image_url.split('/').pop().split('.')[0];
  await cloudinary.uploader.destroy(`balaji-jewellers/${publicId}`).catch(() => {});
  await pool.execute('DELETE FROM product_images WHERE id = ?', [imageId]);

  res.json({ success: true, message: 'Image deleted.' });
};
