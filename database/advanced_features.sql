-- =============================================================
-- Balaji Jewellers — Advanced DBMS Features
-- File: advanced_features.sql
-- Target: MySQL 8.0+
-- Run: mysql -u root -p balaji_jewellers < database/advanced_features.sql
-- =============================================================

USE balaji_jewellers;

-- =============================================================
-- SECTION 1: NEW SUPPORTING TABLES
-- =============================================================

-- 1. Stock Alerts — tracks low-stock and out-of-stock events
CREATE TABLE IF NOT EXISTS stock_alerts (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  product_id    INT,
  product_name  VARCHAR(200),
  current_stock INT,
  alerted_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  is_resolved   BOOLEAN DEFAULT FALSE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL
);

-- 2. Order Status Log — audit trail for order status changes
CREATE TABLE IF NOT EXISTS order_status_log (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  order_id    INT,
  old_status  ENUM('pending','processing','shipped','delivered','cancelled'),
  new_status  ENUM('pending','processing','shipped','delivered','cancelled'),
  changed_by  INT NULL,
  changed_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id)   REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (changed_by) REFERENCES users(id)  ON DELETE SET NULL
);

-- 3. Price Change Log — records every product price modification
CREATE TABLE IF NOT EXISTS price_change_log (
  id                  INT AUTO_INCREMENT PRIMARY KEY,
  product_id          INT,
  old_making_charges  DECIMAL(10,2),
  new_making_charges  DECIMAL(10,2),
  old_price           DECIMAL(10,2),
  new_price           DECIMAL(10,2),
  change_reason       VARCHAR(255),
  changed_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL
);

-- 4. Gold Rate History — historical snapshot of gold rates
CREATE TABLE IF NOT EXISTS gold_rate_history (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  rate_22k    DECIMAL(10,2),
  rate_18k    DECIMAL(10,2),
  rate_14k    DECIMAL(10,2),
  recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. Wishlist Reminders — tracks items lingering in wishlists
CREATE TABLE IF NOT EXISTS wishlist_reminders (
  id               INT AUTO_INCREMENT PRIMARY KEY,
  user_id          INT,
  product_id       INT,
  added_at         TIMESTAMP,
  days_in_wishlist INT,
  reminder_sent    BOOLEAN DEFAULT FALSE,
  FOREIGN KEY (user_id)    REFERENCES users(id)    ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- Add avg_rating and review_count columns to products (needed by triggers)
ALTER TABLE products ADD COLUMN IF NOT EXISTS avg_rating    DECIMAL(3,2) DEFAULT 0;
ALTER TABLE products ADD COLUMN IF NOT EXISTS review_count  INT DEFAULT 0;


-- =============================================================
-- SECTION 2: CHECK CONSTRAINTS (Data Integrity / Assertions)
-- =============================================================

-- Helper: MySQL 8.0.16+ supports CHECK constraints.
-- We use ALTER TABLE ... ADD CONSTRAINT ... CHECK (...)
-- Note: MySQL does not support DROP CONSTRAINT IF EXISTS natively,
-- so we use a stored procedure to safely drop constraints first.

DELIMITER $$
DROP PROCEDURE IF EXISTS SafeDropConstraint$$
CREATE PROCEDURE SafeDropConstraint(
  IN p_table VARCHAR(64),
  IN p_constraint VARCHAR(64)
)
BEGIN
  DECLARE v_count INT DEFAULT 0;
  SELECT COUNT(*) INTO v_count
    FROM information_schema.TABLE_CONSTRAINTS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME   = p_table
      AND CONSTRAINT_NAME = p_constraint
      AND CONSTRAINT_TYPE = 'CHECK';
  IF v_count > 0 THEN
    SET @sql = CONCAT('ALTER TABLE `', p_table, '` DROP CONSTRAINT `', p_constraint, '`');
    PREPARE stmt FROM @sql;
    EXECUTE stmt;
    DEALLOCATE PREPARE stmt;
  END IF;
END$$
DELIMITER ;

-- --- Reviews ---
CALL SafeDropConstraint('reviews', 'chk_rating_range');
ALTER TABLE reviews ADD CONSTRAINT chk_rating_range CHECK (rating BETWEEN 1 AND 5);

-- --- Products ---
CALL SafeDropConstraint('products', 'chk_gold_weight_positive');
CALL SafeDropConstraint('products', 'chk_making_charges_non_neg');
CALL SafeDropConstraint('products', 'chk_price_positive');
CALL SafeDropConstraint('products', 'chk_stock_non_negative');
CALL SafeDropConstraint('products', 'chk_purity_valid');

ALTER TABLE products ADD CONSTRAINT chk_gold_weight_positive   CHECK (gold_weight > 0);
ALTER TABLE products ADD CONSTRAINT chk_making_charges_non_neg CHECK (making_charges >= 0);
ALTER TABLE products ADD CONSTRAINT chk_price_positive         CHECK (price > 0);
ALTER TABLE products ADD CONSTRAINT chk_stock_non_negative     CHECK (stock_quantity >= 0);
ALTER TABLE products ADD CONSTRAINT chk_purity_valid           CHECK (purity IN ('14k','18k','22k'));

-- --- Addresses ---
CALL SafeDropConstraint('addresses', 'chk_pincode_format');
ALTER TABLE addresses ADD CONSTRAINT chk_pincode_format CHECK (pincode REGEXP '^[0-9]{6}$');

-- --- Orders ---
CALL SafeDropConstraint('orders', 'chk_total_amount_positive');
CALL SafeDropConstraint('orders', 'chk_gst_non_negative');
CALL SafeDropConstraint('orders', 'chk_shipping_non_negative');
CALL SafeDropConstraint('orders', 'chk_discount_non_negative');

ALTER TABLE orders ADD CONSTRAINT chk_total_amount_positive CHECK (total_amount > 0);
ALTER TABLE orders ADD CONSTRAINT chk_gst_non_negative      CHECK (gst >= 0);
ALTER TABLE orders ADD CONSTRAINT chk_shipping_non_negative  CHECK (shipping >= 0);
ALTER TABLE orders ADD CONSTRAINT chk_discount_non_negative  CHECK (discount >= 0);

-- --- Users ---
CALL SafeDropConstraint('users', 'chk_email_format');
ALTER TABLE users ADD CONSTRAINT chk_email_format CHECK (email LIKE '%@%');

-- --- Gold Rates ---
CALL SafeDropConstraint('gold_rates', 'chk_rate_22k_gt_18k');
CALL SafeDropConstraint('gold_rates', 'chk_rate_18k_gt_14k');
CALL SafeDropConstraint('gold_rates', 'chk_rates_positive');

ALTER TABLE gold_rates ADD CONSTRAINT chk_rate_22k_gt_18k CHECK (rate_22k > rate_18k);
ALTER TABLE gold_rates ADD CONSTRAINT chk_rate_18k_gt_14k CHECK (rate_18k > rate_14k);
ALTER TABLE gold_rates ADD CONSTRAINT chk_rates_positive   CHECK (rate_22k > 0 AND rate_18k > 0 AND rate_14k > 0);

-- --- Coupons ---
CALL SafeDropConstraint('coupons', 'chk_discount_value_positive');
CALL SafeDropConstraint('coupons', 'chk_max_uses_positive');
CALL SafeDropConstraint('coupons', 'chk_used_count_non_neg');

ALTER TABLE coupons ADD CONSTRAINT chk_discount_value_positive CHECK (discount_value > 0);
ALTER TABLE coupons ADD CONSTRAINT chk_max_uses_positive       CHECK (max_uses > 0);
ALTER TABLE coupons ADD CONSTRAINT chk_used_count_non_neg      CHECK (used_count >= 0);

-- --- Order Items ---
CALL SafeDropConstraint('order_items', 'chk_oi_quantity_positive');
CALL SafeDropConstraint('order_items', 'chk_oi_price_positive');

ALTER TABLE order_items ADD CONSTRAINT chk_oi_quantity_positive CHECK (quantity > 0);
ALTER TABLE order_items ADD CONSTRAINT chk_oi_price_positive    CHECK (price > 0);

-- Clean up helper procedure
DROP PROCEDURE IF EXISTS SafeDropConstraint;


-- =============================================================
-- SECTION 3: TRIGGERS
-- =============================================================

-- TRIGGER 1: Deduct stock after an order item is inserted
DROP TRIGGER IF EXISTS trg_deduct_stock_after_order;
DELIMITER $$
CREATE TRIGGER trg_deduct_stock_after_order
AFTER INSERT ON order_items
FOR EACH ROW
BEGIN
  DECLARE v_new_stock INT;
  DECLARE v_prod_name VARCHAR(200);

  -- Deduct stock
  UPDATE products
    SET stock_quantity = stock_quantity - NEW.quantity
    WHERE id = NEW.product_id;

  -- Read updated stock
  SELECT stock_quantity, name INTO v_new_stock, v_prod_name
    FROM products WHERE id = NEW.product_id;

  -- Alert if stock falls below 3
  IF v_new_stock < 3 THEN
    INSERT INTO stock_alerts (product_id, product_name, current_stock)
      VALUES (NEW.product_id, v_prod_name, v_new_stock);
  END IF;
END$$
DELIMITER ;

-- TRIGGER 2: Alert when product stock is updated to low level
DROP TRIGGER IF EXISTS trg_stock_alert_on_update;
DELIMITER $$
CREATE TRIGGER trg_stock_alert_on_update
AFTER UPDATE ON products
FOR EACH ROW
BEGIN
  IF NEW.stock_quantity < 3 AND OLD.stock_quantity >= 3 THEN
    IF NEW.stock_quantity = 0 THEN
      INSERT INTO stock_alerts (product_id, product_name, current_stock)
        VALUES (NEW.id, CONCAT(NEW.name, ' — OUT OF STOCK'), NEW.stock_quantity);
    ELSE
      INSERT INTO stock_alerts (product_id, product_name, current_stock)
        VALUES (NEW.id, NEW.name, NEW.stock_quantity);
    END IF;
  END IF;
END$$
DELIMITER ;

-- TRIGGER 3: Log order status changes
DROP TRIGGER IF EXISTS trg_log_order_status_change;
DELIMITER $$
CREATE TRIGGER trg_log_order_status_change
AFTER UPDATE ON orders
FOR EACH ROW
BEGIN
  IF OLD.status != NEW.status THEN
    INSERT INTO order_status_log (order_id, old_status, new_status, changed_at)
      VALUES (NEW.id, OLD.status, NEW.status, NOW());
  END IF;
END$$
DELIMITER ;

-- TRIGGER 4a: Sync average rating after review INSERT
DROP TRIGGER IF EXISTS trg_sync_product_avg_rating;
DELIMITER $$
CREATE TRIGGER trg_sync_product_avg_rating
AFTER INSERT ON reviews
FOR EACH ROW
BEGIN
  UPDATE products SET
    avg_rating   = (SELECT COALESCE(AVG(rating), 0) FROM reviews WHERE product_id = NEW.product_id),
    review_count = (SELECT COUNT(*)                  FROM reviews WHERE product_id = NEW.product_id)
  WHERE id = NEW.product_id;
END$$
DELIMITER ;

-- TRIGGER 4b: Sync average rating after review DELETE
DROP TRIGGER IF EXISTS trg_sync_product_avg_rating_delete;
DELIMITER $$
CREATE TRIGGER trg_sync_product_avg_rating_delete
AFTER DELETE ON reviews
FOR EACH ROW
BEGIN
  UPDATE products SET
    avg_rating   = (SELECT COALESCE(AVG(rating), 0) FROM reviews WHERE product_id = OLD.product_id),
    review_count = (SELECT COUNT(*)                  FROM reviews WHERE product_id = OLD.product_id)
  WHERE id = OLD.product_id;
END$$
DELIMITER ;

-- TRIGGER 5: Recalculate all product prices when gold rate changes
DROP TRIGGER IF EXISTS trg_recalculate_prices_on_gold_rate_update;
DELIMITER $$
CREATE TRIGGER trg_recalculate_prices_on_gold_rate_update
AFTER INSERT ON gold_rates
FOR EACH ROW
BEGIN
  DECLARE v_done       INT DEFAULT 0;
  DECLARE v_pid        INT;
  DECLARE v_purity     VARCHAR(3);
  DECLARE v_weight     DECIMAL(6,3);
  DECLARE v_making     DECIMAL(10,2);
  DECLARE v_old_price  DECIMAL(10,2);
  DECLARE v_new_price  DECIMAL(10,2);

  -- Cursor over all products
  DECLARE cur_products CURSOR FOR
    SELECT id, purity, gold_weight, making_charges, price FROM products;
  DECLARE CONTINUE HANDLER FOR NOT FOUND SET v_done = 1;

  -- Record history
  INSERT INTO gold_rate_history (rate_22k, rate_18k, rate_14k)
    VALUES (NEW.rate_22k, NEW.rate_18k, NEW.rate_14k);

  OPEN cur_products;
  price_loop: LOOP
    FETCH cur_products INTO v_pid, v_purity, v_weight, v_making, v_old_price;
    IF v_done THEN LEAVE price_loop; END IF;

    -- Calculate new price based on purity
    CASE v_purity
      WHEN '22k' THEN SET v_new_price = ROUND(v_weight * NEW.rate_22k + v_making, 2);
      WHEN '18k' THEN SET v_new_price = ROUND(v_weight * NEW.rate_18k + v_making, 2);
      WHEN '14k' THEN SET v_new_price = ROUND(v_weight * NEW.rate_14k + v_making, 2);
    END CASE;

    -- Update product price
    UPDATE products SET price = v_new_price WHERE id = v_pid;

    -- Log price change
    INSERT INTO price_change_log
      (product_id, old_making_charges, new_making_charges, old_price, new_price, change_reason)
      VALUES (v_pid, v_making, v_making, v_old_price, v_new_price, 'Gold rate updated');

  END LOOP;
  CLOSE cur_products;
END$$
DELIMITER ;


-- =============================================================
-- SECTION 4: STORED PROCEDURES WITH CURSORS
-- =============================================================

-- PROCEDURE 1: GetMonthlyRevenueReport
-- Generates monthly revenue breakdown for a given year
DROP PROCEDURE IF EXISTS GetMonthlyRevenueReport;
DELIMITER $$
CREATE PROCEDURE GetMonthlyRevenueReport(IN p_year INT)
BEGIN
  DECLARE v_done     INT DEFAULT 0;
  DECLARE v_order_id INT;
  DECLARE v_amount   DECIMAL(10,2);
  DECLARE v_gst      DECIMAL(10,2);
  DECLARE v_created  TIMESTAMP;
  DECLARE v_category VARCHAR(100);
  DECLARE v_month    INT;

  DECLARE cur_orders CURSOR FOR
    SELECT o.id, o.total_amount, o.gst, o.created_at, c.name AS category_name
    FROM orders o
    JOIN order_items oi ON oi.order_id = o.id
    JOIN products p ON p.id = oi.product_id
    JOIN categories c ON c.id = p.category_id
    WHERE YEAR(o.created_at) = p_year AND o.payment_status = 'paid'
    GROUP BY o.id, o.total_amount, o.gst, o.created_at, c.name;

  DECLARE CONTINUE HANDLER FOR NOT FOUND SET v_done = 1;
  DECLARE EXIT HANDLER FOR SQLEXCEPTION BEGIN ROLLBACK; RESIGNAL; END;

  DROP TEMPORARY TABLE IF EXISTS monthly_revenue_temp;
  CREATE TEMPORARY TABLE monthly_revenue_temp (
    month_number  INT,
    month_name    VARCHAR(20),
    total_orders  INT DEFAULT 0,
    total_revenue DECIMAL(12,2) DEFAULT 0,
    total_gst     DECIMAL(12,2) DEFAULT 0,
    net_revenue   DECIMAL(12,2) DEFAULT 0,
    top_category  VARCHAR(100) DEFAULT ''
  );

  -- Seed all 12 months
  INSERT INTO monthly_revenue_temp (month_number, month_name) VALUES
    (1,'January'),(2,'February'),(3,'March'),(4,'April'),
    (5,'May'),(6,'June'),(7,'July'),(8,'August'),
    (9,'September'),(10,'October'),(11,'November'),(12,'December');

  OPEN cur_orders;
  read_loop: LOOP
    FETCH cur_orders INTO v_order_id, v_amount, v_gst, v_created, v_category;
    IF v_done THEN LEAVE read_loop; END IF;
    SET v_month = MONTH(v_created);
    UPDATE monthly_revenue_temp SET
      total_orders  = total_orders + 1,
      total_revenue = total_revenue + v_amount,
      total_gst     = total_gst + v_gst,
      net_revenue   = net_revenue + (v_amount - v_gst)
    WHERE month_number = v_month;
  END LOOP;
  CLOSE cur_orders;

  -- Top category per month
  UPDATE monthly_revenue_temp mrt SET top_category = COALESCE((
    SELECT c.name FROM orders o
    JOIN order_items oi ON oi.order_id = o.id
    JOIN products p ON p.id = oi.product_id
    JOIN categories c ON c.id = p.category_id
    WHERE YEAR(o.created_at) = p_year AND MONTH(o.created_at) = mrt.month_number
      AND o.payment_status = 'paid'
    GROUP BY c.name ORDER BY SUM(oi.price * oi.quantity) DESC LIMIT 1
  ), '');

  SELECT * FROM monthly_revenue_temp ORDER BY month_number;
  DROP TEMPORARY TABLE IF EXISTS monthly_revenue_temp;
END$$
DELIMITER ;

-- PROCEDURE 2: BulkUpdateMakingCharges
-- Adjusts making charges by percentage and recalculates prices
DROP PROCEDURE IF EXISTS BulkUpdateMakingCharges;
DELIMITER $$
CREATE PROCEDURE BulkUpdateMakingCharges(IN p_percent DECIMAL(5,2), IN p_reason VARCHAR(255))
BEGIN
  DECLARE v_done       INT DEFAULT 0;
  DECLARE v_prod_id    INT;
  DECLARE v_name       VARCHAR(200);
  DECLARE v_old_making DECIMAL(10,2);
  DECLARE v_old_price  DECIMAL(10,2);
  DECLARE v_weight     DECIMAL(6,3);
  DECLARE v_purity     VARCHAR(3);
  DECLARE v_new_making DECIMAL(10,2);
  DECLARE v_new_price  DECIMAL(10,2);
  DECLARE v_r22        DECIMAL(10,2);
  DECLARE v_r18        DECIMAL(10,2);
  DECLARE v_r14        DECIMAL(10,2);
  DECLARE v_count      INT DEFAULT 0;
  DECLARE v_total_inc  DECIMAL(12,2) DEFAULT 0;

  DECLARE cur_prods CURSOR FOR
    SELECT id, name, making_charges, price, gold_weight, purity FROM products;

  DECLARE CONTINUE HANDLER FOR NOT FOUND SET v_done = 1;
  DECLARE EXIT HANDLER FOR SQLEXCEPTION BEGIN ROLLBACK; RESIGNAL; END;

  SELECT rate_22k, rate_18k, rate_14k INTO v_r22, v_r18, v_r14
    FROM gold_rates ORDER BY id DESC LIMIT 1;

  START TRANSACTION;
  OPEN cur_prods;
  update_loop: LOOP
    FETCH cur_prods INTO v_prod_id, v_name, v_old_making, v_old_price, v_weight, v_purity;
    IF v_done THEN LEAVE update_loop; END IF;

    SET v_new_making = ROUND(v_old_making * (1 + p_percent / 100), 2);
    CASE v_purity
      WHEN '22k' THEN SET v_new_price = ROUND(v_weight * v_r22 + v_new_making, 2);
      WHEN '18k' THEN SET v_new_price = ROUND(v_weight * v_r18 + v_new_making, 2);
      WHEN '14k' THEN SET v_new_price = ROUND(v_weight * v_r14 + v_new_making, 2);
    END CASE;

    UPDATE products SET making_charges = v_new_making, price = v_new_price WHERE id = v_prod_id;
    INSERT INTO price_change_log
      (product_id, old_making_charges, new_making_charges, old_price, new_price, change_reason)
      VALUES (v_prod_id, v_old_making, v_new_making, v_old_price, v_new_price, p_reason);

    SET v_count = v_count + 1;
    SET v_total_inc = v_total_inc + (v_new_price - v_old_price);
  END LOOP;
  CLOSE cur_prods;
  COMMIT;

  SELECT v_count AS products_updated, v_total_inc AS total_price_increase;
END$$
DELIMITER ;

-- PROCEDURE 3: GenerateRestockList
-- Prioritized list of products needing restocking
DROP PROCEDURE IF EXISTS GenerateRestockList;
DELIMITER $$
CREATE PROCEDURE GenerateRestockList()
BEGIN
  DECLARE v_done     INT DEFAULT 0;
  DECLARE v_id       INT;
  DECLARE v_name     VARCHAR(200);
  DECLARE v_stock    INT;
  DECLARE v_purity   VARCHAR(3);
  DECLARE v_category VARCHAR(100);
  DECLARE v_restock  INT;
  DECLARE v_priority VARCHAR(10);

  DECLARE cur_low CURSOR FOR
    SELECT p.id, p.name, p.stock_quantity, p.purity, c.name AS category
    FROM products p JOIN categories c ON c.id = p.category_id
    WHERE p.stock_quantity < 5 ORDER BY p.stock_quantity ASC;

  DECLARE CONTINUE HANDLER FOR NOT FOUND SET v_done = 1;
  DECLARE EXIT HANDLER FOR SQLEXCEPTION BEGIN ROLLBACK; RESIGNAL; END;

  DROP TEMPORARY TABLE IF EXISTS restock_list_temp;
  CREATE TEMPORARY TABLE restock_list_temp (
    product_id INT, product_name VARCHAR(200), current_stock INT,
    purity VARCHAR(3), category VARCHAR(100),
    suggested_restock INT, priority VARCHAR(10)
  );

  OPEN cur_low;
  restock_loop: LOOP
    FETCH cur_low INTO v_id, v_name, v_stock, v_purity, v_category;
    IF v_done THEN LEAVE restock_loop; END IF;
    IF v_stock = 0 THEN
      SET v_restock = 20; SET v_priority = 'CRITICAL';
    ELSEIF v_stock < 3 THEN
      SET v_restock = 10; SET v_priority = 'HIGH';
    ELSE
      SET v_restock = 5;  SET v_priority = 'MEDIUM';
    END IF;
    INSERT INTO restock_list_temp VALUES
      (v_id, v_name, v_stock, v_purity, v_category, v_restock, v_priority);
  END LOOP;
  CLOSE cur_low;

  SELECT * FROM restock_list_temp ORDER BY FIELD(priority, 'CRITICAL', 'HIGH', 'MEDIUM');
  DROP TEMPORARY TABLE IF EXISTS restock_list_temp;
END$$
DELIMITER ;

-- PROCEDURE 4: GetWishlistConversionReport
-- Analyzes wishlist-to-purchase conversion rates
DROP PROCEDURE IF EXISTS GetWishlistConversionReport;
DELIMITER $$
CREATE PROCEDURE GetWishlistConversionReport()
BEGIN
  DECLARE v_done         INT DEFAULT 0;
  DECLARE v_user_id      INT;
  DECLARE v_product_id   INT;
  DECLARE v_product_name VARCHAR(200);
  DECLARE v_user_name    VARCHAR(100);
  DECLARE v_email        VARCHAR(150);
  DECLARE v_days         INT;
  DECLARE v_converted    INT DEFAULT 0;
  DECLARE v_total_wish   INT DEFAULT 0;
  DECLARE v_total_conv   INT DEFAULT 0;

  DECLARE cur_wish CURSOR FOR
    SELECT w.user_id, w.product_id, p.name, u.name, u.email,
           DATEDIFF(NOW(), w.created_at) AS days_wishlisted
    FROM wishlist w
    JOIN products p ON p.id = w.product_id
    JOIN users u    ON u.id = w.user_id;

  DECLARE CONTINUE HANDLER FOR NOT FOUND SET v_done = 1;
  DECLARE EXIT HANDLER FOR SQLEXCEPTION BEGIN ROLLBACK; RESIGNAL; END;

  DROP TEMPORARY TABLE IF EXISTS wishlist_report_temp;
  CREATE TEMPORARY TABLE wishlist_report_temp (
    user_name VARCHAR(100), email VARCHAR(150), product_name VARCHAR(200),
    days_in_wishlist INT, was_purchased BOOLEAN
  );

  OPEN cur_wish;
  wish_loop: LOOP
    FETCH cur_wish INTO v_user_id, v_product_id, v_product_name, v_user_name, v_email, v_days;
    IF v_done THEN LEAVE wish_loop; END IF;

    IF EXISTS (
      SELECT 1 FROM order_items oi JOIN orders o ON o.id = oi.order_id
      WHERE o.user_id = v_user_id AND oi.product_id = v_product_id
    ) THEN
      SET v_converted = 1;
      SET v_total_conv = v_total_conv + 1;
    ELSE
      SET v_converted = 0;
    END IF;
    SET v_total_wish = v_total_wish + 1;

    INSERT INTO wishlist_report_temp VALUES
      (v_user_name, v_email, v_product_name, v_days, v_converted);

    -- Flag reminders for items > 30 days not purchased
    IF v_days > 30 AND v_converted = 0 THEN
      INSERT IGNORE INTO wishlist_reminders (user_id, product_id, added_at, days_in_wishlist)
        SELECT v_user_id, v_product_id, w.created_at, v_days
        FROM wishlist w WHERE w.user_id = v_user_id AND w.product_id = v_product_id;
    END IF;
  END LOOP;
  CLOSE cur_wish;

  SELECT product_name,
    COUNT(*) AS wishlist_count,
    SUM(was_purchased) AS purchase_count,
    ROUND(SUM(was_purchased) / COUNT(*) * 100, 2) AS conversion_rate
  FROM wishlist_report_temp GROUP BY product_name ORDER BY conversion_rate DESC;

  SELECT v_total_wish AS total_wishlisted, v_total_conv AS total_converted,
    ROUND(v_total_conv / NULLIF(v_total_wish, 0) * 100, 2) AS overall_conversion_rate;

  DROP TEMPORARY TABLE IF EXISTS wishlist_report_temp;
END$$
DELIMITER ;

-- PROCEDURE 5: PlaceOrderWithValidation
-- Complete order placement with stock validation, coupon, GST, transaction safety
DROP PROCEDURE IF EXISTS PlaceOrderWithValidation;
DELIMITER $$
CREATE PROCEDURE PlaceOrderWithValidation(
  IN  p_user_id        INT,
  IN  p_address_id     INT,
  IN  p_payment_method VARCHAR(20),
  IN  p_coupon_code    VARCHAR(50),
  OUT p_order_id       INT,
  OUT p_total          DECIMAL(10,2),
  OUT p_error_msg      VARCHAR(255)
)
proc_body: BEGIN
  DECLARE v_done        INT DEFAULT 0;
  DECLARE v_product_id  INT;
  DECLARE v_quantity    INT;
  DECLARE v_weight      DECIMAL(6,3);
  DECLARE v_purity      VARCHAR(3);
  DECLARE v_making      DECIMAL(10,2);
  DECLARE v_stock       INT;
  DECLARE v_name        VARCHAR(200);
  DECLARE v_r22         DECIMAL(10,2);
  DECLARE v_r18         DECIMAL(10,2);
  DECLARE v_r14         DECIMAL(10,2);
  DECLARE v_item_price  DECIMAL(10,2);
  DECLARE v_subtotal    DECIMAL(10,2) DEFAULT 0;
  DECLARE v_gst         DECIMAL(10,2);
  DECLARE v_shipping    DECIMAL(10,2);
  DECLARE v_discount    DECIMAL(10,2) DEFAULT 0;
  DECLARE v_disc_type   VARCHAR(10);
  DECLARE v_disc_val    DECIMAL(10,2);
  DECLARE v_min_order   DECIMAL(10,2);
  DECLARE v_coupon_id   INT;
  DECLARE v_cart_id     INT;
  DECLARE v_gold_rate   DECIMAL(10,2);

  DECLARE cur_cart CURSOR FOR
    SELECT ci.product_id, ci.quantity, p.gold_weight, p.purity,
           p.making_charges, p.stock_quantity, p.name,
           gr.rate_22k, gr.rate_18k, gr.rate_14k
    FROM cart_items ci
    JOIN cart c ON c.id = ci.cart_id AND c.user_id = p_user_id
    JOIN products p ON p.id = ci.product_id
    CROSS JOIN (SELECT * FROM gold_rates ORDER BY id DESC LIMIT 1) gr;

  DECLARE CONTINUE HANDLER FOR NOT FOUND SET v_done = 1;
  DECLARE EXIT HANDLER FOR SQLEXCEPTION
  BEGIN
    ROLLBACK;
    SET p_error_msg = 'Database error during order placement';
    RESIGNAL;
  END;

  SET p_order_id = 0; SET p_total = 0; SET p_error_msg = '';

  -- Get cart
  SELECT id INTO v_cart_id FROM cart WHERE user_id = p_user_id LIMIT 1;
  IF v_cart_id IS NULL THEN
    SET p_error_msg = 'Cart is empty or does not exist';
    LEAVE proc_body;
  END IF;

  START TRANSACTION;

  -- PASS 1: Validate stock and calculate subtotal
  OPEN cur_cart;
  validate_loop: LOOP
    FETCH cur_cart INTO v_product_id, v_quantity, v_weight, v_purity,
                        v_making, v_stock, v_name, v_r22, v_r18, v_r14;
    IF v_done THEN LEAVE validate_loop; END IF;

    IF v_quantity > v_stock THEN
      SET p_error_msg = CONCAT('Insufficient stock for ', v_name,
                               '. Available: ', v_stock, ', Requested: ', v_quantity);
      CLOSE cur_cart;
      ROLLBACK;
      LEAVE proc_body;
    END IF;

    CASE v_purity
      WHEN '22k' THEN SET v_item_price = ROUND(v_weight * v_r22 + v_making, 2);
      WHEN '18k' THEN SET v_item_price = ROUND(v_weight * v_r18 + v_making, 2);
      WHEN '14k' THEN SET v_item_price = ROUND(v_weight * v_r14 + v_making, 2);
    END CASE;
    SET v_subtotal = v_subtotal + (v_item_price * v_quantity);
  END LOOP;
  CLOSE cur_cart;

  -- Apply coupon
  IF p_coupon_code IS NOT NULL AND p_coupon_code != '' THEN
    SELECT id, discount_type, discount_value, min_order
      INTO v_coupon_id, v_disc_type, v_disc_val, v_min_order
      FROM coupons
      WHERE code = p_coupon_code AND is_active = TRUE
        AND (expires_at IS NULL OR expires_at > NOW())
        AND used_count < max_uses LIMIT 1;
    IF v_coupon_id IS NOT NULL AND v_subtotal >= v_min_order THEN
      IF v_disc_type = 'percent' THEN
        SET v_discount = ROUND(v_subtotal * v_disc_val / 100, 2);
      ELSE
        SET v_discount = v_disc_val;
      END IF;
      UPDATE coupons SET used_count = used_count + 1 WHERE id = v_coupon_id;
    END IF;
  END IF;

  -- Calculate GST (3%) and shipping
  SET v_gst     = ROUND((v_subtotal - v_discount) * 0.03, 2);
  SET v_shipping = IF(v_subtotal > 10000, 0, 299);
  SET p_total    = v_subtotal - v_discount + v_gst + v_shipping;

  -- Insert order
  INSERT INTO orders (user_id, address_id, subtotal, gst, shipping, discount,
                      coupon_code, total_amount, payment_method, payment_status, status)
    VALUES (p_user_id, p_address_id, v_subtotal, v_gst, v_shipping, v_discount,
            p_coupon_code, p_total, p_payment_method, 'pending', 'pending');
  SET p_order_id = LAST_INSERT_ID();

  -- PASS 2: Insert order items (nested block for second cursor)
  SET v_done = 0;
  BEGIN
    DECLARE v2_product_id INT;
    DECLARE v2_quantity   INT;
    DECLARE v2_weight     DECIMAL(6,3);
    DECLARE v2_purity     VARCHAR(3);
    DECLARE v2_making     DECIMAL(10,2);
    DECLARE v2_name       VARCHAR(200);
    DECLARE v2_r22        DECIMAL(10,2);
    DECLARE v2_r18        DECIMAL(10,2);
    DECLARE v2_r14        DECIMAL(10,2);
    DECLARE v2_price      DECIMAL(10,2);
    DECLARE v2_rate       DECIMAL(10,2);
    DECLARE v2_done       INT DEFAULT 0;

    DECLARE cur_cart2 CURSOR FOR
      SELECT ci.product_id, ci.quantity, p.gold_weight, p.purity,
             p.making_charges, p.name, gr.rate_22k, gr.rate_18k, gr.rate_14k
      FROM cart_items ci
      JOIN cart c ON c.id = ci.cart_id AND c.user_id = p_user_id
      JOIN products p ON p.id = ci.product_id
      CROSS JOIN (SELECT * FROM gold_rates ORDER BY id DESC LIMIT 1) gr;
    DECLARE CONTINUE HANDLER FOR NOT FOUND SET v2_done = 1;

    OPEN cur_cart2;
    insert_loop: LOOP
      FETCH cur_cart2 INTO v2_product_id, v2_quantity, v2_weight, v2_purity,
                           v2_making, v2_name, v2_r22, v2_r18, v2_r14;
      IF v2_done THEN LEAVE insert_loop; END IF;
      CASE v2_purity
        WHEN '22k' THEN SET v2_price = ROUND(v2_weight * v2_r22 + v2_making, 2); SET v2_rate = v2_r22;
        WHEN '18k' THEN SET v2_price = ROUND(v2_weight * v2_r18 + v2_making, 2); SET v2_rate = v2_r18;
        WHEN '14k' THEN SET v2_price = ROUND(v2_weight * v2_r14 + v2_making, 2); SET v2_rate = v2_r14;
      END CASE;
      INSERT INTO order_items (order_id, product_id, quantity, price, gold_rate)
        VALUES (p_order_id, v2_product_id, v2_quantity, v2_price, v2_rate);
    END LOOP;
    CLOSE cur_cart2;
  END;

  -- Clear cart
  DELETE FROM cart_items WHERE cart_id = v_cart_id;
  COMMIT;
  SET p_error_msg = 'SUCCESS';
END$$
DELIMITER ;


-- =============================================================
-- SECTION 5: VIEWS
-- =============================================================

-- VIEW 1: Live product prices computed from latest gold rates
CREATE OR REPLACE VIEW v_product_live_price AS
SELECT
  p.id, p.name, p.description, p.purity, p.gold_weight, p.making_charges,
  p.stock_quantity, p.is_featured, p.is_new, p.occasion, p.avg_rating, p.review_count,
  c.name AS category_name, c.id AS category_id,
  CASE p.purity
    WHEN '22k' THEN gr.rate_22k
    WHEN '18k' THEN gr.rate_18k
    ELSE gr.rate_14k
  END AS gold_rate_used,
  ROUND(p.gold_weight * CASE p.purity
    WHEN '22k' THEN gr.rate_22k
    WHEN '18k' THEN gr.rate_18k
    ELSE gr.rate_14k END + p.making_charges) AS live_price,
  ROUND((p.gold_weight * CASE p.purity
    WHEN '22k' THEN gr.rate_22k
    WHEN '18k' THEN gr.rate_18k
    ELSE gr.rate_14k END + p.making_charges) * 1.03) AS live_price_with_gst,
  pi.image_url AS primary_image,
  gr.updated_at AS rate_last_updated
FROM products p
JOIN categories c ON c.id = p.category_id
LEFT JOIN product_images pi ON pi.product_id = p.id AND pi.is_primary = TRUE
CROSS JOIN (SELECT * FROM gold_rates ORDER BY id DESC LIMIT 1) gr;

-- VIEW 2: Full order invoice with customer and item details
CREATE OR REPLACE VIEW v_order_full_invoice AS
SELECT
  o.id AS order_id, o.created_at, o.status, o.payment_method, o.payment_status,
  o.subtotal, o.making_charges, o.gst, o.shipping, o.discount, o.coupon_code, o.total_amount,
  u.name AS customer_name, u.email AS customer_email, u.phone AS customer_phone,
  a.full_name AS ship_to, a.address_line1, a.address_line2, a.city, a.state,
  a.pincode, a.country,
  oi.id AS item_id, oi.quantity, oi.price AS item_price, oi.gold_rate,
  p.name AS product_name, p.purity, p.gold_weight, p.making_charges AS item_making,
  c.name AS category_name,
  (oi.price * oi.quantity) AS item_total
FROM orders o
JOIN users u ON u.id = o.user_id
LEFT JOIN addresses a ON a.id = o.address_id
JOIN order_items oi ON oi.order_id = o.id
JOIN products p ON p.id = oi.product_id
JOIN categories c ON c.id = p.category_id;

-- VIEW 3: Top customers ranked by lifetime value
CREATE OR REPLACE VIEW v_top_customers AS
SELECT
  u.id, u.name, u.email, u.phone, u.created_at AS member_since,
  COUNT(DISTINCT o.id) AS total_orders,
  SUM(o.total_amount) AS lifetime_value,
  AVG(o.total_amount) AS avg_order_value,
  MAX(o.created_at) AS last_order_date,
  MIN(o.created_at) AS first_order_date,
  DATEDIFF(MAX(o.created_at), MIN(o.created_at)) AS days_as_customer
FROM users u
JOIN orders o ON o.user_id = u.id
WHERE o.payment_status = 'paid'
GROUP BY u.id, u.name, u.email, u.phone, u.created_at
ORDER BY lifetime_value DESC;

-- VIEW 4: Category performance metrics
CREATE OR REPLACE VIEW v_category_performance AS
SELECT
  c.id, c.name AS category_name,
  COUNT(DISTINCT p.id) AS total_products,
  COUNT(DISTINCT oi.order_id) AS total_orders,
  COALESCE(SUM(oi.quantity), 0) AS total_units_sold,
  COALESCE(SUM(oi.price * oi.quantity), 0) AS total_revenue,
  AVG(p.price) AS avg_product_price,
  AVG(r.rating) AS avg_rating,
  COUNT(DISTINCT r.id) AS total_reviews,
  SUM(CASE WHEN p.stock_quantity = 0 THEN 1 ELSE 0 END) AS out_of_stock_count
FROM categories c
LEFT JOIN products p ON p.category_id = c.id
LEFT JOIN order_items oi ON oi.product_id = p.id
LEFT JOIN reviews r ON r.product_id = p.id
GROUP BY c.id, c.name;

-- VIEW 5: Low stock alert dashboard
CREATE OR REPLACE VIEW v_low_stock_alert AS
SELECT
  p.id, p.name, p.purity, p.gold_weight, p.stock_quantity,
  c.name AS category_name,
  CASE
    WHEN p.stock_quantity = 0 THEN 'OUT OF STOCK'
    WHEN p.stock_quantity <= 2 THEN 'CRITICAL'
    WHEN p.stock_quantity <= 5 THEN 'LOW'
  END AS alert_level,
  p.is_featured,
  p.price AS current_price
FROM products p
JOIN categories c ON c.id = p.category_id
WHERE p.stock_quantity < 5
ORDER BY p.stock_quantity ASC;

-- VIEW 6: Daily revenue breakdown
CREATE OR REPLACE VIEW v_daily_revenue AS
SELECT
  DATE(o.created_at) AS revenue_date,
  DAYNAME(o.created_at) AS day_name,
  COUNT(DISTINCT o.id) AS total_orders,
  SUM(o.subtotal) AS gross_revenue,
  SUM(o.discount) AS total_discounts,
  SUM(o.gst) AS gst_collected,
  SUM(o.shipping) AS shipping_revenue,
  SUM(o.total_amount) AS net_revenue,
  COUNT(DISTINCT o.user_id) AS unique_customers
FROM orders o
WHERE o.payment_status = 'paid'
GROUP BY DATE(o.created_at), DAYNAME(o.created_at)
ORDER BY revenue_date DESC;

-- VIEW 7: Product review statistics with star breakdown
CREATE OR REPLACE VIEW v_product_review_stats AS
SELECT
  p.id, p.name, c.name AS category_name,
  COUNT(r.id) AS total_reviews,
  ROUND(AVG(r.rating), 2) AS avg_rating,
  SUM(CASE WHEN r.rating = 5 THEN 1 ELSE 0 END) AS five_star,
  SUM(CASE WHEN r.rating = 4 THEN 1 ELSE 0 END) AS four_star,
  SUM(CASE WHEN r.rating = 3 THEN 1 ELSE 0 END) AS three_star,
  SUM(CASE WHEN r.rating = 2 THEN 1 ELSE 0 END) AS two_star,
  SUM(CASE WHEN r.rating = 1 THEN 1 ELSE 0 END) AS one_star,
  MAX(r.created_at) AS latest_review_date,
  (SELECT u.name FROM reviews r2 JOIN users u ON u.id = r2.user_id
   WHERE r2.product_id = p.id ORDER BY r2.created_at DESC LIMIT 1) AS latest_reviewer
FROM products p
JOIN categories c ON c.id = p.category_id
LEFT JOIN reviews r ON r.product_id = p.id
GROUP BY p.id, p.name, c.name
ORDER BY avg_rating DESC;


-- =============================================================
-- SECTION 6: COMPLEX JOIN QUERIES (as Stored Procedures)
-- =============================================================

-- QUERY 1: GetBestSellingProducts
DROP PROCEDURE IF EXISTS GetBestSellingProducts;
DELIMITER $$
CREATE PROCEDURE GetBestSellingProducts(IN p_limit INT, IN p_days INT)
BEGIN
  DECLARE EXIT HANDLER FOR SQLEXCEPTION BEGIN ROLLBACK; RESIGNAL; END;
  SELECT
    p.id AS product_id, p.name AS product_name, c.name AS category_name,
    p.purity, p.gold_weight,
    SUM(oi.quantity) AS units_sold,
    SUM(oi.price * oi.quantity) AS total_revenue,
    COUNT(DISTINCT oi.order_id) AS order_count,
    pi.image_url AS primary_image
  FROM products p
  JOIN order_items oi ON oi.product_id = p.id
  JOIN orders o ON o.id = oi.order_id
  JOIN categories c ON c.id = p.category_id
  LEFT JOIN product_images pi ON pi.product_id = p.id AND pi.is_primary = TRUE
  WHERE o.created_at >= DATE_SUB(NOW(), INTERVAL p_days DAY)
    AND o.payment_status = 'paid'
  GROUP BY p.id, p.name, c.name, p.purity, p.gold_weight, pi.image_url
  ORDER BY units_sold DESC
  LIMIT p_limit;
END$$
DELIMITER ;

-- QUERY 2: GetCustomerPurchaseHistory
DROP PROCEDURE IF EXISTS GetCustomerPurchaseHistory;
DELIMITER $$
CREATE PROCEDURE GetCustomerPurchaseHistory(IN p_user_id INT)
BEGIN
  DECLARE EXIT HANDLER FOR SQLEXCEPTION BEGIN ROLLBACK; RESIGNAL; END;
  SELECT
    o.id AS order_id, o.created_at, o.status, o.payment_method,
    p.name AS product_name, c.name AS category_name, p.purity,
    oi.quantity, oi.price AS item_price,
    o.total_amount,
    CONCAT(a.address_line1, ', ', a.city, ', ', a.state, ' - ', a.pincode) AS delivery_address,
    pi.image_url AS primary_image
  FROM orders o
  JOIN order_items oi ON oi.order_id = o.id
  JOIN products p ON p.id = oi.product_id
  JOIN categories c ON c.id = p.category_id
  LEFT JOIN addresses a ON a.id = o.address_id
  LEFT JOIN product_images pi ON pi.product_id = p.id AND pi.is_primary = TRUE
  WHERE o.user_id = p_user_id
  ORDER BY o.created_at DESC;
END$$
DELIMITER ;

-- QUERY 3: GetWishlistVsPurchaseAnalysis
DROP PROCEDURE IF EXISTS GetWishlistVsPurchaseAnalysis;
DELIMITER $$
CREATE PROCEDURE GetWishlistVsPurchaseAnalysis()
BEGIN
  DECLARE EXIT HANDLER FOR SQLEXCEPTION BEGIN ROLLBACK; RESIGNAL; END;
  SELECT
    p.name, c.name AS category,
    COUNT(DISTINCT w.user_id) AS wishlist_count,
    COUNT(DISTINCT CASE WHEN oi.order_id IS NOT NULL THEN w.user_id END) AS purchased_count,
    ROUND(COUNT(DISTINCT CASE WHEN oi.order_id IS NOT NULL THEN w.user_id END)
          / COUNT(DISTINCT w.user_id) * 100, 2) AS conversion_rate_pct,
    ROUND(AVG(DATEDIFF(NOW(), w.created_at)), 0) AS avg_days_in_wishlist
  FROM wishlist w
  JOIN products p ON p.id = w.product_id
  JOIN categories c ON c.id = p.category_id
  LEFT JOIN order_items oi ON oi.product_id = w.product_id
  LEFT JOIN orders o ON o.id = oi.order_id AND o.user_id = w.user_id
  GROUP BY p.id, p.name, c.name
  ORDER BY conversion_rate_pct DESC;
END$$
DELIMITER ;

-- QUERY 4: GetCouponUsageReport
DROP PROCEDURE IF EXISTS GetCouponUsageReport;
DELIMITER $$
CREATE PROCEDURE GetCouponUsageReport()
BEGIN
  DECLARE EXIT HANDLER FOR SQLEXCEPTION BEGIN ROLLBACK; RESIGNAL; END;
  SELECT
    cp.code, cp.discount_type, cp.discount_value, cp.max_uses, cp.used_count,
    ROUND(cp.used_count / cp.max_uses * 100, 1) AS usage_pct,
    COUNT(DISTINCT o.id) AS orders_using_coupon,
    COALESCE(SUM(o.discount), 0) AS total_discount_given,
    COALESCE(SUM(o.total_amount), 0) AS revenue_from_coupon_orders,
    AVG(o.total_amount) AS avg_order_with_coupon,
    cp.is_active, cp.expires_at
  FROM coupons cp
  LEFT JOIN orders o ON o.coupon_code = cp.code
  GROUP BY cp.id, cp.code, cp.discount_type, cp.discount_value,
           cp.max_uses, cp.used_count, cp.is_active, cp.expires_at
  ORDER BY total_discount_given DESC;
END$$
DELIMITER ;

-- QUERY 5: GetGoldRateImpactAnalysis
DROP PROCEDURE IF EXISTS GetGoldRateImpactAnalysis;
DELIMITER $$
CREATE PROCEDURE GetGoldRateImpactAnalysis()
BEGIN
  DECLARE EXIT HANDLER FOR SQLEXCEPTION BEGIN ROLLBACK; RESIGNAL; END;
  SELECT
    DATE(gr.recorded_at) AS rate_date,
    gr.rate_22k, gr.rate_18k, gr.rate_14k,
    COUNT(DISTINCT o.id) AS orders_that_day,
    COALESCE(SUM(o.total_amount), 0) AS revenue_that_day,
    AVG(o.total_amount) AS avg_order_that_day
  FROM gold_rate_history gr
  LEFT JOIN orders o ON DATE(o.created_at) = DATE(gr.recorded_at)
  GROUP BY DATE(gr.recorded_at), gr.rate_22k, gr.rate_18k, gr.rate_14k
  ORDER BY rate_date DESC;
END$$
DELIMITER ;

-- QUERY 6: GetRevenueByPurityReport
DROP PROCEDURE IF EXISTS GetRevenueByPurityReport;
DELIMITER $$
CREATE PROCEDURE GetRevenueByPurityReport(IN p_from DATE, IN p_to DATE)
BEGIN
  DECLARE EXIT HANDLER FOR SQLEXCEPTION BEGIN ROLLBACK; RESIGNAL; END;
  SELECT
    p.purity,
    COUNT(DISTINCT oi.order_id) AS total_orders,
    SUM(oi.quantity) AS total_units,
    SUM(oi.price * oi.quantity) AS total_revenue,
    AVG(oi.price) AS avg_selling_price,
    SUM(p.making_charges * oi.quantity) AS total_making_revenue,
    SUM(oi.gold_rate * p.gold_weight * oi.quantity) AS total_gold_value
  FROM order_items oi
  JOIN orders o ON o.id = oi.order_id
  JOIN products p ON p.id = oi.product_id
  WHERE DATE(o.created_at) BETWEEN p_from AND p_to
    AND o.payment_status = 'paid'
  GROUP BY p.purity;
END$$
DELIMITER ;


-- =============================================================
-- SECTION 7: INDEXES FOR PERFORMANCE
-- =============================================================

-- Composite indexes to speed up common query patterns
-- MySQL 8.0 does not support CREATE INDEX IF NOT EXISTS natively,
-- so we use a helper procedure to safely add indexes.

DELIMITER $$
DROP PROCEDURE IF EXISTS SafeCreateIndex$$
CREATE PROCEDURE SafeCreateIndex(
  IN p_index_name VARCHAR(64),
  IN p_table_name VARCHAR(64),
  IN p_columns    VARCHAR(255)
)
BEGIN
  DECLARE v_count INT DEFAULT 0;
  SELECT COUNT(*) INTO v_count
    FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = p_table_name
      AND INDEX_NAME = p_index_name;
  IF v_count = 0 THEN
    SET @sql = CONCAT('CREATE INDEX `', p_index_name, '` ON `', p_table_name, '` (', p_columns, ')');
    PREPARE stmt FROM @sql;
    EXECUTE stmt;
    DEALLOCATE PREPARE stmt;
  END IF;
END$$
DELIMITER ;

-- Orders: speed up user-specific and status-filtered queries
CALL SafeCreateIndex('idx_orders_user_status',     'orders',      'user_id, status');
CALL SafeCreateIndex('idx_orders_created_payment',  'orders',      'created_at, payment_status');
CALL SafeCreateIndex('idx_orders_coupon',           'orders',      'coupon_code');

-- Order Items: speed up product-level analytics
CALL SafeCreateIndex('idx_order_items_product',     'order_items', 'product_id');

-- Reviews: speed up rating aggregations per product
CALL SafeCreateIndex('idx_reviews_product_rating',  'reviews',     'product_id, rating');

-- Wishlist: speed up user+product lookups
CALL SafeCreateIndex('idx_wishlist_user_product',   'wishlist',    'user_id, product_id');

-- Products: speed up purity/stock and category/featured filters
CALL SafeCreateIndex('idx_products_purity_stock',   'products',    'purity, stock_quantity');
CALL SafeCreateIndex('idx_products_category_feat',  'products',    'category_id, is_featured, is_new');

-- Cart Items: speed up cart lookups
CALL SafeCreateIndex('idx_cart_items_cart',          'cart_items',  'cart_id, product_id');

-- Gold Rates: speed up latest-rate queries
CALL SafeCreateIndex('idx_gold_rates_updated',      'gold_rates',  'updated_at');

-- Clean up helper
DROP PROCEDURE IF EXISTS SafeCreateIndex;


-- =============================================================
-- SECTION 8: TEST / SAMPLE CALLS
-- =============================================================

-- Stored Procedures with Cursors
CALL GetMonthlyRevenueReport(2025);
CALL GenerateRestockList();
CALL GetWishlistConversionReport();
CALL BulkUpdateMakingCharges(5.00, 'Annual making charge revision 2025');

-- Complex Join Query Procedures
CALL GetBestSellingProducts(10, 30);
CALL GetCustomerPurchaseHistory(1);
CALL GetWishlistVsPurchaseAnalysis();
CALL GetCouponUsageReport();
CALL GetGoldRateImpactAnalysis();
CALL GetRevenueByPurityReport('2025-01-01', '2025-12-31');

-- Views
SELECT * FROM v_product_live_price LIMIT 5;
SELECT * FROM v_low_stock_alert;
SELECT * FROM v_top_customers LIMIT 10;
SELECT * FROM v_category_performance;
SELECT * FROM v_daily_revenue LIMIT 30;
SELECT * FROM v_product_review_stats LIMIT 10;

-- PlaceOrderWithValidation (requires user with cart items)
SET @oid = 0; SET @tot = 0; SET @msg = '';
CALL PlaceOrderWithValidation(1, 1, 'upi', 'BALAJI10', @oid, @tot, @msg);
SELECT @oid AS order_id, @tot AS total, @msg AS message;

-- =============================================================
-- END OF FILE — advanced_features.sql
-- Total features: 5 tables, 20+ constraints, 6 triggers,
--   5 cursor procedures, 6 join-query procedures, 7 views,
--   10 performance indexes
-- =============================================================
