/**
 * API Client for connecting to Backend
 */

// Get API URL from environment variable
// In Next.js, environment variables prefixed with NEXT_PUBLIC_ are available in the browser
const API_URL = 
  typeof window !== 'undefined' 
    ? (window as any).__NEXT_DATA__?.env?.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'
    : process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

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
  backtest_trades_count?: number;
  markdown_description?: string;
  backtest_results?: any;
  thumbnail?: string;
  is_active: boolean;
  sort_order?: number;
  discountedPrice?: number;
  discountExpiresAt?: string;
  created_at: string;
  courses?: Course[];
  files?: File[];
  category?: Category;
}

export interface Category {
  id: string;
  name: string;
  description?: string;
  slug?: string;
  icon?: string;
  is_active?: boolean;
}

export interface Course {
  id: string;
  title: string;
  description: string;
  markdown_description?: string;
  markdown_content?: string;
  keywords?: string[];
  duration_minutes?: number;
  thumbnail?: string;
  is_active?: boolean;
  sort_order?: number;
  category?: Category;
  files?: File[];
  created_at?: string;
}

export interface File {
  id: string;
  name: string;
  type: string;
  size: number;
  isFree: boolean;
  path: string;
  mimetype?: string;
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

export type TicketStatus = 'open' | 'in_progress' | 'waiting_for_user' | 'resolved' | 'closed';
export type TicketPriority = 'low' | 'medium' | 'high' | 'urgent';
export type TicketType = 'technical' | 'billing' | 'general' | 'feature_request' | 'bug_report';
export type MessageType = 'user' | 'support' | 'system';

export interface Ticket {
  id: string;
  subject: string;
  description: string;
  status: TicketStatus;
  priority: TicketPriority;
  type: TicketType;
  reference_number?: string;
  user?: User;
  assigned_to?: User | null;
  messages?: TicketMessage[];
  resolved_at?: string | null;
  closed_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface TicketMessage {
  id: string;
  content: string;
  type: MessageType;
  is_internal: boolean;
  user?: User | null;
  ticket?: Ticket;
  created_at: string;
  updated_at: string;
}

export interface TicketListResponse {
  tickets: Ticket[];
  total: number;
  page: number;
  totalPages: number;
}

export interface TicketStatistics {
  total: number;
  open: number;
  in_progress: number;
  waiting_for_user: number;
  resolved: number;
  closed: number;
  by_priority: {
    low: number;
    medium: number;
    high: number;
    urgent: number;
  };
  by_type: {
    technical: number;
    billing: number;
    general: number;
    feature_request: number;
    bug_report: number;
  };
}

export class ApiClient {
  private baseUrl: string;
  private token: string | null = null;

  constructor(baseUrl: string = API_URL) {
    // Ensure baseUrl doesn't end with a slash
    this.baseUrl = baseUrl.replace(/\/$/, '');
    
    // Log the base URL for debugging
    if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
      console.log('[ApiClient] Initialized with baseUrl:', this.baseUrl);
      console.log('[ApiClient] NEXT_PUBLIC_API_URL:', process.env.NEXT_PUBLIC_API_URL);
    }
    
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
    // Always check localStorage to ensure sync
    if (typeof window !== 'undefined') {
      const storedToken = localStorage.getItem('token');
      if (storedToken !== this.token) {
        this.token = storedToken;
      }
    }
    return this.token;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    // Ensure endpoint starts with /
    const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    const url = `${this.baseUrl}${normalizedEndpoint}`;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache', // Prevent 304 responses
      ...(options.headers as Record<string, string>),
    };

    // Always get fresh token from localStorage to ensure sync
    const token = this.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const config: RequestInit = {
      headers,
      cache: 'no-store', // Prevent browser caching
      ...options,
    };

    try {
      // Log request for debugging (only in development)
      if (process.env.NODE_ENV === 'development') {
        console.log('[API Request]', {
          method: config.method || 'GET',
          url,
          baseUrl: this.baseUrl,
          endpoint,
          headers: Object.keys(headers),
          config: {
            method: config.method,
            cache: config.cache,
            credentials: config.credentials,
          },
        });
      }
      
      // Test if URL is reachable before making the request
      if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
        try {
          // Quick connectivity test
          const testUrl = new URL(url);
          console.log('[API] Testing connectivity to:', testUrl.origin);
        } catch (urlError) {
          console.error('[API] Invalid URL:', url, urlError);
        }
      }
      
      let response: Response;
      try {
        response = await fetch(url, config);
      } catch (fetchError) {
        // Log fetch error immediately with full details
        console.error('[API Fetch Error]', {
          fetchError,
          errorType: fetchError?.constructor?.name,
          errorMessage: fetchError instanceof Error ? fetchError.message : String(fetchError),
          errorStack: fetchError instanceof Error ? fetchError.stack : undefined,
          url,
          baseUrl: this.baseUrl,
          endpoint,
          config: {
            method: config.method,
            headers: Object.keys(headers),
            cache: config.cache,
          },
        });
        throw fetchError; // Re-throw to be caught by outer catch
      }
      
      // Log response for debugging (only in development)
      if (process.env.NODE_ENV === 'development') {
        console.log('[API Response]', {
          status: response.status,
          statusText: response.statusText,
          url: response.url,
          ok: response.ok,
          headers: Object.fromEntries(response.headers.entries()),
        });
      }

      if (response.status === 401) {
        // Unauthorized - clear token
        this.setToken(null);
        // Don't redirect automatically - let the component handle it
        // This prevents redirect loops
        throw new Error('Unauthorized');
      }
      
      if (response.status === 403) {
        // Forbidden - might be role issue, don't clear token immediately
        // Let the component handle it
        const errorData = await response.json().catch(() => ({}));
        const error = new Error(errorData.message || 'Forbidden - Access denied');
        (error as any).status = 403;
        (error as any).data = errorData;
        throw error;
      }

      // Handle 304 Not Modified - return cached data or empty response
      if (response.status === 304) {
        // For 304, the browser should use cached data
        // But if we're here, we need to handle it gracefully
        // Try to parse as JSON if content-type suggests it, otherwise return empty
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          try {
            return await response.json();
          } catch {
            // If body is empty (which is normal for 304), return empty array/object based on expected type
            return [] as T;
          }
        }
        return [] as T;
      }

      if (!response.ok) {
        let errorData: any = {};
        const contentType = response.headers.get('content-type');
        
        try {
          if (contentType && contentType.includes('application/json')) {
            errorData = await response.json();
          } else {
            const text = await response.text();
            errorData = { message: text || `HTTP error! status: ${response.status}` };
          }
        } catch (parseError) {
          errorData = { message: `HTTP error! status: ${response.status} ${response.statusText}` };
        }
        
        const errorMessage = errorData.message || errorData.error || `HTTP error! status: ${response.status}`;
        const error = new Error(errorMessage);
        (error as any).status = response.status;
        (error as any).data = errorData;
        throw error;
      }

      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        return await response.json();
      } else {
        const text = await response.text();
        return text as T;
      }
    } catch (error) {
      // Log the full error for debugging
      console.error('[API Error] Full error details:', {
        error,
        errorType: error?.constructor?.name,
        errorMessage: error instanceof Error ? error.message : String(error),
        errorStack: error instanceof Error ? error.stack : undefined,
        url,
        baseUrl: this.baseUrl,
      });
      
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      
      // Check for network errors (CORS, connection refused, etc.)
      const isNetworkError =
        error instanceof TypeError &&
        (errorMessage === 'Failed to fetch' ||
          errorMessage.includes('fetch') ||
          errorMessage.includes('network') ||
          errorMessage.includes('CORS') ||
          errorMessage.includes('ERR_CONNECTION_REFUSED') ||
          errorMessage.includes('ERR_NETWORK') ||
          errorMessage.includes('NetworkError') ||
          errorMessage.includes('Network request failed'));

      // Handle network/fetch errors specifically
      if (isNetworkError) {
        // More detailed error message
        let detailedMessage = `Unable to connect to the API server at ${url}. `;
        detailedMessage += `Please ensure the backend server is running at ${this.baseUrl}. `;
        
        // Add CORS hint if it's a CORS-related error
        if (errorMessage.includes('CORS') || errorMessage.includes('Access-Control')) {
          detailedMessage += `This might be a CORS issue. Check that FRONTEND_URL in backend/.env includes ${typeof window !== 'undefined' ? window.location.origin : 'your frontend URL'}.`;
        }
        
        const networkError = new Error(detailedMessage);
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

      // Handle HTTP errors (from response)
      if (error instanceof Error && (error as any).status) {
        const httpError = error;
        const errorDetails: Record<string, unknown> = {
          url,
          baseUrl: this.baseUrl,
          message: httpError.message,
          status: (httpError as any).status,
          data: (httpError as any).data,
        };
        console.error('API request failed - HTTP error:', errorDetails);
        throw httpError;
      }

      // Handle other errors
      const errorDetails: Record<string, unknown> = {
        url,
        baseUrl: this.baseUrl,
        message: errorMessage,
        errorType: typeof error,
      };

      if (error instanceof Error) {
        errorDetails.errorName = error.name;
        errorDetails.errorMessage = error.message;
        errorDetails.errorStack = error.stack;
        // Add any additional properties
        if ((error as any).status) {
          errorDetails.status = (error as any).status;
        }
        if ((error as any).data) {
          errorDetails.data = (error as any).data;
        }
      } else {
        errorDetails.error = String(error);
        errorDetails.errorStringified = JSON.stringify(error);
      }

      console.error('API request failed:', errorDetails);
      
      // Create a proper error object if needed
      if (!(error instanceof Error)) {
        const newError = new Error(errorMessage);
        (newError as any).originalError = error;
        throw newError;
      }
      
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

  getProductThumbnailUrl(productId: string): string {
    return `${this.baseUrl}/product/${productId}/thumbnail`;
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

  getFileStreamUrl(fileId: string, view: boolean = false): string {
    // Get file URL with token if available (for authentication)
    const url = `${this.baseUrl}/file/serve/${fileId}`;
    const token = this.getToken();
    const params = new URLSearchParams();
    
    // Add view parameter if needed (for PDF viewing in browser)
    if (view) {
      params.append('view', 'true');
    }
    
    // For video/audio streaming, we need to add token to URL as query parameter
    // because video/audio tags can't send custom headers
    if (token) {
      params.append('token', token);
    }
    
    const queryString = params.toString();
    return queryString ? `${url}?${queryString}` : url;
  }

  async downloadFile(fileId: string): Promise<void> {
    const url = `${this.baseUrl}/file/serve/${fileId}`;
    const headers: Record<string, string> = {};
    
    // Token is optional - free files can be downloaded without authentication
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers,
      });

      // Only redirect to login if we had a token and got 401 (token expired/invalid)
      // For free files, 401 shouldn't happen, but if it does, we don't redirect
      if (response.status === 401 && this.token) {
        this.setToken(null);
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
        throw new Error('Unauthorized');
      }

      if (!response.ok) {
        // Try to get error message from response
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message || `HTTP error! status: ${response.status}`
        );
      }

      // Get filename from Content-Disposition header or use fileId
      const contentDisposition = response.headers.get('Content-Disposition');
      let filename = `file-${fileId}`;
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="?(.+?)"?$/);
        if (filenameMatch) {
          filename = filenameMatch[1];
        }
      }

      // Create blob and download
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error('Error downloading file:', error);
      throw error;
    }
  }

  // User endpoints
  async getUser(id: string): Promise<User> {
    return this.get<User>(`/user/${id}`);
  }

  async updateUser(id: string, data: {
    first_name?: string;
    last_name?: string;
    email?: string;
    password?: string;
  }): Promise<User> {
    return this.patch<User>(`/user/${id}`, data);
  }

  // Ticket endpoints
  async createTicket(data: {
    subject: string;
    description: string;
    priority?: TicketPriority;
    type?: TicketType;
  }): Promise<Ticket> {
    return this.post<Ticket>('/tickets', data);
  }

  async getTickets(params?: {
    page?: number;
    limit?: number;
    status?: TicketStatus;
    priority?: TicketPriority;
    type?: TicketType;
  }): Promise<TicketListResponse> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.status) queryParams.append('status', params.status);
    if (params?.priority) queryParams.append('priority', params.priority);
    if (params?.type) queryParams.append('type', params.type);
    
    const query = queryParams.toString();
    return this.get<TicketListResponse>(`/tickets${query ? `?${query}` : ''}`);
  }

  async getTicket(id: string): Promise<Ticket> {
    return this.get<Ticket>(`/tickets/${id}`);
  }

  async getTicketByReference(referenceNumber: string): Promise<Ticket> {
    return this.get<Ticket>(`/tickets/reference/${referenceNumber}`);
  }

  async updateTicket(id: string, data: {
    subject?: string;
    description?: string;
    status?: TicketStatus;
    priority?: TicketPriority;
    type?: TicketType;
  }): Promise<Ticket> {
    return this.patch<Ticket>(`/tickets/${id}`, data);
  }

  async deleteTicket(id: string): Promise<void> {
    return this.delete<void>(`/tickets/${id}`);
  }

  async assignTicket(id: string, assignedToId: string): Promise<Ticket> {
    return this.patch<Ticket>(`/tickets/${id}/assign`, { assignedToId });
  }

  async getTicketMessages(ticketId: string): Promise<TicketMessage[]> {
    return this.get<TicketMessage[]>(`/tickets/${ticketId}/messages`);
  }

  async createTicketMessage(ticketId: string, data: {
    content: string;
    type?: MessageType;
    is_internal?: boolean;
  }): Promise<TicketMessage> {
    return this.post<TicketMessage>(`/tickets/${ticketId}/messages`, data);
  }

  async deleteTicketMessage(messageId: string): Promise<void> {
    return this.delete<void>(`/tickets/messages/${messageId}`);
  }

  async getTicketStatistics(): Promise<TicketStatistics> {
    return this.get<TicketStatistics>('/tickets/statistics');
  }
}

export const apiClient = new ApiClient();
