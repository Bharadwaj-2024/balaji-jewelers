-- =============================================================
-- Balaji Jewellers — Seed Data
-- Run: mysql -u root -p balaji_jewellers < database/seed.sql
-- =============================================================

USE balaji_jewellers;

-- ── Gold Rates (₹ per gram) ──────────────────────────────
INSERT IGNORE INTO gold_rates (rate_22k, rate_18k, rate_14k)
VALUES (6820.00, 5580.00, 4300.00);

-- ── Categories ───────────────────────────────────────────
INSERT INTO categories (name, description, image_url) VALUES
  ('Rings',     'Beautiful gold rings for every occasion',   '/images/cats/rings.jpg'),
  ('Necklaces', 'Elegant necklaces and harams',              '/images/cats/necklaces.jpg'),
  ('Earrings',  'Jhumkas, studs, drops and more',            '/images/cats/earrings.jpg'),
  ('Bangles',   'Traditional and modern gold bangles',       '/images/cats/bangles.jpg'),
  ('Pendants',  'Gold pendants for every belief',            '/images/cats/pendants.jpg'),
  ('Chains',    'Lightweight everyday gold chains',          '/images/cats/chains.jpg')
ON DUPLICATE KEY UPDATE name = VALUES(name);

-- ── Products ─────────────────────────────────────────────
-- Price formula: gold_weight × gold_rate + making_charges
-- Ring cat_id=1, Necklace=2, Earring=3, Bangle=4, Pendant=5, Chain=6

INSERT INTO products
  (name, category_id, price, gold_weight, purity, making_charges, description, occasion, stock_quantity, is_featured, is_new)
VALUES
  -- RINGS (category_id = 1)
  ('Royal Kundan Bridal Ring',    1,  35480,  4.5, '22k',  2800,
   'Exquisite kundan bridal ring handcrafted by master artisans with intricate meenakari work.',
   'Wedding',      12, TRUE,  TRUE),

  ('Diamond Cut Ring 18K',        1,  22360,  3.1, '18k',  2200,
   'Modern diamond-cut pattern ring in 18K gold. Geometric facets catch light beautifully.',
   'Anniversary',  14, TRUE,  TRUE),

  ('Twisted Band Ring 22K',       1,  18200,  2.5, '22k',  1500,
   'Elegant twisted band ring with a classic rope pattern in 22K gold.',
   'Daily Wear',   20, FALSE, FALSE),

  ('Floral Cluster Ring 18K',     1,  29800,  3.8, '18k',  2800,
   'Delicate floral cluster ring adorned with micro stone settings.',
   'Anniversary',   8, FALSE, TRUE),

  -- NECKLACES (category_id = 2)
  ('Peacock Polki Necklace',      2,  86700, 18.2, '22k', 12500,
   'Majestic peacock-inspired polki necklace in 22K gold adorned with uncut diamonds.',
   'Wedding',       5, TRUE,  TRUE),

  ('Lakshmi Coin Necklace',       2,  94860, 12.8, '22k',  7500,
   'Auspicious Goddess Lakshmi coin pendant necklace in 22K gold. Traditional Kasu mala design.',
   'Festive',       7, TRUE,  FALSE),

  ('Layered Beads Necklace 22K',  2,  52400,  7.2, '22k',  3200,
   'Multi-layered gold bead necklace with ruby-red stone accents.',
   'Daily Wear',   10, FALSE, TRUE),

  ('Coin Choker Necklace 18K',    2,  38600,  6.4, '18k',  2800,
   'Trendy coin choker with matte-finish 18K gold coins on a slim chain.',
   'Festive',      12, FALSE, FALSE),

  -- EARRINGS (category_id = 3)
  ('Temple Jhumka Earrings',      3,  50030,  6.8, '22k',  3500,
   'Traditional south Indian temple jhumkas with deity motifs and cascading pearl drops.',
   'Festive',      20, TRUE,  FALSE),

  ('Pearl Drop Earrings 18K',     3,  25930,  4.2, '18k',  2500,
   'Elegant freshwater pearl drop earrings with 18K gold mount.',
   'Daily Wear',   22, FALSE, TRUE),

  ('Chandbali Earrings 22K',      3,  44200,  5.9, '22k',  3800,
   'Classic crescent chandbali earrings with filigree work and ruby accents.',
   'Wedding',       9, TRUE,  FALSE),

  ('Hoop Earrings 18K',           3,  17400,  2.8, '18k',  1800,
   'Lightweight 18K gold hoop earrings, perfect for everyday elegance.',
   'Daily Wear',   30, FALSE, TRUE),

  -- BANGLES (category_id = 4)
  ('Gold Bangle Set 6pc',         4, 175250, 24.5, '22k',  8500,
   'Set of 6 traditional 22K gold bangles with floral motifs and matte finish.',
   'Wedding',       8, FALSE, FALSE),

  ('Antique Kada Bangle',         4, 114000, 15.6, '22k',  6800,
   'Wide antique-finish 22K gold kada with traditional peacock and floral motifs.',
   'Festive',      10, FALSE, FALSE),

  ('Slim Gold Bangle 22K',        4,  54600,  7.0, '22k',  2800,
   'Sleek and minimalist 22K gold bangle, ideal for daily wear stacking.',
   'Daily Wear',   18, FALSE, TRUE),

  ('Designer Diamond Bangle 18K', 4,  68800,  9.2, '18k',  5600,
   'Contemporary 18K gold bangle with a row of brilliant-cut diamond settings.',
   'Anniversary',   6, TRUE,  FALSE),

  -- PENDANTS (category_id = 5)
  ('Om Pendant 18K',              5,  20640,  3.2, '18k',  1800,
   'Sacred Om pendant in 18K gold. Lightweight and perfect for daily devotional wear.',
   'Daily Wear',   35, FALSE, TRUE),

  ('Ganesha Pendant 22K',         5,  35560,  4.8, '22k',  2800,
   'Lord Ganesha pendant in 22K gold, believed to bring good fortune and remove obstacles.',
   'Festive',      28, FALSE, FALSE),

  ('Heart Pendant 18K',           5,  16400,  2.4, '18k',  1600,
   'Romantic 18K gold heart pendant with a glossy finish. Perfect for gifting.',
   'Anniversary',  40, FALSE, TRUE),

  ('Evil Eye Pendant 18K',        5,  19800,  2.8, '18k',  1800,
   'Protective evil eye pendant in 18K gold set with blue enamel.',
   'Daily Wear',   22, FALSE, FALSE),

  -- CHAINS (category_id = 6)
  ('Wheat Chain 22K',             6,  64400,  8.5, '22k',  3200,
   'Classic wheat chain in 22K gold. Durable and versatile, perfect for everyday wear.',
   'Daily Wear',   18, FALSE, FALSE),

  ('Singapore Chain 22K',         6,  44680,  6.2, '22k',  2400,
   'Lightweight Singapore chain in 22K gold. Pairs beautifully with any pendant.',
   'Daily Wear',   25, TRUE,  TRUE),

  ('Box Chain 18K',               6,  30240,  4.8, '18k',  2400,
   'Modern box chain in 18K gold with a polished square link design.',
   'Daily Wear',   15, FALSE, FALSE),

  ('Rope Chain 22K',              6,  57000,  7.5, '22k',  2700,
   'Luxurious twisted rope chain in 22K gold, adds elegance to any outfit.',
   'Festive',      12, FALSE, TRUE)
ON DUPLICATE KEY UPDATE name = VALUES(name);

-- ── Admin User (password: Admin@123) ─────────────────────
INSERT INTO users (name, email, password, phone, role)
VALUES ('Admin', 'admin@balajijewellers.com',
        '$2b$12$LQ9aBzR0l9xK6q/SYPg8dOWc4pJlHHLgYi3nIFBEJe5KHvtv7jkRi',
        '9876543210', 'admin')
ON DUPLICATE KEY UPDATE name = VALUES(name);

-- ── Coupons ───────────────────────────────────────────────
INSERT INTO coupons (code, discount_type, discount_value, min_order) VALUES
  ('BALAJI10',   'percent', 10,  10000),
  ('WELCOME500', 'flat',   500,   5000),
  ('WEDDING15',  'percent', 15,  50000)
ON DUPLICATE KEY UPDATE discount_value = VALUES(discount_value);

SELECT 'Seed complete! Tables populated successfully.' AS status;
