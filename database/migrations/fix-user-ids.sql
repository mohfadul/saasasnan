-- Fix user IDs to be proper UUIDs
USE healthcare_saas;

-- Update dentist user IDs to proper UUIDs
UPDATE users SET id = '550e8400-e29b-41d4-a716-446655440003' WHERE email = 'dentist@demo.com';
UPDATE users SET id = '550e8400-e29b-41d4-a716-446655440004' WHERE email = 'dentist2@demo.com';

-- Update any references (if needed)
UPDATE patients SET created_by = '550e8400-e29b-41d4-a716-446655440003' WHERE created_by = 'user-003';
UPDATE patients SET created_by = '550e8400-e29b-41d4-a716-446655440004' WHERE created_by = 'user-004';

-- Verify
SELECT id, email, CONCAT(first_name, ' ', last_name) as name, role 
FROM users 
WHERE role IN ('dentist', 'doctor', 'provider')
ORDER BY email;

