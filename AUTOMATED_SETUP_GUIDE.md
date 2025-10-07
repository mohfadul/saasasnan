# 🚀 Automated Setup Guide - Run This Now!

**Status**: Ready to execute  
**Estimated Time**: 2 minutes  

---

## ⚡ QUICK START (3 Simple Steps)

### **Step 1: Open phpMyAdmin**
```
URL: http://localhost/phpmyadmin
Select your database (e.g., healthcare_saas)
Click "SQL" tab
```

### **Step 2: Run the Complete Setup**
1. Open file: `database/migrations/COMPLETE-SETUP-RUN-THIS.sql`
2. **IMPORTANT**: Before running, you need to:
   - First run PARTS 1 & 2 to see your tenant_id and clinic_id
   - Copy those IDs
   - Replace `@TENANT_ID` and `@CLINIC_ID` in PART 3
   - Then run the entire file again

**OR use this easier approach:**

#### **Option A: Two-Step Execution (Recommended)**

**First Execution** - Get your IDs:
```sql
-- Copy and run just this part:
SELECT id as tenant_id, name FROM tenants ORDER BY created_at ASC LIMIT 1;
SELECT id as clinic_id, name FROM clinics ORDER BY created_at ASC LIMIT 1;
```

You'll get something like:
```
tenant_id: 550e8400-e29b-41d4-a716-446655440000
clinic_id: 660e8400-e29b-41d4-a716-446655440000
```

**Second Execution** - Run complete setup:
```sql
-- 1. Copy the COMPLETE-SETUP-RUN-THIS.sql file
-- 2. Find these lines:
SET @TENANT_ID = 'YOUR_TENANT_ID_HERE';
SET @CLINIC_ID = 'YOUR_CLINIC_ID_HERE';

-- 3. Replace with YOUR actual IDs:
SET @TENANT_ID = '550e8400-e29b-41d4-a716-446655440000';
SET @CLINIC_ID = '660e8400-e29b-41d4-a716-446655440000';

-- 4. Run the entire modified SQL
```

#### **Option B: Generate Custom Script (Automatic)**

Run this command to create a custom SQL with your IDs:

```bash
node scripts/auto-generate-setup.js
```

This will:
- Connect to your database
- Get tenant_id and clinic_id automatically
- Generate `database/migrations/CUSTOM-SETUP-READY.sql`
- You just run that file in phpMyAdmin!

### **Step 3: Restart Backend**
```bash
# In your backend terminal (Ctrl+C to stop current)
cd backend
npm run start:dev
```

---

## ✅ VERIFICATION

After restart, test login:

1. Open: `http://localhost:3000/login`
2. Try these accounts:

| Role | Email | Password |
|------|-------|----------|
| Doctor | doctor@demo.com | Doctor123!@# |
| Pharmacist | pharmacist@demo.com | Pharmacist123!@# |
| Hospital Admin | hospitaladmin@demo.com | Hospital123!@# |

---

## 🔍 TROUBLESHOOTING

### ❌ "Duplicate entry" error
**Solution**: Users already exist. Run this to check:
```sql
SELECT email, role FROM users 
WHERE email IN ('doctor@demo.com', 'pharmacist@demo.com', 'hospitaladmin@demo.com');
```

If they exist, you can either:
- Use existing accounts
- Delete and recreate: `DELETE FROM users WHERE email IN ('doctor@demo.com', 'pharmacist@demo.com', 'hospitaladmin@demo.com');`

### ❌ "Unknown column 'role' type 'doctor'"
**Solution**: Migration didn't run. Run PART 1 of the SQL file.

### ❌ Login fails / Invalid credentials
**Solution**: Passwords not hashed correctly. Run:
```bash
node scripts/update-test-passwords.js
```

---

## 📝 WHAT THIS SETUP DOES

1. ✅ Updates database enum (adds doctor, pharmacist roles)
2. ✅ Renames clinic_admin → hospital_admin
3. ✅ Creates 3 test users with proper bcrypt passwords
4. ✅ Verifies setup with role count

**Total SQL execution time**: ~500ms  
**Backend restart time**: ~10 seconds  

---

## 🎯 AFTER SETUP IS COMPLETE

You'll be ready for:
- ✅ **Phase 2**: Implement role-based guards (security)
- ✅ **Phase 3**: Create custom dashboards per role
- ✅ **Phase 4**: Add route protection
- ✅ **Phase 5**: Build patient portal

---

**Need help?** Check the error messages above or ask for assistance! 🚀

