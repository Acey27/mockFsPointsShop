import axios, { AxiosInstance, AxiosError, AxiosResponse } from 'axios';
import { 
  ApiResponse, 
  User, 
  UserPoints, 
  Product, 
  Transaction, 
  Order, 
  Mood,
  LoginCredentials,
  RegisterData,
  AuthResponse,
  CheerForm,
  CheckoutForm,
  MoodForm,
  ProductFilters,
  PaginatedResponse
} from '../types';

// Environment configuration
const config = {
  API_BASE_URL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001',
  APP_NAME: import.meta.env.VITE_APP_NAME || 'Points Shop',
  APP_VERSION: import.meta.env.VITE_APP_VERSION || '1.0.0',
  DEV_MODE: import.meta.env.VITE_DEV_MODE === 'true',
  ENABLE_MOCK_DATA: import.meta.env.VITE_ENABLE_MOCK_DATA === 'true'
};

// API Client class
class ApiClient {
  private client: AxiosInstance;
  private authToken: string | null = null;

  constructor() {
    this.client = axios.create({
      baseURL: config.API_BASE_URL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor to add auth token
    this.client.interceptors.request.use(
      (config) => {
        if (this.authToken) {
          config.headers.Authorization = `Bearer ${this.authToken}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response: AxiosResponse) => response,
      (error: AxiosError) => {
        // Handle 401 errors (unauthorized)
        if (error.response?.status === 401) {
          this.clearAuth();
          // Redirect to login or emit event
          window.dispatchEvent(new CustomEvent('auth:logout'));
        }

        // Handle network errors
        if (!error.response) {
          throw new Error('Network error - please check your connection');
        }

        // Handle API errors
        const apiError = error.response.data as ApiResponse;
        throw new Error(apiError.message || 'An error occurred');
      }
    );

    // Load auth token from localStorage
    this.loadAuthToken();
  }

  // Auth methods
  private loadAuthToken() {
    const token = localStorage.getItem('auth_token');
    if (token) {
      this.setAuthToken(token);
    }
  }

  setAuthToken(token: string) {
    this.authToken = token;
    localStorage.setItem('auth_token', token);
  }

  clearAuth() {
    this.authToken = null;
    localStorage.removeItem('auth_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user_data');
  }

  // Authentication endpoints
  async register(data: RegisterData): Promise<AuthResponse> {
    const response = await this.client.post<ApiResponse<AuthResponse>>('/api/auth/register', data);
    const authData = response.data.data!;
    this.setAuthToken(authData.token);
    return authData;
  }

  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await this.client.post<ApiResponse<AuthResponse>>('/api/auth/login', credentials);
    const authData = response.data.data!;
    this.setAuthToken(authData.token);
    localStorage.setItem('refresh_token', authData.refreshToken);
    localStorage.setItem('user_data', JSON.stringify(authData.user));
    return authData;
  }

  async logout(): Promise<void> {
    try {
      await this.client.post('/api/auth/logout');
    } finally {
      this.clearAuth();
    }
  }

  async getCurrentUser(): Promise<{ user: User; points: UserPoints | null }> {
    const response = await this.client.get<ApiResponse<{ user: User; points: UserPoints | null }>>('/api/auth/me');
    return response.data.data!;
  }

  async refreshToken(): Promise<{ token: string; refreshToken: string }> {
    const refreshToken = localStorage.getItem('refresh_token');
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await this.client.post<ApiResponse<{ token: string; refreshToken: string }>>(
      '/api/auth/refresh',
      { refreshToken }
    );
    
    const tokens = response.data.data!;
    this.setAuthToken(tokens.token);
    localStorage.setItem('refresh_token', tokens.refreshToken);
    return tokens;
  }

  // User endpoints
  async getUsers(params?: { page?: number; limit?: number; search?: string }): Promise<PaginatedResponse<User>> {
    const response = await this.client.get<PaginatedResponse<User>>('/api/users', { params });
    return response.data;
  }

  async getUserById(id: string): Promise<User> {
    const response = await this.client.get<ApiResponse<User>>(`/api/users/${id}`);
    return response.data.data!;
  }

  // Points endpoints
  async getPointsBalance(): Promise<UserPoints> {
    const response = await this.client.get<ApiResponse<UserPoints>>('/api/points/balance');
    return response.data.data!;
  }

  async getTransactions(params?: { page?: number; limit?: number; type?: string }): Promise<PaginatedResponse<Transaction>> {
    const response = await this.client.get<PaginatedResponse<Transaction>>('/api/points/transactions', { params });
    return response.data;
  }

  async getAdminTransactions(params?: { page?: number; limit?: number; type?: string; days?: number }): Promise<PaginatedResponse<Transaction>> {
    const response = await this.client.get<PaginatedResponse<Transaction>>('/api/admin/transactions', { params });
    return response.data;
  }

  async cheerUser(data: CheerForm): Promise<Transaction[]> {
    const response = await this.client.post<ApiResponse<Transaction[]>>('/api/points/cheer', data);
    return response.data.data!;
  }

  async getLeaderboard(params?: { limit?: number; department?: string }): Promise<Array<{ user: User; points: UserPoints }>> {
    const response = await this.client.get<ApiResponse<Array<{ user: User; points: UserPoints }>>>('/api/points/leaderboard', { params });
    return response.data.data!;
  }

  // Shop endpoints
  async getProducts(filters?: ProductFilters): Promise<PaginatedResponse<Product>> {
    const response = await this.client.get<PaginatedResponse<Product>>('/api/shop/products', { params: filters });
    return response.data;
  }

  async getProductById(id: string): Promise<Product> {
    const response = await this.client.get<ApiResponse<Product>>(`/api/shop/products/${id}`);
    return response.data.data!;
  }

  async addToCart(productId: string, quantity: number): Promise<void> {
    await this.client.post('/api/shop/cart/add', { productId, quantity });
  }

  async getCart(): Promise<Array<{ product: Product; quantity: number }>> {
    const response = await this.client.get<ApiResponse<Array<{ product: Product; quantity: number }>>>('/api/shop/cart');
    return response.data.data!;
  }

  async checkout(data: CheckoutForm): Promise<{ order: Order; receipt: any; newBalance: number }> {
    const response = await this.client.post<ApiResponse<{ order: Order; receipt: any; newBalance: number }>>('/api/shop/checkout', data);
    return response.data.data!;
  }

  async getOrders(params?: { page?: number; limit?: number; status?: string }): Promise<PaginatedResponse<Order>> {
    const response = await this.client.get<PaginatedResponse<Order>>('/api/shop/orders', { params });
    return response.data;
  }

  // New order history with receipts
  async getOrderHistory(params?: { page?: number; limit?: number; status?: string }): Promise<PaginatedResponse<any>> {
    const response = await this.client.get<PaginatedResponse<any>>('/api/shop/orders/history', { params });
    return response.data;
  }

  // Get specific order with receipt
  async getOrderWithReceipt(orderId: string): Promise<{ order: Order; receipt: any; transactions: any[] }> {
    const response = await this.client.get<ApiResponse<{ order: Order; receipt: any; transactions: any[] }>>(`/api/shop/orders/${orderId}`);
    return response.data.data!;
  }

  // Mood endpoints
  async submitMood(data: MoodForm): Promise<Mood> {
    const response = await this.client.post<ApiResponse<Mood>>('/api/mood', data);
    return response.data.data!;
  }

  async getMoodHistory(params?: { limit?: number; startDate?: string; endDate?: string }): Promise<Mood[]> {
    const response = await this.client.get<ApiResponse<Mood[]>>('/api/mood/history', { params });
    return response.data.data!;
  }

  async getMoodAnalytics(days?: number): Promise<any> {
    const response = await this.client.get<ApiResponse<any>>('/api/mood/analytics', { params: { days } });
    return response.data.data!;
  }

  // Health check endpoints
  async healthCheck(): Promise<any> {
    const response = await this.client.get<ApiResponse<any>>('/api/health');
    return response.data.data!;
  }

  // Demo endpoints (fallback when database is not available)
  async getDemoUsers(): Promise<User[]> {
    const response = await this.client.get<ApiResponse<User[]>>('/api/demo/users');
    return response.data.data!;
  }

  async getDemoProducts(): Promise<Product[]> {
    const response = await this.client.get<ApiResponse<Product[]>>('/api/demo/products');
    return response.data.data!;
  }

  // Admin endpoints
  async getAdminDashboard(): Promise<any> {
    const response = await this.client.get<ApiResponse<any>>('/api/admin/dashboard');
    return response.data.data!;
  }

  async getAdminUsersOverview(params?: { 
    page?: number; 
    limit?: number; 
    search?: string; 
    sortBy?: string; 
    sortOrder?: 'asc' | 'desc' 
  }): Promise<any> {
    const response = await this.client.get<ApiResponse<any>>('/api/admin/users/overview', { params });
    return response.data.data!;
  }

  async getAdminPointsAnalytics(days?: number): Promise<any> {
    const response = await this.client.get<ApiResponse<any>>('/api/admin/analytics/points', { params: { days } });
    return response.data.data!;
  }

  async getAdminMoodAnalytics(days?: number): Promise<any> {
    const response = await this.client.get<ApiResponse<any>>('/api/admin/analytics/mood', { params: { days } });
    return response.data.data!;
  }

  async getSystemHealth(): Promise<any> {
    const response = await this.client.get<ApiResponse<any>>('/api/admin/system/health');
    return response.data.data!;
  }

  // Admin product management
  async createProduct(data: Partial<Product>): Promise<Product> {
    const response = await this.client.post<ApiResponse<Product>>('/api/shop/admin/products', data);
    return response.data.data!;
  }

  async updateProduct(id: string, data: Partial<Product>): Promise<Product> {
    const response = await this.client.patch<ApiResponse<Product>>(`/api/shop/admin/products/${id}`, data);
    return response.data.data!;
  }

  async deleteProduct(id: string): Promise<void> {
    await this.client.delete(`/api/shop/admin/products/${id}`);
  }

  async getAdminProducts(params?: ProductFilters): Promise<PaginatedResponse<Product>> {
    const response = await this.client.get<PaginatedResponse<Product>>('/api/shop/admin/products', { params });
    return response.data;
  }

  async getAdminOrders(params?: { page?: number; limit?: number; status?: string }): Promise<PaginatedResponse<Order>> {
    const response = await this.client.get<PaginatedResponse<Order>>('/api/admin/orders', { params });
    return response.data;
  }

  async updateOrderStatus(orderId: string, status: string): Promise<Order> {
    const response = await this.client.patch<ApiResponse<Order>>(`/api/admin/orders/${orderId}`, { status });
    return response.data.data!;
  }

  // Admin points management
  async addPointsToUser(userId: string, amount: number, reason: string): Promise<Transaction> {
    const response = await this.client.post<ApiResponse<Transaction>>('/api/points/admin/add', { 
      userId, 
      amount, 
      reason 
    });
    return response.data.data!;
  }

  async deductPointsFromUser(userId: string, amount: number, reason: string): Promise<Transaction> {
    const response = await this.client.post<ApiResponse<Transaction>>('/api/points/admin/deduct', { 
      userId, 
      amount, 
      reason 
    });
    return response.data.data!;
  }

  async getUserPointsAdmin(userId: string): Promise<{ user: User; points: UserPoints; transactions: Transaction[] }> {
    const response = await this.client.get<ApiResponse<{ user: User; points: UserPoints; transactions: Transaction[] }>>(`/api/points/admin/${userId}`);
    return response.data.data!;
  }

  async resetMonthlyLimits(): Promise<{ modifiedCount: number }> {
    const response = await this.client.post<ApiResponse<{ modifiedCount: number }>>('/api/points/admin/reset-monthly');
    return response.data.data!;
  }
}

// Create and export a singleton instance
export const apiClient = new ApiClient();
export default apiClient;

// Export configuration for components that need it
export { config };
