-- ╔══════════════════════════════════════════════════════════════════╗
-- ║   BALAJI JEWELLERS — SQL TOPICS REFERENCE (All-in-One)        ║
-- ║   Every SQL concept used in this project, clearly explained   ║
-- ╚══════════════════════════════════════════════════════════════════╝


-- ============================================================
-- TOPIC 1: CREATE DATABASE
-- Creates a new database. IF NOT EXISTS prevents errors if it
-- already exists. CHARACTER SET utf8mb4 supports emojis & all
-- languages. COLLATE sets sorting/comparison rules.
-- ============================================================
CREATE DATABASE IF NOT EXISTS balaji_jewellers
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE balaji_jewellers;


-- ============================================================
-- TOPIC 2: CREATE TABLE + DATA TYPES + CONSTRAINTS
-- ============================================================
-- Data Types used:
--   INT           → whole numbers (ids, quantities)
--   VARCHAR(n)    → variable-length text up to n chars
--   TEXT          → long text (descriptions)
--   DECIMAL(p,s)  → exact numbers (p=total digits, s=decimal places)
--   BOOLEAN       → TRUE/FALSE (stored as TINYINT 0/1)
--   TIMESTAMP     → date + time values
--   ENUM(...)     → restricted set of allowed values
--   JSON          → stores JSON data natively
--
-- Constraints used:
--   PRIMARY KEY      → uniquely identifies each row
--   AUTO_INCREMENT   → auto-generates incrementing IDs
--   NOT NULL         → field cannot be empty
--   UNIQUE           → no duplicate values allowed
--   DEFAULT          → fallback value if none provided
--   CHECK            → validates data against a condition
--   FOREIGN KEY      → links to another table's primary key
--   ON DELETE CASCADE→ auto-delete child rows when parent is deleted
-- ============================================================

-- TABLE: users
CREATE TABLE users (
  id          INT AUTO_INCREMENT PRIMARY KEY,   -- AUTO_INCREMENT: auto-generates 1,2,3...
  name        VARCHAR(100) NOT NULL,            -- NOT NULL: must have a value
  email       VARCHAR(150) UNIQUE NOT NULL,     -- UNIQUE: no two users can have same email
  password    VARCHAR(255) NOT NULL,
  phone       VARCHAR(15),                      -- nullable (no NOT NULL = optional)
  role        ENUM('user','admin') DEFAULT 'user',  -- ENUM: only these 2 values allowed
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP   -- DEFAULT: auto-fills current time
);

-- TABLE: addresses (ONE-TO-MANY: one user → many addresses)
CREATE TABLE addresses (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  user_id       INT NOT NULL,
  full_name     VARCHAR(100),
  phone         VARCHAR(15),
  address_line1 TEXT,                           -- TEXT: for longer content
  address_line2 TEXT,
  city          VARCHAR(100),
  state         VARCHAR(100),
  pincode       VARCHAR(10),
  country       VARCHAR(50) DEFAULT 'India',    -- DEFAULT: India if not specified
  is_default    BOOLEAN DEFAULT FALSE,          -- BOOLEAN: true/false flag
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  -- ↑ FOREIGN KEY: user_id must exist in users table
  -- ↑ ON DELETE CASCADE: if user is deleted, their addresses are auto-deleted
);

-- TABLE: categories
CREATE TABLE categories (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(100) NOT NULL,
  description TEXT,
  image_url   VARCHAR(255)
);

-- TABLE: products (FOREIGN KEY to categories)
CREATE TABLE products (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  name            VARCHAR(200) NOT NULL,
  category_id     INT,
  price           DECIMAL(10,2) NOT NULL,       -- DECIMAL(10,2): up to 99999999.99
  gold_weight     DECIMAL(6,3),                 -- DECIMAL(6,3): up to 999.999 grams
  purity          ENUM('14k','18k','22k') DEFAULT '22k',
  making_charges  DECIMAL(10,2) DEFAULT 0,
  description     TEXT,
  occasion        VARCHAR(100),
  stock_quantity  INT DEFAULT 0,
  is_featured     BOOLEAN DEFAULT FALSE,
  is_new          BOOLEAN DEFAULT FALSE,
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES categories(id)
);

-- TABLE: product_images (ONE-TO-MANY: one product → many images)
CREATE TABLE product_images (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  product_id  INT NOT NULL,
  image_url   VARCHAR(255) NOT NULL,
  is_primary  BOOLEAN DEFAULT FALSE,
  sort_order  INT DEFAULT 0,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- TABLE: product_variants
CREATE TABLE product_variants (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  product_id  INT NOT NULL,
  size        VARCHAR(20),
  weight      DECIMAL(6,3),
  price       DECIMAL(10,2),
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- TABLE: orders (MULTIPLE FOREIGN KEYS + ON UPDATE CURRENT_TIMESTAMP)
CREATE TABLE orders (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  user_id         INT NOT NULL,
  address_id      INT,
  subtotal        DECIMAL(10,2),
  making_charges  DECIMAL(10,2),
  gst             DECIMAL(10,2),
  shipping        DECIMAL(10,2) DEFAULT 0,
  total_amount    DECIMAL(10,2),
  status          ENUM('pending','processing','shipped','delivered','cancelled') DEFAULT 'pending',
  payment_method  ENUM('cod','upi','card','razorpay') DEFAULT 'cod',
  payment_status  ENUM('pending','paid','failed') DEFAULT 'pending',
  notes           TEXT,
  coupon_code     VARCHAR(50),
  discount        DECIMAL(10,2) DEFAULT 0,
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  -- ↑ ON UPDATE CURRENT_TIMESTAMP: auto-updates whenever row is modified
  FOREIGN KEY (user_id)    REFERENCES users(id),
  FOREIGN KEY (address_id) REFERENCES addresses(id)
);

-- TABLE: order_items (MULTIPLE FOREIGN KEYS)
CREATE TABLE order_items (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  order_id    INT NOT NULL,
  product_id  INT NOT NULL,
  quantity    INT DEFAULT 1,
  price       DECIMAL(10,2),
  gold_rate   DECIMAL(10,2),
  FOREIGN KEY (order_id)   REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id)
);

-- TABLE: order_bills (JSON DATA TYPE + UNIQUE constraint on non-PK column)
CREATE TABLE order_bills (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  order_id        INT NOT NULL UNIQUE,          -- UNIQUE: one bill per order
  invoice_no      VARCHAR(30) NOT NULL,
  customer_name   VARCHAR(100) NOT NULL,
  customer_email  VARCHAR(150),
  customer_phone  VARCHAR(15),
  delivery_address TEXT,
  items_json      JSON NOT NULL,                -- JSON: stores order snapshot as JSON
  subtotal        DECIMAL(10,2),
  making_charges  DECIMAL(10,2),
  discount        DECIMAL(10,2) DEFAULT 0,
  gst             DECIMAL(10,2),
  shipping        DECIMAL(10,2) DEFAULT 0,
  total_amount    DECIMAL(10,2),
  payment_method  VARCHAR(20),
  coupon_code     VARCHAR(50),
  bill_date       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
);

-- TABLE: reviews (CHECK constraint + COMPOSITE UNIQUE KEY)
CREATE TABLE reviews (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  user_id     INT NOT NULL,
  product_id  INT NOT NULL,
  rating      INT CHECK (rating BETWEEN 1 AND 5),  -- CHECK: rating must be 1-5
  comment     TEXT,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id)    REFERENCES users(id),
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  UNIQUE KEY unique_review (user_id, product_id)
  -- ↑ COMPOSITE UNIQUE: one review per user per product
);

-- TABLE: wishlist (MANY-TO-MANY relationship via junction table)
CREATE TABLE wishlist (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  user_id     INT NOT NULL,
  product_id  INT NOT NULL,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id)    REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  UNIQUE KEY unique_wish (user_id, product_id)
);

-- TABLE: cart (ONE-TO-ONE: one cart per user via UNIQUE on user_id)
CREATE TABLE cart (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  user_id     INT UNIQUE NOT NULL,              -- UNIQUE: each user gets exactly one cart
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- TABLE: cart_items
CREATE TABLE cart_items (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  cart_id     INT NOT NULL,
  product_id  INT NOT NULL,
  quantity    INT DEFAULT 1,
  FOREIGN KEY (cart_id)    REFERENCES cart(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id),
  UNIQUE KEY unique_cart_item (cart_id, product_id)
);

-- TABLE: gold_rates
CREATE TABLE gold_rates (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  rate_22k    DECIMAL(10,2) NOT NULL,
  rate_18k    DECIMAL(10,2) NOT NULL,
  rate_14k    DECIMAL(10,2) NOT NULL,
  updated_by  INT,
  updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (updated_by) REFERENCES users(id)
);

-- TABLE: coupons
CREATE TABLE coupons (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  code            VARCHAR(50) UNIQUE NOT NULL,
  discount_type   ENUM('percent','flat') DEFAULT 'percent',
  discount_value  DECIMAL(10,2),
  min_order       DECIMAL(10,2) DEFAULT 0,
  max_uses        INT DEFAULT 100,
  used_count      INT DEFAULT 0,
  expires_at      TIMESTAMP NULL,               -- NULL allowed: NULL means never expires
  is_active       BOOLEAN DEFAULT TRUE,
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- ============================================================
-- TOPIC 3: CREATE INDEX
-- Indexes speed up SELECT queries on frequently searched columns.
-- Think of it like a book's index — find data without scanning
-- every row.
-- ============================================================
CREATE INDEX idx_products_category  ON products(category_id);
CREATE INDEX idx_products_featured  ON products(is_featured);
CREATE INDEX idx_order_items_order  ON order_items(order_id);
CREATE INDEX idx_reviews_product    ON reviews(product_id);
CREATE INDEX idx_cart_items_cart    ON cart_items(cart_id);
CREATE INDEX idx_order_bills_order  ON order_bills(order_id);


-- ============================================================
-- TOPIC 4: INSERT INTO — Adding data
-- ============================================================

-- Simple INSERT
INSERT INTO gold_rates (rate_22k, rate_18k, rate_14k)
VALUES (6820.00, 5580.00, 4300.00);

-- Multi-row INSERT (insert many rows at once)
INSERT INTO categories (name, description, image_url) VALUES
  ('Rings',     'Beautiful gold rings for every occasion', '/images/cats/rings.jpg'),
  ('Necklaces', 'Elegant necklaces and harams',            '/images/cats/necklaces.jpg'),
  ('Earrings',  'Jhumkas, studs, drops and more',          '/images/cats/earrings.jpg'),
  ('Bangles',   'Traditional and modern gold bangles',      '/images/cats/bangles.jpg'),
  ('Pendants',  'Gold pendants for every belief',           '/images/cats/pendants.jpg'),
  ('Chains',    'Lightweight everyday gold chains',         '/images/cats/chains.jpg');

-- INSERT with many columns
INSERT INTO products
  (name, category_id, price, gold_weight, purity, making_charges,
   description, occasion, stock_quantity, is_featured, is_new)
VALUES
  ('Royal Kundan Bridal Ring', 1, 35480, 4.5, '22k', 2800,
   'Exquisite kundan bridal ring with meenakari work.',
   'Wedding', 12, TRUE, TRUE),
  ('Peacock Polki Necklace', 2, 86700, 18.2, '22k', 12500,
   'Majestic peacock-inspired polki necklace in 22K gold.',
   'Wedding', 5, TRUE, TRUE);

-- INSERT with hashed password
INSERT INTO users (name, email, password, phone, role) VALUES
  ('Admin', 'admin@balajijewellers.com',
   '$2b$12$LQ9aBzR0l9xK6q/SYPg8dOWc4pJlHHLgYi3nIFBEJe5KHvtv7jkRi',
   '9876543210', 'admin');

INSERT INTO coupons (code, discount_type, discount_value, min_order) VALUES
  ('BALAJI10',   'percent', 10,  10000),
  ('WELCOME500', 'flat',   500,   5000),
  ('WEDDING15',  'percent', 15,  50000);


-- ============================================================
-- TOPIC 5: INSERT IGNORE — Skip if duplicate exists
-- Unlike regular INSERT, this won't throw an error on duplicates.
-- ============================================================
INSERT IGNORE INTO wishlist (user_id, product_id) VALUES (1, 5);
-- If user 1 already wishlisted product 5, this silently does nothing.


-- ============================================================
-- TOPIC 6: INSERT ... ON DUPLICATE KEY UPDATE (UPSERT)
-- If a duplicate key is found, UPDATE instead of throwing an error.
-- ============================================================
-- Cart: add item or increment quantity if already in cart
INSERT INTO cart_items (cart_id, product_id, quantity)
VALUES (1, 3, 1)
ON DUPLICATE KEY UPDATE quantity = quantity + 1;
-- ↑ If product 3 is already in cart 1, just add 1 to its quantity

-- Review: insert new or update existing review
INSERT INTO reviews (user_id, product_id, rating, comment)
VALUES (1, 5, 4, 'Beautiful pendant!')
ON DUPLICATE KEY UPDATE rating = 4, comment = 'Beautiful pendant!';

-- Seed data upsert
INSERT INTO categories (name, description, image_url)
VALUES ('Rings', 'Gold rings', '/images/rings.jpg')
ON DUPLICATE KEY UPDATE name = VALUES(name);


-- ============================================================
-- TOPIC 7: SELECT — Reading data
-- ============================================================

-- Basic SELECT
SELECT * FROM gold_rates ORDER BY id DESC LIMIT 1;
-- ↑ Get the latest gold rate (* = all columns)

-- SELECT specific columns with WHERE
SELECT id, name, email, role, phone FROM users WHERE id = 1;

-- SELECT with comparison operators
SELECT * FROM products WHERE id = 1 AND stock_quantity >= 2;

-- SELECT with LIKE (pattern matching for search)
SELECT * FROM products
WHERE name LIKE '%kundan%'              -- contains "kundan"
   OR description LIKE '%kundan%'
   OR occasion LIKE '%kundan%';


-- ============================================================
-- TOPIC 8: JOINS — Combining data from multiple tables
-- ============================================================

-- LEFT JOIN: Get ALL products, even those without a category
-- (unmatched rows show NULL for category columns)
SELECT p.*, c.name AS category_name
FROM products p
LEFT JOIN categories c ON p.category_id = c.id;

-- INNER JOIN (just "JOIN"): Only rows that match in BOTH tables
SELECT r.*, u.name AS user_name
FROM reviews r
JOIN users u ON u.id = r.user_id
WHERE r.product_id = 1;

-- Multiple JOINs in one query
SELECT o.*, ob.invoice_no, u.name AS user_name, u.email AS user_email
FROM orders o
JOIN users u ON u.id = o.user_id
LEFT JOIN order_bills ob ON ob.order_id = o.id
LEFT JOIN order_items oi ON oi.order_id = o.id;

-- CROSS JOIN: Every row from one table paired with another
-- Used here to attach current gold rates to every cart/wishlist item
SELECT ci.*, p.name, p.gold_weight,
       gr.rate_22k, gr.rate_18k, gr.rate_14k
FROM cart_items ci
JOIN products p ON p.id = ci.product_id
CROSS JOIN (SELECT * FROM gold_rates ORDER BY id DESC LIMIT 1) gr
WHERE ci.cart_id = 1;


-- ============================================================
-- TOPIC 9: AGGREGATE FUNCTIONS — Calculations on groups of rows
-- ============================================================

-- COUNT: How many rows?
SELECT COUNT(*) AS total FROM users WHERE role = 'user';

-- COUNT(DISTINCT): Count unique values only
SELECT COUNT(DISTINCT r.id) AS review_count FROM reviews r WHERE r.product_id = 1;

-- SUM: Add up values
SELECT COALESCE(SUM(total_amount), 0) AS revenue
FROM orders WHERE payment_status = 'paid';
-- ↑ COALESCE: returns 0 if SUM is NULL (no paid orders)

-- AVG: Average value
SELECT COALESCE(AVG(rating), 0) AS avg_rating FROM reviews WHERE product_id = 1;

-- GROUP_CONCAT: Combine multiple values into one string
SELECT o.id, GROUP_CONCAT(p.name SEPARATOR ', ') AS product_names
FROM orders o
LEFT JOIN order_items oi ON oi.order_id = o.id
LEFT JOIN products p ON p.id = oi.product_id
GROUP BY o.id;
-- ↑ Result: "Royal Kundan Bridal Ring, Peacock Polki Necklace"


-- ============================================================
-- TOPIC 10: GROUP BY — Group rows for aggregate calculations
-- ============================================================

-- Products with their average rating and review count
SELECT p.id, p.name,
       COALESCE(AVG(r.rating), 0) AS avg_rating,
       COUNT(DISTINCT r.id) AS review_count
FROM products p
LEFT JOIN reviews r ON r.product_id = p.id
GROUP BY p.id;

-- Categories with product count
SELECT c.*, COUNT(p.id) AS product_count
FROM categories c
LEFT JOIN products p ON p.category_id = c.id
GROUP BY c.id;


-- ============================================================
-- TOPIC 11: ORDER BY + LIMIT + OFFSET (Sorting & Pagination)
-- ============================================================

-- Sort by price descending
SELECT * FROM products ORDER BY price DESC;

-- Sort by created_at, newest first
SELECT * FROM orders ORDER BY created_at DESC;

-- Pagination: Page 2, 12 items per page
SELECT * FROM products
ORDER BY created_at DESC
LIMIT 12 OFFSET 12;
-- ↑ LIMIT 12: show 12 results
-- ↑ OFFSET 12: skip the first 12 (page 1)
-- Formula: OFFSET = (page - 1) × limit


-- ============================================================
-- TOPIC 12: SUBQUERIES — A query inside another query
-- ============================================================

-- Scalar subquery in SELECT (returns one value per row)
SELECT p.id, p.name,
  (SELECT image_url FROM product_images
   WHERE product_id = p.id AND is_primary = 1 LIMIT 1) AS primary_image,
  (SELECT image_url FROM product_images
   WHERE product_id = p.id AND is_primary = 0 LIMIT 1) AS hover_image
FROM products p;

-- Subquery in FROM (derived table)
SELECT ci.*, gr.rate_22k
FROM cart_items ci
CROSS JOIN (SELECT * FROM gold_rates ORDER BY id DESC LIMIT 1) gr;


-- ============================================================
-- TOPIC 13: CASE WHEN — Conditional logic inside SQL
-- ============================================================

-- Admin dashboard stats: conditional counting
SELECT
  COUNT(*) AS total_orders,
  SUM(CASE WHEN status = 'pending'  THEN 1 ELSE 0 END) AS pending,
  SUM(CASE WHEN status = 'shipped'  THEN 1 ELSE 0 END) AS shipped
FROM orders;

-- Products: count out-of-stock items
SELECT
  COUNT(*) AS total,
  SUM(CASE WHEN stock_quantity = 0 THEN 1 ELSE 0 END) AS out_of_stock
FROM products;


-- ============================================================
-- TOPIC 14: UPDATE — Modifying existing data
-- ============================================================

-- Simple UPDATE
UPDATE users SET name = 'Bharadwaj', phone = '9999999999' WHERE id = 1;

-- UPDATE with hashed password
UPDATE users SET password = '$2b$12$newhashhere' WHERE id = 1;

-- Dynamic UPDATE (backend builds SET clause dynamically)
UPDATE products SET name = 'New Name', price = 45000 WHERE id = 1;

-- UPDATE with arithmetic
UPDATE products SET stock_quantity = stock_quantity - 2 WHERE id = 1;
-- ↑ Decrease stock by 2 when someone buys

UPDATE products SET stock_quantity = stock_quantity + 2 WHERE id = 1;
-- ↑ Restore stock when order is cancelled

-- UPDATE counters
UPDATE coupons SET used_count = used_count + 1 WHERE id = 1;

-- Bulk UPDATE (reset all defaults)
UPDATE addresses SET is_default = 0 WHERE user_id = 1;


-- ============================================================
-- TOPIC 15: DELETE — Removing data
-- ============================================================

-- Simple DELETE
DELETE FROM products WHERE id = 1;

-- DELETE with multiple conditions
DELETE FROM wishlist WHERE user_id = 1 AND product_id = 5;

-- DELETE all items in a cart
DELETE FROM cart_items WHERE cart_id = 1;

-- DELETE with ownership check
DELETE FROM addresses WHERE id = 3 AND user_id = 1;
-- ↑ Only delete if this address belongs to user 1


-- ============================================================
-- TOPIC 16: WHERE CLAUSE PATTERNS (Filtering)
-- ============================================================

-- Parameterized queries (? placeholders prevent SQL injection)
-- In backend code: pool.execute('SELECT * FROM users WHERE email = ?', [email])

-- Comparison operators
SELECT * FROM products WHERE price >= 10000 AND price <= 50000;

-- IS NULL / IS NOT NULL
SELECT * FROM coupons
WHERE is_active = 1
  AND (expires_at IS NULL OR expires_at > NOW());
-- ↑ Active coupons that either never expire OR haven't expired yet

-- NOW() function: current date-time
SELECT * FROM coupons WHERE expires_at > NOW();

-- Multiple conditions with AND + OR
SELECT * FROM coupons
WHERE code = 'BALAJI10'
  AND is_active = 1
  AND used_count < max_uses
  AND min_order <= 50000;

-- Dynamic WHERE building (1=1 trick)
-- Backend starts with WHERE 1=1 (always true) then appends conditions:
-- WHERE 1=1 AND category_id = 1 AND purity = '22k' AND price >= 10000
SELECT * FROM products p
WHERE 1=1
  AND p.category_id = 1
  AND p.purity = '22k'
  AND p.price >= 10000;


-- ============================================================
-- TOPIC 17: TRANSACTIONS — All-or-nothing operations
-- Used when placing an order (must create order + items + bill
-- + update stock ALL together, or NONE if something fails)
-- ============================================================

-- START TRANSACTION: begin a group of operations
START TRANSACTION;

  -- Step 1: Create the order
  INSERT INTO orders (user_id, address_id, subtotal, gst, total_amount, payment_method)
  VALUES (1, 1, 35480, 1064, 36544, 'upi');
  -- Assume this gives orderId = 100

  -- Step 2: Add order items
  INSERT INTO order_items (order_id, product_id, quantity, price, gold_rate)
  VALUES (100, 1, 1, 35480, 6820);

  -- Step 3: Decrease stock
  UPDATE products SET stock_quantity = stock_quantity - 1 WHERE id = 1;

  -- Step 4: Save bill snapshot
  INSERT INTO order_bills
    (order_id, invoice_no, customer_name, customer_email, items_json,
     subtotal, gst, total_amount, payment_method)
  VALUES
    (100, 'BJ-2026-00100', 'Bharadwaj', 'user@email.com',
     '[{"name":"Royal Kundan Bridal Ring","quantity":1,"price":35480}]',
     35480, 1064, 36544, 'upi');

  -- Step 5: Clear cart
  DELETE FROM cart_items WHERE cart_id = 1;

-- If everything succeeded:
COMMIT;

-- If any step failed, undo ALL changes:
-- ROLLBACK;


-- ============================================================
-- TOPIC 18: COALESCE — Handle NULL values
-- Returns the first non-NULL value from the list
-- ============================================================
SELECT COALESCE(AVG(rating), 0) AS avg_rating FROM reviews WHERE product_id = 999;
-- ↑ If no reviews exist, AVG returns NULL. COALESCE converts it to 0.

SELECT COALESCE(SUM(total_amount), 0) AS revenue FROM orders WHERE payment_status = 'paid';
-- ↑ If no paid orders, returns 0 instead of NULL


-- ============================================================
-- TOPIC 19: ALIASES — Renaming columns/tables for clarity
-- ============================================================

-- Column alias (AS)
SELECT COUNT(*) AS total_products FROM products;
SELECT AVG(rating) AS average_rating FROM reviews;

-- Table alias (short names for readability)
SELECT p.name, c.name AS category_name
FROM products p                          -- "p" is alias for products
LEFT JOIN categories c ON p.category_id = c.id;  -- "c" for categories


-- ============================================================
-- TOPIC 20: RELATIONSHIP TYPES (Database Design)
-- ============================================================

-- ONE-TO-MANY: One user has many addresses
-- users.id (1) → addresses.user_id (many)
-- One product has many images
-- products.id (1) → product_images.product_id (many)
-- One order has many order_items
-- orders.id (1) → order_items.order_id (many)

-- ONE-TO-ONE: One user has one cart (enforced by UNIQUE on user_id)
-- users.id (1) → cart.user_id (1, UNIQUE)
-- One order has one bill (enforced by UNIQUE on order_id)
-- orders.id (1) → order_bills.order_id (1, UNIQUE)

-- MANY-TO-MANY: Users ↔ Products (through junction tables)
-- users ↔ wishlist ↔ products
-- users ↔ reviews ↔ products
-- cart ↔ cart_items ↔ products


-- ============================================================
-- TOPIC 21: SELECT with COUNT for pagination
-- ============================================================
-- Get total count for pagination metadata
SELECT COUNT(DISTINCT p.id) AS total FROM products p WHERE p.category_id = 1;

-- Then in the app: totalPages = CEIL(total / limit)


-- ============================================================
-- SUMMARY OF ALL 21 SQL TOPICS
-- ============================================================
-- 1.  CREATE DATABASE (with CHARACTER SET, COLLATE)
-- 2.  CREATE TABLE (with all data types & constraints)
-- 3.  CREATE INDEX (performance optimization)
-- 4.  INSERT INTO (single & multi-row)
-- 5.  INSERT IGNORE (skip duplicates)
-- 6.  INSERT ON DUPLICATE KEY UPDATE (upsert)
-- 7.  SELECT (basic queries, WHERE, LIKE)
-- 8.  JOINS (LEFT JOIN, INNER JOIN, CROSS JOIN)
-- 9.  AGGREGATE FUNCTIONS (COUNT, SUM, AVG, COALESCE, GROUP_CONCAT)
-- 10. GROUP BY (grouping for aggregates)
-- 11. ORDER BY + LIMIT + OFFSET (sorting & pagination)
-- 12. SUBQUERIES (scalar, derived tables)
-- 13. CASE WHEN (conditional logic)
-- 14. UPDATE (simple, arithmetic, dynamic, bulk)
-- 15. DELETE (simple, conditional, with ownership check)
-- 16. WHERE PATTERNS (comparisons, IS NULL, NOW(), dynamic building)
-- 17. TRANSACTIONS (START TRANSACTION, COMMIT, ROLLBACK)
-- 18. COALESCE (NULL handling)
-- 19. ALIASES (column AS, table aliases)
-- 20. RELATIONSHIP TYPES (one-to-one, one-to-many, many-to-many)
-- 21. PAGINATION (COUNT + LIMIT/OFFSET)
-- ============================================================
