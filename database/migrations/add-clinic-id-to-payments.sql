-- Add missing clinic_id column to payments table
ALTER TABLE payments 
ADD COLUMN IF NOT EXISTS clinic_id CHAR(36) NULL AFTER tenant_id;

-- Add foreign key constraint
ALTER TABLE payments 
ADD CONSTRAINT fk_payments_clinic 
FOREIGN KEY (clinic_id) REFERENCES clinics(id) ON DELETE SET NULL;

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_payments_clinic ON payments(clinic_id);

