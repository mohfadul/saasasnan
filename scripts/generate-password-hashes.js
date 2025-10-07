#!/usr/bin/env node
/**
 * Generate bcrypt password hashes for new user roles
 * Run: node scripts/generate-password-hashes.js
 */

const bcrypt = require('bcrypt');

const users = [
  { role: 'Doctor', email: 'doctor@demo.com', password: 'Doctor123!@#' },
  { role: 'Pharmacist', email: 'pharmacist@demo.com', password: 'Pharmacist123!@#' },
  { role: 'Hospital Admin', email: 'hospitaladmin@demo.com', password: 'Hospital123!@#' },
];

async function generateHashes() {
  console.log('\n🔐 GENERATING PASSWORD HASHES FOR NEW ROLES\n');
  console.log('═'.repeat(70));
  
  for (const user of users) {
    const hash = await bcrypt.hash(user.password, 10);
    console.log(`\n${user.role}:`);
    console.log(`  Email:    ${user.email}`);
    console.log(`  Password: ${user.password}`);
    console.log(`  Hash:     ${hash}`);
  }
  
  console.log('\n' + '═'.repeat(70));
  console.log('\n📋 SQL UPDATE STATEMENTS:\n');
  
  for (const user of users) {
    const hash = await bcrypt.hash(user.password, 10);
    const roleValue = user.role.toLowerCase().replace(/ /g, '_');
    console.log(`-- ${user.role}`);
    console.log(`UPDATE users SET encrypted_password = '${hash}' WHERE email = '${user.email}' AND role = '${roleValue}';\n`);
  }
  
  console.log('✅ Copy the UPDATE statements above into phpMyAdmin\n');
}

generateHashes().catch(console.error);

