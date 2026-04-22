-- migrations/001_initial.sql
-- Initial migration for pasal_e database

-- OWNER
CREATE TABLE IF NOT EXISTS owner (
    owner_id SERIAL PRIMARY KEY,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password TEXT,
    google_id TEXT UNIQUE,
    auth_provider VARCHAR(20) NOT NULL CHECK (auth_provider IN ('local', 'google')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- SHOP
CREATE TABLE IF NOT EXISTS shop (
    shop_id SERIAL PRIMARY KEY,
    owner_id INT UNIQUE REFERENCES owner(owner_id) ON DELETE CASCADE,
    shop_name VARCHAR(255) NOT NULL,
    brand_name VARCHAR(255),
    currency VARCHAR(10),
    subdomain VARCHAR(255) UNIQUE,
    theme VARCHAR(100),
    colour VARCHAR(100),
    logo_image TEXT,
    banner_image TEXT,
    physical_location TEXT,
    bank_account_details TEXT
);

-- CATEGORY
CREATE TABLE IF NOT EXISTS category (
    category_id SERIAL PRIMARY KEY,
    shop_id INT REFERENCES shop(shop_id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    image TEXT
);

-- PRODUCT
CREATE TABLE IF NOT EXISTS product (
    product_id SERIAL PRIMARY KEY,
    shop_id INT REFERENCES shop(shop_id) ON DELETE CASCADE,
    category_id INT REFERENCES category(category_id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    image TEXT,
    vendor_name VARCHAR(255),
    stock INT DEFAULT 0,
    cost_price DECIMAL(10,2),
    selling_price DECIMAL(10,2),
    online_available BOOLEAN DEFAULT TRUE
);

-- VARIATION
CREATE TABLE IF NOT EXISTS variation (
    variation_id SERIAL PRIMARY KEY,
    product_id INT REFERENCES product(product_id) ON DELETE CASCADE,
    name VARCHAR(255),
    image TEXT,
    selling_price DECIMAL(10,2)
);

-- RECEIPT
CREATE TABLE IF NOT EXISTS receipt (
    receipt_id SERIAL PRIMARY KEY,
    shop_id INT REFERENCES shop(shop_id) ON DELETE CASCADE,
    image TEXT,
    vendor_name VARCHAR(255),
    date_added DATE,
    total_amount DECIMAL(10,2)
);

-- CUSTOMER
CREATE TABLE IF NOT EXISTS customer (
    customer_id SERIAL PRIMARY KEY,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    email VARCHAR(255) UNIQUE,
    address TEXT,
    landmark TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- CART
CREATE TABLE IF NOT EXISTS cart (
    cart_id SERIAL PRIMARY KEY,
    customer_id INT REFERENCES customer(customer_id) ON DELETE CASCADE
);

-- CART_ITEM
CREATE TABLE IF NOT EXISTS cart_item (
    cart_item_id SERIAL PRIMARY KEY,
    cart_id INT REFERENCES cart(cart_id) ON DELETE CASCADE,
    product_id INT REFERENCES product(product_id) ON DELETE CASCADE,
    variation_id INT REFERENCES variation(variation_id) ON DELETE SET NULL,
    quantity INT NOT NULL CHECK (quantity > 0),
    amount DECIMAL(10,2)
);

-- ORDERS
CREATE TABLE IF NOT EXISTS orders (
    order_id SERIAL PRIMARY KEY,
    customer_id INT REFERENCES customer(customer_id) ON DELETE SET NULL,
    shop_id INT REFERENCES shop(shop_id) ON DELETE CASCADE,
    order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    total_amount DECIMAL(10,2),
    payment_screenshot TEXT,
    payment_type VARCHAR(50),
    status VARCHAR(50)
);

-- ORDER_DETAILS
CREATE TABLE IF NOT EXISTS order_details (
    order_details_id SERIAL PRIMARY KEY,
    order_id INT REFERENCES orders(order_id) ON DELETE CASCADE,
    product_id INT REFERENCES product(product_id) ON DELETE SET NULL,
    variation_id INT REFERENCES variation(variation_id) ON DELETE SET NULL,
    quantity INT NOT NULL CHECK (quantity > 0),
    price DECIMAL(10,2)
);

-- FORECAST
CREATE TABLE IF NOT EXISTS forecast (
    forecast_id SERIAL PRIMARY KEY,
    shop_id INT REFERENCES shop(shop_id) ON DELETE CASCADE,
    forecast_date DATE,
    predicted_income DECIMAL(10,2),
    predicted_expense DECIMAL(10,2)
);

-- ============================================================

-- Add default status to orders (safe to run multiple times)
ALTER TABLE orders
  ALTER COLUMN status SET DEFAULT 'Pending';

-- Update any existing NULL statuses
UPDATE orders SET status = 'Pending' WHERE status IS NULL;

-- Add NOT NULL constraint after backfill
ALTER TABLE orders
  ALTER COLUMN status SET NOT NULL;

-- Add product_name snapshot to order_details so product name
-- is preserved even if product is deleted later
ALTER TABLE order_details
  ADD COLUMN IF NOT EXISTS product_name VARCHAR(255),
  ADD COLUMN IF NOT EXISTS variation_name VARCHAR(255);


-- ============================================================
-- 003_dashboard_additions (appended)
-- Add date_added to product for expense tracking
-- ============================================================
ALTER TABLE product
  ADD COLUMN IF NOT EXISTS date_added TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Backfill existing products with a placeholder date
UPDATE product SET date_added = CURRENT_TIMESTAMP WHERE date_added IS NULL;

