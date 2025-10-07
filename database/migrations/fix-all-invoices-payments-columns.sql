-- Fix invoices table - add all missing columns from the backend entity

-- Customer type (enum: patient, insurance, third_party)
ALTER TABLE invoices 
ADD COLUMN IF NOT EXISTS customer_type VARCHAR(50) NOT NULL DEFAULT 'patient';

-- Customer ID (patient_id or insurance_provider_id)
ALTER TABLE invoices 
ADD COLUMN IF NOT EXISTS customer_id CHAR(36) NULL;

-- Customer info (JSON with name, contact, etc.)
ALTER TABLE invoices 
ADD COLUMN IF NOT EXISTS customer_info JSON NULL;

-- Invoice number (auto-generated)
ALTER TABLE invoices 
ADD COLUMN IF NOT EXISTS invoice_number VARCHAR(100) NULL;

-- Invoice and due dates
ALTER TABLE invoices 
ADD COLUMN IF NOT EXISTS invoice_date DATE NULL;

ALTER TABLE invoices 
ADD COLUMN IF NOT EXISTS due_date DATE NULL;

-- Financial columns
ALTER TABLE invoices 
ADD COLUMN IF NOT EXISTS subtotal DECIMAL(10,2) DEFAULT 0;

ALTER TABLE invoices 
ADD COLUMN IF NOT EXISTS tax_amount DECIMAL(10,2) DEFAULT 0;

ALTER TABLE invoices 
ADD COLUMN IF NOT EXISTS discount_amount DECIMAL(10,2) DEFAULT 0;

ALTER TABLE invoices 
ADD COLUMN IF NOT EXISTS total_amount DECIMAL(10,2) DEFAULT 0;

ALTER TABLE invoices 
ADD COLUMN IF NOT EXISTS paid_amount DECIMAL(10,2) DEFAULT 0;

ALTER TABLE invoices 
ADD COLUMN IF NOT EXISTS balance_amount DECIMAL(10,2) DEFAULT 0;

-- Status
ALTER TABLE invoices 
ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'draft';

-- Payment terms
ALTER TABLE invoices 
ADD COLUMN IF NOT EXISTS payment_terms INT DEFAULT 30;

ALTER TABLE invoices 
ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50) NULL;

ALTER TABLE invoices 
ADD COLUMN IF NOT EXISTS payment_reference VARCHAR(255) NULL;

ALTER TABLE invoices 
ADD COLUMN IF NOT EXISTS paid_date DATE NULL;

-- Additional fields
ALTER TABLE invoices 
ADD COLUMN IF NOT EXISTS notes TEXT NULL;

ALTER TABLE invoices 
ADD COLUMN IF NOT EXISTS terms_and_conditions TEXT NULL;

ALTER TABLE invoices 
ADD COLUMN IF NOT EXISTS created_by CHAR(36) NULL;

-- Fix payments table - add all missing columns

-- Transaction ID from payment gateway
ALTER TABLE payments 
ADD COLUMN IF NOT EXISTS transaction_id VARCHAR(255) NULL;

-- Gateway response
ALTER TABLE payments 
ADD COLUMN IF NOT EXISTS gateway_response JSON NULL;

-- Processing fee
ALTER TABLE payments 
ADD COLUMN IF NOT EXISTS processing_fee DECIMAL(10,2) DEFAULT 0;

-- Status renamed to payment_status
ALTER TABLE payments 
ADD COLUMN IF NOT EXISTS payment_status VARCHAR(50) DEFAULT 'pending';

-- Payment number
ALTER TABLE payments 
ADD COLUMN IF NOT EXISTS payment_number VARCHAR(100) NULL;

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_invoices_customer_type ON invoices(customer_type);
CREATE INDEX IF NOT EXISTS idx_invoices_customer_id ON invoices(customer_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_invoice_number ON invoices(invoice_number);

CREATE INDEX IF NOT EXISTS idx_payments_transaction_id ON payments(transaction_id);
CREATE INDEX IF NOT EXISTS idx_payments_payment_status ON payments(payment_status);
CREATE INDEX IF NOT EXISTS idx_payments_payment_number ON payments(payment_number);

