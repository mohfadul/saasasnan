import axios from 'axios';
import { LoginRequest, AuthResponse, Patient, CreatePatientRequest, Appointment, CreateAppointmentRequest, Tenant } from '../types';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Export as apiClient for compatibility with other services
export const apiClient = api;

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('access_token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authApi = {
  login: async (credentials: LoginRequest): Promise<AuthResponse> => {
    const response = await api.post('/auth/login', credentials);
    return response.data;
  },

  getProfile: async () => {
    const response = await api.get('/auth/profile');
    return response.data;
  },
};

// Patients API
export const patientsApi = {
  getPatients: async (clinicId?: string): Promise<Patient[]> => {
    const params = clinicId ? { clinicId } : {};
    const response = await api.get('/patients', { params });
    return response.data;
  },

  getPatient: async (id: string): Promise<Patient> => {
    const response = await api.get(`/patients/${id}`);
    return response.data;
  },

  createPatient: async (patientData: CreatePatientRequest): Promise<Patient> => {
    const response = await api.post('/patients', patientData);
    return response.data;
  },

  updatePatient: async (id: string, patientData: Partial<CreatePatientRequest>): Promise<Patient> => {
    const response = await api.patch(`/patients/${id}`, patientData);
    return response.data;
  },

  deletePatient: async (id: string): Promise<void> => {
    await api.delete(`/patients/${id}`);
  },

  searchPatients: async (searchTerm: string, clinicId?: string): Promise<Patient[]> => {
    const params = { q: searchTerm, ...(clinicId && { clinicId }) };
    const response = await api.get('/patients/search', { params });
    return response.data;
  },

  getPatientStats: async (clinicId?: string) => {
    const params = clinicId ? { clinicId } : {};
    const response = await api.get('/patients/stats', { params });
    return response.data;
  },
};

// Appointments API
export const appointmentsApi = {
  getAppointments: async (params?: {
    clinicId?: string;
    providerId?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<Appointment[]> => {
    const response = await api.get('/appointments', { params });
    return response.data;
  },

  getAppointment: async (id: string): Promise<Appointment> => {
    const response = await api.get(`/appointments/${id}`);
    return response.data;
  },

  createAppointment: async (appointmentData: CreateAppointmentRequest): Promise<Appointment> => {
    const response = await api.post('/appointments', appointmentData);
    return response.data;
  },

  updateAppointment: async (id: string, appointmentData: Partial<CreateAppointmentRequest>): Promise<Appointment> => {
    const response = await api.patch(`/appointments/${id}`, appointmentData);
    return response.data;
  },

  cancelAppointment: async (id: string, reason: string): Promise<Appointment> => {
    const response = await api.patch(`/appointments/${id}/cancel`, { reason });
    return response.data;
  },

  deleteAppointment: async (id: string): Promise<void> => {
    await api.delete(`/appointments/${id}`);
  },

  getProviderSchedule: async (providerId: string, date: string): Promise<Appointment[]> => {
    const response = await api.get(`/appointments/schedule/${providerId}`, { params: { date } });
    return response.data;
  },

  getAppointmentStats: async (params?: {
    clinicId?: string;
    startDate?: string;
    endDate?: string;
  }) => {
    const response = await api.get('/appointments/stats', { params });
    return response.data;
  },
};

// Tenants API
export const tenantsApi = {
  getTenants: async (): Promise<Tenant[]> => {
    const response = await api.get('/tenants');
    return response.data;
  },

  getTenant: async (id: string): Promise<Tenant> => {
    const response = await api.get(`/tenants/${id}`);
    return response.data;
  },

  getTenantStats: async (id: string) => {
    const response = await api.get(`/tenants/${id}/stats`);
    return response.data;
  },
};

export default api;
