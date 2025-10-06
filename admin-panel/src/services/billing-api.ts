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
    create: async (data: CreateInvoiceRequest): Promise<Invoice> => {
      const response = await apiClient.post('/billing/invoices', data);
      return response.data;
    },
    
    getAll: async (params?: {
      clinicId?: string;
      status?: string;
      customerType?: string;
      startDate?: string;
      endDate?: string;
    }): Promise<Invoice[]> => {
      // Only pass params object if it has values
      const config = params && Object.keys(params).length > 0 ? { params } : {};
      const response = await apiClient.get('/billing/invoices', config);
      return response.data;
    },
    
    getById: async (id: string): Promise<Invoice> => {
      const response = await apiClient.get(`/billing/invoices/${id}`);
      return response.data;
    },
    
    update: async (id: string, data: Partial<CreateInvoiceRequest>): Promise<Invoice> => {
      const response = await apiClient.patch(`/billing/invoices/${id}`, data);
      return response.data;
    },
    
    send: async (id: string): Promise<Invoice> => {
      const response = await apiClient.patch(`/billing/invoices/${id}/send`);
      return response.data;
    },
    
    markPaid: async (id: string): Promise<Invoice> => {
      const response = await apiClient.patch(`/billing/invoices/${id}/mark-paid`);
      return response.data;
    },
    
    delete: async (id: string): Promise<void> => {
      await apiClient.delete(`/billing/invoices/${id}`);
    },
    
    getOverdue: async (clinicId?: string): Promise<Invoice[]> => {
      const response = await apiClient.get('/billing/invoices/overdue', { params: { clinicId } });
      return response.data;
    },
    
    getStats: async (params?: {
      clinicId?: string;
      startDate?: string;
      endDate?: string;
    }): Promise<any> => {
      const response = await apiClient.get('/billing/invoices/stats', { params });
      return response.data;
    },
  },

  // Payment endpoints
  payments: {
    create: async (data: CreatePaymentRequest): Promise<Payment> => {
      const response = await apiClient.post('/billing/payments', data);
      return response.data;
    },
    
    getAll: async (params?: {
      invoiceId?: string;
      paymentMethod?: string;
      status?: string;
      startDate?: string;
      endDate?: string;
    }): Promise<Payment[]> => {
      const response = await apiClient.get('/billing/payments', { params });
      return response.data;
    },
    
    getById: async (id: string): Promise<Payment> => {
      const response = await apiClient.get(`/billing/payments/${id}`);
      return response.data;
    },
    
    update: async (id: string, data: Partial<CreatePaymentRequest>): Promise<Payment> => {
      const response = await apiClient.patch(`/billing/payments/${id}`, data);
      return response.data;
    },
    
    refund: async (id: string, amount: number, reason: string): Promise<Payment> => {
      const response = await apiClient.post(`/billing/payments/${id}/refund`, { amount, reason });
      return response.data;
    },
    
    delete: async (id: string): Promise<void> => {
      await apiClient.delete(`/billing/payments/${id}`);
    },
    
    getStats: async (params?: {
      startDate?: string;
      endDate?: string;
    }): Promise<any> => {
      const response = await apiClient.get('/billing/payments/stats', { params });
      return response.data;
    },
  },

  // Insurance Provider endpoints
  insuranceProviders: {
    create: async (data: CreateInsuranceProviderRequest): Promise<InsuranceProvider> => {
      const response = await apiClient.post('/billing/insurance-providers', data);
      return response.data;
    },
    
    getAll: async (status?: string): Promise<InsuranceProvider[]> => {
      const response = await apiClient.get('/billing/insurance-providers', { params: { status } });
      return response.data;
    },
    
    getById: async (id: string): Promise<InsuranceProvider> => {
      const response = await apiClient.get(`/billing/insurance-providers/${id}`);
      return response.data;
    },
    
    update: async (id: string, data: Partial<CreateInsuranceProviderRequest>): Promise<InsuranceProvider> => {
      const response = await apiClient.patch(`/billing/insurance-providers/${id}`, data);
      return response.data;
    },
    
    delete: async (id: string): Promise<void> => {
      await apiClient.delete(`/billing/insurance-providers/${id}`);
    },
  },

  // Patient Insurance endpoints
  patientInsurance: {
    create: async (data: CreatePatientInsuranceRequest): Promise<PatientInsurance> => {
      const response = await apiClient.post('/billing/patient-insurance', data);
      return response.data;
    },
    
    getByPatientId: async (patientId: string): Promise<PatientInsurance[]> => {
      const response = await apiClient.get(`/billing/patients/${patientId}/insurance`);
      return response.data;
    },
    
    update: async (id: string, data: Partial<CreatePatientInsuranceRequest>): Promise<PatientInsurance> => {
      const response = await apiClient.patch(`/billing/patient-insurance/${id}`, data);
      return response.data;
    },
    
    delete: async (id: string): Promise<void> => {
      await apiClient.delete(`/billing/patient-insurance/${id}`);
    },
  },

  // Billing overview and stats
  getOverview: async (): Promise<BillingStats> => {
    const response = await apiClient.get('/billing/overview');
    return response.data;
  },
  
  getInsuranceStats: async (): Promise<any> => {
    const response = await apiClient.get('/billing/insurance/stats');
    return response.data;
  },
};

// Export individual API sections for easier imports
export const invoicesApi = {
  getInvoices: billingApi.invoices.getAll,
  getInvoice: billingApi.invoices.getById,
  createInvoice: billingApi.invoices.create,
  updateInvoice: billingApi.invoices.update,
  deleteInvoice: billingApi.invoices.delete,
  sendInvoice: billingApi.invoices.send,
  markInvoicePaid: billingApi.invoices.markPaid,
  getOverdueInvoices: billingApi.invoices.getOverdue,
  getInvoiceStats: billingApi.invoices.getStats,
};

export const paymentsApi = {
  getPayments: billingApi.payments.getAll,
  getPayment: billingApi.payments.getById,
  createPayment: billingApi.payments.create,
  updatePayment: billingApi.payments.update,
  deletePayment: billingApi.payments.delete,
  refundPayment: billingApi.payments.refund,
  getPaymentStats: billingApi.payments.getStats,
};

export const insuranceProvidersApi = {
  getInsuranceProviders: billingApi.insuranceProviders.getAll,
  getInsuranceProvider: billingApi.insuranceProviders.getById,
  createInsuranceProvider: billingApi.insuranceProviders.create,
  updateInsuranceProvider: billingApi.insuranceProviders.update,
  deleteInsuranceProvider: billingApi.insuranceProviders.delete,
};

export const patientInsuranceApi = {
  getPatientInsurance: billingApi.patientInsurance.getByPatientId,
  createPatientInsurance: billingApi.patientInsurance.create,
  updatePatientInsurance: billingApi.patientInsurance.update,
  deletePatientInsurance: billingApi.patientInsurance.delete,
};