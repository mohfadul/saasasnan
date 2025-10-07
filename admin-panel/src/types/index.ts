// User and Auth Types
export interface User {
  id: string;
  email: string;
  role: UserRole;
  firstName?: string;
  lastName?: string;
  tenantId: string;
  clinicId?: string;
}

export enum UserRole {
  SUPER_ADMIN = 'super_admin',
  HOSPITAL_ADMIN = 'hospital_admin',  // Renamed from clinic_admin
  DENTIST = 'dentist',
  DOCTOR = 'doctor',                  // New role
  PHARMACIST = 'pharmacist',          // New role
  STAFF = 'staff',
  SUPPLIER = 'supplier',
  PATIENT = 'patient',
}

export interface LoginRequest {
  email: string;
  password: string;
  tenantId?: string;
}

export interface AuthResponse {
  access_token: string;
  user: User;
}

// Patient Types
export interface PatientDemographics {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender?: string;
  phone?: string;
  email?: string;
  address?: Record<string, any>;
}

export interface Patient {
  id: string;
  tenantId: string;
  clinicId: string;
  demographics: PatientDemographics;
  patientExternalId?: string;
  tags: string[];
  consentFlags: Record<string, any>;
  medicalAlertFlags: Record<string, any>;
  lastVisitAt?: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
}

export interface CreatePatientRequest {
  demographics: PatientDemographics;
  clinicId: string;
  patientExternalId?: string;
  tags?: string[];
  consentFlags?: Record<string, any>;
  medicalAlertFlags?: Record<string, any>;
}

// Appointment Types
export enum AppointmentStatus {
  SCHEDULED = 'scheduled',
  CONFIRMED = 'confirmed',
  CHECKED_IN = 'checked_in',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  NO_SHOW = 'no_show',
}

export interface Appointment {
  id: string;
  tenantId: string;
  clinicId: string;
  patientId: string;
  providerId: string;
  startTime: string;
  endTime: string;
  status: AppointmentStatus;
  appointmentType?: string;
  reason?: string;
  roomId?: string;
  checkedInAt?: string;
  seenByProviderAt?: string;
  completedAt?: string;
  cancelledAt?: string;
  cancellationReason?: string;
  recurrencePattern?: Record<string, any>;
  masterAppointmentId?: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  patient?: Patient;
  provider?: User;
}

export interface CreateAppointmentRequest {
  clinicId: string;
  patientId: string;
  providerId: string;
  startTime: string;
  endTime: string;
  appointmentType?: string;
  reason?: string;
  roomId?: string;
  status?: AppointmentStatus;
  recurrencePattern?: Record<string, any>;
}

// Tenant Types
export interface Tenant {
  id: string;
  name: string;
  subdomain: string;
  config: Record<string, any>;
  status: string;
  createdAt: string;
  updatedAt: string;
}

// API Response Types
export interface ApiResponse<T> {
  data: T;
  message?: string;
  status: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}
