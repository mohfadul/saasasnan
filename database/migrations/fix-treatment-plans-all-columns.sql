-- Fix treatment_plans table - add all missing columns
-- Add clinical_note_id if missing
ALTER TABLE treatment_plans 
ADD COLUMN IF NOT EXISTS clinical_note_id CHAR(36) NULL;

-- Add all other potentially missing columns from phase4 schema
ALTER TABLE treatment_plans 
ADD COLUMN IF NOT EXISTS priority VARCHAR(50) NOT NULL DEFAULT 'medium';

ALTER TABLE treatment_plans 
ADD COLUMN IF NOT EXISTS estimated_completion_date DATE NULL;

ALTER TABLE treatment_plans 
ADD COLUMN IF NOT EXISTS actual_completion_date DATE NULL;

ALTER TABLE treatment_plans 
ADD COLUMN IF NOT EXISTS estimated_cost DECIMAL(10, 2) NOT NULL DEFAULT 0;

ALTER TABLE treatment_plans 
ADD COLUMN IF NOT EXISTS actual_cost DECIMAL(10, 2) NOT NULL DEFAULT 0;

ALTER TABLE treatment_plans 
ADD COLUMN IF NOT EXISTS insurance_estimate DECIMAL(10, 2) NOT NULL DEFAULT 0;

ALTER TABLE treatment_plans 
ADD COLUMN IF NOT EXISTS patient_responsibility DECIMAL(10, 2) NOT NULL DEFAULT 0;

ALTER TABLE treatment_plans 
ADD COLUMN IF NOT EXISTS total_items INT NOT NULL DEFAULT 0;

ALTER TABLE treatment_plans 
ADD COLUMN IF NOT EXISTS completed_items INT NOT NULL DEFAULT 0;

ALTER TABLE treatment_plans 
ADD COLUMN IF NOT EXISTS in_progress_items INT NOT NULL DEFAULT 0;

ALTER TABLE treatment_plans 
ADD COLUMN IF NOT EXISTS pending_items INT NOT NULL DEFAULT 0;

ALTER TABLE treatment_plans 
ADD COLUMN IF NOT EXISTS notes TEXT NULL;

ALTER TABLE treatment_plans 
ADD COLUMN IF NOT EXISTS patient_consent_notes TEXT NULL;

ALTER TABLE treatment_plans 
ADD COLUMN IF NOT EXISTS patient_consent_date TIMESTAMP NULL;

ALTER TABLE treatment_plans 
ADD COLUMN IF NOT EXISTS patient_consent_obtained BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE treatment_plans 
ADD COLUMN IF NOT EXISTS proposed_at TIMESTAMP NULL;

ALTER TABLE treatment_plans 
ADD COLUMN IF NOT EXISTS accepted_at TIMESTAMP NULL;

ALTER TABLE treatment_plans 
ADD COLUMN IF NOT EXISTS started_at TIMESTAMP NULL;

ALTER TABLE treatment_plans 
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP NULL;

ALTER TABLE treatment_plans 
ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMP NULL;

ALTER TABLE treatment_plans 
ADD COLUMN IF NOT EXISTS cancellation_reason TEXT NULL;

ALTER TABLE treatment_plans 
ADD COLUMN IF NOT EXISTS created_by CHAR(36) NULL;

-- Update status column constraints if it exists
ALTER TABLE treatment_plans 
MODIFY COLUMN status VARCHAR(50) NOT NULL DEFAULT 'draft' 
CHECK (status IN ('draft', 'proposed', 'accepted', 'in_progress', 'completed', 'cancelled', 'on_hold'));

-- Add priority constraint
ALTER TABLE treatment_plans 
ADD CONSTRAINT chk_priority 
CHECK (priority IN ('low', 'medium', 'high', 'urgent'));

-- Add foreign key constraints
ALTER TABLE treatment_plans 
ADD CONSTRAINT fk_treatment_plans_clinical_note 
FOREIGN KEY (clinical_note_id) REFERENCES clinical_notes(id) ON DELETE SET NULL;

ALTER TABLE treatment_plans 
ADD CONSTRAINT fk_treatment_plans_created_by 
FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL;

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_treatment_plans_clinical_note ON treatment_plans(clinical_note_id);
CREATE INDEX IF NOT EXISTS idx_treatment_plans_created_by ON treatment_plans(created_by);
CREATE INDEX IF NOT EXISTS idx_treatment_plans_status ON treatment_plans(status);
CREATE INDEX IF NOT EXISTS idx_treatment_plans_priority ON treatment_plans(priority);

