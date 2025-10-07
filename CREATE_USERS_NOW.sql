-- ============================================
-- QUICK USER CREATION - Run in phpMyAdmin
-- ============================================
-- Just copy this ENTIRE file and run it!

-- Step 1: Get your tenant and clinic IDs
SELECT 'YOUR TENANT ID:' as info, id, name FROM tenants ORDER BY created_at LIMIT 1;
SELECT 'YOUR CLINIC ID:' as info, id, name FROM clinics ORDER BY created_at LIMIT 1;

-- Step 2: Copy the IDs from above and replace below
-- (Or use the default test tenant/clinic if you have them)

-- ============================================
-- Update the role enum first
-- ============================================
UPDATE users SET role = 'hospital_admin' WHERE role = 'clinic_admin';

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

-- ============================================
-- Create the 3 new users
-- REPLACE 'YOUR_TENANT_ID' and 'YOUR_CLINIC_ID' 
-- with the IDs from Step 1 above!
-- ============================================

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
  'Dr. John', 'Smith', '+1234567890', 0, 0, NOW(), NOW()
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
  'Sarah', 'Johnson', '+1234567891', 0, 0, NOW(), NOW()
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
  'Michael', 'Davis', '+1234567892', 0, 0, NOW(), NOW()
);

-- ============================================
-- VERIFY
-- ============================================
SELECT 'NEW USERS CREATED:' as status;
SELECT email, role, CONCAT(first_name, ' ', last_name) as name
FROM users
WHERE email IN ('doctor@demo.com', 'pharmacist@demo.com', 'hospitaladmin@demo.com');

-- ============================================
-- LOGIN CREDENTIALS:
-- ============================================
-- doctor@demo.com       / Doctor123!@#
-- pharmacist@demo.com   / Pharmacist123!@#
-- hospitaladmin@demo.com / Hospital123!@#
-- ============================================

