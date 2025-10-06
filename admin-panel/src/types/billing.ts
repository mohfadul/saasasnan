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

// Sudan Payment System Enums
export enum PaymentProvider {
  BANK_OF_KHARTOUM = 'BankOfKhartoum',
  FAISAL_ISLAMIC_BANK = 'FaisalIslamicBank',
  OMDURMAN_NATIONAL_BANK = 'OmdurmanNationalBank',
  ZAIN_BEDE = 'ZainBede',
  CASHI = 'Cashi',
  CASH_ON_DELIVERY = 'CashOnDelivery',
  CASH_AT_BRANCH = 'CashAtBranch',
  OTHER = 'Other',
}

export enum PaymentStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  CONFIRMED = 'confirmed',
  COMPLETED = 'completed',
  FAILED = 'failed',
  REFUNDED = 'refunded',
  REJECTED = 'rejected',
  CANCELLED = 'cancelled',
}

export interface Payment {
  id: string;
  tenant_id: string;
  invoice_id?: string;
  payment_number: string;
  payment_date: string;
  payment_method: 'cash' | 'card' | 'bank_transfer' | 'check' | 'insurance' | 'online' | 'mobile_wallet' | string;
  amount: number;
  transaction_id?: string;
  reference_number?: string;
  gateway_response?: Record<string, any>;
  processing_fee?: number;
  payment_fee?: number;
  applied_to_invoice?: number;
  payment_status?: PaymentStatus | string;
  status: 'pending' | 'completed' | 'failed' | 'refunded' | 'cancelled';
  refunded_amount?: number;
  refunded_at?: string;
  refund_reason?: string;
  processed_at?: string;
  payer_info?: Record<string, any>;
  notes?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
  invoice?: Invoice;
  // Sudan Payment System Fields
  provider?: PaymentProvider | string;
  reference_id?: string;
  payer_name?: string;
  wallet_phone?: string;
  receipt_url?: string;
  reviewed_by?: string;
  reviewed_at?: string;
  admin_notes?: string;
  reviewed_by_user?: any;
  created_by_user?: any;
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

// Sudan Payment System Interfaces
export interface CreateSudanPaymentRequest {
  invoice_id: string;
  provider: PaymentProvider;
  reference_id: string;
  payer_name: string;
  wallet_phone?: string;
  amount: number;
  receipt_url?: string;
  notes?: string;
}

export interface UpdateSudanPaymentRequest {
  reference_id?: string;
  payer_name?: string;
  wallet_phone?: string;
  amount?: number;
  receipt_url?: string;
  notes?: string;
}

export interface ConfirmPaymentRequest {
  admin_notes?: string;
}

export interface RejectPaymentRequest {
  reason: string;
}

export interface PaymentAuditLog {
  id: string;
  tenant_id: string;
  payment_id: string;
  action: 'created' | 'confirmed' | 'rejected' | 'refunded' | 'updated' | 'status_changed';
  performed_by: string;
  previous_status?: string;
  new_status?: string;
  ip_address?: string;
  user_agent?: string;
  changes?: Record<string, any>;
  notes?: string;
  created_at: string;
  performed_by_user?: any;
}

export interface PaymentMethod {
  id: string;
  tenant_id: string;
  provider_code: string;
  provider_name: string;
  provider_type: 'bank_transfer' | 'mobile_wallet' | 'cash';
  is_active: boolean;
  requires_reference: boolean;
  requires_receipt: boolean;
  receipt_threshold?: number;
  validation_pattern?: string;
  icon_url?: string;
  instructions?: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export const PaymentProviderLabels: Record<PaymentProvider, string> = {
  [PaymentProvider.BANK_OF_KHARTOUM]: 'Bank of Khartoum',
  [PaymentProvider.FAISAL_ISLAMIC_BANK]: 'Faisal Islamic Bank',
  [PaymentProvider.OMDURMAN_NATIONAL_BANK]: 'Omdurman National Bank',
  [PaymentProvider.ZAIN_BEDE]: 'Zain Bede (زين بيدي)',
  [PaymentProvider.CASHI]: 'Cashi Agent Wallet',
  [PaymentProvider.CASH_ON_DELIVERY]: 'Cash on Delivery',
  [PaymentProvider.CASH_AT_BRANCH]: 'Cash at Branch',
  [PaymentProvider.OTHER]: 'Other',
};

export const PaymentProviderTypes: Record<PaymentProvider, 'bank' | 'wallet' | 'cash' | 'other'> = {
  [PaymentProvider.BANK_OF_KHARTOUM]: 'bank',
  [PaymentProvider.FAISAL_ISLAMIC_BANK]: 'bank',
  [PaymentProvider.OMDURMAN_NATIONAL_BANK]: 'bank',
  [PaymentProvider.ZAIN_BEDE]: 'wallet',
  [PaymentProvider.CASHI]: 'wallet',
  [PaymentProvider.CASH_ON_DELIVERY]: 'cash',
  [PaymentProvider.CASH_AT_BRANCH]: 'cash',
  [PaymentProvider.OTHER]: 'other',
};
