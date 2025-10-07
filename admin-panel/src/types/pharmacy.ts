/**
 * Pharmacy Module Type Definitions
 * Healthcare SaaS Platform
 */

// Drug Types
export interface Drug {
  id: string;
  tenant_id: string;
  clinic_id: string;
  supplier_id?: string;
  category_id?: string;
  name: string;
  description?: string;
  drug_code: string;
  generic_name?: string;
  brand_name?: string;
  manufacturer?: string;
  unit_price: number;
  cost_price?: number;
  unit_of_measure: string;
  dosage_form?: string;
  strength?: string;
  requires_prescription: boolean;
  is_controlled_substance: boolean;
  storage_requirements?: string;
  side_effects?: string;
  contraindications?: string;
  image_url?: string;
  status: 'active' | 'inactive' | 'discontinued';
  created_at: string;
  updated_at: string;
}

// Drug Inventory Types
export interface DrugInventory {
  id: string;
  tenant_id: string;
  clinic_id: string;
  drug_id: string;
  quantity: number;
  minimum_stock: number;
  maximum_stock: number;
  reorder_level: number;
  batch_id: string;
  expiry_date: string;
  manufacture_date?: string;
  shelf_location?: string;
  bin_number?: string;
  batch_cost_price: number;
  batch_selling_price: number;
  status: 'available' | 'low_stock' | 'out_of_stock' | 'expired' | 'recalled';
  expiry_alert_sent: boolean;
  low_stock_alert_sent: boolean;
  added_by?: string;
  created_at: string;
  updated_at: string;
  drug?: Drug;
}

// Sale Types
export interface PharmacySale {
  id: string;
  tenant_id: string;
  clinic_id: string;
  sale_number: string;
  sale_date: string;
  patient_id?: string;
  customer_name?: string;
  customer_phone?: string;
  prescription_id?: string;
  doctor_name?: string;
  subtotal: number;
  tax_amount: number;
  discount_amount: number;
  total_amount: number;
  paid_amount: number;
  balance: number;
  payment_method: 'cash' | 'card' | 'insurance' | 'mobile_wallet' | 'bank_transfer';
  payment_reference?: string;
  status: 'draft' | 'completed' | 'refunded' | 'cancelled';
  notes?: string;
  cashier_id?: string;
  created_at: string;
  updated_at: string;
  items?: PharmacySaleItem[];
}

export interface PharmacySaleItem {
  id: string;
  sale_id: string;
  drug_id: string;
  inventory_id?: string;
  drug_name: string;
  batch_id: string;
  quantity: number;
  unit_price: number;
  discount: number;
  total_price: number;
  drug?: Drug;
}

// Prescription Types
export interface DoctorPrescription {
  id: string;
  tenant_id: string;
  clinic_id: string;
  prescription_number: string;
  doctor_name: string;
  doctor_contact: string;
  doctor_id: string;
  doctor_email: string;
  patient_id?: string;
  patient_name?: string;
  prescription_date: string;
  pickup_date: string;
  total_amount: number;
  status: 'pending' | 'verified' | 'picked_up' | 'cancelled' | 'expired';
  verified_at?: string;
  verified_by?: string;
  picked_up_at?: string;
  notes?: string;
  special_instructions?: string;
  created_at: string;
  updated_at: string;
  items?: PrescriptionItem[];
}

export interface PrescriptionItem {
  id: string;
  prescription_id: string;
  drug_id: string;
  drug_name: string;
  drug_price: number;
  quantity_prescribed: number;
  quantity_dispensed: number;
  dosage_instructions?: string;
  frequency?: string;
  duration_days?: number;
  unit_price: number;
  total_price: number;
  drug?: Drug;
}

// Supplier Types
export interface PharmacySupplier {
  id: string;
  tenant_id: string;
  supplier_code: string;
  name: string;
  email: string;
  contact: string;
  address?: string;
  drugs_available?: string;
  tax_id?: string;
  license_number?: string;
  rating: number;
  total_orders: number;
  on_time_delivery_rate: number;
  status: 'active' | 'inactive' | 'suspended';
  notify_on_expiry: boolean;
  notify_on_low_stock: boolean;
  created_at: string;
  updated_at: string;
}

// Drug Category Types
export interface DrugCategory {
  id: string;
  tenant_id: string;
  name: string;
  description?: string;
  sort_order: number;
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
}

// Request DTOs
export interface CreateDrugInventoryRequest {
  drugId: string;
  clinicId: string;
  quantity: number;
  batchId: string;
  expiryDate: string;
  manufactureDate?: string;
  batchCostPrice: number;
  batchSellingPrice: number;
  shelfLocation?: string;
  binNumber?: string;
  minimumStock?: number;
  reorderLevel?: number;
}

export interface CreateSaleRequest {
  clinicId: string;
  patientId?: string;
  customerName?: string;
  customerPhone?: string;
  prescriptionId?: string;
  doctorName?: string;
  items: {
    drugId: string;
    inventoryId: string;
    quantity: number;
    unitPrice: number;
    discount?: number;
  }[];
  paymentMethod: string;
  paidAmount: number;
  notes?: string;
}

export interface CreatePrescriptionRequest {
  clinicId: string;
  doctorName: string;
  doctorContact: string;
  doctorId: string;
  doctorEmail: string;
  patientId?: string;
  patientName?: string;
  prescriptionDate: string;
  pickupDate: string;
  items: {
    drugId: string;
    quantityPrescribed: number;
    dosageInstructions?: string;
    frequency?: string;
    durationDays?: number;
  }[];
  specialInstructions?: string;
}

// Dashboard Overview
export interface PharmacyDashboard {
  drugs: {
    total: number;
    active: number;
  };
  inventory: {
    totalStock: number;
    lowStockItems: number;
    expiringSoon: number;
    expired: number;
    outOfStock: number;
  };
  sales: {
    total: number;
    todayRevenue: number;
    todayCount: number;
  };
  prescriptions: {
    total: number;
    pending: number;
    verified: number;
  };
}

// Cart Item (for POS)
export interface CartItem {
  inventoryId: string;
  drug: Drug;
  batchId: string;
  quantity: number;
  unitPrice: number;
  availableStock: number;
  discount?: number;
}

