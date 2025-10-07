-- Sudan Payment System Migration
-- Adds support for local payment providers, manual reconciliation, and audit logging
-- Database: MySQL (Note: Original request mentioned Postgres, but this system uses MySQL)
-- Date: 2025-10-06

-- =====================================================
-- 1. Update payments table with Sudan-specific fields
-- =====================================================

-- Add payment provider enum (if not exists)
ALTER TABLE payments 
ADD COLUMN IF NOT EXISTS provider VARCHAR(50) DEFAULT 'bank_transfer' 
COMMENT 'Payment provider: BankOfKhartoum, FaisalIslamicBank, ZainBede, Cashi, CashOnDelivery, CashAtBranch';

-- Add transaction reference ID
ALTER TABLE payments 
ADD COLUMN IF NOT EXISTS reference_id VARCHAR(100) 
COMMENT 'Bank transfer ref, wallet transaction ID, or agent code';

-- Add payer information
ALTER TABLE payments 
ADD COLUMN IF NOT EXISTS payer_name VARCHAR(255) 
COMMENT 'Name of person making payment';

ALTER TABLE payments 
ADD COLUMN IF NOT EXISTS wallet_phone VARCHAR(20) 
COMMENT 'Mobile wallet phone number (Sudan format: +249...)';

-- Add receipt/proof upload
ALTER TABLE payments 
ADD COLUMN IF NOT EXISTS receipt_url VARCHAR(500) 
COMMENT 'URL to uploaded receipt/screenshot';

-- Update payment status enum
ALTER TABLE payments 
MODIFY COLUMN payment_status ENUM(
  'pending', 
  'processing', 
  'confirmed', 
  'completed', 
  'failed', 
  'refunded', 
  'rejected'
) DEFAULT 'pending';

-- Add manual review fields
ALTER TABLE payments 
ADD COLUMN IF NOT EXISTS reviewed_by VARCHAR(36) 
COMMENT 'User ID of admin who reviewed payment';

ALTER TABLE payments 
ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMP NULL 
COMMENT 'Timestamp when payment was reviewed';

-- Add notes for admin use
ALTER TABLE payments 
ADD COLUMN IF NOT EXISTS admin_notes TEXT 
COMMENT 'Notes added by admin during review';

-- Add indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_payments_provider ON payments(provider);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(payment_status);
CREATE INDEX IF NOT EXISTS idx_payments_reference ON payments(reference_id);
CREATE INDEX IF NOT EXISTS idx_payments_reviewed_by ON payments(reviewed_by);

-- =====================================================
-- 2. Create payment_audit_log table for compliance
-- =====================================================

CREATE TABLE IF NOT EXISTS payment_audit_log (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  tenant_id VARCHAR(36) NOT NULL,
  payment_id VARCHAR(36) NOT NULL,
  action VARCHAR(50) NOT NULL COMMENT 'created, confirmed, rejected, refunded, updated',
  performed_by VARCHAR(36) NOT NULL COMMENT 'User ID who performed action',
  previous_status VARCHAR(50) COMMENT 'Status before change',
  new_status VARCHAR(50) COMMENT 'Status after change',
  ip_address VARCHAR(45) COMMENT 'IP address of user',
  user_agent TEXT COMMENT 'Browser/device info',
  changes JSON COMMENT 'Detailed changes made',
  notes TEXT COMMENT 'Reason for action',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_audit_tenant (tenant_id),
  INDEX idx_audit_payment (payment_id),
  INDEX idx_audit_action (action),
  INDEX idx_audit_performed_by (performed_by),
  INDEX idx_audit_created (created_at),
  
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
  FOREIGN KEY (payment_id) REFERENCES payments(id) ON DELETE CASCADE,
  FOREIGN KEY (performed_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 3. Update invoices table for payment linking
-- =====================================================

-- Add payment linking
ALTER TABLE invoices 
ADD COLUMN IF NOT EXISTS linked_payment_id VARCHAR(36) 
COMMENT 'Primary payment ID for this invoice';

-- Add partial payment support
ALTER TABLE invoices 
ADD COLUMN IF NOT EXISTS allows_partial_payments BOOLEAN DEFAULT FALSE 
COMMENT 'Whether invoice accepts multiple partial payments';

ALTER TABLE invoices 
ADD COLUMN IF NOT EXISTS paid_amount DECIMAL(10,2) DEFAULT 0.00 
COMMENT 'Total amount paid so far';

-- Update invoice status to include pending_payment
ALTER TABLE invoices 
MODIFY COLUMN status ENUM(
  'draft', 
  'pending', 
  'pending_payment', 
  'partially_paid', 
  'paid', 
  'overdue', 
  'cancelled', 
  'refunded'
) DEFAULT 'draft';

-- Add index for payment lookup
CREATE INDEX IF NOT EXISTS idx_invoices_payment ON invoices(linked_payment_id);

-- =====================================================
-- 4. Create invoice_payments junction table
-- =====================================================
-- For supporting multiple payments against one invoice

CREATE TABLE IF NOT EXISTS invoice_payments (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  tenant_id VARCHAR(36) NOT NULL,
  invoice_id VARCHAR(36) NOT NULL,
  payment_id VARCHAR(36) NOT NULL,
  amount_applied DECIMAL(10,2) NOT NULL COMMENT 'Amount of this payment applied to invoice',
  applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  applied_by VARCHAR(36) COMMENT 'User who applied payment',
  
  INDEX idx_invoice_payments_invoice (invoice_id),
  INDEX idx_invoice_payments_payment (payment_id),
  INDEX idx_invoice_payments_tenant (tenant_id),
  
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
  FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE,
  FOREIGN KEY (payment_id) REFERENCES payments(id) ON DELETE CASCADE,
  FOREIGN KEY (applied_by) REFERENCES users(id) ON DELETE SET NULL,
  
  UNIQUE KEY unique_invoice_payment (invoice_id, payment_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 5. Create payment_methods reference table
-- =====================================================
-- For managing available payment providers

CREATE TABLE IF NOT EXISTS payment_methods (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  tenant_id VARCHAR(36) NOT NULL,
  provider_code VARCHAR(50) NOT NULL COMMENT 'BankOfKhartoum, FaisalIslamicBank, etc.',
  provider_name VARCHAR(255) NOT NULL,
  provider_type ENUM('bank_transfer', 'mobile_wallet', 'cash') NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  requires_reference BOOLEAN DEFAULT TRUE,
  requires_receipt BOOLEAN DEFAULT FALSE,
  receipt_threshold DECIMAL(10,2) COMMENT 'Amount above which receipt is required',
  validation_pattern VARCHAR(500) COMMENT 'Regex pattern for reference ID validation',
  icon_url VARCHAR(500),
  instructions TEXT COMMENT 'Payment instructions for users',
  sort_order INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_payment_methods_tenant (tenant_id),
  INDEX idx_payment_methods_type (provider_type),
  INDEX idx_payment_methods_active (is_active),
  
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
  
  UNIQUE KEY unique_tenant_provider (tenant_id, provider_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 6. Insert default Sudan payment methods
-- =====================================================

-- Insert for demo tenant (update tenant_id as needed)
INSERT INTO payment_methods (id, tenant_id, provider_code, provider_name, provider_type, requires_receipt, receipt_threshold, validation_pattern, instructions, sort_order) VALUES
(UUID(), 'demo-tenant-001', 'BankOfKhartoum', 'Bank of Khartoum', 'bank_transfer', TRUE, 5000.00, '^BOK[0-9]{10,15}$', 'Transfer to Account: 1234567890\nSwift: BOKKSDKH\nEnter transaction reference starting with BOK', 1),
(UUID(), 'demo-tenant-001', 'FaisalIslamicBank', 'Faisal Islamic Bank', 'bank_transfer', TRUE, 5000.00, '^FIB[0-9]{10,15}$', 'Transfer to Account: 0987654321\nSwift: FIBSSDKH\nEnter transaction reference starting with FIB', 2),
(UUID(), 'demo-tenant-001', 'OmdurmanNationalBank', 'Omdurman National Bank', 'bank_transfer', TRUE, 5000.00, '^ONB[0-9]{10,15}$', 'Transfer to Account: 1122334455\nEnter transaction reference starting with ONB', 3),
(UUID(), 'demo-tenant-001', 'ZainBede', 'Zain Bede (زين بيدي)', 'mobile_wallet', TRUE, 3000.00, '^[0-9]{10,15}$', 'Send to: +249123456789\nEnter wallet transaction ID', 4),
(UUID(), 'demo-tenant-001', 'Cashi', 'Cashi Agent Wallet', 'mobile_wallet', TRUE, 3000.00, '^CASHI[0-9]{8,12}$', 'Pay at any Cashi agent\nEnter agent code and transaction ID', 5),
(UUID(), 'demo-tenant-001', 'CashOnDelivery', 'Cash on Delivery', 'cash', FALSE, NULL, NULL, 'Pay cash when you receive your order', 6),
(UUID(), 'demo-tenant-001', 'CashAtBranch', 'Cash at Branch', 'cash', FALSE, NULL, NULL, 'Pay cash at our branch location', 7);

-- =====================================================
-- 7. Create reconciliation batches table (Future)
-- =====================================================
-- For bulk reconciliation from bank statements

CREATE TABLE IF NOT EXISTS payment_reconciliation_batches (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  tenant_id VARCHAR(36) NOT NULL,
  batch_name VARCHAR(255) NOT NULL,
  provider_code VARCHAR(50) NOT NULL,
  file_url VARCHAR(500) COMMENT 'URL to uploaded CSV/Excel file',
  total_records INT DEFAULT 0,
  matched_records INT DEFAULT 0,
  unmatched_records INT DEFAULT 0,
  status ENUM('pending', 'processing', 'completed', 'failed') DEFAULT 'pending',
  processed_by VARCHAR(36),
  processed_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_reconciliation_tenant (tenant_id),
  INDEX idx_reconciliation_status (status),
  INDEX idx_reconciliation_provider (provider_code),
  
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
  FOREIGN KEY (processed_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 8. Add foreign key for reviewed_by
-- =====================================================

ALTER TABLE payments 
ADD CONSTRAINT fk_payments_reviewed_by 
FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL;

-- =====================================================
-- 9. Create view for pending payments dashboard
-- =====================================================

CREATE OR REPLACE VIEW v_pending_payments AS
SELECT 
  p.id,
  p.tenant_id,
  p.invoice_id,
  p.payment_method,
  p.provider,
  p.reference_id,
  p.payer_name,
  p.wallet_phone,
  p.amount,
  p.payment_date,
  p.receipt_url,
  p.payment_status,
  p.created_at,
  i.invoice_number,
  i.patient_id,
  u.first_name AS user_first_name,
  u.last_name AS user_last_name,
  u.email AS user_email
FROM payments p
LEFT JOIN invoices i ON p.invoice_id = i.id
LEFT JOIN users u ON i.patient_id = u.id
WHERE p.payment_status = 'pending'
ORDER BY p.created_at ASC;

-- =====================================================
-- 10. Add triggers for audit logging
-- =====================================================

DELIMITER $$

-- Trigger for payment status changes
CREATE TRIGGER IF NOT EXISTS trg_payment_audit_update
AFTER UPDATE ON payments
FOR EACH ROW
BEGIN
  IF OLD.payment_status != NEW.payment_status THEN
    INSERT INTO payment_audit_log (
      tenant_id, 
      payment_id, 
      action, 
      performed_by, 
      previous_status, 
      new_status,
      notes,
      changes
    ) VALUES (
      NEW.tenant_id,
      NEW.id,
      'status_changed',
      NEW.reviewed_by,
      OLD.payment_status,
      NEW.payment_status,
      NEW.admin_notes,
      JSON_OBJECT(
        'old_status', OLD.payment_status,
        'new_status', NEW.payment_status,
        'reviewed_at', NEW.reviewed_at
      )
    );
  END IF;
END$$

-- Trigger for new payment creation
CREATE TRIGGER IF NOT EXISTS trg_payment_audit_insert
AFTER INSERT ON payments
FOR EACH ROW
BEGIN
  INSERT INTO payment_audit_log (
    tenant_id,
    payment_id,
    action,
    performed_by,
    new_status,
    changes
  ) VALUES (
    NEW.tenant_id,
    NEW.id,
    'created',
    NEW.tenant_id, -- Use tenant_id as fallback for performed_by
    NEW.payment_status,
    JSON_OBJECT(
      'amount', NEW.amount,
      'provider', NEW.provider,
      'reference_id', NEW.reference_id
    )
  );
END$$

DELIMITER ;

-- =====================================================
-- 11. Grant necessary permissions (if using specific DB users)
-- =====================================================

-- GRANT SELECT, INSERT, UPDATE ON payments TO 'app_user'@'localhost';
-- GRANT SELECT, INSERT ON payment_audit_log TO 'app_user'@'localhost';
-- GRANT SELECT ON v_pending_payments TO 'admin_user'@'localhost';

-- =====================================================
-- Migration Complete
-- =====================================================

-- Verification Queries:
-- SELECT * FROM payment_methods WHERE tenant_id = 'demo-tenant-001';
-- SELECT * FROM v_pending_payments LIMIT 10;
-- DESCRIBE payments;
-- DESCRIBE payment_audit_log;


