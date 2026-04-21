-- =============================================================
-- Balaji Jewellers — MySQL Schema
-- Run: mysql -u root -p < database/schema.sql
-- =============================================================

CREATE DATABASE IF NOT EXISTS balaji_jewellers CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE balaji_jewellers;

-- Users
CREATE TABLE users (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(100) NOT NULL,
  email       VARCHAR(150) UNIQUE NOT NULL,
  password    VARCHAR(255) NOT NULL,
  phone       VARCHAR(15),
  role        ENUM('user','admin') DEFAULT 'user',
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Addresses
CREATE TABLE addresses (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  user_id       INT NOT NULL,
  full_name     VARCHAR(100),
  phone         VARCHAR(15),
  address_line1 TEXT,
  address_line2 TEXT,
  city          VARCHAR(100),
  state         VARCHAR(100),
  pincode       VARCHAR(10),
  country       VARCHAR(50) DEFAULT 'India',
  is_default    BOOLEAN DEFAULT FALSE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Categories
CREATE TABLE categories (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(100) NOT NULL,
  description TEXT,
  image_url   VARCHAR(255)
);

-- Products
CREATE TABLE products (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  name            VARCHAR(200) NOT NULL,
  category_id     INT,
  price           DECIMAL(10,2) NOT NULL,
  gold_weight     DECIMAL(6,3),
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

-- Product Images
CREATE TABLE product_images (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  product_id  INT NOT NULL,
  image_url   VARCHAR(255) NOT NULL,
  is_primary  BOOLEAN DEFAULT FALSE,
  sort_order  INT DEFAULT 0,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- Product Variants
CREATE TABLE product_variants (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  product_id  INT NOT NULL,
  size        VARCHAR(20),
  weight      DECIMAL(6,3),
  price       DECIMAL(10,2),
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- Orders
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
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (address_id) REFERENCES addresses(id)
);

-- Order Items
CREATE TABLE order_items (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  order_id    INT NOT NULL,
  product_id  INT NOT NULL,
  quantity    INT DEFAULT 1,
  price       DECIMAL(10,2),
  gold_rate   DECIMAL(10,2),
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id)
);

-- Order Bills (invoice snapshot — saved once at order creation)
CREATE TABLE order_bills (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  order_id        INT NOT NULL UNIQUE,
  invoice_no      VARCHAR(30) NOT NULL,        -- e.g. BJ-2024-00001
  customer_name   VARCHAR(100) NOT NULL,
  customer_email  VARCHAR(150),
  customer_phone  VARCHAR(15),
  delivery_address TEXT,                        -- full address as formatted string
  items_json      JSON NOT NULL,               -- snapshot of items at time of order
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

-- Reviews
CREATE TABLE reviews (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  user_id     INT NOT NULL,
  product_id  INT NOT NULL,
  rating      INT CHECK (rating BETWEEN 1 AND 5),
  comment     TEXT,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  UNIQUE KEY unique_review (user_id, product_id)
);

-- Wishlist
CREATE TABLE wishlist (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  user_id     INT NOT NULL,
  product_id  INT NOT NULL,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  UNIQUE KEY unique_wish (user_id, product_id)
);

-- Cart
CREATE TABLE cart (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  user_id     INT UNIQUE NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Cart Items
CREATE TABLE cart_items (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  cart_id     INT NOT NULL,
  product_id  INT NOT NULL,
  quantity    INT DEFAULT 1,
  FOREIGN KEY (cart_id) REFERENCES cart(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id),
  UNIQUE KEY unique_cart_item (cart_id, product_id)
);

-- Gold Rates
CREATE TABLE gold_rates (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  rate_22k    DECIMAL(10,2) NOT NULL,
  rate_18k    DECIMAL(10,2) NOT NULL,
  rate_14k    DECIMAL(10,2) NOT NULL,
  updated_by  INT,
  updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (updated_by) REFERENCES users(id)
);

-- Coupons
CREATE TABLE coupons (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  code            VARCHAR(50) UNIQUE NOT NULL,
  discount_type   ENUM('percent','flat') DEFAULT 'percent',
  discount_value  DECIMAL(10,2),
  min_order       DECIMAL(10,2) DEFAULT 0,
  max_uses        INT DEFAULT 100,
  used_count      INT DEFAULT 0,
  expires_at      TIMESTAMP NULL,
  is_active       BOOLEAN DEFAULT TRUE,
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_products_category  ON products(category_id);
CREATE INDEX idx_products_featured  ON products(is_featured);
CREATE INDEX idx_order_items_order  ON order_items(order_id);
CREATE INDEX idx_reviews_product    ON reviews(product_id);
CREATE INDEX idx_cart_items_cart    ON cart_items(cart_id);
CREATE INDEX idx_order_bills_order  ON order_bills(order_id);

-- ======================== SEED DATA ========================

INSERT INTO gold_rates (rate_22k, rate_18k, rate_14k) VALUES (6820.00, 5580.00, 4300.00);

INSERT INTO categories (name, description, image_url) VALUES
  ('Rings',     'Beautiful gold rings for every occasion', '/images/cats/rings.jpg'),
  ('Necklaces', 'Elegant necklaces and harams',            '/images/cats/necklaces.jpg'),
  ('Earrings',  'Jhumkas, studs, drops and more',          '/images/cats/earrings.jpg'),
  ('Bangles',   'Traditional and modern gold bangles',      '/images/cats/bangles.jpg'),
  ('Pendants',  'Gold pendants for every belief',           '/images/cats/pendants.jpg'),
  ('Chains',    'Lightweight everyday gold chains',         '/images/cats/chains.jpg');

INSERT INTO products (name, category_id, price, gold_weight, purity, making_charges, description, occasion, stock_quantity, is_featured, is_new) VALUES
  ('Royal Kundan Bridal Ring',   1,  35480, 4.5, '22k',  2800, 'Exquisite kundan bridal ring handcrafted by master artisans with intricate meenakari work.',        'Wedding',     12, TRUE,  TRUE),
  ('Peacock Polki Necklace',     2,  86700, 18.2,'22k', 12500, 'Majestic peacock-inspired polki necklace in 22K gold adorned with uncut diamonds.',                  'Wedding',      5, TRUE,  TRUE),
  ('Temple Jhumka Earrings',     3,  50030,  6.8,'22k',  3500, 'Traditional south Indian temple jhumkas with deity motifs and cascading pearl drops.',               'Festive',     20, TRUE,  FALSE),
  ('Gold Bangle Set 6pc',        4, 175250, 24.5,'22k',  8500, 'Set of 6 traditional 22K gold bangles with floral motifs and matte finish.',                         'Wedding',      8, FALSE, FALSE),
  ('Om Pendant 18K',             5,  20640,  3.2,'18k',  1800, 'Sacred Om pendant in 18K gold. Lightweight and perfect for daily devotional wear.',                  'Daily Wear',  35, FALSE, TRUE),
  ('Wheat Chain 22K',            6,  64400,  8.5,'22k',  3200, 'Classic wheat chain in 22K gold. Durable and versatile, perfect for everyday wear.',                 'Daily Wear',  18, FALSE, FALSE),
  ('Diamond Cut Ring 18K',       1,  22360,  3.1,'18k',  2200, 'Modern diamond-cut pattern ring in 18K gold. Geometric facets catch light beautifully.',             'Anniversary', 14, TRUE,  TRUE),
  ('Lakshmi Coin Necklace',      2,  94860, 12.8,'22k',  7500, 'Auspicious Goddess Lakshmi coin pendant necklace in 22K gold. Traditional Kasu mala design.',       'Festive',      7, TRUE,  FALSE),
  ('Pearl Drop Earrings 18K',    3,  25930,  4.2,'18k',  2500, 'Elegant freshwater pearl drop earrings with 18K gold mount.',                                        'Daily Wear',  22, FALSE, TRUE),
  ('Antique Kada Bangle',        4, 114000, 15.6,'22k',  6800, 'Wide antique-finish 22K gold kada with traditional peacock and floral motifs.',                      'Festive',     10, FALSE, FALSE),
  ('Ganesha Pendant 22K',        5,  35560,  4.8,'22k',  2800, 'Lord Ganesha pendant in 22K gold, believed to bring good fortune and remove obstacles.',             'Festive',     28, FALSE, FALSE),
  ('Singapore Chain 22K',        6,  44680,  6.2,'22k',  2400, 'Lightweight Singapore chain in 22K gold. Pairs beautifully with any pendant.',                      'Daily Wear',  25, TRUE,  TRUE);

-- Admin user — password: Admin@123 (bcrypt hash)
INSERT INTO users (name, email, password, phone, role) VALUES
  ('Admin', 'admin@balajijewellers.com', '$2b$12$LQ9aBzR0l9xK6q/SYPg8dOWc4pJlHHLgYi3nIFBEJe5KHvtv7jkRi', '9876543210', 'admin');

INSERT INTO coupons (code, discount_type, discount_value, min_order) VALUES
  ('BALAJI10',  'percent', 10,  10000),
  ('WELCOME500','flat',   500,   5000),
  ('WEDDING15', 'percent', 15,  50000);
