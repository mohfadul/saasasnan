# 🔐 Phase 2: Role-Based Security Implementation Plan

**Status**: In Progress  
**Started**: October 7, 2025  
**Est. Completion**: 5-8 hours  

---

## 🎯 OBJECTIVES

1. ✅ Add @Roles decorators to 150+ API endpoints
2. ✅ Implement role-based data filtering in services
3. ✅ Prevent unauthorized access
4. ✅ Create frontend route protection
5. ✅ Test all role-based access controls

---

## 📋 ROLE DEFINITIONS

```typescript
export enum UserRole {
  SUPER_ADMIN = 'super_admin',      // Full system access
  HOSPITAL_ADMIN = 'hospital_admin', // Hospital/clinic management
  DENTIST = 'dentist',               // Dental services
  DOCTOR = 'doctor',                 // Medical services
  PHARMACIST = 'pharmacist',         // Pharmacy management
  STAFF = 'staff',                   // General staff
  SUPPLIER = 'supplier',             // Vendor/supplier
  PATIENT = 'patient',               // Patient/customer
}
```

---

## 🗺️ ROLE ACCESS MATRIX

### **Module 1: Patients** (`/patients`)

| Endpoint | Method | Allowed Roles |
|----------|--------|---------------|
| `/patients` | GET | super_admin, hospital_admin, doctor, dentist, staff |
| `/patients` | POST | super_admin, hospital_admin, staff |
| `/patients/:id` | GET | super_admin, hospital_admin, doctor, dentist, staff, patient (own only) |
| `/patients/:id` | PUT | super_admin, hospital_admin, staff |
| `/patients/:id` | DELETE | super_admin, hospital_admin |
| `/patients/search` | POST | super_admin, hospital_admin, doctor, dentist, staff |
| `/patients/stats` | GET | super_admin, hospital_admin |

### **Module 2: Appointments** (`/appointments`)

| Endpoint | Method | Allowed Roles |
|----------|--------|---------------|
| `/appointments` | GET | super_admin, hospital_admin, doctor, dentist, staff, patient (own) |
| `/appointments` | POST | super_admin, hospital_admin, doctor, dentist, staff, patient |
| `/appointments/:id` | GET | super_admin, hospital_admin, doctor, dentist, staff, patient (own) |
| `/appointments/:id` | PUT | super_admin, hospital_admin, doctor, dentist, staff |
| `/appointments/:id` | DELETE | super_admin, hospital_admin |
| `/appointments/by-date` | GET | super_admin, hospital_admin, doctor, dentist, staff |

### **Module 3: Billing** (`/billing`)

| Endpoint | Method | Allowed Roles |
|----------|--------|---------------|
| `/billing/invoices` | GET | super_admin, hospital_admin, staff |
| `/billing/invoices` | POST | super_admin, hospital_admin, staff |
| `/billing/invoices/:id` | PUT | super_admin, hospital_admin |
| `/billing/payments` | GET | super_admin, hospital_admin, staff |
| `/billing/payments` | POST | super_admin, hospital_admin, staff |
| `/billing/insurance-providers` | GET | super_admin, hospital_admin, staff |

### **Module 4: Pharmacy** (`/pharmacy`)

| Endpoint | Method | Allowed Roles |
|----------|--------|---------------|
| `/pharmacy/dashboard` | GET | super_admin, hospital_admin, pharmacist |
| `/pharmacy/inventory` | GET | super_admin, hospital_admin, pharmacist |
| `/pharmacy/inventory` | POST | super_admin, hospital_admin, pharmacist |
| `/pharmacy/sales` | GET | super_admin, hospital_admin, pharmacist |
| `/pharmacy/sales` | POST | pharmacist |
| `/pharmacy/prescriptions` | GET | super_admin, hospital_admin, doctor, dentist, pharmacist |
| `/pharmacy/prescriptions` | POST | doctor, dentist |

### **Module 5: Hospital** (`/hospital`)

| Endpoint | Method | Allowed Roles |
|----------|--------|---------------|
| `/hospital/dashboard` | GET | super_admin, hospital_admin, doctor |
| `/hospital/departments` | GET | super_admin, hospital_admin, doctor, staff |
| `/hospital/beds` | GET | super_admin, hospital_admin, doctor, staff |
| `/hospital/lab` | GET | super_admin, hospital_admin, doctor |
| `/hospital/blood-bank` | GET | super_admin, hospital_admin, doctor |

### **Module 6: Marketplace** (`/marketplace`)

| Endpoint | Method | Allowed Roles |
|----------|--------|---------------|
| `/marketplace/products` | GET | super_admin, hospital_admin, staff, supplier |
| `/marketplace/products` | POST | super_admin, hospital_admin, supplier |
| `/marketplace/orders` | GET | super_admin, hospital_admin, staff |
| `/marketplace/orders` | POST | super_admin, hospital_admin, staff |
| `/marketplace/suppliers` | GET | super_admin, hospital_admin |

### **Module 7: Clinical** (`/clinical`)

| Endpoint | Method | Allowed Roles |
|----------|--------|---------------|
| `/clinical/notes` | GET | super_admin, hospital_admin, doctor, dentist |
| `/clinical/notes` | POST | doctor, dentist |
| `/clinical/treatment-plans` | GET | super_admin, hospital_admin, doctor, dentist |
| `/clinical/treatment-plans` | POST | doctor, dentist |

### **Module 8: Analytics** (`/analytics`)

| Endpoint | Method | Allowed Roles |
|----------|--------|---------------|
| `/analytics/dashboard` | GET | super_admin, hospital_admin |
| `/analytics/reports` | GET | super_admin, hospital_admin |
| `/analytics/metrics` | GET | super_admin, hospital_admin, doctor, dentist |

### **Module 9: AI** (`/ai`)

| Endpoint | Method | Allowed Roles |
|----------|--------|---------------|
| `/ai/predictions` | GET | super_admin, hospital_admin, doctor, dentist |
| `/ai/insights` | GET | super_admin, hospital_admin |

### **Module 10: Features** (`/features`)

| Endpoint | Method | Allowed Roles |
|----------|--------|---------------|
| `/features/flags` | GET | ALL |
| `/features/flags` | POST | super_admin |
| `/features/ab-tests` | GET | super_admin, hospital_admin |

---

## 🔄 IMPLEMENTATION WORKFLOW

### **Step 1: Add @Roles Decorator to Controllers** ✅

For each controller method:
```typescript
@UseGuards(AuthGuard('jwt'), TenantGuard, RolesGuard)
@Roles('super_admin', 'hospital_admin', 'doctor')
@Get('patients')
async getPatients() {
  // ...
}
```

### **Step 2: Implement Role-Based Data Filtering**

Update services to filter data by role:
```typescript
async findAll(userId: string, role: string, tenantId: string) {
  let query = this.repo.createQueryBuilder('entity')
    .where('entity.tenant_id = :tenantId', { tenantId });

  // Role-based filtering
  if (role === 'patient') {
    query.andWhere('entity.patient_id = :userId', { userId });
  } else if (role === 'doctor' || role === 'dentist') {
    query.andWhere('entity.provider_id = :userId', { userId });
  }
  // hospital_admin and super_admin see all

  return query.getMany();
}
```

### **Step 3: Update Frontend Route Protection**

```typescript
<Route 
  path="/pharmacy" 
  element={
    <ProtectedRoute allowedRoles={['pharmacist', 'hospital_admin', 'super_admin']}>
      <PharmacyPage />
    </ProtectedRoute>
  } 
/>
```

---

## 📊 PROGRESS TRACKER

| Module | Endpoints | @Roles Added | Data Filtering | Status |
|--------|-----------|--------------|----------------|--------|
| Auth | 5 | 0/5 | N/A | Pending |
| Patients | 8 | 0/8 | Pending | Pending |
| Appointments | 12 | 0/12 | Pending | Pending |
| Billing | 20 | 4/20 | Pending | In Progress |
| Pharmacy | 20 | 0/20 | Pending | Pending |
| Hospital | 15 | 0/15 | Pending | Pending |
| Marketplace | 18 | 0/18 | Pending | Pending |
| Clinical | 10 | 0/10 | Pending | Pending |
| Analytics | 10 | 0/10 | Pending | Pending |
| AI | 10 | 0/10 | Pending | Pending |
| Features | 8 | 0/8 | Pending | Pending |
| Inventory | 8 | 0/8 | Pending | Pending |
| Tenants | 7 | 0/7 | Pending | Pending |
| Health | 2 | 0/2 | N/A | Pending |
| **TOTAL** | **153** | **4/153** | **0/11** | **3%** |

---

## 🧪 TESTING STRATEGY

### **Test Cases Per Role**

**Super Admin**:
- ✅ Can access ALL endpoints
- ✅ Can see ALL data

**Hospital Admin**:
- ✅ Can access most endpoints
- ✅ Can see all tenant data
- ❌ Cannot access super_admin-only endpoints

**Doctor/Dentist**:
- ✅ Can access patient records
- ✅ Can create clinical notes
- ✅ Can see assigned patients only
- ❌ Cannot access financial data

**Pharmacist**:
- ✅ Can access pharmacy module
- ✅ Can process prescriptions
- ❌ Cannot access other modules

**Patient**:
- ✅ Can see own data only
- ✅ Can book appointments
- ❌ Cannot see other patients

**Staff**:
- ✅ Limited access to operational endpoints
- ❌ No financial access

---

## 🚨 SECURITY CONSIDERATIONS

1. **Default Deny**: If no @Roles decorator, deny access
2. **Tenant Isolation**: Always filter by tenant_id
3. **Data Ownership**: Users see only their own data (unless admin)
4. **Audit Logging**: Log all access attempts
5. **Error Messages**: Don't reveal system details

---

## ⏱️ TIME ESTIMATES

- Controllers (150+ endpoints): 3-4 hours
- Service filtering (11 services): 2-3 hours
- Frontend routes: 30 minutes
- Testing: 1-2 hours
- **Total**: 5-8 hours

---

**Status**: Starting implementation now...

