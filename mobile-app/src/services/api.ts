import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthTokens, ApiResponse } from '../types';

class ApiService {
  private api: AxiosInstance;
  private baseURL: string;

  constructor() {
    this.baseURL = __DEV__ 
      ? 'http://localhost:3000/api' 
      : 'https://api.healthcaresaas.com/api';
    
    this.api = axios.create({
      baseURL: this.baseURL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor to add auth token
    this.api.interceptors.request.use(
      async (config) => {
        const tokens = await this.getStoredTokens();
        if (tokens?.access_token) {
          config.headers.Authorization = `Bearer ${tokens.access_token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor to handle token refresh
    this.api.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            const tokens = await this.getStoredTokens();
            if (tokens?.refresh_token) {
              const newTokens = await this.refreshToken(tokens.refresh_token);
              await this.storeTokens(newTokens);
              
              originalRequest.headers.Authorization = `Bearer ${newTokens.access_token}`;
              return this.api(originalRequest);
            }
          } catch (refreshError) {
            // Refresh failed, redirect to login
            await this.clearStoredTokens();
            // You can emit an event here to notify the app to redirect to login
          }
        }

        return Promise.reject(error);
      }
    );
  }

  private async getStoredTokens(): Promise<AuthTokens | null> {
    try {
      const tokens = await AsyncStorage.getItem('auth_tokens');
      return tokens ? JSON.parse(tokens) : null;
    } catch (error) {
      console.error('Error getting stored tokens:', error);
      return null;
    }
  }

  private async storeTokens(tokens: AuthTokens): Promise<void> {
    try {
      await AsyncStorage.setItem('auth_tokens', JSON.stringify(tokens));
    } catch (error) {
      console.error('Error storing tokens:', error);
    }
  }

  private async clearStoredTokens(): Promise<void> {
    try {
      await AsyncStorage.removeItem('auth_tokens');
      await AsyncStorage.removeItem('user_profile');
    } catch (error) {
      console.error('Error clearing stored tokens:', error);
    }
  }

  private async refreshToken(refreshToken: string): Promise<AuthTokens> {
    const response = await axios.post(`${this.baseURL}/auth/refresh`, {
      refresh_token: refreshToken,
    });
    return response.data;
  }

  // Generic HTTP methods
  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response: AxiosResponse<ApiResponse<T>> = await this.api.get(url, config);
    return response.data.data;
  }

  async post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response: AxiosResponse<ApiResponse<T>> = await this.api.post(url, data, config);
    return response.data.data;
  }

  async put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response: AxiosResponse<ApiResponse<T>> = await this.api.put(url, data, config);
    return response.data.data;
  }

  async patch<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response: AxiosResponse<ApiResponse<T>> = await this.api.patch(url, data, config);
    return response.data.data;
  }

  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response: AxiosResponse<ApiResponse<T>> = await this.api.delete(url, config);
    return response.data.data;
  }

  // Auth methods
  async login(email: string, password: string): Promise<AuthTokens> {
    const response = await this.api.post('/auth/login', { email, password });
    const tokens = response.data.data;
    await this.storeTokens(tokens);
    return tokens;
  }

  async register(userData: any): Promise<AuthTokens> {
    const response = await this.api.post('/auth/register', userData);
    const tokens = response.data.data;
    await this.storeTokens(tokens);
    return tokens;
  }

  async logout(): Promise<void> {
    try {
      await this.api.post('/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      await this.clearStoredTokens();
    }
  }

  // User profile methods
  async getProfile(): Promise<any> {
    return this.get('/user/profile');
  }

  async updateProfile(profileData: any): Promise<any> {
    return this.patch('/user/profile', profileData);
  }

  // Appointments methods
  async getAppointments(params?: any): Promise<any[]> {
    return this.get('/appointments', { params });
  }

  async getAppointment(id: string): Promise<any> {
    return this.get(`/appointments/${id}`);
  }

  async bookAppointment(appointmentData: any): Promise<any> {
    return this.post('/appointments', appointmentData);
  }

  async rescheduleAppointment(id: string, newData: any): Promise<any> {
    return this.patch(`/appointments/${id}/reschedule`, newData);
  }

  async cancelAppointment(id: string, reason?: string): Promise<any> {
    return this.patch(`/appointments/${id}/cancel`, { reason });
  }

  async getAvailableSlots(providerId: string, date: string): Promise<any[]> {
    return this.get(`/appointments/available-slots`, {
      params: { provider_id: providerId, date }
    });
  }

  // Clinical records methods
  async getClinicalNotes(params?: any): Promise<any[]> {
    return this.get('/clinical/notes', { params });
  }

  async getClinicalNote(id: string): Promise<any> {
    return this.get(`/clinical/notes/${id}`);
  }

  async getTreatmentPlans(params?: any): Promise<any[]> {
    return this.get('/clinical/treatment-plans', { params });
  }

  async getTreatmentPlan(id: string): Promise<any> {
    return this.get(`/clinical/treatment-plans/${id}`);
  }

  // Billing methods
  async getInvoices(params?: any): Promise<any[]> {
    return this.get('/billing/invoices', { params });
  }

  async getInvoice(id: string): Promise<any> {
    return this.get(`/billing/invoices/${id}`);
  }

  async getPayments(params?: any): Promise<any[]> {
    return this.get('/billing/payments', { params });
  }

  async createPayment(paymentData: any): Promise<any> {
    return this.post('/billing/payments', paymentData);
  }

  // Notifications methods
  async getNotifications(params?: any): Promise<any[]> {
    return this.get('/notifications', { params });
  }

  async markNotificationAsRead(id: string): Promise<any> {
    return this.patch(`/notifications/${id}/read`);
  }

  async markAllNotificationsAsRead(): Promise<any> {
    return this.patch('/notifications/mark-all-read');
  }

  // Clinic methods
  async getClinicInfo(): Promise<any> {
    return this.get('/clinic/info');
  }

  async getProviders(): Promise<any[]> {
    return this.get('/clinic/providers');
  }

  async getServices(): Promise<any[]> {
    return this.get('/clinic/services');
  }

  // File upload methods
  async uploadFile(file: any, type: string): Promise<any> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);

    const response = await this.api.post('/files/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data.data;
  }

  // Health data methods
  async getHealthSummary(): Promise<any> {
    return this.get('/health/summary');
  }

  async updateHealthData(data: any): Promise<any> {
    return this.patch('/health/data', data);
  }
}

export const apiService = new ApiService();
export default apiService;
