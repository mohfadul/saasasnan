-- Add missing clinic_id column to invoices table
ALTER TABLE invoices 
ADD COLUMN IF NOT EXISTS clinic_id CHAR(36) NULL AFTER tenant_id;

-- Add foreign key constraint
ALTER TABLE invoices 
ADD CONSTRAINT fk_invoices_clinic 
FOREIGN KEY (clinic_id) REFERENCES clinics(id) ON DELETE SET NULL;

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_invoices_clinic ON invoices(clinic_id);

