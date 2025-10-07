-- ============================================
-- Seed: Create Test Users for New Roles
-- Date: October 7, 2025
-- Purpose: Create test users for DOCTOR and PHARMACIST roles
-- ============================================

-- Prerequisites:
-- 1. Run add-new-user-roles.sql migration first
-- 2. Ensure you have a test tenant/clinic

-- Get your tenant_id and clinic_id from existing data
-- SELECT id, name FROM tenants LIMIT 1;
-- SELECT id, name FROM clinics WHERE tenant_id = '<your-tenant-id>' LIMIT 1;

-- Replace <TENANT_ID> and <CLINIC_ID> with actual UUIDs from your database

-- ============================================
-- 1. DOCTOR Role Test User
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
  '<TENANT_ID>',  -- Replace with your tenant_id
  '<CLINIC_ID>',  -- Replace with your clinic_id
  'doctor@demo.com',
  '$2b$10$9rIwQJK8K8K8K8K8K8K8KOxY8qF6K8K8K8K8K8K8K8K8K8K8K8',  -- Password: Doctor123!@#
  'doctor',
  'Dr. John',
  'Smith',
  '+1234567890',
  false,
  0,
  NOW(),
  NOW()
);

-- ============================================
-- 2. PHARMACIST Role Test User
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
  '<TENANT_ID>',  -- Replace with your tenant_id
  '<CLINIC_ID>',  -- Replace with your clinic_id
  'pharmacist@demo.com',
  '$2b$10$9rIwQJK8K8K8K8K8K8K8KOxY8qF6K8K8K8K8K8K8K8K8K8K8K8',  -- Password: Pharmacist123!@#
  'pharmacist',
  'Sarah',
  'Johnson',
  '+1234567891',
  false,
  0,
  NOW(),
  NOW()
);

-- ============================================
-- 3. Additional HOSPITAL_ADMIN (renamed from CLINIC_ADMIN)
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
  '<TENANT_ID>',  -- Replace with your tenant_id
  '<CLINIC_ID>',  -- Replace with your clinic_id
  'hospitaladmin@demo.com',
  '$2b$10$9rIwQJK8K8K8K8K8K8K8KOxY8qF6K8K8K8K8K8K8K8K8K8K8K8',  -- Password: Hospital123!@#
  'hospital_admin',
  'Michael',
  'Davis',
  '+1234567892',
  false,
  0,
  NOW(),
  NOW()
);

-- ============================================
-- Verification
-- ============================================
-- View all test users
SELECT 
  email,
  role,
  first_name,
  last_name,
  created_at
FROM users
WHERE email IN ('doctor@demo.com', 'pharmacist@demo.com', 'hospitaladmin@demo.com')
ORDER BY role;

-- Count users by role
SELECT role, COUNT(*) as count
FROM users
GROUP BY role
ORDER BY count DESC;

-- ============================================
-- Login Credentials:
-- ============================================
-- Doctor:       doctor@demo.com       / Doctor123!@#
-- Pharmacist:   pharmacist@demo.com   / Pharmacist123!@#
-- Hospital Admin: hospitaladmin@demo.com / Hospital123!@#
-- ============================================

-- NOTE: The encrypted_password above is a placeholder.
-- You'll need to generate proper bcrypt hashes for actual passwords.
-- Run this Node.js script to generate proper hashes:
/*
const bcrypt = require('bcrypt');
async function generateHash() {
  const hash1 = await bcrypt.hash('Doctor123!@#', 10);
  const hash2 = await bcrypt.hash('Pharmacist123!@#', 10);
  const hash3 = await bcrypt.hash('Hospital123!@#', 10);
  console.log('Doctor:', hash1);
  console.log('Pharmacist:', hash2);
  console.log('Hospital Admin:', hash3);
}
generateHash();
*/

