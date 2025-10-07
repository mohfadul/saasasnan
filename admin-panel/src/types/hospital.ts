/**
 * Hospital Management Module Type Definitions
 * Converted from Laravel HMS
 */

export interface Department {
  id: string;
  tenant_id: string;
  name: string;
  description?: string;
  head_doctor_id?: string;
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
}

export interface Bed {
  id: string;
  tenant_id: string;
  clinic_id: string;
  department_id: string;
  bed_number: string;
  bed_type: string;
  status: 'available' | 'occupied' | 'maintenance' | 'reserved';
  price_per_day?: number;
  floor?: string;
  room_number?: string;
  created_at: string;
  updated_at: string;
}

export interface BedAllotment {
  id: string;
  tenant_id: string;
  clinic_id: string;
  bed_id: string;
  patient_id: string;
  allotment_date: string;
  discharge_date?: string;
  status: 'active' | 'discharged' | 'transferred';
  notes?: string;
  assigned_by?: string;
  created_at: string;
  updated_at: string;
}

export interface BloodBank {
  id: string;
  tenant_id: string;
  clinic_id: string;
  blood_group: string;
  quantity: number;
  donor_id?: string;
  collection_date?: string;
  expiry_date?: string;
  status: 'available' | 'reserved' | 'used' | 'expired';
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface Donor {
  id: string;
  tenant_id: string;
  name: string;
  email?: string;
  phone: string;
  blood_group: string;
  address?: string;
  last_donation_date?: string;
  total_donations: number;
  status: 'active' | 'inactive' | 'blacklisted';
  medical_notes?: string;
  created_at: string;
  updated_at: string;
}

export interface LabTemplate {
  id: string;
  tenant_id: string;
  test_name: string;
  description?: string;
  department_id?: string;
  price: number;
  parameters?: any;
  normal_range?: string;
  turnaround_time_hours?: number;
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
}

export interface LabReport {
  id: string;
  tenant_id: string;
  clinic_id: string;
  patient_id: string;
  template_id: string;
  doctor_id?: string;
  lab_technician_id?: string;
  test_results?: any;
  findings?: string;
  recommendations?: string;
  test_date: string;
  result_date?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  created_at: string;
  updated_at: string;
}

export interface HospitalService {
  id: string;
  tenant_id: string;
  name: string;
  description?: string;
  department_id?: string;
  price: number;
  duration_minutes?: number;
  status: 'active' | 'inactive';
  requirements?: string;
  created_at: string;
  updated_at: string;
}

export interface ServicePackage {
  id: string;
  tenant_id: string;
  name: string;
  description?: string;
  service_ids: string[];
  original_price: number;
  package_price: number;
  discount_percentage?: number;
  validity_days?: number;
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
}

export interface DoctorSchedule {
  id: string;
  tenant_id: string;
  doctor_id: string;
  day_of_week: string;
  start_time: string;
  end_time: string;
  department_id?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface DoctorDayoff {
  id: string;
  tenant_id: string;
  doctor_id: string;
  date: string;
  reason?: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
}

export interface Expense {
  id: string;
  tenant_id: string;
  clinic_id: string;
  category: string;
  amount: number;
  date: string;
  description?: string;
  department_id?: string;
  vendor_name?: string;
  receipt_number?: string;
  approved_by?: string;
  status: 'pending' | 'approved' | 'paid' | 'rejected';
  created_at: string;
  updated_at: string;
}

export interface FinancialRecord {
  id: string;
  tenant_id: string;
  clinic_id: string;
  date: string;
  income: number;
  expense: number;
  net_balance: number;
  notes?: string;
  recorded_by?: string;
  created_at: string;
  updated_at: string;
}

export interface PatientDocument {
  id: string;
  tenant_id: string;
  clinic_id: string;
  patient_id: string;
  title: string;
  description?: string;
  file_path: string;
  file_type?: string;
  file_size?: number;
  uploaded_by?: string;
  document_type: 'lab_result' | 'prescription' | 'scan' | 'report' | 'consent' | 'other';
  created_at: string;
  updated_at: string;
}

// Dashboard Overview
export interface HospitalDashboard {
  departments: {
    total: number;
  };
  beds: {
    total: number;
    occupied: number;
    available: number;
    occupancyRate: string;
  };
  bloodBank: {
    totalDonors: number;
    totalUnits: number;
  };
  laboratory: {
    pendingReports: number;
  };
}

