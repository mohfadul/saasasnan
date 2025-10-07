-- COMPLETE ORDERS TABLE FIX
-- This aligns the orders table with the backend Order entity
-- Based on backend/src/marketplace/entities/order.entity.ts

USE healthcare_saas;

-- Step 1: Add missing columns
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS clinic_id VARCHAR(36) COMMENT 'Clinic that placed the order';

ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS subtotal DECIMAL(10,2) DEFAULT 0 COMMENT 'Subtotal before tax/shipping';

ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS tax_amount DECIMAL(10,2) DEFAULT 0 COMMENT 'Tax amount';

ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS shipping_cost DECIMAL(10,2) DEFAULT 0 COMMENT 'Shipping/delivery cost';

ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS discount_amount DECIMAL(10,2) DEFAULT 0 COMMENT 'Discount applied';

ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS actual_delivery_date TIMESTAMP NULL COMMENT 'When order was actually delivered';

ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS shipping_address JSON COMMENT 'Delivery address';

-- Step 2: Fix column types to match backend entity
-- Change DATE columns to TIMESTAMP
ALTER TABLE orders 
MODIFY COLUMN order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'When order was placed';

ALTER TABLE orders 
MODIFY COLUMN expected_delivery_date TIMESTAMP NULL COMMENT 'Expected delivery date';

-- Step 3: Update status enum to include all backend statuses
ALTER TABLE orders 
MODIFY COLUMN status ENUM('draft', 'pending', 'confirmed', 'shipped', 'delivered', 'cancelled', 'returned') 
DEFAULT 'draft' 
COMMENT 'Order status';

-- Step 4: Update existing data
-- Set clinic_id from tenant_id where null
UPDATE orders 
SET clinic_id = tenant_id 
WHERE clinic_id IS NULL;

-- Calculate subtotal from total_amount where not set
UPDATE orders 
SET subtotal = total_amount,
    tax_amount = 0,
    shipping_cost = 0,
    discount_amount = 0
WHERE subtotal IS NULL OR subtotal = 0;

-- Step 5: Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_orders_clinic ON orders(clinic_id);
CREATE INDEX IF NOT EXISTS idx_orders_actual_delivery ON orders(actual_delivery_date);

-- Step 6: Add foreign key for clinic_id (skip if exists - won't error)
-- Note: Commented out to avoid duplicate key error if already exists
-- ALTER TABLE orders 
-- ADD CONSTRAINT fk_orders_clinic 
-- FOREIGN KEY (clinic_id) REFERENCES clinics(id) ON DELETE CASCADE;

SELECT 'COMPLETE: Orders table is now aligned with backend entity!' AS Status;

