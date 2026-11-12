import { ApiResponse, ApiErrorResponse } from '@edusaas/api-contracts';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api/v1';

export class ApiClient {
  private static getHeaders(): HeadersInit {
    const token = localStorage.getItem('access_token');
    const tenantId = localStorage.getItem('tenant_id');

    return {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(tenantId ? { 'X-Tenant-ID': tenantId } : {}),
    };
  }

  static async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    const res = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'GET',
      headers: this.getHeaders(),
    });
    return this.handleResponse<T>(res);
  }

  static async post<T>(endpoint: string, body: unknown): Promise<ApiResponse<T>> {
    const res = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(body),
    });
    return this.handleResponse<T>(res);
  }

  private static async handleResponse<T>(res: Response): Promise<ApiResponse<T>> {
    const json = await res.json();
    if (!res.ok) {
      const err = json as ApiErrorResponse;
      throw new Error(err.message || 'API request failed');
    }
    return json as ApiResponse<T>;
  }
}
