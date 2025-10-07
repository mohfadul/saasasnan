-- ============================================
-- STEP-BY-STEP SETUP FOR NEW ROLES
-- Copy and paste each section ONE AT A TIME
-- ============================================

-- ============================================
-- STEP 1: Get Your IDs (RUN THIS FIRST!)
-- ============================================
-- Copy the results - you'll need them in Step 3

SELECT 
  'COPY THIS TENANT_ID:' as instruction,
  id as tenant_id, 
  name as tenant_name 
FROM tenants 
ORDER BY created_at ASC 
LIMIT 1;

SELECT 
  'COPY THIS CLINIC_ID:' as instruction,
  id as clinic_id, 
  name as clinic_name 
FROM clinics 
ORDER BY created_at ASC 
LIMIT 1;

-- ============================================
-- STEP 2: Update Role Enum (RUN THIS SECOND!)
-- ============================================

-- Update existing users
UPDATE users 
SET role = 'hospital_admin' 
WHERE role = 'clinic_admin';

-- Add new roles to enum
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

-- Verify
SELECT 'Updated roles:' as status, role, COUNT(*) as count
FROM users 
GROUP BY role;

-- ============================================
-- STEP 3: Create Test Users (RUN THIS THIRD!)
-- ============================================
-- BEFORE RUNNING: Replace YOUR_TENANT_ID and YOUR_CLINIC_ID 
-- with the IDs you copied from Step 1!

-- DOCTOR USER
INSERT INTO users (
  id, tenant_id, clinic_id, email, encrypted_password, role,
  first_name, last_name, phone, mfa_enabled, failed_login_attempts,
  created_at, updated_at
) VALUES (
  UUID(),
  'YOUR_TENANT_ID',  -- ← REPLACE THIS!
  'YOUR_CLINIC_ID',  -- ← REPLACE THIS!
  'doctor@demo.com',
  '$2b$10$85EtLcqSgy7oZQLInDhSVeFfwNFx5pbv5YPetCxIX3MK86kKouT.a',
  'doctor',
  'Dr. John', 'Smith', '+1234567890', 0, 0,
  NOW(), NOW()
);

-- PHARMACIST USER
INSERT INTO users (
  id, tenant_id, clinic_id, email, encrypted_password, role,
  first_name, last_name, phone, mfa_enabled, failed_login_attempts,
  created_at, updated_at
) VALUES (
  UUID(),
  'YOUR_TENANT_ID',  -- ← REPLACE THIS!
  'YOUR_CLINIC_ID',  -- ← REPLACE THIS!
  'pharmacist@demo.com',
  '$2b$10$42g/Y0MrUFejaPro7VvAbeZvkaRFCrCdAbDE2mhb4njGmfi4X35R6',
  'pharmacist',
  'Sarah', 'Johnson', '+1234567891', 0, 0,
  NOW(), NOW()
);

-- HOSPITAL ADMIN USER
INSERT INTO users (
  id, tenant_id, clinic_id, email, encrypted_password, role,
  first_name, last_name, phone, mfa_enabled, failed_login_attempts,
  created_at, updated_at
) VALUES (
  UUID(),
  'YOUR_TENANT_ID',  -- ← REPLACE THIS!
  'YOUR_CLINIC_ID',  -- ← REPLACE THIS!
  'hospitaladmin@demo.com',
  '$2b$10$ID3wkD8IdXYdyOEpByO4eemUMOLGuqSPoCSAJ5S1yHBSkBjkUqVSq',
  'hospital_admin',
  'Michael', 'Davis', '+1234567892', 0, 0,
  NOW(), NOW()
);

-- ============================================
-- STEP 4: Verify (RUN THIS LAST!)
-- ============================================

SELECT '✅ New users created:' as status;
SELECT 
  email, role,
  CONCAT(first_name, ' ', last_name) as name,
  phone, created_at
FROM users
WHERE email IN ('doctor@demo.com', 'pharmacist@demo.com', 'hospitaladmin@demo.com');

SELECT '✅ Final role distribution:' as status;
SELECT role, COUNT(*) as count 
FROM users 
GROUP BY role 
ORDER BY count DESC;

-- ============================================
-- LOGIN CREDENTIALS (Password: Same for all below)
-- ============================================
-- doctor@demo.com       / Doctor123!@#
-- pharmacist@demo.com   / Pharmacist123!@#
-- hospitaladmin@demo.com / Hospital123!@#
-- ============================================

