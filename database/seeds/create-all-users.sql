-- Healthcare SaaS - Create Admin and Test Users
-- Run this in phpMyAdmin: http://localhost/phpmyadmin
-- Or via MySQL command line

USE healthcare_saas;

-- ============================================
-- STEP 1: Create Demo Tenant & Clinic
-- ============================================

INSERT INTO tenants (id, name, subdomain, status, subscription_tier, config, created_at, updated_at) 
VALUES (
  'demo-tenant-001',
  'Demo Healthcare Center',
  'demo',
  'active',
  'enterprise',
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
-- STEP 2: Create Users (All Roles)
-- ============================================

-- Password for all users: Admin123!
-- Bcrypt hash: $2b$10$rBV2ifCh0Wg3N.kLm4r5eO1kD5p3ZGBxKwZxf5o8Y5kQlZJ7qj8y2

-- 1. ADMIN User
INSERT INTO users (
  id, tenant_id, clinic_id, email, encrypted_password,
  first_name, last_name, role, status, is_active, email_verified,
  phone, created_at, updated_at
) VALUES (
  'user-admin-001',
  'demo-tenant-001',
  'demo-clinic-001',
  'admin@demo.com',
  '$2b$10$rBV2ifCh0Wg3N.kLm4r5eO1kD5p3ZGBxKwZxf5o8Y5kQlZJ7qj8y2',
  'Admin',
  'User',
  'admin',
  'active',
  1,
  1,
  '+1-555-0101',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON DUPLICATE KEY UPDATE email=email;

-- 2. DOCTOR User (Dentist)
INSERT INTO users (
  id, tenant_id, clinic_id, email, encrypted_password,
  first_name, last_name, role, status, is_active, email_verified,
  phone, specialization, license_number, created_at, updated_at
) VALUES (
  'user-doctor-001',
  'demo-tenant-001',
  'demo-clinic-001',
  'doctor@demo.com',
  '$2b$10$rBV2ifCh0Wg3N.kLm4r5eO1kD5p3ZGBxKwZxf5o8Y5kQlZJ7qj8y2',
  'Dr. Sarah',
  'Johnson',
  'doctor',
  'active',
  1,
  1,
  '+1-555-0102',
  'General Dentistry',
  'DDS-123456',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON DUPLICATE KEY UPDATE email=email;

-- 3. DENTIST User (Specialist)
INSERT INTO users (
  id, tenant_id, clinic_id, email, encrypted_password,
  first_name, last_name, role, status, is_active, email_verified,
  phone, specialization, license_number, created_at, updated_at
) VALUES (
  'user-dentist-001',
  'demo-tenant-001',
  'demo-clinic-001',
  'dentist@demo.com',
  '$2b$10$rBV2ifCh0Wg3N.kLm4r5eO1kD5p3ZGBxKwZxf5o8Y5kQlZJ7qj8y2',
  'Dr. Michael',
  'Chen',
  'dentist',
  'active',
  1,
  1,
  '+1-555-0103',
  'Orthodontics',
  'DDS-789012',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON DUPLICATE KEY UPDATE email=email;

-- 4. NURSE User
INSERT INTO users (
  id, tenant_id, clinic_id, email, encrypted_password,
  first_name, last_name, role, status, is_active, email_verified,
  phone, created_at, updated_at
) VALUES (
  'user-nurse-001',
  'demo-tenant-001',
  'demo-clinic-001',
  'nurse@demo.com',
  '$2b$10$rBV2ifCh0Wg3N.kLm4r5eO1kD5p3ZGBxKwZxf5o8Y5kQlZJ7qj8y2',
  'Emily',
  'Rodriguez',
  'nurse',
  'active',
  1,
  1,
  '+1-555-0104',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON DUPLICATE KEY UPDATE email=email;

-- 5. RECEPTIONIST User
INSERT INTO users (
  id, tenant_id, clinic_id, email, encrypted_password,
  first_name, last_name, role, status, is_active, email_verified,
  phone, created_at, updated_at
) VALUES (
  'user-receptionist-001',
  'demo-tenant-001',
  'demo-clinic-001',
  'receptionist@demo.com',
  '$2b$10$rBV2ifCh0Wg3N.kLm4r5eO1kD5p3ZGBxKwZxf5o8Y5kQlZJ7qj8y2',
  'Jessica',
  'Williams',
  'receptionist',
  'active',
  1,
  1,
  '+1-555-0105',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON DUPLICATE KEY UPDATE email=email;

-- 6. STAFF User (General)
INSERT INTO users (
  id, tenant_id, clinic_id, email, encrypted_password,
  first_name, last_name, role, status, is_active, email_verified,
  phone, created_at, updated_at
) VALUES (
  'user-staff-001',
  'demo-tenant-001',
  'demo-clinic-001',
  'staff@demo.com',
  '$2b$10$rBV2ifCh0Wg3N.kLm4r5eO1kD5p3ZGBxKwZxf5o8Y5kQlZJ7qj8y2',
  'David',
  'Miller',
  'staff',
  'active',
  1,
  1,
  '+1-555-0106',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON DUPLICATE KEY UPDATE email=email;

-- 7. BILLING User
INSERT INTO users (
  id, tenant_id, clinic_id, email, encrypted_password,
  first_name, last_name, role, status, is_active, email_verified,
  phone, created_at, updated_at
) VALUES (
  'user-billing-001',
  'demo-tenant-001',
  'demo-clinic-001',
  'billing@demo.com',
  '$2b$10$rBV2ifCh0Wg3N.kLm4r5eO1kD5p3ZGBxKwZxf5o8Y5kQlZJ7qj8y2',
  'Amanda',
  'Taylor',
  'billing',
  'active',
  1,
  1,
  '+1-555-0107',
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
  address, emergency_contact, medical_history,
  status, created_at, updated_at
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
  '{"street": "456 Oak Street", "city": "Healthcare City", "state": "HC", "zip": "12345"}',
  '{"name": "Jane Smith", "relationship": "spouse", "phone": "+1-555-0202"}',
  '{"allergies": ["penicillin"], "conditions": [], "medications": []}',
  'active',
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
  '{"street": "789 Maple Avenue", "city": "Healthcare City", "state": "HC", "zip": "12345"}',
  '{"name": "Robert Johnson", "relationship": "spouse", "phone": "+1-555-0204"}',
  '{"allergies": [], "conditions": ["hypertension"], "medications": ["lisinopril"]}',
  'active',
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
  '{"street": "321 Pine Road", "city": "Healthcare City", "state": "HC", "zip": "12345"}',
  '{"name": "Lisa Davis", "relationship": "spouse", "phone": "+1-555-0206"}',
  '{"allergies": [], "conditions": ["diabetes"], "medications": ["metformin"]}',
  'active',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON DUPLICATE KEY UPDATE email=email;

-- ============================================
-- VERIFICATION: View Created Users
-- ============================================

SELECT 
  '✅ Users Created Successfully!' AS Status;

SELECT 
  u.email AS 'Login Email',
  u.first_name AS 'First Name',
  u.last_name AS 'Last Name',
  u.role AS 'Role',
  u.status AS 'Status',
  'Admin123!' AS 'Password (All Users)'
FROM users u
WHERE u.tenant_id = 'demo-tenant-001'
ORDER BY 
  CASE u.role
    WHEN 'admin' THEN 1
    WHEN 'doctor' THEN 2
    WHEN 'dentist' THEN 3
    WHEN 'nurse' THEN 4
    WHEN 'receptionist' THEN 5
    WHEN 'billing' THEN 6
    ELSE 7
  END;

SELECT 
  CONCAT(p.first_name, ' ', p.last_name) AS 'Patient Name',
  p.email AS 'Email',
  p.phone AS 'Phone',
  p.status AS 'Status'
FROM patients p
WHERE p.tenant_id = 'demo-tenant-001';

-- ============================================
-- SUMMARY
-- ============================================

SELECT '==================================' AS '';
SELECT '  USERS CREATED SUCCESSFULLY!   ' AS '';
SELECT '==================================' AS '';
SELECT '' AS '';
SELECT 'Login to admin panel at: http://localhost:3000' AS '';
SELECT '' AS '';
SELECT '👤 ADMIN USER:' AS '';
SELECT '   Email: admin@demo.com' AS '';
SELECT '   Password: Admin123!' AS '';
SELECT '' AS '';
SELECT '👨‍⚕️ DOCTOR USER:' AS '';
SELECT '   Email: doctor@demo.com' AS '';
SELECT '   Password: Admin123!' AS '';
SELECT '' AS '';
SELECT '👨‍⚕️ DENTIST USER:' AS '';
SELECT '   Email: dentist@demo.com' AS '';
SELECT '   Password: Admin123!' AS '';
SELECT '' AS '';
SELECT '👩‍⚕️ NURSE USER:' AS '';
SELECT '   Email: nurse@demo.com' AS '';
SELECT '   Password: Admin123!' AS '';
SELECT '' AS '';
SELECT '👩‍💼 RECEPTIONIST USER:' AS '';
SELECT '   Email: receptionist@demo.com' AS '';
SELECT '   Password: Admin123!' AS '';
SELECT '' AS '';
SELECT '👤 BILLING USER:' AS '';
SELECT '   Email: billing@demo.com' AS '';
SELECT '   Password: Admin123!' AS '';
SELECT '' AS '';
SELECT '👤 STAFF USER:' AS '';
SELECT '   Email: staff@demo.com' AS '';
SELECT '   Password: Admin123!' AS '';
SELECT '' AS '';
SELECT '🏥 3 Sample patients created' AS '';
SELECT '==================================' AS '';

