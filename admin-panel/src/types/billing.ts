export interface Invoice {
  id: string;
  tenant_id: string;
  clinic_id: string;
  invoice_number: string;
  invoice_date: string;
  due_date: string;
  customer_type: 'patient' | 'insurance' | 'third_party';
  customer_id?: string;
  customer_info: Record<string, any>;
  subtotal: number;
  tax_amount: number;
  discount_amount: number;
  total_amount: number;
  paid_amount: number;
  balance_amount: number;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  payment_terms: number;
  payment_method?: string;
  payment_reference?: string;
  paid_date?: string;
  notes?: string;
  terms_and_conditions?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
  items?: InvoiceItem[];
  payments?: Payment[];
}

export interface InvoiceItem {
  id: string;
  invoice_id: string;
  description: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  item_type?: 'service' | 'product' | 'treatment' | 'procedure' | 'consultation';
  reference_id?: string;
  tax_rate: number;
  tax_amount: number;
  created_at: string;
  updated_at: string;
}

export interface Payment {
  id: string;
  tenant_id: string;
  invoice_id?: string;
  payment_number: string;
  payment_date: string;
  payment_method: 'cash' | 'card' | 'bank_transfer' | 'check' | 'insurance' | 'online';
  amount: number;
  transaction_id?: string;
  gateway_response?: Record<string, any>;
  processing_fee: number;
  status: 'pending' | 'completed' | 'failed' | 'refunded' | 'cancelled';
  notes?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
  invoice?: Invoice;
}

export interface InsuranceProvider {
  id: string;
  tenant_id: string;
  name: string;
  contact_info: Record<string, any>;
  coverage_details: Record<string, any>;
  copay_percentage: number;
  status: 'active' | 'inactive' | 'suspended';
  created_at: string;
  updated_at: string;
  patient_insurances?: PatientInsurance[];
}

export interface PatientInsurance {
  id: string;
  patient_id: string;
  insurance_provider_id: string;
  policy_number: string;
  group_number?: string;
  effective_date?: string;
  expiration_date?: string;
  copay_amount?: number;
  is_primary: boolean;
  status: 'active' | 'inactive' | 'expired';
  created_at: string;
  updated_at: string;
  patient?: any;
  insurance_provider?: InsuranceProvider;
}

export interface CreateInvoiceRequest {
  clinicId: string;
  customerType: 'patient' | 'insurance' | 'third_party';
  customerId?: string;
  customerInfo: Record<string, any>;
  items: {
    description: string;
    quantity: number;
    unitPrice: number;
    itemType?: 'service' | 'product' | 'treatment' | 'procedure' | 'consultation';
    referenceId?: string;
    taxRate?: number;
  }[];
  dueDate?: string;
  notes?: string;
  termsAndConditions?: string;
  paymentTerms?: number;
}

export interface CreatePaymentRequest {
  invoiceId?: string;
  paymentMethod: 'cash' | 'card' | 'bank_transfer' | 'check' | 'insurance' | 'online';
  amount: number;
  paymentDate?: string;
  transactionId?: string;
  gatewayResponse?: Record<string, any>;
  processingFee?: number;
  notes?: string;
}

export interface CreateInsuranceProviderRequest {
  name: string;
  contactInfo: Record<string, any>;
  coverageDetails?: Record<string, any>;
  copayPercentage?: number;
  status?: string;
}

export interface CreatePatientInsuranceRequest {
  patientId: string;
  insuranceProviderId: string;
  policyNumber: string;
  groupNumber?: string;
  effectiveDate?: string;
  expirationDate?: string;
  copayAmount?: number;
  isPrimary?: boolean;
  status?: string;
}

export interface BillingStats {
  invoices: {
    totalInvoices: number;
    statusStats: Record<string, number>;
    totalRevenue: number;
    outstandingAmount: number;
    averageInvoiceValue: number;
  };
  payments: {
    totalPayments: number;
    totalAmount: number;
    methodBreakdown: Record<string, { count: number; amount: number }>;
    averagePaymentAmount: number;
  };
  insurance: {
    totalProviders: number;
    activeProviders: number;
    inactiveProviders: number;
    totalPatientInsurances: number;
    primaryInsurances: number;
    expiredInsurances: number;
  };
  overdueInvoices: number;
  summary: {
    totalRevenue: number;
    outstandingAmount: number;
    totalPayments: number;
    overdueCount: number;
    collectionRate: string;
  };
}
