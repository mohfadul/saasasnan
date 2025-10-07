-- Fix user passwords with correct bcrypt hash
-- Password for all users: Admin123!

USE healthcare_saas;

UPDATE users 
SET encrypted_password = '$2b$10$pKXMuTBDEjDZdf1JDcmZ9.b8TOUIyJmt55WZl3JdgprW4ax.qgPSO'
WHERE tenant_id = 'demo-tenant-001';

-- Verify update
SELECT 
  email, 
  role, 
  LENGTH(encrypted_password) as pwd_length,
  SUBSTRING(encrypted_password, 1, 10) as pwd_start
FROM users 
WHERE tenant_id = 'demo-tenant-001';

SELECT '✅ Passwords updated! All users can now login with: Admin123!' AS Status;

