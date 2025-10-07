# 🏥 Healthcare SaaS Platform (NileCare) - Complete System Architecture Analysis

**Platform Name**: NileCare (Healthcare SaaS)  
**Date**: October 7, 2025  
**Version**: 2.0  
**Status**: Production Ready with Multi-Role Foundation  

---

## 🎯 Executive Summary

**Current State**: The platform has a **single unified admin dashboard** with role-based access control. All user types (currently) share the same UI but see filtered data based on their role and tenant.

**Target State** (Based on your requirements): Multiple role-specific dashboards (Dentist, Doctor, Hospital Admin, Pharmacist, Customer).

---

## 🏗️ Current Architecture Stack

| Layer | Technology | Current Implementation |
|-------|------------|------------------------|
| **Frontend** | React 18 + TypeScript | ✅ Single admin panel (SPA) |
| **Styling** | Tailwind CSS + ShadCN UI | ✅ Professional UI components |
| **State** | React Query | ✅ Server state management |
| **Routing** | React Router v6 | ✅ Protected routes |
| **Backend** | NestJS + TypeScript | ✅ 15 modules |
| **ORM** | TypeORM | ✅ Entity management |
| **Database** | **MySQL 8.0+** (NOT PostgreSQL) | ✅ 53 tables |
| **Auth** | **JWT + Passport** (NOT Supabase) | ✅ Token-based auth |
| **API** | RESTful + Swagger | ✅ 120+ endpoints |
| **Security** | Helmet + CORS + Encryption | ✅ Enterprise-grade |

**⚠️ Note**: System uses **MySQL + NestJS**, NOT PostgreSQL + Supabase

---

## 👥 Current User Roles

### **Defined in Backend** (`backend/src/auth/entities/user.entity.ts`)

```typescript
export enum UserRole {
  SUPER_ADMIN = 'super_admin',    // Platform administrator
  CLINIC_ADMIN = 'clinic_admin',  // Clinic/Hospital manager
  DENTIST = 'dentist',            // Dental practitioners
  STAFF = 'staff',                // General staff
  SUPPLIER = 'supplier',          // Marketplace suppliers
  PATIENT = 'patient',            // Patients (to be renamed to CUSTOMER)
}
```

### **Gap Analysis** (What needs to be added)

| Required Role | Current Status | Action Needed |
|---------------|----------------|---------------|
| 🦷 Dentist | ✅ EXISTS as `DENTIST` | Ready to use |
| 🩺 Doctor | ⚠️ Use `DENTIST` or add `DOCTOR` | Add new role or rename |
| 🏥 Hospital Admin | ✅ EXISTS as `CLINIC_ADMIN` | Ready to use |
| 💊 Pharmacist | ❌ MISSING | **Add `PHARMACIST` role** |
| 👤 Customer | ✅ EXISTS as `PATIENT` | **Rename to `CUSTOMER`** |

---

## 🔐 Authentication & Authorization Flow

### **Current Implementation**

```
┌─────────────────────────────────────────────────────┐
│          1. USER VISITS APPLICATION                 │
│              http://localhost:3000                  │
└────────────────────┬────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────┐
│     2. CHECK AUTHENTICATION (useAuth hook)          │
│                                                     │
│  - Check localStorage for access_token             │
│  - If found, verify with GET /auth/profile         │
│  - If valid, set user context                      │
│  - If not, redirect to /login                      │
└────────────────────┬────────────────────────────────┘
                     │
        ┌────────────┴────────────┐
        │                         │
        ▼                         ▼
   [AUTHENTICATED]           [NOT AUTHENTICATED]
        │                         │
        │                         ▼
        │                    LOGIN PAGE
        │                         │
        │                    POST /auth/login
        │                    { email, password, tenantId }
        │                         │
        │                         ▼
        │                   JWT Token Generated
        │                    (includes: userId, role, tenantId)
        │                         │
        │                         ▼
        │                   Store in localStorage
        │                    - access_token
        │                    - user object
        │                         │
        └─────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────┐
│    3. RENDER DASHBOARD (ProtectedRoute)             │
│                                                     │
│  Currently: SINGLE admin dashboard for ALL roles    │
│  - DashboardLayout (Sidebar + Header)              │
│  - Route-based views (Patients, Appointments, etc.)│
│  - NO role-specific dashboards yet                 │
└────────────────────┬────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────┐
│    4. DATA FILTERING (Backend)                      │
│                                                     │
│  Every API call includes:                          │
│  - Authorization: Bearer <JWT_TOKEN>               │
│  - X-Tenant-ID header (optional)                   │
│                                                     │
│  Backend Guards:                                    │
│  - @UseGuards(AuthGuard('jwt'), TenantGuard)      │
│  - Extracts: user.id, user.role, user.tenant_id   │
│  - Filters queries by tenant_id automatically      │
└─────────────────────────────────────────────────────┘
```

### **Authentication Files**

```
backend/src/auth/
├── auth.service.ts          # Login, token generation
├── auth.controller.ts       # POST /auth/login, GET /auth/profile
├── jwt.strategy.ts          # JWT validation
├── jwt-auth.guard.ts        # Route protection
└── entities/user.entity.ts  # User model with roles

admin-panel/src/
├── hooks/useAuth.ts         # Auth context & hooks
├── pages/LoginPage.tsx      # Login UI
└── App.tsx                  # ProtectedRoute wrapper
```

---

## 📊 Current Data Flow

### **Login → Dashboard Flow**

```
1. USER ENTERS CREDENTIALS
   ↓
   LoginPage.tsx
   ↓
   const { login } = useAuth()
   ↓
   authApi.login({ email, password, tenantId })

2. BACKEND VALIDATES
   ↓
   POST /auth/login
   ↓
   AuthService.validateUser()
   ↓
   - Check email + password (bcrypt)
   - Check tenant_id
   - Check account not locked
   - Increment failed attempts if wrong
   ↓
   Generate JWT Token
   {
     sub: user.id,
     email: user.email,
     role: user.role,
     tenantId: user.tenant_id,
     clinicId: user.clinic_id
   }

3. FRONTEND STORES TOKEN
   ↓
   localStorage.setItem('access_token', token)
   localStorage.setItem('user', JSON.stringify(user))
   ↓
   Set user in AuthContext
   ↓
   Redirect to "/"

4. DASHBOARD RENDERS
   ↓
   App.tsx checks ProtectedRoute
   ↓
   If authenticated → Render DashboardLayout
   ↓
   DashboardLayout shows:
   - Sidebar (navigation menu)
   - Header (user profile)
   - Main content area (route-based)

5. API CALLS
   ↓
   Every API request includes:
   - Authorization: Bearer <token>
   - X-Tenant-ID: <tenantId>
   ↓
   Backend validates JWT
   ↓
   Extract user.tenant_id from token
   ↓
   Filter all queries:
   WHERE tenant_id = :tenantId
```

---

## 🎨 Current Dashboard Structure

### **⚠️ CURRENT: Single Dashboard for All Roles**

```
admin-panel/src/
└── pages/
    ├── DashboardPage.tsx       # Homepage dashboard (shared by all)
    ├── PatientsPage.tsx        # Patient list
    ├── AppointmentsPage.tsx    # Appointments
    ├── BillingPage.tsx         # Billing & invoices
    ├── PharmacyPage.tsx        # Pharmacy management
    ├── MarketplacePage.tsx     # Dental supplies
    ├── ClinicalNotesPage.tsx   # Clinical documentation
    ├── TreatmentPlansPage.tsx  # Treatment planning
    ├── AnalyticsPage.tsx       # Analytics & reports
    ├── AIPage.tsx              # AI insights
    └── SettingsPage.tsx        # User settings
```

**Problem**: No role-specific dashboards! All users see the same interface.

### **🎯 REQUIRED: Role-Specific Dashboards**

```
admin-panel/src/pages/dashboards/
├── DentistDashboard.tsx       # For DENTIST role
├── DoctorDashboard.tsx        # For DOCTOR role (new)
├── HospitalAdminDashboard.tsx # For CLINIC_ADMIN role
├── PharmacistDashboard.tsx    # For PHARMACIST role (new)
├── CustomerDashboard.tsx      # For CUSTOMER role (renamed from PATIENT)
└── SuperAdminDashboard.tsx    # For SUPER_ADMIN role
```

---

## 🗄️ Database Architecture

### **Current Database: MySQL (NOT PostgreSQL)**

**Total Tables**: 53 (across 3 schema files)
- `00-master-schema.sql` - 31 core tables
- `01-pharmacy-module.sql` - 8 pharmacy tables
- `02-hospital-module.sql` - 14 hospital tables

### **Core Tables**

```sql
-- Multi-Tenancy Foundation
tenants (id, name, subdomain, status)
  ├──> clinics (id, tenant_id, name, address)
  └──> users (id, tenant_id, clinic_id, email, role, password)

-- Patient/Customer Data
patients (id, tenant_id, clinic_id, encrypted_demographics)
  ├──> appointments
  ├──> clinical_notes
  ├──> treatment_plans
  ├──> invoices
  │     └──> payments
  └──> patient_insurance

-- Marketplace
suppliers → products → inventory
                   └──> orders → order_items

-- Pharmacy
pharmacy_suppliers → pharmacy_drugs → pharmacy_drug_inventory
                                   ├──> pharmacy_sales
                                   └──> pharmacy_doctor_prescriptions

-- Hospital (NEW)
hospital_departments
├──> doctor_schedules
├──> hospital_beds → bed_allotments
├──> hospital_services → service_packages
└──> lab_test_templates → lab_reports

blood_donors → blood_bank_inventory

hospital_expenses, financial_records, patient_documents
```

### **⚠️ Database Access: NO RLS (Row Level Security)**

Current system uses:
- **Application-level filtering** (not database RLS)
- **TypeORM where clauses**: `WHERE tenant_id = :tenantId`
- **NestJS Guards**: `TenantGuard` intercepts requests
- **NOT using PostgreSQL RLS policies**

---

## 🔄 Data Relationships

### **User → Data Mapping**

```
users (role-based access)
  │
  ├─[SUPER_ADMIN]─────> ALL tenants, ALL data
  │
  ├─[CLINIC_ADMIN]────> tenant_id + clinic_id scoped
  │   └──> Can see: Patients, Appointments, Staff, Financial, Inventory
  │
  ├─[DENTIST]─────────> tenant_id + clinic_id scoped
  │   └──> Can see: Own appointments, Own patients, Clinical notes
  │
  ├─[STAFF]───────────> tenant_id + clinic_id scoped  
  │   └──> Can see: Assigned tasks, Appointments, Inventory
  │
  ├─[SUPPLIER]────────> tenant_id scoped (marketplace)
  │   └──> Can see: Own products, Orders from clinics
  │
  └─[PATIENT]─────────> Own data only
      └──> Can see: Own appointments, Own invoices, Own medical records
```

---

## 🚨 Current Issues & Gaps

### **1. Role Structure Gaps** ⚠️

| Required Role | Current Status | Issue |
|---------------|----------------|-------|
| 🦷 Dentist | ✅ `DENTIST` exists | OK |
| 🩺 Doctor | ❌ Not defined | **Need to add `DOCTOR` role** |
| 🏥 Hospital Admin | ✅ `CLINIC_ADMIN` exists | OK (can rename) |
| 💊 Pharmacist | ❌ Not defined | **Need to add `PHARMACIST` role** |
| 👤 Customer | ✅ `PATIENT` exists | **Need to rename to `CUSTOMER`** |

### **2. Dashboard Structure Issues** 🚨

**Current**: ONE dashboard for all roles  
**Required**: FIVE separate dashboards

**Files to Create**:
```
admin-panel/src/pages/dashboards/
├── DentistDashboard.tsx        # ❌ MISSING
├── DoctorDashboard.tsx         # ❌ MISSING
├── HospitalAdminDashboard.tsx  # ❌ MISSING
├── PharmacistDashboard.tsx     # ❌ MISSING
└── CustomerDashboard.tsx       # ❌ MISSING
```

### **3. Naming Inconsistencies** 📝

**Problem**: "Patient" used throughout, but should be "Customer"

**Files Affected** (100+ occurrences):
```
Backend:
- backend/src/patients/ folder name
- backend/src/patients/entities/patient.entity.ts
- All services referencing "patient"
- Database table: patients

Frontend:
- admin-panel/src/components/patients/
- admin-panel/src/pages/.../Patient*.tsx
- All "patient" text in UI

Database:
- Table: patients
- Foreign keys: patient_id
- Columns: patient_*
```

### **4. Database Technology Mismatch** ⚠️

**You mentioned**: PostgreSQL + RLS (Row Level Security)  
**Actual system**: MySQL + Application-level filtering

**Current Security Model**:
```typescript
// Application-level (TypeORM)
@UseGuards(AuthGuard('jwt'), TenantGuard)
async getData(@Request() req) {
  const tenantId = req.user.tenant_id;
  return this.repo.find({ where: { tenant_id: tenantId } });
}

// NOT using PostgreSQL RLS:
// CREATE POLICY tenant_isolation ON patients
// FOR ALL USING (tenant_id = current_setting('app.current_tenant')::uuid);
```

---

## 📐 System Component Map

### **Frontend Structure**

```
admin-panel/src/
├── components/
│   ├── layout/
│   │   ├── DashboardLayout.tsx    # Main layout (Sidebar + Header)
│   │   ├── Sidebar.tsx            # Navigation menu
│   │   └── Header.tsx             # Top bar with user menu
│   ├── patients/                  # ⚠️ Rename to customers/
│   │   ├── PatientTable.tsx       # ⚠️ Rename to CustomerTable.tsx
│   │   └── PatientForm.tsx        # ⚠️ Rename to CustomerForm.tsx
│   ├── appointments/
│   ├── billing/
│   ├── pharmacy/
│   ├── marketplace/
│   ├── clinical/
│   └── ui/                        # ShadCN components
│
├── pages/
│   ├── DashboardPage.tsx          # ⚠️ Currently shared by all roles
│   ├── LoginPage.tsx              # Login screen
│   ├── PatientsPage.tsx           # ⚠️ Rename to CustomersPage.tsx
│   ├── AppointmentsPage.tsx
│   ├── BillingPage.tsx
│   ├── PharmacyPage.tsx
│   ├── MarketplacePage.tsx
│   └── ...
│
├── hooks/
│   └── useAuth.ts                 # Auth context & hooks
│
├── services/
│   ├── api.ts                     # Axios instance
│   ├── auth-api.ts                # Login, logout
│   ├── patients-api.ts            # ⚠️ Rename to customers-api.ts
│   ├── appointments-api.ts
│   ├── billing-api.ts
│   └── ...
│
└── types/
    ├── index.ts                   # ⚠️ Has PATIENT role
    ├── billing.ts
    ├── pharmacy.ts
    └── hospital.ts
```

### **Backend Structure**

```
backend/src/
├── auth/
│   ├── entities/user.entity.ts    # UserRole enum ⚠️
│   ├── auth.service.ts            # Login logic
│   ├── auth.controller.ts         # /auth/login, /auth/profile
│   ├── jwt.strategy.ts            # JWT validation
│   └── jwt-auth.guard.ts          # Route protection
│
├── tenants/
│   ├── entities/tenant.entity.ts  # Multi-tenancy root
│   ├── tenant.guard.ts            # Tenant isolation
│   └── tenants.service.ts
│
├── patients/                      # ⚠️ Rename to customers/
│   ├── entities/patient.entity.ts # ⚠️ Rename to customer.entity.ts
│   ├── patients.service.ts        # ⚠️ Rename to customers.service.ts
│   └── patients.controller.ts     # ⚠️ Rename to customers.controller.ts
│
├── appointments/
│   ├── entities/appointment.entity.ts
│   ├── appointments.service.ts
│   └── appointments.controller.ts
│
├── billing/
│   ├── entities/invoice.entity.ts
│   ├── entities/payment.entity.ts
│   ├── billing.service.ts
│   └── billing.controller.ts
│
├── pharmacy/                      # 8 entities, full POS
├── hospital/                      # 14 entities, HMS features
├── marketplace/                   # Suppliers, products, orders
├── clinical/                      # Notes, treatment plans
├── analytics/                     # Reports & metrics
├── ai/                            # ML predictions
└── features/                      # Feature flags
```

---

## 🔗 API → Database → Frontend Connection

### **Example: Viewing Patients/Customers**

```
┌──────────────────────────────────────────────────────────┐
│  FRONTEND (React)                                        │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  PatientsPage.tsx                                        │
│  └─> useQuery(['patients'], patientsApi.getPatients)    │
│                                                          │
└──────────────────────┬───────────────────────────────────┘
                       │
                       │ GET /patients?clinicId=xxx
                       │ Headers: Authorization: Bearer <JWT>
                       │
                       ▼
┌──────────────────────────────────────────────────────────┐
│  BACKEND (NestJS)                                        │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  @Controller('patients')                                 │
│  @UseGuards(AuthGuard('jwt'), TenantGuard)              │
│  @Get()                                                  │
│  async getPatients(@Request() req, @Query() query) {    │
│    const tenantId = req.user.tenant_id;  // From JWT    │
│    const clinicId = query.clinicId;                     │
│    return this.patientsService.findAll(tenantId, clinicId);│
│  }                                                       │
│                                                          │
└──────────────────────┬───────────────────────────────────┘
                       │
                       │ SQL Query with TypeORM
                       │
                       ▼
┌──────────────────────────────────────────────────────────┐
│  DATABASE (MySQL)                                        │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  SELECT * FROM patients                                  │
│  WHERE tenant_id = :tenantId                            │
│    AND clinic_id = :clinicId                            │
│  ORDER BY created_at DESC;                              │
│                                                          │
│  Returns: Array of patient records                       │
│                                                          │
└──────────────────────┬───────────────────────────────────┘
                       │
                       │ JSON Response
                       │
                       ▼
┌──────────────────────────────────────────────────────────┐
│  FRONTEND RECEIVES DATA                                  │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  React Query caches result                               │
│  └─> PatientTable.tsx renders list                      │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

---

## 🎯 Role-Specific Data Access (Current Logic)

### **How Data Filtering Works**

```typescript
// 1. JWT Token contains role
const payload = {
  sub: user.id,
  role: user.role,           // 'dentist', 'patient', etc.
  tenantId: user.tenant_id,
  clinicId: user.clinic_id
};

// 2. Backend Guard extracts from token
@UseGuards(AuthGuard('jwt'), TenantGuard)
async getData(@Request() req) {
  const userId = req.user.sub;
  const role = req.user.role;
  const tenantId = req.user.tenant_id;
  const clinicId = req.user.clinicId;
  
  // 3. Service filters by role
  if (role === 'patient') {
    // Patients see ONLY their own data
    return this.repo.find({ where: { id: userId } });
  } else if (role === 'dentist') {
    // Dentists see patients in their clinic
    return this.repo.find({ where: { tenant_id: tenantId, clinic_id: clinicId } });
  } else if (role === 'clinic_admin') {
    // Admins see all clinic data
    return this.repo.find({ where: { tenant_id: tenantId } });
  }
}
```

### **⚠️ Problem**: Role-based filtering NOT consistently implemented!

Currently, most endpoints filter by `tenant_id` only, not by `role`.

---

## 🔍 Current vs Required Architecture

### **Current: Single Admin Panel**
```
Login → JWT Token → Single Dashboard → Role-filtered API data
```

**Issues**:
- ❌ No role-specific UI
- ❌ Dentists see admin controls
- ❌ Patients can't use the admin panel
- ❌ No customer-facing portal

### **Required: Multi-Dashboard System**
```
Login → JWT Token → Role Router → Specific Dashboard → Role-filtered API data

Role Router Logic:
if (role === 'dentist') → DentistDashboard
if (role === 'doctor') → DoctorDashboard
if (role === 'clinic_admin' || role === 'hospital_admin') → HospitalAdminDashboard
if (role === 'pharmacist') → PharmacistDashboard
if (role === 'customer' || role === 'patient') → CustomerDashboard
```

---

## 📋 Required Changes

### **Phase 1: Role Updates** (Backend)

1. **Add missing roles to UserRole enum**:
```typescript
export enum UserRole {
  SUPER_ADMIN = 'super_admin',
  HOSPITAL_ADMIN = 'hospital_admin',  // Rename from CLINIC_ADMIN
  DENTIST = 'dentist',
  DOCTOR = 'doctor',                  // ADD NEW
  PHARMACIST = 'pharmacist',          // ADD NEW
  STAFF = 'staff',
  SUPPLIER = 'supplier',
  CUSTOMER = 'customer',              // Rename from PATIENT
}
```

2. **Update database enum**:
```sql
ALTER TABLE users MODIFY COLUMN role ENUM(
  'super_admin',
  'hospital_admin',
  'dentist',
  'doctor',
  'pharmacist',
  'staff',
  'supplier',
  'customer'
) DEFAULT 'customer';
```

### **Phase 2: Rename Patient → Customer** (Massive)

**Backend** (50+ files):
```bash
# Rename folder
mv backend/src/patients backend/src/customers

# Rename all files
patient.entity.ts → customer.entity.ts
patients.service.ts → customers.service.ts
patients.controller.ts → customers.controller.ts
patients.module.ts → customers.module.ts

# Rename in database
ALTER TABLE patients RENAME TO customers;
# Update all foreign keys: patient_id → customer_id
```

**Frontend** (40+ files):
```bash
# Rename folder
mv admin-panel/src/components/patients admin-panel/src/components/customers

# Rename all components
PatientTable.tsx → CustomerTable.tsx
PatientForm.tsx → CustomerForm.tsx
PatientsPage.tsx → CustomersPage.tsx

# Update all imports and references
```

**Database** (30+ tables with patient_id):
```sql
-- Rename table
ALTER TABLE patients RENAME TO customers;

-- Rename columns in dependent tables
ALTER TABLE appointments CHANGE patient_id customer_id VARCHAR(36);
ALTER TABLE invoices CHANGE patient_id customer_id VARCHAR(36);
ALTER TABLE clinical_notes CHANGE patient_id customer_id VARCHAR(36);
-- ... 20+ more tables
```

### **Phase 3: Create Role-Specific Dashboards**

```typescript
// admin-panel/src/App.tsx
const getDashboardByRole = (role: UserRole) => {
  switch(role) {
    case 'dentist': return <DentistDashboard />;
    case 'doctor': return <DoctorDashboard />;
    case 'hospital_admin': return <HospitalAdminDashboard />;
    case 'pharmacist': return <PharmacistDashboard />;
    case 'customer': return <CustomerDashboard />;
    case 'super_admin': return <SuperAdminDashboard />;
    default: return <DashboardPage />;
  }
};
```

### **Phase 4: Role-Based Route Protection**

```typescript
// Add role checking to routes
<Route
  path="/pharmacy"
  element={
    <ProtectedRoute allowedRoles={['pharmacist', 'hospital_admin']}>
      <PharmacyPage />
    </ProtectedRoute>
  }
/>
```

---

## 🎨 Proposed Dashboard Designs

### **🦷 Dentist Dashboard**
```
Widgets:
- Today's Appointments
- Pending Clinical Notes
- Treatment Plans (my patients)
- Quick Patient Lookup

Navigation:
- My Schedule
- My Patients
- Clinical Notes
- Treatment Plans
- (Limited access to billing, pharmacy)
```

### **🩺 Doctor Dashboard** (Similar to Dentist)
```
Widgets:
- Today's Schedule
- Hospital Rounds
- Pending Lab Reports
- Patient Admissions

Navigation:
- My Schedule
- My Patients
- Lab Reports
- Hospital Beds
- Prescriptions
```

### **🏥 Hospital Admin Dashboard**
```
Widgets:
- Patient Census
- Bed Occupancy Rate
- Revenue (Today/Month)
- Staff on Duty
- Blood Bank Status
- Pending Expenses

Navigation:
- ALL modules (full access)
- Departments
- Staff Management
- Financial Reports
- Inventory Management
```

### **💊 Pharmacist Dashboard**
```
Widgets:
- Pending Prescriptions
- Expiring Drugs (30 days)
- Low Stock Alerts
- Today's Sales

Navigation:
- Pharmacy POS
- Drug Inventory
- Prescriptions
- Suppliers
- Sales Reports
- (Read-only: Patients, Appointments)
```

### **👤 Customer Dashboard** (Patient Portal)
```
Widgets:
- Upcoming Appointments
- Recent Visits
- Outstanding Bills
- Prescriptions

Navigation:
- My Appointments
- Medical Records
- Treatment Plans
- Bills & Payments
- Profile Settings
- (No access to admin features)
```

---

## 🔄 Recommended Data Flow

### **New Multi-Dashboard Flow**

```
1. USER LOGS IN
   ↓
   POST /auth/login
   ↓
   Returns: { user, access_token }
   ↓
   user.role = 'dentist' | 'doctor' | 'hospital_admin' | 'pharmacist' | 'customer'

2. FRONTEND ROUTES TO CORRECT DASHBOARD
   ↓
   App.tsx checks user.role
   ↓
   if (role === 'customer') → Navigate to /customer-portal
   if (role === 'pharmacist') → Navigate to /pharmacist-dashboard  
   if (role === 'dentist') → Navigate to /dentist-dashboard
   if (role === 'doctor') → Navigate to /doctor-dashboard
   if (role === 'hospital_admin') → Navigate to /admin-dashboard

3. DASHBOARD LOADS ROLE-SPECIFIC COMPONENTS
   ↓
   Each dashboard calls relevant APIs
   ↓
   Backend filters data by role + tenant_id

4. SIDEBAR SHOWS ROLE-APPROPRIATE MENU
   ↓
   Dentist: Patients, Appointments, Clinical
   Pharmacist: Pharmacy, Prescriptions, Inventory
   Customer: Appointments, Bills, Records (read-only)
```

---

## 📊 Complete System Map

```
┌─────────────────────────────────────────────────────────────┐
│                    NILEC ARE PLATFORM                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────┐                                            │
│  │   USERS     │  Roles: Dentist, Doctor, Admin, Pharmacist,│
│  │             │         Customer, Supplier                 │
│  └──────┬──────┘                                            │
│         │                                                   │
│         │ LOGIN (JWT)                                       │
│         │                                                   │
│         ▼                                                   │
│  ┌─────────────────────────────────────────┐               │
│  │       ROLE-BASED ROUTING                │               │
│  └─────────────────────────────────────────┘               │
│         │                                                   │
│         ├──> [Dentist] ────> DentistDashboard              │
│         ├──> [Doctor] ─────> DoctorDashboard               │
│         ├──> [Hospital Admin]> AdminDashboard              │
│         ├──> [Pharmacist] ─> PharmacistDashboard           │
│         └──> [Customer] ───> CustomerPortal                │
│                                                             │
│  Each dashboard calls role-filtered APIs:                  │
│  ┌──────────────────────────────────────────┐             │
│  │  Backend (NestJS) - 15 Modules           │             │
│  ├──────────────────────────────────────────┤             │
│  │  • Customers (renamed from Patients)     │             │
│  │  • Appointments                          │             │
│  │  • Billing & Payments                    │             │
│  │  • Pharmacy (POS, Prescriptions)         │             │
│  │  • Hospital (Beds, Lab, Blood Bank)      │             │
│  │  • Marketplace                           │             │
│  │  • Clinical Notes                        │             │
│  │  • Treatment Plans                       │             │
│  │  • Analytics                             │             │
│  │  • AI/ML                                 │             │
│  └──────────────────┬───────────────────────┘             │
│                     │                                     │
│                     │ TypeORM                             │
│                     ▼                                     │
│  ┌──────────────────────────────────────────┐             │
│  │  MySQL Database - 53 Tables              │             │
│  ├──────────────────────────────────────────┤             │
│  │  Multi-Tenant Isolation:                 │             │
│  │  WHERE tenant_id = :currentTenantId      │             │
│  │                                          │             │
│  │  Role-Based Filtering:                   │             │
│  │  - Customers see own data only           │             │
│  │  - Dentists see clinic patients          │             │
│  │  - Admins see all tenant data            │             │
│  └──────────────────────────────────────────┘             │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## ✅ What's Working Well

1. ✅ **Multi-Tenancy**: Solid tenant isolation
2. ✅ **JWT Authentication**: Secure token-based auth
3. ✅ **Module Structure**: Well-organized backend
4. ✅ **Type Safety**: Full TypeScript coverage
5. ✅ **Database Design**: Normalized, indexed
6. ✅ **API Architecture**: RESTful with Swagger docs
7. ✅ **PHI Encryption**: Patient demographics encrypted
8. ✅ **15 Complete Modules**: Rich feature set

---

## 🚨 What Needs Fixing

### **Critical** (Must Fix)

1. **❌ Missing Roles**:
   - Add `DOCTOR` role
   - Add `PHARMACIST` role

2. **❌ Rename Patient → Customer**:
   - Affects 100+ files
   - Database table rename
   - All foreign keys

3. **❌ No Role-Specific Dashboards**:
   - Create 5 separate dashboard UIs
   - Implement role-based routing
   - Different sidebar menus per role

### **High Priority**

4. **⚠️ Role-Based Permissions**: 
   - Add role checking to ALL routes
   - Implement permission decorators
   - Guard endpoints by allowed roles

5. **⚠️ Database Migration from MySQL**:
   - You mentioned PostgreSQL + RLS
   - Current system is MySQL
   - Need migration strategy if changing

### **Medium Priority**

6. **Dashboard Widgets**: Create role-specific widgets
7. **Mobile App**: Different views per role
8. **Notifications**: Role-based alerts

---

## 📄 System Design Summary

### **Current Architecture**
- ✅ **Backend**: NestJS + TypeScript + MySQL
- ✅ **Frontend**: React + TypeScript + Tailwind + ShadCN
- ✅ **Auth**: JWT tokens (NOT Supabase)
- ✅ **Database**: MySQL 53 tables (NOT PostgreSQL)
- ⚠️ **Dashboards**: Single admin panel (needs role-specific)
- ⚠️ **Roles**: Missing Doctor & Pharmacist
- ⚠️ **Naming**: Uses "Patient" (should be "Customer")

### **Required Architecture**
- 🎯 **Roles**: Add Doctor, Pharmacist, rename Patient → Customer
- 🎯 **Dashboards**: 5 role-specific UIs
- 🎯 **Routing**: Role-based navigation
- 🎯 **Permissions**: Guard routes by allowed roles
- 🎯 **Database**: Option to migrate to PostgreSQL + RLS (or keep MySQL)

---

## ✅ Confirmation

**I fully understand the current system:**

✅ NestJS + MySQL backend (15 modules)  
✅ React + Tailwind frontend (single admin panel)  
✅ JWT auth with 6 current roles  
✅ Multi-tenant architecture  
✅ 53 database tables  
✅ Application-level security (not database RLS)  

**I understand what needs to be done:**

📋 Add DOCTOR and PHARMACIST roles  
📋 Rename PATIENT → CUSTOMER throughout (100+ files)  
📋 Create 5 role-specific dashboards  
📋 Implement role-based routing  
📋 Add role-based permissions to APIs  
📋 Update sidebar menus per role  

---

**Ready for next steps! What would you like me to tackle first?**

1. **Add new roles** (Doctor, Pharmacist) to backend?
2. **Rename Patient → Customer** throughout codebase?
3. **Create role-specific dashboards**?
4. **All of the above**?

