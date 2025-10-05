export interface User {
  id: string;
  email: string;
  role: 'patient' | 'dentist' | 'staff' | 'admin';
  tenant_id: string;
  clinic_id: string;
  profile?: PatientProfile;
  created_at: string;
  updated_at: string;
}

export interface PatientProfile {
  id: string;
  patient_id: string;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  gender: 'male' | 'female' | 'other';
  phone_number?: string;
  address?: Address;
  emergency_contact?: EmergencyContact;
  insurance_info?: InsuranceInfo[];
  medical_history?: string[];
  allergies?: string[];
  medications?: Medication[];
  created_at: string;
  updated_at: string;
}

export interface Address {
  street: string;
  city: string;
  state: string;
  zip_code: string;
  country: string;
}

export interface EmergencyContact {
  name: string;
  relationship: string;
  phone_number: string;
  email?: string;
}

export interface InsuranceInfo {
  provider_name: string;
  policy_number: string;
  group_number?: string;
  is_primary: boolean;
  effective_date: string;
  expiration_date?: string;
}

export interface Medication {
  name: string;
  dosage: string;
  frequency: string;
  start_date: string;
  end_date?: string;
  prescribed_by?: string;
}

export interface Appointment {
  id: string;
  patient_id: string;
  provider_id: string;
  start_time: string;
  end_time: string;
  status: 'scheduled' | 'confirmed' | 'checked_in' | 'in_progress' | 'completed' | 'cancelled' | 'no_show';
  appointment_type: string;
  reason?: string;
  room_id?: string;
  notes?: string;
  provider?: User;
  created_at: string;
  updated_at: string;
}

export interface ClinicalNote {
  id: string;
  patient_id: string;
  provider_id: string;
  appointment_id?: string;
  note_type: 'consultation' | 'examination' | 'treatment' | 'follow_up' | 'emergency' | 'progress' | 'discharge';
  status: 'draft' | 'finalized' | 'amended' | 'archived';
  chief_complaint: string;
  history_of_present_illness?: string;
  examination_findings?: string;
  diagnosis?: string;
  treatment_rendered?: string;
  recommendations?: string;
  follow_up_instructions?: string;
  provider?: User;
  created_at: string;
  updated_at: string;
}

export interface TreatmentPlan {
  id: string;
  patient_id: string;
  provider_id: string;
  title: string;
  description?: string;
  status: 'draft' | 'proposed' | 'accepted' | 'in_progress' | 'completed' | 'cancelled' | 'on_hold';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  estimated_cost: number;
  insurance_estimate: number;
  patient_responsibility: number;
  total_items: number;
  completed_items: number;
  items: TreatmentPlanItem[];
  provider?: User;
  created_at: string;
  updated_at: string;
}

export interface TreatmentPlanItem {
  id: string;
  treatment_plan_id: string;
  procedure_name: string;
  procedure_code?: string;
  item_type: 'procedure' | 'consultation' | 'examination' | 'cleaning' | 'restoration' | 'extraction' | 'implant' | 'orthodontic' | 'periodontal' | 'endodontic' | 'prosthodontic' | 'surgery' | 'other';
  status: 'pending' | 'scheduled' | 'in_progress' | 'completed' | 'cancelled' | 'on_hold';
  description?: string;
  quantity: number;
  estimated_duration_minutes: number;
  scheduled_date?: string;
  unit_cost: number;
  total_cost: number;
  sequence_order: number;
  special_instructions?: string;
}

export interface Invoice {
  id: string;
  patient_id: string;
  invoice_number: string;
  invoice_date: string;
  due_date: string;
  total_amount: number;
  paid_amount: number;
  balance_amount: number;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  items: InvoiceItem[];
  created_at: string;
  updated_at: string;
}

export interface InvoiceItem {
  id: string;
  invoice_id: string;
  description: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  item_type?: string;
  tax_rate: number;
  tax_amount: number;
}

export interface Payment {
  id: string;
  invoice_id?: string;
  payment_number: string;
  payment_date: string;
  payment_method: 'cash' | 'card' | 'bank_transfer' | 'check' | 'insurance' | 'online';
  amount: number;
  status: 'pending' | 'completed' | 'failed' | 'refunded' | 'cancelled';
  transaction_id?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'appointment' | 'billing' | 'clinical' | 'general';
  is_read: boolean;
  data?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface Clinic {
  id: string;
  name: string;
  address: Address;
  phone_number: string;
  email: string;
  website?: string;
  hours: ClinicHours;
  services: string[];
  providers: User[];
  created_at: string;
  updated_at: string;
}

export interface ClinicHours {
  monday: DayHours;
  tuesday: DayHours;
  wednesday: DayHours;
  thursday: DayHours;
  friday: DayHours;
  saturday: DayHours;
  sunday: DayHours;
}

export interface DayHours {
  is_open: boolean;
  open_time?: string;
  close_time?: string;
  break_start?: string;
  break_end?: string;
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
  status: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
}

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  expires_in: number;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  phone_number?: string;
}

export interface UpdateProfileRequest {
  first_name?: string;
  last_name?: string;
  phone_number?: string;
  address?: Address;
  emergency_contact?: EmergencyContact;
}

export interface BookAppointmentRequest {
  provider_id: string;
  appointment_type: string;
  preferred_date: string;
  preferred_time_start: string;
  preferred_time_end: string;
  reason?: string;
  notes?: string;
}

export interface RescheduleAppointmentRequest {
  new_start_time: string;
  new_end_time: string;
  reason?: string;
}
