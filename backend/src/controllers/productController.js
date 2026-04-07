// src/controllers/productController.js
const pool           = require('../config/db');
const { cloudinary } = require('../config/cloudinary');

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

  if (category)    { conditions.push('p.category_id = ?');  params.push(category); }
  if (purity)      { conditions.push('p.purity = ?');        params.push(purity); }
  if (occasion)    { conditions.push('p.occasion = ?');      params.push(occasion); }
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

  const offset = (parseInt(page) - 1) * parseInt(limit);

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
  params.push(parseInt(limit), offset);

  const [products] = await pool.execute(sql, params);

  // Total count
  const countSql = `SELECT COUNT(DISTINCT p.id) AS total FROM products p WHERE ${conditions.join(' AND ')}`;
  const [countRows] = await pool.execute(countSql, params.slice(0, -2));
  const total = countRows[0].total;

  res.json({
    success: true,
    data: products,
    pagination: {
      total,
      page:       parseInt(page),
      limit:      parseInt(limit),
      totalPages: Math.ceil(total / parseInt(limit)),
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

  res.json({ success: true, data: { ...rows[0], images, variants } });
};

// POST /api/products (admin)
exports.createProduct = async (req, res) => {
  const { name, category_id, price, gold_weight, purity, making_charges, description, occasion, stock_quantity, is_featured, is_new } = req.body;

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

  const isPrimary = req.body.is_primary === 'true';

  for (let i = 0; i < req.files.length; i++) {
    const file = req.files[i];
    await pool.execute(
      'INSERT INTO product_images (product_id, image_url, is_primary, sort_order) VALUES (?, ?, ?, ?)',
      [id, file.path, i === 0 && isPrimary ? 1 : 0, i]
    );
  }

  res.json({ success: true, message: `${req.files.length} image(s) uploaded.` });
};

// DELETE /api/products/:id/images/:imageId (admin)
exports.deleteImage = async (req, res) => {
  const { imageId } = req.params;
  const [rows] = await pool.execute('SELECT image_url FROM product_images WHERE id = ?', [imageId]);
  if (!rows.length) return res.status(404).json({ success: false, message: 'Image not found.' });

  const publicId = rows[0].image_url.split('/').pop().split('.')[0];
  await cloudinary.uploader.destroy(`balaji-jewellers/${publicId}`).catch(() => {});
  await pool.execute('DELETE FROM product_images WHERE id = ?', [imageId]);

  res.json({ success: true, message: 'Image deleted.' });
};
