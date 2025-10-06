import axios, { AxiosResponse, AxiosError } from 'axios';

interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
}

interface LoginRequest {
  email: string;
  password: string;
  tenantId?: string;
}

interface RefreshTokenRequest {
  refresh_token: string;
}

class AuthApiService {
  private baseURL = process.env.REACT_APP_API_URL || 'http://localhost:3001';
  private refreshPromise: Promise<string> | null = null;

  constructor() {
    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor to add auth token
    axios.interceptors.request.use(
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

    // Response interceptor to handle token refresh
    axios.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const originalRequest = error.config as any;

        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            const newToken = await this.refreshAccessToken();
            if (newToken) {
              originalRequest.headers.Authorization = `Bearer ${newToken}`;
              return axios(originalRequest);
            }
          } catch (refreshError) {
            // Refresh failed, redirect to login
            this.handleAuthFailure();
            return Promise.reject(refreshError);
          }
        }

        return Promise.reject(error);
      }
    );
  }

  private async refreshAccessToken(): Promise<string | null> {
    // Prevent multiple simultaneous refresh attempts
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    const refreshToken = localStorage.getItem('refresh_token');
    if (!refreshToken) {
      this.handleAuthFailure();
      return null;
    }

    this.refreshPromise = this.performTokenRefresh(refreshToken).then(token => token || '');
    
    try {
      const newToken = await this.refreshPromise;
      return newToken || null;
    } finally {
      this.refreshPromise = null;
    }
  }

  private async performTokenRefresh(refreshToken: string): Promise<string | null> {
    try {
      const response: AxiosResponse<TokenResponse> = await axios.post(
        `${this.baseURL}/auth/refresh`,
        { refresh_token: refreshToken }
      );

      const { access_token, refresh_token: newRefreshToken } = response.data;

      // Update stored tokens
      localStorage.setItem('access_token', access_token);
      localStorage.setItem('refresh_token', newRefreshToken);

      return access_token;
    } catch (error) {
      console.error('Token refresh failed:', error);
      this.handleAuthFailure();
      return null;
    }
  }

  private handleAuthFailure() {
    // Clear stored tokens
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');

    // Redirect to login page
    window.location.href = '/login';
  }

  async login(credentials: LoginRequest): Promise<TokenResponse> {
    const response: AxiosResponse<TokenResponse> = await axios.post(
      `${this.baseURL}/auth/login`,
      credentials
    );

    const { access_token, refresh_token } = response.data;

    // Store tokens
    localStorage.setItem('access_token', access_token);
    localStorage.setItem('refresh_token', refresh_token);

    return response.data;
  }

  async logout(): Promise<void> {
    const refreshToken = localStorage.getItem('refresh_token');
    
    if (refreshToken) {
      try {
        await axios.post(`${this.baseURL}/auth/logout`, {
          refresh_token: refreshToken,
        });
      } catch (error) {
        console.error('Logout API call failed:', error);
      }
    }

    // Clear local storage regardless of API call success
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');

    // Redirect to login
    window.location.href = '/login';
  }

  async getProfile(): Promise<any> {
    const response = await axios.get(`${this.baseURL}/auth/profile`);
    return response.data;
  }

  // Utility methods
  isAuthenticated(): boolean {
    const token = localStorage.getItem('access_token');
    return !!token;
  }

  getAccessToken(): string | null {
    return localStorage.getItem('access_token');
  }

  getRefreshToken(): string | null {
    return localStorage.getItem('refresh_token');
  }

  // Check if token is expired (basic check)
  isTokenExpired(): boolean {
    const token = localStorage.getItem('access_token');
    if (!token) return true;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Math.floor(Date.now() / 1000);
      return payload.exp < currentTime;
    } catch (error) {
      return true;
    }
  }

  // Auto-refresh token before expiration
  async ensureValidToken(): Promise<string | null> {
    if (this.isTokenExpired()) {
      return await this.refreshAccessToken();
    }
    return this.getAccessToken();
  }
}

export const authApi = new AuthApiService();
export default authApi;

