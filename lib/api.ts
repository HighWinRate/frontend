/**
 * API Client for connecting to Backend
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

// Types
export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: 'user' | 'admin';
}

export interface AuthResponse {
  access_token: string;
  user: User;
}

export interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  winrate: number;
  trading_style?: string;
  trading_session?: string;
  keywords?: string[];
  is_active: boolean;
  created_at: string;
  courses?: Course[];
  files?: File[];
}

export interface Course {
  id: string;
  title: string;
  description: string;
  markdown_content?: string;
  keywords?: string[];
  duration_minutes?: number;
  files?: File[];
}

export interface File {
  id: string;
  name: string;
  type: string;
  size: number;
  isFree: boolean;
  path: string;
  created_at: string;
}

export interface Transaction {
  id: string;
  user_id?: string;
  product_id?: string;
  product?: Product;
  amount: number;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  ref_id?: string;
  refId?: string;
  cryptoAddress?: string;
  crypto_amount?: number;
  cryptoAmount?: number;
  crypto_currency?: string;
  cryptoCurrency?: string;
  tx_hash?: string;
  gateway?: string;
  discount_amount?: number;
  discount_code?: DiscountCode | null;
  paid_at?: string | null;
  created_at: string;
}

export interface DiscountCode {
  id: string;
  code: string;
  amount: number;
  type: 'percentage' | 'fixed';
  is_active: boolean;
  max_uses?: number;
  current_uses?: number;
  start_date?: string;
  end_date?: string;
  description?: string;
  minimum_amount?: number;
}

export interface DiscountValidation {
  isValid: boolean;
  discountAmount: number;
  finalPrice: number;
  discountCode?: DiscountCode;
  message?: string;
}

export class ApiClient {
  private baseUrl: string;
  private token: string | null = null;

  constructor(baseUrl: string = API_URL) {
    this.baseUrl = baseUrl;
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('token');
    }
  }

  setToken(token: string | null) {
    this.token = token;
    if (typeof window !== 'undefined') {
      if (token) {
        localStorage.setItem('token', token);
      } else {
        localStorage.removeItem('token');
      }
    }
  }

  getToken(): string | null {
    return this.token;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const config: RequestInit = {
      headers,
      ...options,
    };

    try {
      const response = await fetch(url, config);

      if (response.status === 401) {
        // Unauthorized - clear token
        this.setToken(null);
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
        throw new Error('Unauthorized');
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message || `HTTP error! status: ${response.status}`
        );
      }

      return await response.json();
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      const isNetworkError =
        error instanceof TypeError &&
        (errorMessage === 'Failed to fetch' ||
          errorMessage.includes('fetch') ||
          errorMessage.includes('network'));

      // Handle network/fetch errors specifically
      if (isNetworkError) {
        const networkError = new Error(
          `Unable to connect to the API server at ${url}. Please ensure the backend server is running at ${this.baseUrl}`
        );
        networkError.name = 'NetworkError';
        // Preserve original error as cause if available
        if (error instanceof Error) {
          networkError.cause = error;
        }

        // Log error details separately to ensure they're captured
        const errorDetails: Record<string, unknown> = {
          url,
          baseUrl: this.baseUrl,
          message: networkError.message,
          originalError: errorMessage,
        };

        if (error instanceof Error) {
          errorDetails.errorName = error.name;
          errorDetails.errorMessage = error.message;
          errorDetails.errorStack = error.stack;
        } else {
          errorDetails.error = String(error);
        }

        console.error('API request failed - Network error:', errorDetails);
        throw networkError;
      }

      // Handle other fetch errors
      if (error instanceof TypeError) {
        const fetchError = new Error(
          `Network request failed: ${errorMessage}. Please check your connection and ensure the server is running.`
        );
        fetchError.name = 'FetchError';
        fetchError.cause = error;

        const errorDetails: Record<string, unknown> = {
          url,
          baseUrl: this.baseUrl,
          message: fetchError.message,
          originalError: errorMessage,
          errorName: error.name,
          errorMessage: error.message,
          errorStack: error.stack,
        };

        console.error('API request failed - Fetch error:', errorDetails);
        throw fetchError;
      }

      // Handle other errors
      const errorDetails: Record<string, unknown> = {
        url,
        baseUrl: this.baseUrl,
        message: errorMessage,
      };

      if (error instanceof Error) {
        errorDetails.errorName = error.name;
        errorDetails.errorMessage = error.message;
        errorDetails.errorStack = error.stack;
      } else {
        errorDetails.error = String(error);
      }

      console.error('API request failed:', errorDetails);
      throw error;
    }
  }

  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  async post<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async patch<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async put<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }

  // Auth endpoints
  async register(data: {
    email: string;
    password: string;
    first_name: string;
    last_name: string;
  }): Promise<AuthResponse> {
    const response = await this.post<AuthResponse>('/auth/register', data);
    if (response.access_token) {
      this.setToken(response.access_token);
    }
    return response;
  }

  async login(data: {
    email: string;
    password: string;
  }): Promise<AuthResponse> {
    const response = await this.post<AuthResponse>('/auth/login', data);
    if (response.access_token) {
      this.setToken(response.access_token);
    }
    return response;
  }

  logout() {
    this.setToken(null);
  }

  // Product endpoints
  async getProducts(): Promise<Product[]> {
    return this.get<Product[]>('/product');
  }

  async getProduct(id: string): Promise<Product> {
    return this.get<Product>(`/product/${id}`);
  }

  // Course endpoints
  async getCourses(): Promise<Course[]> {
    return this.get<Course[]>('/course');
  }

  async getCourse(id: string): Promise<Course> {
    return this.get<Course>(`/course/${id}`);
  }

  async getUserCourses(userId: string): Promise<Course[]> {
    return this.get<Course[]>(`/user/${userId}/courses`);
  }

  // Transaction endpoints
  async initiateCryptoPayment(data: {
    productId: string;
    cryptoCurrency: string;
    cryptoAmount?: number;
    discountCode?: string;
  }): Promise<{
    transactionId: string;
    refId: string;
    cryptoAddress: string;
    cryptoAmount: number;
    cryptoCurrency: string;
    originalPrice: number;
    discountAmount?: number;
    finalPrice: number;
    status: string;
    message: string;
  }> {
    return this.post('/transaction/initiate-crypto-payment', data);
  }

  async getOwnedProducts(userId: string): Promise<Product[]> {
    return this.get<Product[]>(`/transaction/owned/${userId}`);
  }

  async getMyTransactions(): Promise<Transaction[]> {
    return this.get<Transaction[]>(`/transaction/my`);
  }

  // Discount endpoints
  async validateDiscount(
    code: string,
    productId: string
  ): Promise<DiscountValidation> {
    return this.post<DiscountValidation>('/discount/validate', {
      code,
      productId,
    });
  }

  // File endpoints
  async getUserFiles(userId: string): Promise<File[]> {
    return this.get<File[]>(`/user/${userId}/files`);
  }

  getFileUrl(fileId: string): string {
    return `${this.baseUrl}/file/serve/${fileId}`;
  }

  // User endpoints
  async getUser(id: string): Promise<User> {
    return this.get<User>(`/user/${id}`);
  }
}

export const apiClient = new ApiClient();
