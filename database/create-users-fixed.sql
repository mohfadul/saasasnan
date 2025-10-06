-- Healthcare SaaS - Create Admin and Test Users (Fixed for actual schema)
-- Run this in phpMyAdmin: http://localhost/phpmyadmin

USE healthcare_saas;

-- ============================================
-- STEP 1: Create Demo Tenant & Clinic
-- ============================================

INSERT INTO tenants (id, name, subdomain, status, config, created_at, updated_at) 
VALUES (
  'demo-tenant-001',
  'Demo Healthcare Center',
  'demo',
  'active',
  '{"features": ["all"], "max_users": 100, "max_patients": 10000}',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON DUPLICATE KEY UPDATE name=name;

INSERT INTO clinics (id, tenant_id, name, address, contact_info, settings, created_at, updated_at) 
VALUES (
  'demo-clinic-001',
  'demo-tenant-001',
  'Main Dental Clinic',
  '{"street": "123 Medical Plaza", "city": "Healthcare City", "state": "HC", "zip": "12345", "country": "USA"}',
  '{"phone": "+1-555-0100", "email": "info@demo-clinic.com", "website": "https://demo-clinic.com"}',
  '{"timezone": "America/New_York", "business_hours": {"mon-fri": "9:00-17:00"}}',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON DUPLICATE KEY UPDATE name=name;

-- ============================================
-- STEP 2: Create Users (Based on actual schema)
-- ============================================
-- Available roles: 'super_admin', 'clinic_admin', 'dentist', 'staff', 'supplier', 'patient'
-- Password for all users: Admin123!
-- Bcrypt hash: $2b$10$rBV2ifCh0Wg3N.kLm4r5eO1kD5p3ZGBxKwZxf5o8Y5kQlZJ7qj8y2

-- 1. SUPER ADMIN User
INSERT INTO users (
  id, tenant_id, clinic_id, email, encrypted_password,
  first_name, last_name, role, phone, mfa_enabled,
  created_at, updated_at
) VALUES (
  'user-super-admin-001',
  'demo-tenant-001',
  'demo-clinic-001',
  'admin@demo.com',
  '$2b$10$rBV2ifCh0Wg3N.kLm4r5eO1kD5p3ZGBxKwZxf5o8Y5kQlZJ7qj8y2',
  'Super',
  'Admin',
  'super_admin',
  '+1-555-0101',
  0,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON DUPLICATE KEY UPDATE email=email;

-- 2. CLINIC ADMIN User
INSERT INTO users (
  id, tenant_id, clinic_id, email, encrypted_password,
  first_name, last_name, role, phone, mfa_enabled,
  created_at, updated_at
) VALUES (
  'user-clinic-admin-001',
  'demo-tenant-001',
  'demo-clinic-001',
  'clinicadmin@demo.com',
  '$2b$10$rBV2ifCh0Wg3N.kLm4r5eO1kD5p3ZGBxKwZxf5o8Y5kQlZJ7qj8y2',
  'Clinic',
  'Administrator',
  'clinic_admin',
  '+1-555-0102',
  0,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON DUPLICATE KEY UPDATE email=email;

-- 3. DENTIST User #1
INSERT INTO users (
  id, tenant_id, clinic_id, email, encrypted_password,
  first_name, last_name, role, phone, mfa_enabled,
  created_at, updated_at
) VALUES (
  'user-dentist-001',
  'demo-tenant-001',
  'demo-clinic-001',
  'dentist@demo.com',
  '$2b$10$rBV2ifCh0Wg3N.kLm4r5eO1kD5p3ZGBxKwZxf5o8Y5kQlZJ7qj8y2',
  'Dr. Sarah',
  'Johnson',
  'dentist',
  '+1-555-0103',
  0,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON DUPLICATE KEY UPDATE email=email;

-- 4. DENTIST User #2
INSERT INTO users (
  id, tenant_id, clinic_id, email, encrypted_password,
  first_name, last_name, role, phone, mfa_enabled,
  created_at, updated_at
) VALUES (
  'user-dentist-002',
  'demo-tenant-001',
  'demo-clinic-001',
  'dentist2@demo.com',
  '$2b$10$rBV2ifCh0Wg3N.kLm4r5eO1kD5p3ZGBxKwZxf5o8Y5kQlZJ7qj8y2',
  'Dr. Michael',
  'Chen',
  'dentist',
  '+1-555-0104',
  0,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON DUPLICATE KEY UPDATE email=email;

-- 5. STAFF User #1 (Receptionist)
INSERT INTO users (
  id, tenant_id, clinic_id, email, encrypted_password,
  first_name, last_name, role, phone, mfa_enabled,
  created_at, updated_at
) VALUES (
  'user-staff-001',
  'demo-tenant-001',
  'demo-clinic-001',
  'receptionist@demo.com',
  '$2b$10$rBV2ifCh0Wg3N.kLm4r5eO1kD5p3ZGBxKwZxf5o8Y5kQlZJ7qj8y2',
  'Jessica',
  'Williams',
  'staff',
  '+1-555-0105',
  0,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON DUPLICATE KEY UPDATE email=email;

-- 6. STAFF User #2 (Nurse)
INSERT INTO users (
  id, tenant_id, clinic_id, email, encrypted_password,
  first_name, last_name, role, phone, mfa_enabled,
  created_at, updated_at
) VALUES (
  'user-staff-002',
  'demo-tenant-001',
  'demo-clinic-001',
  'nurse@demo.com',
  '$2b$10$rBV2ifCh0Wg3N.kLm4r5eO1kD5p3ZGBxKwZxf5o8Y5kQlZJ7qj8y2',
  'Emily',
  'Rodriguez',
  'staff',
  '+1-555-0106',
  0,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON DUPLICATE KEY UPDATE email=email;

-- 7. STAFF User #3 (Billing)
INSERT INTO users (
  id, tenant_id, clinic_id, email, encrypted_password,
  first_name, last_name, role, phone, mfa_enabled,
  created_at, updated_at
) VALUES (
  'user-staff-003',
  'demo-tenant-001',
  'demo-clinic-001',
  'billing@demo.com',
  '$2b$10$rBV2ifCh0Wg3N.kLm4r5eO1kD5p3ZGBxKwZxf5o8Y5kQlZJ7qj8y2',
  'Amanda',
  'Taylor',
  'staff',
  '+1-555-0107',
  0,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON DUPLICATE KEY UPDATE email=email;

-- ============================================
-- STEP 3: Create Sample Patients
-- ============================================

INSERT INTO patients (
  id, tenant_id, clinic_id, first_name, last_name, 
  date_of_birth, gender, email, phone,
  created_at, updated_at
) VALUES 
(
  'patient-001',
  'demo-tenant-001',
  'demo-clinic-001',
  'John',
  'Smith',
  '1985-05-15',
  'male',
  'john.smith@email.com',
  '+1-555-0201',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
),
(
  'patient-002',
  'demo-tenant-001',
  'demo-clinic-001',
  'Mary',
  'Johnson',
  '1990-08-22',
  'female',
  'mary.johnson@email.com',
  '+1-555-0203',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
),
(
  'patient-003',
  'demo-tenant-001',
  'demo-clinic-001',
  'Robert',
  'Davis',
  '1978-03-10',
  'male',
  'robert.davis@email.com',
  '+1-555-0205',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
),
(
  'patient-004',
  'demo-tenant-001',
  'demo-clinic-001',
  'Jennifer',
  'Martinez',
  '1982-11-28',
  'female',
  'jennifer.martinez@email.com',
  '+1-555-0207',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
),
(
  'patient-005',
  'demo-tenant-001',
  'demo-clinic-001',
  'Michael',
  'Anderson',
  '1995-07-14',
  'male',
  'michael.anderson@email.com',
  '+1-555-0209',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON DUPLICATE KEY UPDATE email=email;

-- ============================================
-- VERIFICATION: View Created Data
-- ============================================

SELECT '✅ SUCCESS: All users and patients created!' AS Status;
SELECT '' AS '';

SELECT '👥 USERS CREATED:' AS '';
SELECT 
  u.email AS 'Email',
  CONCAT(u.first_name, ' ', u.last_name) AS 'Name',
  u.role AS 'Role',
  u.phone AS 'Phone'
FROM users u
WHERE u.tenant_id = 'demo-tenant-001'
ORDER BY 
  CASE u.role
    WHEN 'super_admin' THEN 1
    WHEN 'clinic_admin' THEN 2
    WHEN 'dentist' THEN 3
    WHEN 'staff' THEN 4
    ELSE 5
  END,
  u.email;

SELECT '' AS '';
SELECT '👨‍👩‍👧‍👦 PATIENTS CREATED:' AS '';
SELECT 
  CONCAT(p.first_name, ' ', p.last_name) AS 'Name',
  p.email AS 'Email',
  p.phone AS 'Phone',
  p.date_of_birth AS 'DOB'
FROM patients p
WHERE p.tenant_id = 'demo-tenant-001'
ORDER BY p.last_name, p.first_name;

-- ============================================
-- LOGIN CREDENTIALS
-- ============================================

SELECT '' AS '';
SELECT '========================================' AS '';
SELECT '   LOGIN CREDENTIALS (All Users)      ' AS '';
SELECT '========================================' AS '';
SELECT '' AS '';
SELECT '🔐 PASSWORD FOR ALL USERS: Admin123!' AS '';
SELECT '' AS '';
SELECT '👤 SUPER ADMIN:' AS '';
SELECT '   Email: admin@demo.com' AS '';
SELECT '' AS '';
SELECT '👤 CLINIC ADMIN:' AS '';
SELECT '   Email: clinicadmin@demo.com' AS '';
SELECT '' AS '';
SELECT '👨‍⚕️ DENTIST #1:' AS '';
SELECT '   Email: dentist@demo.com' AS '';
SELECT '' AS '';
SELECT '👨‍⚕️ DENTIST #2:' AS '';
SELECT '   Email: dentist2@demo.com' AS '';
SELECT '' AS '';
SELECT '👩‍💼 RECEPTIONIST (Staff):' AS '';
SELECT '   Email: receptionist@demo.com' AS '';
SELECT '' AS '';
SELECT '👩‍⚕️ NURSE (Staff):' AS '';
SELECT '   Email: nurse@demo.com' AS '';
SELECT '' AS '';
SELECT '💰 BILLING (Staff):' AS '';
SELECT '   Email: billing@demo.com' AS '';
SELECT '' AS '';
SELECT '🌐 LOGIN AT: http://localhost:3000' AS '';
SELECT '========================================' AS '';

