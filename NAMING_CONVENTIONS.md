# 📚 Naming Conventions - Healthcare SaaS Platform

**Last Updated**: October 7, 2025  
**Status**: Official Standard  

---

## 🎯 Purpose

This document defines the official naming conventions for the Healthcare SaaS Platform to ensure consistency, readability, and maintainability across the entire codebase.

---

## 📁 Directory Structure

### Backend (NestJS)

```
backend/src/
├── [module]/              # kebab-case (e.g., patient-records/)
│   ├── entities/          # Plural, kebab-case
│   ├── dto/               # Lowercase acronym
│   ├── [module].controller.ts
│   ├── [module].service.ts
│   └── [module].module.ts
```

### Frontend (React)

```
admin-panel/src/
├── components/            # Plural
│   ├── [feature]/        # kebab-case (e.g., patient-forms/)
│   │   └── Component.tsx  # PascalCase
├── pages/                 # Plural
│   └── PageName.tsx       # PascalCase + Page suffix
├── services/              # Plural
│   └── service-name.ts    # kebab-case
├── types/                 # Plural
│   └── feature.ts         # kebab-case
├── utils/                 # Plural
│   └── utility-name.ts    # kebab-case
└── hooks/                 # Plural
    └── useHookName.ts     # camelCase with 'use' prefix
```

---

## 📄 File Naming

### Backend Files

| Type | Convention | Example |
|------|-----------|---------|
| Entity | `kebab-case.entity.ts` | `patient-record.entity.ts` |
| DTO | `kebab-case.dto.ts` | `create-patient.dto.ts` |
| Controller | `kebab-case.controller.ts` | `patients.controller.ts` |
| Service | `kebab-case.service.ts` | `patients.service.ts` |
| Module | `kebab-case.module.ts` | `patients.module.ts` |
| Guard | `kebab-case.guard.ts` | `jwt-auth.guard.ts` |
| Interceptor | `kebab-case.interceptor.ts` | `logging.interceptor.ts` |
| Decorator | `kebab-case.decorator.ts` | `roles.decorator.ts` |
| Filter | `kebab-case.filter.ts` | `http-exception.filter.ts` |
| Pipe | `kebab-case.pipe.ts` | `validation.pipe.ts` |

### Frontend Files

| Type | Convention | Example |
|------|-----------|---------|
| Component | `PascalCase.tsx` | `PatientTable.tsx` |
| Page | `PascalCase.tsx` | `DashboardPage.tsx` |
| Hook | `useCamelCase.ts` | `useAuth.ts` |
| Service | `kebab-case.ts` | `patient-api.ts` |
| Util | `kebab-case.ts` | `date-utils.ts` |
| Type | `kebab-case.ts` | `patient-types.ts` |
| Context | `PascalCase.tsx` | `AuthContext.tsx` |
| Config | `kebab-case.ts` | `api-config.ts` |

---

## 💻 Code Naming

### TypeScript/JavaScript

```typescript
// ✅ Variables - camelCase
const userName = "John Doe";
const patientId = "123";
let isActive = true;

// ✅ Constants - UPPER_SNAKE_CASE
const API_BASE_URL = "http://localhost:3001";
const MAX_RETRY_COUNT = 3;
const DEFAULT_PAGE_SIZE = 20;

// ✅ Functions - camelCase
function calculateTotalPrice() {}
const handleSubmit = () => {};
async function fetchPatientData() {}

// ✅ Classes - PascalCase
class PatientService {}
class AuthGuard {}
class ValidationPipe {}

// ✅ Interfaces - PascalCase (with 'I' prefix optional)
interface Patient {}
interface IPatientRepository {}  // Optional 'I' prefix
interface PatientDto {}

// ✅ Types - PascalCase
type UserId = string;
type PatientStatus = 'active' | 'inactive';

// ✅ Enums - PascalCase (keys UPPER_SNAKE_CASE)
enum UserRole {
  ADMIN = 'admin',
  DOCTOR = 'doctor',
  PATIENT = 'patient'
}

enum AppointmentStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  CANCELLED = 'cancelled'
}

// ✅ React Components - PascalCase
const PatientForm = () => {};
export const AppointmentTable = () => {};
function DashboardPage() {}

// ✅ React Hooks - camelCase with 'use' prefix
const useAuth = () => {};
const useFetchPatients = () => {};
const useLocalStorage = () => {};

// ✅ Props Interfaces - PascalCase with 'Props' suffix
interface PatientFormProps {
  patient?: Patient;
  onSubmit: (data: Patient) => void;
}

// ✅ Event Handlers - camelCase with 'handle' or 'on' prefix
const handleClick = () => {};
const handleFormSubmit = () => {};
const onPatientSelect = () => {};

// ✅ Boolean Variables - 'is', 'has', 'should' prefix
const isLoading = false;
const hasPermission = true;
const shouldRender = false;
const canEdit = true;

// ✅ Private Class Members - camelCase with '_' prefix (optional)
class UserService {
  private _userId: string;
  private userRepository: Repository<User>;
}
```

### Database

```sql
-- ✅ Tables - snake_case, plural
patients
appointments
clinical_notes
treatment_plans

-- ✅ Columns - snake_case
patient_id
first_name
created_at
is_active

-- ✅ Foreign Keys - snake_case with _id suffix
patient_id
clinic_id
doctor_id

-- ✅ Junction Tables - singular_singular
patient_insurance
user_role
appointment_reminder

-- ✅ Indexes - idx_table_column
idx_patients_email
idx_appointments_date
idx_users_tenant_id
```

---

## 🗂️ Folder Organization

### Backend Module Structure

```
src/
└── patients/
    ├── entities/
    │   ├── patient.entity.ts
    │   └── patient-insurance.entity.ts
    ├── dto/
    │   ├── create-patient.dto.ts
    │   ├── update-patient.dto.ts
    │   └── patient-query.dto.ts
    ├── patients.controller.ts
    ├── patients.service.ts
    └── patients.module.ts
```

### Frontend Feature Structure

```
src/
└── components/
    └── patients/
        ├── PatientTable.tsx
        ├── PatientForm.tsx
        ├── PatientCard.tsx
        └── PatientDetails.tsx
```

---

## 📦 Import Organization

### Order of Imports

```typescript
// 1. External libraries (React, NestJS, etc.)
import React, { useState, useEffect } from 'react';
import { Injectable } from '@nestjs/common';
import axios from 'axios';

// 2. Internal modules/services
import { AuthService } from '../auth/auth.service';
import { PatientDto } from './dto/patient.dto';

// 3. Relative imports
import { formatDate } from '../../utils/date-utils';
import './styles.css';
```

### Import Grouping

```typescript
// ✅ Good
import React from 'react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

import { useAuth } from '@/hooks/useAuth';
import { PatientService } from '@/services/patient-service';

import type { Patient } from '@/types/patient';
import type { ApiResponse } from '@/types/api';

// ❌ Bad (mixed order)
import { formatDate } from './utils';
import React from 'react';
import type { Patient } from './types';
import { Button } from '../components/Button';
```

---

## 🎨 Component Naming

### React Components

```typescript
// ✅ Good
export const PatientTable = () => {};
export const AppointmentForm = () => {};
export const DashboardPage = () => {};

// ❌ Bad
export const patientTable = () => {};
export const appointment_form = () => {};
export const dashboardpage = () => {};
```

### Component Files

```
✅ PatientTable.tsx
✅ AppointmentForm.tsx
✅ DashboardPage.tsx

❌ patientTable.tsx
❌ appointment-form.tsx
❌ dashboard_page.tsx
```

---

## 🔧 API Endpoints

### REST API Naming

```
✅ GET    /api/patients
✅ GET    /api/patients/:id
✅ POST   /api/patients
✅ PUT    /api/patients/:id
✅ PATCH  /api/patients/:id
✅ DELETE /api/patients/:id

✅ GET    /api/appointments/by-date
✅ POST   /api/billing/invoices/generate
✅ GET    /api/analytics/dashboard

❌ GET    /api/getPatients
❌ POST   /api/createPatient
❌ GET    /api/PatientById
```

---

## 📝 Comments & Documentation

### Code Comments

```typescript
// ✅ Good - Explains WHY, not WHAT
// Calculate discount based on insurance coverage percentage
const discount = insuranceCoverage * 0.15;

// Retry failed requests with exponential backoff
await retryWithBackoff(fetchData, 3);

// ❌ Bad - Explains obvious WHAT
// Set user name to John
const userName = "John";

// Loop through patients
patients.forEach(patient => {});
```

### JSDoc Comments

```typescript
/**
 * Fetches patient data by ID
 * @param patientId - The unique identifier of the patient
 * @returns Promise resolving to patient data
 * @throws {NotFoundException} When patient is not found
 */
async function fetchPatient(patientId: string): Promise<Patient> {
  // Implementation
}
```

---

## 🚫 Avoid

### Don't Use

```typescript
// ❌ Hungarian notation
const strName = "John";
const intAge = 25;
const boolIsActive = true;

// ❌ Abbreviations (unless very common)
const usrNm = "John";  // Use: userName
const aptId = "123";   // Use: appointmentId
const ptnt = {};       // Use: patient

// ❌ Single letter variables (except loops)
const p = getPatient();  // Use: patient
const d = new Date();    // Use: currentDate

// ✅ OK in loops
for (let i = 0; i < items.length; i++) {}
items.map((item, index) => {});

// ❌ Overly long names
const patientMedicalHistoryRecordWithAllDetailsAndRelatedInformation = {};
// Better: patientMedicalHistory or medicalRecord

// ❌ Unclear abbreviations
const temp = getData();   // Use: temporaryData or cacheData
const tmp = result;       // Use: cachedResult
```

---

## ✅ Best Practices

### 1. Be Descriptive

```typescript
// ✅ Good
const activePatients = patients.filter(p => p.status === 'active');
const unreadNotifications = notifications.filter(n => !n.isRead);

// ❌ Bad
const items = patients.filter(p => p.status === 'active');
const data = notifications.filter(n => !n.isRead);
```

### 2. Be Consistent

```typescript
// ✅ Good - Consistent naming pattern
fetchPatients()
fetchAppointments()
fetchInvoices()

// ❌ Bad - Inconsistent
getPatients()
fetchAppointments()
retrieveInvoices()
```

### 3. Use Domain Language

```typescript
// ✅ Good - Healthcare domain terms
interface Prescription {
  medication: string;
  dosage: string;
  frequency: string;
}

// ❌ Bad - Generic terms
interface Item {
  name: string;
  amount: string;
  times: string;
}
```

---

## 📚 Resources

- [TypeScript Naming Conventions](https://www.typescriptlang.org/docs/handbook/declaration-files/do-s-and-don-ts.html)
- [React Naming Conventions](https://react.dev/learn/thinking-in-react)
- [NestJS Best Practices](https://docs.nestjs.com/recipes/documentation)
- [Airbnb JavaScript Style Guide](https://github.com/airbnb/javascript)

---

## 🔄 Updates

This document is a living standard. When new patterns emerge or conventions evolve, update this document and notify the team.

**Last Review**: October 7, 2025  
**Next Review**: Monthly or as needed

---

**Questions or suggestions? Open an issue or PR to discuss changes.**

