# 🚀 QUICK SETUP - 5 Minutes to Complete!

**Status**: Password hashes generated ✅  
**File Ready**: `database/migrations/STEP-BY-STEP-SETUP.sql` ✅  

---

## ⚡ FASTEST WAY (Copy-Paste 3 Times)

### **1. Open phpMyAdmin**
```
http://localhost/phpmyadmin
→ Select database: healthcare_saas
→ Click "SQL" tab
```

### **2. Get Your IDs** (Copy-Paste #1)
```sql
SELECT id as tenant_id, name FROM tenants ORDER BY created_at ASC LIMIT 1;
SELECT id as clinic_id, name FROM clinics ORDER BY created_at ASC LIMIT 1;
```

**Save the results** - Example:
```
tenant_id: 550e8400-e29b-41d4-a716-446655440000
clinic_id: 660e8400-e29b-41d4-a716-446655440000
```

### **3. Update Enum** (Copy-Paste #2)
```sql
UPDATE users SET role = 'hospital_admin' WHERE role = 'clinic_admin';

ALTER TABLE users 
MODIFY COLUMN role ENUM(
  'super_admin', 'hospital_admin', 'dentist', 'doctor', 
  'pharmacist', 'staff', 'supplier', 'patient'
) NOT NULL DEFAULT 'staff';
```

### **4. Create Users** (Copy-Paste #3 - Edit First!)

**IMPORTANT**: Before pasting, replace `YOUR_TENANT_ID` and `YOUR_CLINIC_ID` with your actual IDs!

```sql
-- DOCTOR
INSERT INTO users (
  id, tenant_id, clinic_id, email, encrypted_password, role,
  first_name, last_name, phone, mfa_enabled, failed_login_attempts,
  created_at, updated_at
) VALUES (
  UUID(),
  '550e8400-e29b-41d4-a716-446655440000',  -- ← Your tenant_id here!
  '660e8400-e29b-41d4-a716-446655440000',  -- ← Your clinic_id here!
  'doctor@demo.com',
  '$2b$10$85EtLcqSgy7oZQLInDhSVeFfwNFx5pbv5YPetCxIX3MK86kKouT.a',
  'doctor',
  'Dr. John', 'Smith', '+1234567890', 0, 0, NOW(), NOW()
);

-- PHARMACIST
INSERT INTO users (
  id, tenant_id, clinic_id, email, encrypted_password, role,
  first_name, last_name, phone, mfa_enabled, failed_login_attempts,
  created_at, updated_at
) VALUES (
  UUID(),
  '550e8400-e29b-41d4-a716-446655440000',  -- ← Your tenant_id here!
  '660e8400-e29b-41d4-a716-446655440000',  -- ← Your clinic_id here!
  'pharmacist@demo.com',
  '$2b$10$42g/Y0MrUFejaPro7VvAbeZvkaRFCrCdAbDE2mhb4njGmfi4X35R6',
  'pharmacist',
  'Sarah', 'Johnson', '+1234567891', 0, 0, NOW(), NOW()
);

-- HOSPITAL ADMIN
INSERT INTO users (
  id, tenant_id, clinic_id, email, encrypted_password, role,
  first_name, last_name, phone, mfa_enabled, failed_login_attempts,
  created_at, updated_at
) VALUES (
  UUID(),
  '550e8400-e29b-41d4-a716-446655440000',  -- ← Your tenant_id here!
  '660e8400-e29b-41d4-a716-446655440000',  -- ← Your clinic_id here!
  'hospitaladmin@demo.com',
  '$2b$10$ID3wkD8IdXYdyOEpByO4eemUMOLGuqSPoCSAJ5S1yHBSkBjkUqVSq',
  'hospital_admin',
  'Michael', 'Davis', '+1234567892', 0, 0, NOW(), NOW()
);
```

### **5. Restart Backend**
```bash
# In backend terminal (Ctrl+C to stop)
npm run start:dev
```

### **6. Test Login** ✅
```
URL: http://localhost:3000/login

Try these:
- doctor@demo.com / Doctor123!@#
- pharmacist@demo.com / Pharmacist123!@#
- hospitaladmin@demo.com / Hospital123!@#
```

---

## ✅ DONE! What You've Achieved:

- ✅ Added 2 new roles (DOCTOR, PHARMACIST)
- ✅ Renamed CLINIC_ADMIN → HOSPITAL_ADMIN
- ✅ Created 3 test users with secure passwords
- ✅ System ready for role-based dashboards

---

## 🚀 NEXT: Phase 2 - Role-Based Security

Let me know when you're ready, and I'll implement:
- Role-based guards on all API endpoints
- Data filtering by user role
- Route protection in frontend

**Estimated time**: 5-8 hours of development (automated)

---

**Need help?** Just ask! 🎯

