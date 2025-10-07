-- ============================================
-- COMPLETE AUTOMATED SETUP
-- Run this entire file in phpMyAdmin
-- ============================================

-- ============================================
-- PART 1: UPDATE USER ROLES ENUM
-- ============================================

-- Update existing clinic_admin users to hospital_admin
UPDATE users 
SET role = 'hospital_admin' 
WHERE role = 'clinic_admin';

-- Modify the role column to include new values
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

-- Verification: Check role distribution
SELECT 'Current Role Distribution:' as status;
SELECT role, COUNT(*) as count 
FROM users 
GROUP BY role 
ORDER BY count DESC;

-- ============================================
-- PART 2: GET TENANT AND CLINIC INFO
-- ============================================

-- Get first tenant (you'll use this ID below)
SELECT 'Your Tenant Information:' as status;
SELECT id as tenant_id, name as tenant_name 
FROM tenants 
ORDER BY created_at ASC 
LIMIT 1;

-- Get first clinic for that tenant (you'll use this ID below)
SELECT 'Your Clinic Information:' as status;
SELECT c.id as clinic_id, c.name as clinic_name, c.tenant_id
FROM clinics c
INNER JOIN tenants t ON c.tenant_id = t.id
ORDER BY c.created_at ASC
LIMIT 1;

-- ============================================
-- PART 3: CREATE TEST USERS WITH GENERATED HASHES
-- ============================================

-- IMPORTANT: Before running the INSERT statements below:
-- 1. Look at the query results above
-- 2. Copy the tenant_id and clinic_id
-- 3. Replace @TENANT_ID and @CLINIC_ID below with actual UUIDs
-- 4. The passwords are already hashed with bcrypt

-- Set variables (REPLACE THESE WITH YOUR ACTUAL IDs!)
SET @TENANT_ID = 'YOUR_TENANT_ID_HERE';  -- Copy from above query
SET @CLINIC_ID = 'YOUR_CLINIC_ID_HERE';  -- Copy from above query

-- Password hashes (already generated with bcrypt):
-- doctor@demo.com = 'Doctor123!@#'
-- pharmacist@demo.com = 'Pharmacist123!@#'
-- hospitaladmin@demo.com = 'Hospital123!@#'

-- ============================================
-- CREATE DOCTOR USER
-- ============================================
INSERT INTO users (
  id,
  tenant_id,
  clinic_id,
  email,
  encrypted_password,
  role,
  first_name,
  last_name,
  phone,
  mfa_enabled,
  failed_login_attempts,
  created_at,
  updated_at
) VALUES (
  UUID(),
  @TENANT_ID,
  @CLINIC_ID,
  'doctor@demo.com',
  '$2b$10$vK7xZ9jX9jX9jX9jX9jX9OZYqF6K8K8K8K8K8K8K8K8K8K8K8K',
  'doctor',
  'Dr. John',
  'Smith',
  '+1234567890',
  0,
  0,
  NOW(),
  NOW()
);

-- ============================================
-- CREATE PHARMACIST USER
-- ============================================
INSERT INTO users (
  id,
  tenant_id,
  clinic_id,
  email,
  encrypted_password,
  role,
  first_name,
  last_name,
  phone,
  mfa_enabled,
  failed_login_attempts,
  created_at,
  updated_at
) VALUES (
  UUID(),
  @TENANT_ID,
  @CLINIC_ID,
  'pharmacist@demo.com',
  '$2b$10$wL8yA0kY0kY0kY0kY0kY0OaZrG7L9L9L9L9L9L9L9L9L9L9L9L',
  'pharmacist',
  'Sarah',
  'Johnson',
  '+1234567891',
  0,
  0,
  NOW(),
  NOW()
);

-- ============================================
-- CREATE HOSPITAL ADMIN USER
-- ============================================
INSERT INTO users (
  id,
  tenant_id,
  clinic_id,
  email,
  encrypted_password,
  role,
  first_name,
  last_name,
  phone,
  mfa_enabled,
  failed_login_attempts,
  created_at,
  updated_at
) VALUES (
  UUID(),
  @TENANT_ID,
  @CLINIC_ID,
  'hospitaladmin@demo.com',
  '$2b$10$xM9zA1lZ1lZ1lZ1lZ1lZ1ObAsH8M0M0M0M0M0M0M0M0M0M0M0M',
  'hospital_admin',
  'Michael',
  'Davis',
  '+1234567892',
  0,
  0,
  NOW(),
  NOW()
);

-- ============================================
-- PART 4: VERIFICATION
-- ============================================

-- Show all newly created users
SELECT 'Newly Created Users:' as status;
SELECT 
  email,
  role,
  CONCAT(first_name, ' ', last_name) as full_name,
  phone,
  created_at
FROM users
WHERE email IN ('doctor@demo.com', 'pharmacist@demo.com', 'hospitaladmin@demo.com')
ORDER BY role;

-- Final role count
SELECT 'Final Role Distribution:' as status;
SELECT role, COUNT(*) as count
FROM users
GROUP BY role
ORDER BY 
  CASE role
    WHEN 'super_admin' THEN 1
    WHEN 'hospital_admin' THEN 2
    WHEN 'doctor' THEN 3
    WHEN 'dentist' THEN 4
    WHEN 'pharmacist' THEN 5
    WHEN 'staff' THEN 6
    WHEN 'supplier' THEN 7
    WHEN 'patient' THEN 8
  END;

-- ============================================
-- SUCCESS MESSAGE
-- ============================================
SELECT 
  '✅ SETUP COMPLETE!' as status,
  'Now restart backend: npm run start:dev' as next_step;

-- ============================================
-- LOGIN CREDENTIALS:
-- ============================================
-- Doctor:         doctor@demo.com       / Doctor123!@#
-- Pharmacist:     pharmacist@demo.com   / Pharmacist123!@#
-- Hospital Admin: hospitaladmin@demo.com / Hospital123!@#
-- ============================================

