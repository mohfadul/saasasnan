# 🧪 Quick Security Testing Guide

**Purpose**: Test the new role-based security and data filtering  
**Time Required**: 15-30 minutes  
**Prerequisites**: Backend + Frontend running ✅

---

## 🗄️ STEP 1: Run Database Migration (CRITICAL!)

**Before testing, you MUST run this migration:**

1. Open **phpMyAdmin** (http://localhost/phpmyadmin)
2. Select your database (e.g., `nilecare` or `healthcare_saas`)
3. Click **SQL** tab
4. Copy contents from: `database/migrations/add-user-id-to-patients.sql`
5. Paste and click **Go**
6. Verify: Should see "1 row affected" or similar

**Why**: This adds `user_id` column to `patients` table, enabling patient data filtering

---

## 👥 STEP 2: Verify Test Users Exist

Check if these users exist in your database:

```sql
SELECT email, role FROM users WHERE email IN (
  'admin@demo.com',
  'doctor@demo.com', 
  'patient@demo.com',
  'pharmacist@demo.com'
);
```

**If missing**, run the SQL from previous setup documents to create them.

---

## 🧪 STEP 3: Test Security by Role

### **Test 1: Admin Access** (Should see ALL data)

1. Open http://localhost:3000
2. Login: `admin@demo.com` / `Admin123!`
3. Navigate to:
   - **Patients** → Should see ALL patients ✅
   - **Appointments** → Should see ALL appointments ✅
   - **Billing** → Should see ALL invoices ✅
   - **Analytics** → Should have full access ✅

**Expected**: Admin sees everything

---

### **Test 2: Doctor Access** (Should see only OWN data)

1. Logout, login: `doctor@demo.com` / `Doctor123!`
2. Navigate to:
   - **Patients** → Should see ALL patients (doctors can see all)
   - **Appointments** → Should see ONLY appointments WHERE provider_id = doctor.id ✅
   - **Clinical Notes** → Should see ONLY notes created by this doctor ✅
   - **Billing** → Should NOT have access ❌

**Expected**: Doctor sees only their own appointments and notes

---

### **Test 3: Patient Access** (Should see ONLY OWN data)

1. Logout, login: `patient@demo.com` / `Patient123!`
2. Navigate to:
   - **Patients** → Should see ONLY their own patient record ✅
   - **Appointments** → Should see ONLY their own appointments ✅
   - **Billing** → Should see ONLY their own invoices ✅
   - **Clinical Notes** → Should see ONLY their own notes ✅
   - **Pharmacy** → Should NOT have access to inventory ❌

**Expected**: Patient sees ONLY their own data

**NOTE**: For this to work, the patient user must be linked to a patient record via `user_id`

---

### **Test 4: Pharmacist Access** (Should access pharmacy only)

1. Logout, login: `pharmacist@demo.com` / `Pharmacist123!`
2. Navigate to:
   - **Pharmacy** → Should have FULL access ✅
   - **Prescriptions** → Should see ALL prescriptions ✅
   - **Inventory** → Should have FULL access ✅
   - **Patients** → Should NOT have access ❌
   - **Clinical Notes** → Should NOT have access ❌

**Expected**: Pharmacist has pharmacy-only access

---

## 🔍 STEP 4: Test Unauthorized Access

### **API Testing** (Optional - use Postman/curl)

**Test 403 Forbidden Errors**:

```bash
# Get JWT token by logging in as patient
POST http://localhost:3001/auth/login
Body: { "email": "patient@demo.com", "password": "Patient123!" }

# Try to access all patients (should work with filtering)
GET http://localhost:3001/patients
Headers: { "Authorization": "Bearer {patient_token}" }
Expected: Returns ONLY patient's own record ✅

# Try to access another patient's record (should fail)
GET http://localhost:3001/patients/{other_patient_id}
Headers: { "Authorization": "Bearer {patient_token}" }
Expected: 403 Forbidden ❌

# Try to delete a patient (should fail - admin only)
DELETE http://localhost:3001/patients/{any_id}
Headers: { "Authorization": "Bearer {patient_token}" }
Expected: 403 Forbidden ❌
```

---

## ✅ EXPECTED RESULTS

### **✅ PASS Criteria**:

1. **Patients see ONLY their own**:
   - Own patient record
   - Own appointments
   - Own invoices
   - Own clinical notes

2. **Providers see ONLY their own**:
   - Own appointments (auto-filtered)
   - Own clinical notes (auto-filtered)
   - All patients (for patient care)

3. **Admin sees everything**:
   - All data accessible
   - All modules available

4. **Unauthorized access blocked**:
   - 403 Forbidden errors for unauthorized endpoints
   - Data filtering prevents seeing others' data

### **❌ FAIL Criteria**:

- Patient sees other patients' data
- Doctor sees another doctor's appointments
- Non-admin can access financial reports
- Any role can delete without permission

---

## 🐛 TROUBLESHOOTING

### **Issue 1: Patient sees all patients**

**Cause**: Database migration not run OR patient.user_id not populated  
**Fix**: 
1. Run `add-user-id-to-patients.sql`
2. Link patient record to user: `UPDATE patients SET user_id = '{user_id}' WHERE id = '{patient_id}';`

### **Issue 2: 403 Forbidden on all requests**

**Cause**: Role not set correctly OR RolesGuard issue  
**Fix**: Check user role in database: `SELECT email, role FROM users;`

### **Issue 3: Doctor sees all appointments**

**Cause**: providerId filter not working  
**Fix**: Verify appointment.provider_id matches user.id

### **Issue 4: Backend won't start**

**Cause**: MySQL not running  
**Fix**: Start MySQL via XAMPP/phpMyAdmin

---

## 📊 QUICK VERIFICATION QUERIES

### **Check User Roles**
```sql
SELECT email, role, tenant_id FROM users ORDER BY role;
```

### **Check Patient-User Links**
```sql
SELECT p.id, p.patient_external_id, p.user_id, u.email 
FROM patients p 
LEFT JOIN users u ON p.user_id = u.id;
```

### **Check Appointment Ownership**
```sql
SELECT 
  a.id,
  a.provider_id,
  u.email as provider_email,
  p.patient_external_id
FROM appointments a
LEFT JOIN users u ON a.provider_id = u.id
LEFT JOIN patients p ON a.patient_id = p.id
LIMIT 10;
```

---

## 🎯 SUCCESS INDICATORS

If everything is working:

✅ Patient login → sees limited nav menu  
✅ Patient can view own appointments  
✅ Patient CANNOT view all patients  
✅ Doctor sees only own appointments (auto-filtered)  
✅ Admin sees everything  
✅ Unauthorized endpoints return 403  

---

## 💡 TIPS

1. **Use browser DevTools** (F12) to see API requests
2. **Check Network tab** for 403 errors
3. **Monitor backend console** for error logs
4. **Test in Incognito** mode to avoid cache issues

---

## 🚀 NEXT AFTER TESTING

Once security is verified:

1. ✅ Commit any bug fixes
2. ✅ Deploy to staging
3. ✅ Run tests in staging
4. ✅ Deploy to production!

---

**Happy Testing!** 🧪

If you encounter issues, check the comprehensive docs:
- `PHASE_2_COMPLETE_SUCCESS.md`
- `PHASE_2_CONTROLLERS_COMPLETE.md`

