-- Healthcare SaaS - Create Test Users
-- Run this in phpMyAdmin SQL tab: http://localhost/phpmyadmin

USE healthcare_saas;

-- Create Demo Tenant
INSERT INTO tenants (id, name, subdomain, status) 
VALUES ('demo-tenant-001', 'Demo Healthcare Center', 'demo', 'active')
ON DUPLICATE KEY UPDATE name=name;

-- Create Demo Clinic
INSERT INTO clinics (id, tenant_id, name) 
VALUES ('demo-clinic-001', 'demo-tenant-001', 'Main Dental Clinic')
ON DUPLICATE KEY UPDATE name=name;

-- Create Users
-- Password for ALL users: Admin123!

-- 1. Super Admin
INSERT INTO users (id, tenant_id, clinic_id, email, encrypted_password, first_name, last_name, role, phone) 
VALUES ('user-001', 'demo-tenant-001', 'demo-clinic-001', 'admin@demo.com', '$2b$10$rBV2ifCh0Wg3N.kLm4r5eO1kD5p3ZGBxKwZxf5o8Y5kQlZJ7qj8y2', 'Super', 'Admin', 'super_admin', '+1-555-0101')
ON DUPLICATE KEY UPDATE email=email;

-- 2. Clinic Admin
INSERT INTO users (id, tenant_id, clinic_id, email, encrypted_password, first_name, last_name, role, phone) 
VALUES ('user-002', 'demo-tenant-001', 'demo-clinic-001', 'clinicadmin@demo.com', '$2b$10$rBV2ifCh0Wg3N.kLm4r5eO1kD5p3ZGBxKwZxf5o8Y5kQlZJ7qj8y2', 'Clinic', 'Admin', 'clinic_admin', '+1-555-0102')
ON DUPLICATE KEY UPDATE email=email;

-- 3. Dentist #1
INSERT INTO users (id, tenant_id, clinic_id, email, encrypted_password, first_name, last_name, role, phone) 
VALUES ('user-003', 'demo-tenant-001', 'demo-clinic-001', 'dentist@demo.com', '$2b$10$rBV2ifCh0Wg3N.kLm4r5eO1kD5p3ZGBxKwZxf5o8Y5kQlZJ7qj8y2', 'Dr. Sarah', 'Johnson', 'dentist', '+1-555-0103')
ON DUPLICATE KEY UPDATE email=email;

-- 4. Dentist #2
INSERT INTO users (id, tenant_id, clinic_id, email, encrypted_password, first_name, last_name, role, phone) 
VALUES ('user-004', 'demo-tenant-001', 'demo-clinic-001', 'dentist2@demo.com', '$2b$10$rBV2ifCh0Wg3N.kLm4r5eO1kD5p3ZGBxKwZxf5o8Y5kQlZJ7qj8y2', 'Dr. Michael', 'Chen', 'dentist', '+1-555-0104')
ON DUPLICATE KEY UPDATE email=email;

-- 5. Receptionist
INSERT INTO users (id, tenant_id, clinic_id, email, encrypted_password, first_name, last_name, role, phone) 
VALUES ('user-005', 'demo-tenant-001', 'demo-clinic-001', 'receptionist@demo.com', '$2b$10$rBV2ifCh0Wg3N.kLm4r5eO1kD5p3ZGBxKwZxf5o8Y5kQlZJ7qj8y2', 'Jessica', 'Williams', 'staff', '+1-555-0105')
ON DUPLICATE KEY UPDATE email=email;

-- 6. Nurse
INSERT INTO users (id, tenant_id, clinic_id, email, encrypted_password, first_name, last_name, role, phone) 
VALUES ('user-006', 'demo-tenant-001', 'demo-clinic-001', 'nurse@demo.com', '$2b$10$rBV2ifCh0Wg3N.kLm4r5eO1kD5p3ZGBxKwZxf5o8Y5kQlZJ7qj8y2', 'Emily', 'Rodriguez', 'staff', '+1-555-0106')
ON DUPLICATE KEY UPDATE email=email;

-- 7. Billing Staff
INSERT INTO users (id, tenant_id, clinic_id, email, encrypted_password, first_name, last_name, role, phone) 
VALUES ('user-007', 'demo-tenant-001', 'demo-clinic-001', 'billing@demo.com', '$2b$10$rBV2ifCh0Wg3N.kLm4r5eO1kD5p3ZGBxKwZxf5o8Y5kQlZJ7qj8y2', 'Amanda', 'Taylor', 'staff', '+1-555-0107')
ON DUPLICATE KEY UPDATE email=email;

-- Verification
SELECT '✅ Users created successfully!' AS Status;
SELECT CONCAT(first_name, ' ', last_name) AS Name, email AS Email, role AS Role FROM users WHERE tenant_id = 'demo-tenant-001' ORDER BY role, email;

-- Login Info
SELECT '========================================' AS '';
SELECT '  LOGIN CREDENTIALS                    ' AS '';
SELECT '========================================' AS '';
SELECT 'Password for ALL users: Admin123!' AS '';
SELECT '----------------------------------------' AS '';
SELECT 'admin@demo.com          - Super Admin' AS '';
SELECT 'clinicadmin@demo.com    - Clinic Admin' AS '';
SELECT 'dentist@demo.com        - Dentist #1' AS '';
SELECT 'dentist2@demo.com       - Dentist #2' AS '';
SELECT 'receptionist@demo.com   - Receptionist' AS '';
SELECT 'nurse@demo.com          - Nurse' AS '';
SELECT 'billing@demo.com        - Billing Staff' AS '';
SELECT '========================================' AS '';
SELECT 'Login at: http://localhost:3000' AS '';

