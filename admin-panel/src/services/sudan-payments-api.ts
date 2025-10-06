import api from './api';
import {
  Payment,
  CreateSudanPaymentRequest,
  ConfirmPaymentRequest,
  RejectPaymentRequest,
  PaymentAuditLog,
} from '../types/billing';

export const sudanPaymentsApi = {
  // User-facing: Create a pending payment
  createPayment: async (data: CreateSudanPaymentRequest): Promise<Payment> => {
    const response = await api.post('/payments', data);
    return response.data;
  },

  // User-facing: Get payment by ID
  getPayment: async (id: string): Promise<Payment> => {
    const response = await api.get(`/payments/${id}`);
    return response.data;
  },

  // User-facing: Get payment audit log
  getPaymentAuditLog: async (id: string): Promise<PaymentAuditLog[]> => {
    const response = await api.get(`/payments/${id}/audit-log`);
    return response.data;
  },

  // Admin: Get all pending payments
  getPendingPayments: async (filters?: {
    provider?: string;
    payer_name?: string;
    reference_id?: string;
    start_date?: string;
    end_date?: string;
  }): Promise<Payment[]> => {
    const response = await api.get('/payments/admin/pending', { params: filters });
    return response.data;
  },

  // Admin: Confirm payment
  confirmPayment: async (id: string, data?: ConfirmPaymentRequest): Promise<Payment> => {
    const response = await api.post(`/payments/admin/${id}/confirm`, data || {});
    return response.data;
  },

  // Admin: Reject payment
  rejectPayment: async (id: string, data: RejectPaymentRequest): Promise<Payment> => {
    const response = await api.post(`/payments/admin/${id}/reject`, data);
    return response.data;
  },
};

export default sudanPaymentsApi;

