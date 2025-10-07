-- ============================================================================
-- Migration: Add user_id to patients table for role-based filtering
-- Purpose: Link patient records to user accounts for patient portal access
-- Date: October 7, 2025
-- Priority: HIGH - Required for Phase 2B service-layer filtering
-- ============================================================================

-- Add user_id column to patients table
ALTER TABLE patients
ADD COLUMN user_id VARCHAR(36) NULL AFTER clinic_id,
ADD INDEX idx_patients_user_id (user_id);

-- Add foreign key constraint
ALTER TABLE patients
ADD CONSTRAINT fk_patients_user_id 
FOREIGN KEY (user_id) REFERENCES users(id) 
ON DELETE SET NULL;

-- Optional: Populate user_id for existing patients
-- This query attempts to match patients to users by email (if available in demographics)
-- You may need to run this manually based on your data:

/*
UPDATE patients p
INNER JOIN users u ON JSON_UNQUOTE(JSON_EXTRACT(p.encrypted_demographics, '$.email')) = u.email
SET p.user_id = u.id
WHERE u.role = 'patient'
  AND p.user_id IS NULL;
*/

-- Verification query
SELECT 
  COUNT(*) as total_patients,
  COUNT(user_id) as patients_with_user_accounts,
  COUNT(*) - COUNT(user_id) as patients_without_accounts
FROM patients;

-- ============================================================================
-- ROLLBACK (if needed)
-- ============================================================================

/*
ALTER TABLE patients
DROP FOREIGN KEY fk_patients_user_id;

ALTER TABLE patients
DROP COLUMN user_id,
DROP INDEX idx_patients_user_id;
*/

