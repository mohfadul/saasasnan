-- Fix Missing Database Columns
-- Date: October 6, 2025

USE healthcare_saas;

-- ==========================================
-- Fix Clinical Notes Table
-- ==========================================

-- Check if column exists before adding
SET @exist = (SELECT COUNT(*) 
              FROM INFORMATION_SCHEMA.COLUMNS 
              WHERE TABLE_SCHEMA = 'healthcare_saas' 
              AND TABLE_NAME = 'clinical_notes' 
              AND COLUMN_NAME = 'clinic_id');

SET @sqlstmt = IF(@exist = 0,
  'ALTER TABLE clinical_notes ADD COLUMN clinic_id CHAR(36) NOT NULL AFTER tenant_id',
  'SELECT ''Column clinic_id already exists'' AS message');

PREPARE stmt FROM @sqlstmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ==========================================
-- Fix Payments Table
-- ==========================================

-- Add payment_number column
SET @exist = (SELECT COUNT(*) 
              FROM INFORMATION_SCHEMA.COLUMNS 
              WHERE TABLE_SCHEMA = 'healthcare_saas' 
              AND TABLE_NAME = 'payments' 
              AND COLUMN_NAME = 'payment_number');

SET @sqlstmt = IF(@exist = 0,
  'ALTER TABLE payments ADD COLUMN payment_number VARCHAR(100) NOT NULL DEFAULT '''' AFTER invoice_id',
  'SELECT ''Column payment_number already exists'' AS message');

PREPARE stmt FROM @sqlstmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add payment_status column
SET @exist = (SELECT COUNT(*) 
              FROM INFORMATION_SCHEMA.COLUMNS 
              WHERE TABLE_SCHEMA = 'healthcare_saas' 
              AND TABLE_NAME = 'payments' 
              AND COLUMN_NAME = 'payment_status');

SET @sqlstmt = IF(@exist = 0,
  'ALTER TABLE payments ADD COLUMN payment_status ENUM(''pending'', ''processing'', ''confirmed'', ''completed'', ''failed'', ''refunded'', ''rejected'', ''cancelled'') NOT NULL DEFAULT ''pending'' AFTER amount',
  'SELECT ''Column payment_status already exists'' AS message');

PREPARE stmt FROM @sqlstmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ==========================================
-- Fix Invoices Table
-- ==========================================

-- Add balance_amount column
SET @exist = (SELECT COUNT(*) 
              FROM INFORMATION_SCHEMA.COLUMNS 
              WHERE TABLE_SCHEMA = 'healthcare_saas' 
              AND TABLE_NAME = 'invoices' 
              AND COLUMN_NAME = 'balance_amount');

SET @sqlstmt = IF(@exist = 0,
  'ALTER TABLE invoices ADD COLUMN balance_amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00 AFTER paid_amount',
  'SELECT ''Column balance_amount already exists'' AS message');

PREPARE stmt FROM @sqlstmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ==========================================
-- Update Existing Data
-- ==========================================

-- Update payment numbers for existing records (if any)
UPDATE payments 
SET payment_number = CONCAT('PAY-', LPAD(id, 10, '0'))
WHERE payment_number = '' OR payment_number IS NULL;

-- Calculate balance_amount for existing invoices
UPDATE invoices 
SET balance_amount = total_amount - IFNULL(paid_amount, 0)
WHERE balance_amount IS NULL OR balance_amount = 0;

-- Update clinic_id for existing clinical notes (use demo clinic if exists)
UPDATE clinical_notes 
SET clinic_id = '550e8400-e29b-41d4-a716-446655440001'
WHERE clinic_id IS NULL OR clinic_id = '';

SELECT 'Database schema fixed successfully!' AS status;

