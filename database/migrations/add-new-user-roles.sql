-- ============================================
-- Migration: Add New User Roles
-- Date: October 7, 2025
-- Purpose: Add DOCTOR and PHARMACIST roles, rename CLINIC_ADMIN to HOSPITAL_ADMIN
-- ============================================

-- Step 1: Update existing enum constraint (MySQL doesn't have enum constraints, so we modify the column)
-- First, let's update any existing 'clinic_admin' users to 'hospital_admin'
UPDATE users 
SET role = 'hospital_admin' 
WHERE role = 'clinic_admin';

-- Step 2: Alter the role column to include new values
-- MySQL ENUM requires recreating the column with new values
ALTER TABLE users 
MODIFY COLUMN role ENUM(
  'super_admin',
  'hospital_admin',
  'dentist',
  'doctor',
  'pharmacist',
  'staff',
  'supplier',
  'patient'
) NOT NULL DEFAULT 'staff';

-- Step 3: Verification queries
-- Count users by role
SELECT role, COUNT(*) as count 
FROM users 
GROUP BY role 
ORDER BY count DESC;

-- Verify no clinic_admin roles remain
SELECT COUNT(*) as clinic_admin_count 
FROM users 
WHERE role = 'clinic_admin';
-- Expected: 0

-- ============================================
-- Rollback (if needed):
-- ALTER TABLE users 
-- MODIFY COLUMN role ENUM(
--   'super_admin',
--   'clinic_admin',
--   'dentist',
--   'staff',
--   'supplier',
--   'patient'
-- ) NOT NULL DEFAULT 'staff';
-- 
-- UPDATE users SET role = 'clinic_admin' WHERE role = 'hospital_admin';
-- ============================================

