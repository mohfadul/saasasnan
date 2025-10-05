import { apiClient } from './api';
import {
  Invoice,
  Payment,
  InsuranceProvider,
  PatientInsurance,
  CreateInvoiceRequest,
  CreatePaymentRequest,
  CreateInsuranceProviderRequest,
  CreatePatientInsuranceRequest,
  BillingStats,
} from '../types/billing';

export const billingApi = {
  // Invoice endpoints
  invoices: {
    create: (data: CreateInvoiceRequest): Promise<Invoice> =>
      apiClient.post('/billing/invoices', data),
    
    getAll: (params?: {
      clinicId?: string;
      status?: string;
      customerType?: string;
      startDate?: string;
      endDate?: string;
    }): Promise<Invoice[]> =>
      apiClient.get('/billing/invoices', { params }),
    
    getById: (id: string): Promise<Invoice> =>
      apiClient.get(`/billing/invoices/${id}`),
    
    update: (id: string, data: Partial<CreateInvoiceRequest>): Promise<Invoice> =>
      apiClient.patch(`/billing/invoices/${id}`, data),
    
    send: (id: string): Promise<Invoice> =>
      apiClient.patch(`/billing/invoices/${id}/send`),
    
    markPaid: (id: string): Promise<Invoice> =>
      apiClient.patch(`/billing/invoices/${id}/mark-paid`),
    
    delete: (id: string): Promise<void> =>
      apiClient.delete(`/billing/invoices/${id}`),
    
    getOverdue: (clinicId?: string): Promise<Invoice[]> =>
      apiClient.get('/billing/invoices/overdue', { params: { clinicId } }),
    
    getStats: (params?: {
      clinicId?: string;
      startDate?: string;
      endDate?: string;
    }): Promise<any> =>
      apiClient.get('/billing/invoices/stats', { params }),
  },

  // Payment endpoints
  payments: {
    create: (data: CreatePaymentRequest): Promise<Payment> =>
      apiClient.post('/billing/payments', data),
    
    getAll: (params?: {
      invoiceId?: string;
      paymentMethod?: string;
      status?: string;
      startDate?: string;
      endDate?: string;
    }): Promise<Payment[]> =>
      apiClient.get('/billing/payments', { params }),
    
    getById: (id: string): Promise<Payment> =>
      apiClient.get(`/billing/payments/${id}`),
    
    update: (id: string, data: Partial<CreatePaymentRequest>): Promise<Payment> =>
      apiClient.patch(`/billing/payments/${id}`, data),
    
    refund: (id: string, amount: number, reason: string): Promise<Payment> =>
      apiClient.post(`/billing/payments/${id}/refund`, { amount, reason }),
    
    delete: (id: string): Promise<void> =>
      apiClient.delete(`/billing/payments/${id}`),
    
    getStats: (params?: {
      startDate?: string;
      endDate?: string;
    }): Promise<any> =>
      apiClient.get('/billing/payments/stats', { params }),
  },

  // Insurance Provider endpoints
  insuranceProviders: {
    create: (data: CreateInsuranceProviderRequest): Promise<InsuranceProvider> =>
      apiClient.post('/billing/insurance-providers', data),
    
    getAll: (status?: string): Promise<InsuranceProvider[]> =>
      apiClient.get('/billing/insurance-providers', { params: { status } }),
    
    getById: (id: string): Promise<InsuranceProvider> =>
      apiClient.get(`/billing/insurance-providers/${id}`),
    
    update: (id: string, data: Partial<CreateInsuranceProviderRequest>): Promise<InsuranceProvider> =>
      apiClient.patch(`/billing/insurance-providers/${id}`, data),
    
    delete: (id: string): Promise<void> =>
      apiClient.delete(`/billing/insurance-providers/${id}`),
  },

  // Patient Insurance endpoints
  patientInsurance: {
    create: (data: CreatePatientInsuranceRequest): Promise<PatientInsurance> =>
      apiClient.post('/billing/patient-insurance', data),
    
    getByPatientId: (patientId: string): Promise<PatientInsurance[]> =>
      apiClient.get(`/billing/patients/${patientId}/insurance`),
    
    update: (id: string, data: Partial<CreatePatientInsuranceRequest>): Promise<PatientInsurance> =>
      apiClient.patch(`/billing/patient-insurance/${id}`, data),
    
    delete: (id: string): Promise<void> =>
      apiClient.delete(`/billing/patient-insurance/${id}`),
  },

  // Billing overview and stats
  getOverview: (): Promise<BillingStats> =>
    apiClient.get('/billing/overview'),
  
  getInsuranceStats: (): Promise<any> =>
    apiClient.get('/billing/insurance/stats'),
};
