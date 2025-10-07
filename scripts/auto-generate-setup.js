#!/usr/bin/env node
/**
 * Auto-generate custom setup SQL with database IDs
 * This connects to your database and creates a ready-to-run SQL file
 */

const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcrypt');

const config = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USERNAME || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_DATABASE || 'healthcare_saas',
};

async function generateSetup() {
  console.log('\n🔄 AUTO-GENERATING CUSTOM SETUP SQL...\n');
  console.log('═'.repeat(70));
  
  let connection;
  
  try {
    // Connect to database
    console.log(`\n📡 Connecting to database: ${config.database}@${config.host}...`);
    connection = await mysql.createConnection(config);
    console.log('✅ Connected!\n');
    
    // Get tenant ID
    const [tenants] = await connection.execute(
      'SELECT id, name FROM tenants ORDER BY created_at ASC LIMIT 1'
    );
    
    if (tenants.length === 0) {
      throw new Error('No tenants found! Please create a tenant first.');
    }
    
    const tenant = tenants[0];
    console.log(`✅ Found tenant: ${tenant.name}`);
    console.log(`   ID: ${tenant.id}\n`);
    
    // Get clinic ID
    const [clinics] = await connection.execute(
      'SELECT id, name FROM clinics WHERE tenant_id = ? ORDER BY created_at ASC LIMIT 1',
      [tenant.id]
    );
    
    if (clinics.length === 0) {
      throw new Error('No clinics found! Please create a clinic first.');
    }
    
    const clinic = clinics[0];
    console.log(`✅ Found clinic: ${clinic.name}`);
    console.log(`   ID: ${clinic.id}\n`);
    
    // Generate password hashes
    console.log('🔐 Generating password hashes...\n');
    const doctorHash = await bcrypt.hash('Doctor123!@#', 10);
    const pharmacistHash = await bcrypt.hash('Pharmacist123!@#', 10);
    const hospitalAdminHash = await bcrypt.hash('Hospital123!@#', 10);
    console.log('✅ Passwords hashed!\n');
    
    // Generate SQL
    const sql = `-- ============================================
-- CUSTOM SETUP SQL - AUTO-GENERATED
-- Generated: ${new Date().toISOString()}
-- Database: ${config.database}
-- Tenant: ${tenant.name} (${tenant.id})
-- Clinic: ${clinic.name} (${clinic.id})
-- ============================================

-- ============================================
-- PART 1: UPDATE USER ROLES ENUM
-- ============================================

UPDATE users 
SET role = 'hospital_admin' 
WHERE role = 'clinic_admin';

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
-- PART 2: CREATE TEST USERS
-- ============================================

-- DOCTOR
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
  '${tenant.id}',
  '${clinic.id}',
  'doctor@demo.com',
  '${doctorHash}',
  'doctor',
  'Dr. John',
  'Smith',
  '+1234567890',
  0,
  0,
  NOW(),
  NOW()
);

-- PHARMACIST
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
  '${tenant.id}',
  '${clinic.id}',
  'pharmacist@demo.com',
  '${pharmacistHash}',
  'pharmacist',
  'Sarah',
  'Johnson',
  '+1234567891',
  0,
  0,
  NOW(),
  NOW()
);

-- HOSPITAL ADMIN
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
  '${tenant.id}',
  '${clinic.id}',
  'hospitaladmin@demo.com',
  '${hospitalAdminHash}',
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
-- VERIFICATION
-- ============================================

SELECT 'Setup Complete!' as status;

SELECT 
  email,
  role,
  CONCAT(first_name, ' ', last_name) as full_name,
  created_at
FROM users
WHERE email IN ('doctor@demo.com', 'pharmacist@demo.com', 'hospitaladmin@demo.com')
ORDER BY role;

SELECT role, COUNT(*) as count
FROM users
GROUP BY role
ORDER BY count DESC;

-- ============================================
-- LOGIN CREDENTIALS:
-- ============================================
-- Doctor:         doctor@demo.com       / Doctor123!@#
-- Pharmacist:     pharmacist@demo.com   / Pharmacist123!@#
-- Hospital Admin: hospitaladmin@demo.com / Hospital123!@#
-- ============================================
`;
    
    // Write to file
    const outputPath = path.join(__dirname, '..', 'database', 'migrations', 'CUSTOM-SETUP-READY.sql');
    fs.writeFileSync(outputPath, sql);
    
    console.log('═'.repeat(70));
    console.log('\n✅ CUSTOM SETUP SQL GENERATED!\n');
    console.log(`📄 File: database/migrations/CUSTOM-SETUP-READY.sql\n`);
    console.log('📋 NEXT STEPS:\n');
    console.log('1. Open phpMyAdmin');
    console.log('2. Select your database');
    console.log('3. Go to SQL tab');
    console.log('4. Copy contents of CUSTOM-SETUP-READY.sql');
    console.log('5. Paste and click "Go"');
    console.log('6. Restart backend: npm run start:dev\n');
    console.log('═'.repeat(70));
    
  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.error('\n💡 TIP: Check your database connection settings in .env file\n');
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

generateSetup();

