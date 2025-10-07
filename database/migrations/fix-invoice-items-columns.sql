-- Fix invoice_items table - add all missing columns

-- Add updated_at column (from BaseEntity)
ALTER TABLE invoice_items 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;

-- Add item_type column (enum: service, product, treatment, consultation)
ALTER TABLE invoice_items 
ADD COLUMN IF NOT EXISTS item_type VARCHAR(50) NULL;

-- Add reference_id (points to appointment, product, etc.)
ALTER TABLE invoice_items 
ADD COLUMN IF NOT EXISTS reference_id CHAR(36) NULL;

-- Add tax fields
ALTER TABLE invoice_items 
ADD COLUMN IF NOT EXISTS tax_rate DECIMAL(5,2) DEFAULT 0;

ALTER TABLE invoice_items 
ADD COLUMN IF NOT EXISTS tax_amount DECIMAL(10,2) DEFAULT 0;

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_invoice_items_type ON invoice_items(item_type);
CREATE INDEX IF NOT EXISTS idx_invoice_items_reference ON invoice_items(reference_id);

