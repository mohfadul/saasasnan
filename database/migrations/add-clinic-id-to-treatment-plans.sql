-- Add missing clinic_id column to treatment_plans table
ALTER TABLE treatment_plans 
ADD COLUMN IF NOT EXISTS clinic_id CHAR(36) NULL AFTER tenant_id;

-- Add foreign key constraint
ALTER TABLE treatment_plans 
ADD CONSTRAINT fk_treatment_plans_clinic 
FOREIGN KEY (clinic_id) REFERENCES clinics(id) ON DELETE SET NULL;

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_treatment_plans_clinic ON treatment_plans(clinic_id);

