-- Create First Admin User for Healthcare SaaS
-- Run this in phpMyAdmin: http://localhost/phpmyadmin

USE healthcare_saas;

-- Create demo tenant
INSERT INTO tenants (id, name, subdomain, status, subscription_tier) 
VALUES ('demo-tenant-001', 'Demo Clinic', 'demo', 'active', 'enterprise')
ON DUPLICATE KEY UPDATE name=name;

-- Create demo clinic
INSERT INTO clinics (id, tenant_id, name, address, contact_info) 
VALUES (
  'demo-clinic-001',
  'demo-tenant-001',
  'Demo Healthcare Center',
  '{"street": "123 Medical Ave", "city": "Healthcare City", "state": "HC", "zip": "12345"}',
  '{"phone": "555-0123", "email": "contact@demo-clinic.com"}'
)
ON DUPLICATE KEY UPDATE name=name;

-- Create admin user
-- Email: admin@demo.com
-- Password: Admin123!
INSERT INTO users (
  id,
  tenant_id,
  clinic_id,
  email,
  encrypted_password,
  first_name,
  last_name,
  role,
  status,
  is_active,
  email_verified
) VALUES (
  'demo-admin-001',
  'demo-tenant-001',
  'demo-clinic-001',
  'admin@demo.com',
  '$2b$10$rBV2ifCh0Wg3N.kLm4r5eO1kD5p3ZGBxKwZxf5o8Y5kQlZJ7qj8y2',
  'Admin',
  'User',
  'admin',
  'active',
  true,
  true
)
ON DUPLICATE KEY UPDATE email=email;

-- Verify the user was created
SELECT 
  u.email,
  u.first_name,
  u.last_name,
  u.role,
  t.name as tenant_name,
  c.name as clinic_name
FROM users u
JOIN tenants t ON u.tenant_id = t.id
JOIN clinics c ON u.clinic_id = c.id
WHERE u.email = 'admin@demo.com';

-- Success message
SELECT 'Admin user created successfully!' AS Status,
       'Email: admin@demo.com' AS Login_Email,
       'Password: Admin123!' AS Login_Password;

