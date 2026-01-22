// User types
export interface User {
  id: number;
  email: string;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
}

// Category types
export type CategoryType = 'income' | 'expense';

export interface Category {
  id: number;
  user_id: number;
  name: string;
  type: CategoryType;
  created_at: string;
  updated_at: string;
}

export interface CategoryRequest {
  name: string;
  type: CategoryType;
}

// Transaction types
export interface Transaction {
  id: number;
  user_id: number;
  category_id: number;
  category?: Category;
  amount: number;
  type: CategoryType;
  date: string;
  memo?: string;
  created_at: string;
  updated_at: string;
}

export interface TransactionRequest {
  category_id: number;
  amount: number;
  type: CategoryType;
  date: string;
  memo?: string;
}

export interface TransactionFilters {
  limit?: number;
  offset?: number;
  type?: CategoryType;
  start_date?: string;
  end_date?: string;
}

// Summary types
export interface MonthlySummary {
  year: number;
  month: number;
  income: number;
  expense: number;
  balance: number;
}

export interface CategorySummary {
  category_id: number;
  category_name: string;
  type: CategoryType;
  total: number;
  count: number;
}

export interface YearlySummary {
  year: number;
  income: number;
  expense: number;
  balance: number;
  monthly: MonthlySummary[];
}

// API response types
export interface ApiResponse<T> {
  data: T;
  total?: number;
  limit?: number;
  offset?: number;
}

export interface ApiError {
  error: string;
}

// Auth context types
export interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => void;
}
