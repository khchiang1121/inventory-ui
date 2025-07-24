import axios from 'axios';
import type { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import { API_CONFIG, STORAGE_KEYS, ERROR_MESSAGES } from '../../constants';
import type { ApiError, AuthTokens } from '../../types';

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_CONFIG.BASE_URL,
      timeout: API_CONFIG.TIMEOUT,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor to add auth Token
    this.client.interceptors.request.use(
      (config) => {
        const token = this.getAccessBearer();
        if (token) {
          config.headers.Authorization = `Token ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor to handle Bearer refresh and errors
    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };

        // Handle 401 errors - redirect to login for simple token auth
        if (error.response?.status === 401 && !originalRequest._retry) {
          this.clearBearers();
          window.location.href = '/login';
          return Promise.reject(error);
        }

        return Promise.reject(this.handleError(error));
      }
    );
  }

  // Note: Queue processing not needed for simple token authentication

  private handleError(error: AxiosError): ApiError {
    if (!error.response) {
      return {
        message: ERROR_MESSAGES.NETWORK_ERROR,
        status: 0,
      };
    }

    const { status, data } = error.response;
    let message: string;

    switch (status) {
      case 400:
        message = ERROR_MESSAGES.VALIDATION_ERROR;
        break;
      case 401:
        message = ERROR_MESSAGES.UNAUTHORIZED;
        break;
      case 403:
        message = ERROR_MESSAGES.FORBIDDEN;
        break;
      case 404:
        message = ERROR_MESSAGES.NOT_FOUND;
        break;
      case 500:
        message = ERROR_MESSAGES.SERVER_ERROR;
        break;
      default:
        message = ERROR_MESSAGES.UNKNOWN_ERROR;
    }

    return {
      message: (data as any)?.message || message,
      status,
      details: (data as any)?.errors || (data as any)?.detail,
    };
  }

  // Token management methods
  private getAccessBearer(): string | null {
    return localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
  }

  // Note: Simple token authentication doesn't use refresh tokens

  public setBearers(tokens: AuthTokens): void {
    localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, tokens.access);
    localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, tokens.refresh);
  }

  public setTokens(tokens: AuthTokens): void {
    this.setBearers(tokens);
  }

  public clearBearers(): void {
    localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
    // Note: Simple token authentication doesn't use refresh tokens
  }

  public isAuthenticated(): boolean {
    return !!this.getAccessBearer();
  }

  // HTTP methods
  public async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response: AxiosResponse<T> = await this.client.get(url, config);
    return response.data;
  }

  public async post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response: AxiosResponse<T> = await this.client.post(url, data, config);
    return response.data;
  }

  public async put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response: AxiosResponse<T> = await this.client.put(url, data, config);
    return response.data;
  }

  public async patch<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response: AxiosResponse<T> = await this.client.patch(url, data, config);
    return response.data;
  }

  public async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response: AxiosResponse<T> = await this.client.delete(url, config);
    return response.data;
  }

  // Utility methods for handling paginated responses
  public async getPaginated<T>(
    url: string,
    params?: Record<string, any>
  ): Promise<{ results: T[]; count: number; next: string | null; previous: string | null }> {
    const response = await this.get<{
      results: T[];
      count: number;
      next: string | null;
      previous: string | null;
    }>(url, { params });
    return response;
  }

  // File upload method
  public async uploadFile<T>(
    url: string,
    file: File,
    onProgress?: (progressEvent: any) => void
  ): Promise<T> {
    const formData = new FormData();
    formData.append('file', file);

    const response: AxiosResponse<T> = await this.client.post(url, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: onProgress,
    });

    return response.data;
  }

  // Bulk operation methods
  public async bulkCreate<T>(url: string, data: any[]): Promise<T[]> {
    const response: AxiosResponse<T[]> = await this.client.post(`${url}bulk_create/`, data);
    return response.data;
  }

  public async bulkUpdate<T>(url: string, data: any[]): Promise<T[]> {
    const response: AxiosResponse<T[]> = await this.client.patch(`${url}bulk_update/`, data);
    return response.data;
  }

  public async bulkDelete(url: string, ids: string[]): Promise<void> {
    await this.client.delete(`${url}bulk_delete/`, { data: { ids } });
  }

  // Health check method
  public async healthCheck(): Promise<{ status: string; timestamp: string }> {
    return this.get('/health/');
  }

  // Method to get raw axios instance for custom requests
  public getClient(): AxiosInstance {
    return this.client;
  }
}

// Create and export a singleton instance
export const apiClient = new ApiClient();
export default apiClient;