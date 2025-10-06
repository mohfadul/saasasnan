-- Fix Clinical Notes Table Schema
-- Date: October 6, 2025

USE healthcare_saas;

-- Add missing columns to clinical_notes table

-- Add status column (ENUM)
ALTER TABLE clinical_notes 
ADD COLUMN `status` ENUM('draft', 'finalized', 'amended', 'archived') NOT NULL DEFAULT 'draft' AFTER note_type;

-- Rename/Add medical history columns
ALTER TABLE clinical_notes 
ADD COLUMN medical_history TEXT NULL AFTER history_of_present_illness;

ALTER TABLE clinical_notes 
ADD COLUMN dental_history TEXT NULL AFTER medical_history;

-- Rename clinical_findings to examination_findings
ALTER TABLE clinical_notes 
CHANGE COLUMN clinical_findings examination_findings TEXT NULL;

-- Add treatment_rendered column
ALTER TABLE clinical_notes 
ADD COLUMN treatment_rendered TEXT NULL AFTER diagnosis;

-- Rename treatment_plan and add recommendations
ALTER TABLE clinical_notes 
CHANGE COLUMN treatment_plan treatment_plan_text TEXT NULL;

ALTER TABLE clinical_notes 
ADD COLUMN recommendations TEXT NULL AFTER treatment_plan_text;

-- Add additional_notes
ALTER TABLE clinical_notes 
ADD COLUMN additional_notes TEXT NULL AFTER follow_up_instructions;

-- Add clinical data JSON columns
ALTER TABLE clinical_notes 
ADD COLUMN vital_signs JSON NULL DEFAULT '{}' AFTER additional_notes;

ALTER TABLE clinical_notes 
ADD COLUMN medications JSON NULL DEFAULT '[]' AFTER vital_signs;

ALTER TABLE clinical_notes 
ADD COLUMN allergies JSON NULL DEFAULT '[]' AFTER medications;

ALTER TABLE clinical_notes 
ADD COLUMN procedures_performed JSON NULL DEFAULT '[]' AFTER allergies;

-- Add digital signature columns
ALTER TABLE clinical_notes 
ADD COLUMN provider_signature TEXT NULL AFTER procedures_performed;

ALTER TABLE clinical_notes 
ADD COLUMN signed_at TIMESTAMP NULL AFTER provider_signature;

-- Add amendment tracking columns
ALTER TABLE clinical_notes 
ADD COLUMN amended_by VARCHAR(36) NULL AFTER signed_at;

ALTER TABLE clinical_notes 
ADD COLUMN amended_at TIMESTAMP NULL AFTER amended_by;

ALTER TABLE clinical_notes 
ADD COLUMN amendment_reason TEXT NULL AFTER amended_at;

-- Add created_by audit column
ALTER TABLE clinical_notes 
ADD COLUMN created_by VARCHAR(36) NULL AFTER amendment_reason;

-- Rename treatment_plan_text back to treatment_plan (if needed for compatibility)
ALTER TABLE clinical_notes 
CHANGE COLUMN treatment_plan_text treatment_plan TEXT NULL;

-- Update note_type ENUM to include all types
ALTER TABLE clinical_notes 
MODIFY COLUMN note_type ENUM(
  'consultation',
  'examination',
  'treatment',
  'follow_up',
  'emergency',
  'progress',
  'discharge'
) NOT NULL;

-- Update existing records to have default status
UPDATE clinical_notes SET status = 'finalized' WHERE status IS NULL;

-- Add foreign keys if not exist
SET @fk_exists = (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS 
                  WHERE CONSTRAINT_SCHEMA = 'healthcare_saas' 
                  AND TABLE_NAME = 'clinical_notes' 
                  AND CONSTRAINT_NAME = 'fk_clinical_notes_amended_by');

SET @sql = IF(@fk_exists = 0,
  'ALTER TABLE clinical_notes ADD CONSTRAINT fk_clinical_notes_amended_by FOREIGN KEY (amended_by) REFERENCES users(id) ON DELETE SET NULL',
  'SELECT "FK already exists" AS message');

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @fk_exists2 = (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS 
                   WHERE CONSTRAINT_SCHEMA = 'healthcare_saas' 
                   AND TABLE_NAME = 'clinical_notes' 
                   AND CONSTRAINT_NAME = 'fk_clinical_notes_created_by');

SET @sql2 = IF(@fk_exists2 = 0,
  'ALTER TABLE clinical_notes ADD CONSTRAINT fk_clinical_notes_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL',
  'SELECT "FK already exists" AS message');

PREPARE stmt2 FROM @sql2;
EXECUTE stmt2;
DEALLOCATE PREPARE stmt2;

SELECT 'Clinical notes schema fixed successfully!' AS status;

