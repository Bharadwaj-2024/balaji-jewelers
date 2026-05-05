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
  ('Rings',     'Beautiful gold rings for every occasion',   'https://i.pinimg.com/originals/32/53/b5/3253b589b9456afebe65a4156d03a5f0.jpg'),
  ('Necklaces', 'Elegant necklaces and harams',              'https://www.southjewellery.com/wp-content/uploads/2022/11/victorian-polki-necklace-20-scaled.jpg'),
  ('Earrings',  'Jhumkas, studs, drops and more',            'https://www.bhindi.com/upload/product/ER-1986.jpg'),
  ('Bangles',   'Traditional and modern gold bangles',       'https://www.meenajewelers.com/thumbFull/images/4_BangleSets_22K_19742.jpg'),
  ('Pendants',  'Gold pendants for every belief',            'https://cdn.shopify.com/s/files/1/0763/1281/products/P27849-18KVEW_1200x.jpg?v=1537213066'),
  ('Chains',    'Lightweight everyday gold chains',          'https://i.etsystatic.com/13771922/r/il/09956e/4250269094/il_1080xN.4250269094_5dxv.jpg')
ON DUPLICATE KEY UPDATE name = VALUES(name), image_url = VALUES(image_url);

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

-- ── Product Images (all categories) ──────────────────────
-- Resolved from user-provided Bing Image links
INSERT INTO product_images (product_id, image_url, is_primary, sort_order) VALUES
  -- RINGS
  (1,  'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=600&h=600&fit=crop', TRUE, 0),
  (7,  'https://i.pinimg.com/originals/32/53/b5/3253b589b9456afebe65a4156d03a5f0.jpg', TRUE, 0),
  (15, 'https://a.1stdibscdn.com/284-carat-oval-cut-ethiopian-opal-diamond-yellow-gold-ring-for-sale-picture-3/j_7993/j_113845121611710661109/OP44_C_master.jpg?width=768', TRUE, 0),
  (16, 'https://a.1stdibscdn.com/18k-yellow-gold-2-carat-oval-cut-natural-diamond-eternity-ring-for-sale/j_27122/j_169763121663101790447/j_16976312_1663101791157_bg_processed.jpg', TRUE, 0),
  -- NECKLACES
  (2,  'https://www.southjewellery.com/wp-content/uploads/2022/11/victorian-polki-necklace-20-scaled.jpg', TRUE, 0),
  (8,  'https://www.chidambaramgoldcovering.com/image/cache/catalog/ChidambaramGoldCovering/necklace/nckn3204-plain-gold-kasu-one-gram-gold-necklace-shop-online-1-1700x2000.jpg', TRUE, 0),
  (19, 'https://www.southjewellery.com/wp-content/uploads/2020/07/layered-emerald-beads-satlada-necklace-519x600.jpg', TRUE, 0),
  (20, 'https://di2ponv0v5otw.cloudfront.net/posts/2023/08/11/64d639159e4f745cf84a1165/m_64d6398497b5d085fb8546c2.jpeg', TRUE, 0),
  -- EARRINGS
  (3,  'https://th.bing.com/th/id/R.b684157cbdf172ebd6f1a06a5ef9b14b?rik=BMTmuyMNXyXGkw&pid=ImgRaw&r=0', TRUE, 0),
  (9,  'https://product-images.therealreal.com/EARRI185398_2_enlarged.jpg', TRUE, 0),
  (23, 'https://www.bhindi.com/upload/product/ER-1986.jpg', TRUE, 0),
  (24, 'https://a.1stdibscdn.com/lb-exclusive-18k-yellow-gold-20ct-diamond-inside-out-hoop-earrings-for-sale/j_682/j_196169221687289014793/j_19616922_1687289015740_bg_processed.jpg', TRUE, 0),
  -- BANGLES
  (4,  'https://www.meenajewelers.com/thumbFull/images/4_BangleSets_22K_19742.jpg', TRUE, 0),
  (10, 'https://shop.southindiajewels.com/wp-content/uploads/2025/09/Antique-Kada-Bangle-SMAIB00656-6-768x768.jpg', TRUE, 0),
  (27, 'https://queensdiamond.com/wp-content/uploads/2024/03/Untitleddesign-2023-12-14T155059.901-1-600x600.png', TRUE, 0),
  (28, 'https://www.borsheims.com/mm5/graphics/00000001/52/3DIBY0516A.jpg', TRUE, 0),
  -- PENDANTS
  (5,  'https://cdn.shopify.com/s/files/1/0763/1281/products/P27849-18KVEW_1200x.jpg?v=1537213066', TRUE, 0),
  (11, 'https://www.bhindi.com/upload/product/Pen-365.webp', TRUE, 0),
  (31, 'https://a.1stdibscdn.com/diamond-accented-18-karat-yellow-gold-heart-pendant-necklace-for-sale/j_11951/j_171398621664468764615/j_17139862_1664468765783_bg_processed.jpg?width=768', TRUE, 0),
  (32, 'https://www.engraversguild.co.uk/wp-content/uploads/2024/04/Steel-Evil-Eye-Front-Gold.jpg', TRUE, 0),
  -- CHAINS
  (6,  'https://i.etsystatic.com/13771922/r/il/09956e/4250269094/il_1080xN.4250269094_5dxv.jpg', TRUE, 0),
  (12, 'https://www.goldstardiamonds.ca/wp-content/uploads/2024/10/img_1351.jpeg', TRUE, 0),
  (35, 'https://i.etsystatic.com/34509128/r/il/b2c537/4834114050/il_794xN.4834114050_dpf6.jpg', TRUE, 0),
  (36, 'https://i.ebayimg.com/images/g/8qgAAOSwQA9nqGq4/s-l1600.jpg', TRUE, 0)
ON DUPLICATE KEY UPDATE image_url = VALUES(image_url);

SELECT 'Seed complete! Tables populated successfully.' AS status;
