import type {
  ApiResponse,
  ApiError,
  AuthResponse,
  LoginRequest,
  RegisterRequest,
  User,
  Transaction,
  TransactionRequest,
  TransactionFilters,
  Category,
  CategoryRequest,
  CategoryType,
  MonthlySummary,
  CategorySummary,
  YearlySummary,
} from '../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

class ApiClient {
  private token: string | null = null;

  setToken(token: string | null) {
    this.token = token;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.token) {
      (headers as Record<string, string>)['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error: ApiError = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(error.error || `HTTP error ${response.status}`);
    }

    if (response.status === 204) {
      return {} as T;
    }

    return response.json();
  }

  // Auth endpoints
  async login(data: LoginRequest): Promise<AuthResponse> {
    return this.request<AuthResponse>('/api/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async register(data: RegisterRequest): Promise<AuthResponse> {
    return this.request<AuthResponse>('/api/v1/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getMe(): Promise<User> {
    return this.request<User>('/api/v1/auth/me');
  }

  async updateMe(name: string): Promise<User> {
    return this.request<User>('/api/v1/auth/me', {
      method: 'PUT',
      body: JSON.stringify({ name }),
    });
  }

  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    return this.request<void>('/api/v1/auth/password', {
      method: 'PUT',
      body: JSON.stringify({ current_password: currentPassword, new_password: newPassword }),
    });
  }

  // Transaction endpoints
  async getTransactions(filters?: TransactionFilters): Promise<ApiResponse<Transaction[]>> {
    const params = new URLSearchParams();
    if (filters?.limit) params.set('limit', filters.limit.toString());
    if (filters?.offset) params.set('offset', filters.offset.toString());
    if (filters?.type) params.set('type', filters.type);
    if (filters?.start_date) params.set('start_date', filters.start_date);
    if (filters?.end_date) params.set('end_date', filters.end_date);

    const query = params.toString();
    return this.request<ApiResponse<Transaction[]>>(`/api/v1/transactions${query ? `?${query}` : ''}`);
  }

  async getTransaction(id: number): Promise<Transaction> {
    return this.request<Transaction>(`/api/v1/transactions/${id}`);
  }

  async createTransaction(data: TransactionRequest): Promise<Transaction> {
    return this.request<Transaction>('/api/v1/transactions', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateTransaction(id: number, data: TransactionRequest): Promise<Transaction> {
    return this.request<Transaction>(`/api/v1/transactions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteTransaction(id: number): Promise<void> {
    return this.request<void>(`/api/v1/transactions/${id}`, {
      method: 'DELETE',
    });
  }

  // Category endpoints
  async getCategories(type?: CategoryType): Promise<ApiResponse<Category[]>> {
    const params = type ? `?type=${type}` : '';
    return this.request<ApiResponse<Category[]>>(`/api/v1/categories${params}`);
  }

  async createCategory(data: CategoryRequest): Promise<Category> {
    return this.request<Category>('/api/v1/categories', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Summary endpoints
  async getMonthlySummary(year?: number, month?: number): Promise<MonthlySummary> {
    const params = new URLSearchParams();
    if (year) params.set('year', year.toString());
    if (month) params.set('month', month.toString());
    const query = params.toString();
    return this.request<MonthlySummary>(`/api/v1/summary/monthly${query ? `?${query}` : ''}`);
  }

  async getCategorySummary(startDate?: string, endDate?: string): Promise<ApiResponse<CategorySummary[]>> {
    const params = new URLSearchParams();
    if (startDate) params.set('start_date', startDate);
    if (endDate) params.set('end_date', endDate);
    const query = params.toString();
    return this.request<ApiResponse<CategorySummary[]>>(`/api/v1/summary/category${query ? `?${query}` : ''}`);
  }

  async getYearlySummary(year?: number): Promise<YearlySummary> {
    const params = year ? `?year=${year}` : '';
    return this.request<YearlySummary>(`/api/v1/summary/yearly${params}`);
  }

  // Export
  async exportCSV(filters?: { start_date?: string; end_date?: string; type?: CategoryType }): Promise<Blob> {
    const params = new URLSearchParams();
    if (filters?.start_date) params.set('start_date', filters.start_date);
    if (filters?.end_date) params.set('end_date', filters.end_date);
    if (filters?.type) params.set('type', filters.type);

    const query = params.toString();
    const response = await fetch(`${API_URL}/api/v1/export/csv${query ? `?${query}` : ''}`, {
      headers: this.token ? { Authorization: `Bearer ${this.token}` } : {},
    });

    if (!response.ok) {
      throw new Error('Failed to export CSV');
    }

    return response.blob();
  }
}

export const apiClient = new ApiClient();
export default apiClient;
