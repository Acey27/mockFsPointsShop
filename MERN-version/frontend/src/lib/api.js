import axios from 'axios';
// Types are now documented in JSDoc format in ../types/index.js

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
  constructor() {
    this.client = null;
    this.authToken = null;
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
      (response) => response,
      (error) => {
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
        const apiError = error.response.data;
        throw new Error(apiError.message || 'An error occurred');
      }
    );

    // Load auth token from localStorage
    this.loadAuthToken();
  }

  // Auth methods
  loadAuthToken() {
    const token = localStorage.getItem('auth_token');
    if (token) {
      this.setAuthToken(token);
    }
  }

  setAuthToken(token) {
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
  async register(data) {
    const response = await this.client.post('/api/auth/register', data);
    const authData = response.data.data;
    this.setAuthToken(authData.token);
    return authData;
  }

  async login(credentials) {
    const response = await this.client.post('/api/auth/login', credentials);
    const authData = response.data.data;
    this.setAuthToken(authData.token);
    localStorage.setItem('refresh_token', authData.refreshToken);
    localStorage.setItem('user_data', JSON.stringify(authData.user));
    return authData;
  }

  async logout() {
    try {
      await this.client.post('/api/auth/logout');
    } finally {
      this.clearAuth();
    }
  }

  async getCurrentUser() {
    const response = await this.client.get('/api/auth/me');
    return response.data.data;
  }

  async refreshToken() {
    const refreshToken = localStorage.getItem('refresh_token');
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await this.client.post(
      '/api/auth/refresh',
      { refreshToken }
    );
    
    const tokens = response.data.data;
    this.setAuthToken(tokens.token);
    localStorage.setItem('refresh_token', tokens.refreshToken);
    return tokens;
  }

  // User endpoints
  async getUsers(params) {
    const response = await this.client.get('/api/users', { params });
    return response.data;
  }

  async getUserById(id) {
    const response = await this.client.get(`/api/users/${id}`);
    return response.data.data;
  }

  async getUsersForCheering() {
    const response = await this.client.get('/api/users/for-cheering');
    return response.data.data;
  }

  // Points endpoints
  async getPointsBalance() {
    const response = await this.client.get('/api/points/balance');
    return response.data.data;
  }

  async getPoints() {
    const response = await this.client.get('/api/points');
    return response.data;
  }

  async getTransactions(params) {
    const response = await this.client.get('/api/points/transactions', { params });
    return response.data;
  }

  async getAdminTransactions(params) {
    const response = await this.client.get('/api/admin/transactions', { params });
    return response.data;
  }

  async cheerUser(data) {
    const response = await this.client.post('/api/cheer', data);
    return response.data.data;
  }

  async getLeaderboard(period = 'weekly') {
    const response = await this.client.get('/api/cheer/leaderboards', { params: { period } });
    return response.data;
  }

  // Legacy method for backward compatibility
  async getLeaderboards(period = 'weekly') {
    return this.getLeaderboard(period);
  }

  // Shop endpoints
  async getProducts(filters) {
    const response = await this.client.get('/api/shop/products', { params: filters });
    return response.data;
  }

  async getProductById(id) {
    const response = await this.client.get(`/api/shop/products/${id}`);
    return response.data.data;
  }

  async addToCart(productId, quantity) {
    const response = await this.client.post('/api/shop/cart/add', { productId, quantity });
    return response.data.data;
  }

  async getCart() {
    const response = await this.client.get('/api/shop/cart');
    return response.data;
  }

  async updateCartItem(productId, quantity) {
    const response = await this.client.patch('/api/shop/cart/update', { productId, quantity });
    return response.data.data;
  }

  async removeFromCart(productId) {
    const response = await this.client.delete(`/api/shop/cart/remove/${productId}`);
    return response.data.data;
  }

  async clearCart() {
    const response = await this.client.delete('/api/shop/cart/clear');
    return response.data.data;
  }

  async checkout(data) {
    const response = await this.client.post('/api/shop/checkout', data);
    return response.data.data;
  }

  async getOrders(params) {
    const response = await this.client.get('/api/shop/orders', { params });
    return response.data;
  }

  // New order history with receipts
  async getOrderHistory(params) {
    const response = await this.client.get('/api/shop/orders/history', { params });
    return response.data;
  }

  // Get specific order with receipt
  async getOrderWithReceipt(orderId) {
    const response = await this.client.get(`/api/shop/orders/${orderId}`);
    return response.data.data;
  }

  // Cancel order (user)
  async cancelOrder(orderId) {
    const response = await this.client.patch(`/api/shop/orders/${orderId}/cancel`);
    return response.data.data;
  }

  // Request cancellation for completed orders
  async requestOrderCancellation(orderId, reason = '') {
    const response = await this.client.patch(`/api/shop/orders/${orderId}/request-cancellation`, {
      reason
    });
    return response.data.data;
  }

  // Mood endpoints
  async submitMood(data) {
    const response = await this.client.post('/api/mood', data);
    return response.data.data;
  }

  async getMoodHistory(params) {
    const response = await this.client.get('/api/mood/history', { params });
    return response.data.data;
  }

  async getMoodAnalytics(days) {
    const response = await this.client.get('/api/mood/analytics', { params });
    return response.data.data;
  }

  // Health check endpoints
  async healthCheck() {
    const response = await this.client.get('/api/health');
    return response.data.data;
  }

  // Demo endpoints (fallback when database is not available)
  async getDemoUsers() {
    const response = await this.client.get('/api/demo/users');
    return response.data.data;
  }

  async getDemoProducts() {
    const response = await this.client.get('/api/demo/products');
    return response.data.data;
  }

  // Admin endpoints
  async getAdminDashboard() {
    const response = await this.client.get('/api/admin/dashboard');
    return response.data.data;
  }

  async getAdminUsersOverview(params) {
    const response = await this.client.get('/api/admin/users/overview', { params });
    return response.data.data;
  }

  async getAdminPointsAnalytics(days) {
    const response = await this.client.get('/api/admin/analytics/points', { params });
    return response.data.data;
  }

  async getAdminMoodAnalytics(days) {
    const response = await this.client.get('/api/admin/analytics/mood', { params });
    return response.data.data;
  }

  async getSystemHealth() {
    const response = await this.client.get('/api/admin/system/health');
    return response.data.data;
  }

  // Admin product management
  async createProduct(data) {
    const response = await this.client.post('/api/shop/admin/products', data);
    return response.data.data;
  }

  async updateProduct(id, data) {
    const response = await this.client.patch(`/api/shop/admin/products/${id}`, data);
    return response.data.data;
  }

  async deleteProduct(id) {
    await this.client.delete(`/api/shop/admin/products/${id}`);
  }

  async getAdminProducts(params) {
    const response = await this.client.get('/api/shop/admin/products', { params });
    return response.data;
  }

  async getAdminOrders(params) {
    const response = await this.client.get('/api/admin/orders', { params });
    return response.data;
  }

  async updateOrderStatus(orderId, status) {
    const response = await this.client.patch(`/api/admin/orders/${orderId}`, { status });
    return response.data.data;
  }

  // Admin cancellation requests
  async getCancellationRequests(params) {
    const response = await this.client.get('/api/admin/orders/cancellation-requests', { params });
    return response.data;
  }

  async processCancellationRequest(orderId, action, adminNotes = '') {
    const response = await this.client.patch(`/api/admin/orders/${orderId}/cancellation-request`, {
      action,
      adminNotes
    });
    return response.data.data;
  }

  // Admin points management
  async addPointsToUser(userId, amount, reason) {
    const response = await this.client.post('/api/points/admin/add', { 
      userId, 
      amount, 
      reason 
    });
    return response.data.data;
  }

  async deductPointsFromUser(userId, amount, reason) {
    const response = await this.client.post('/api/points/admin/deduct', { 
      userId, 
      amount, 
      reason 
    });
    return response.data.data;
  }

  async getUserPointsAdmin(userId) {
    const response = await this.client.get(`/api/points/admin/${userId}`);
    return response.data.data;
  }

  async resetMonthlyLimits() {
    const response = await this.client.post('/api/points/admin/reset-monthly');
    return response.data.data;
  }

  // Points Scheduler Management
  async getSchedulerStatus() {
    const response = await this.client.get('/api/admin/scheduler/status');
    return response.data.data;
  }

  async startScheduler() {
    const response = await this.client.post('/api/admin/scheduler/start');
    return response.data.data;
  }

  async stopScheduler() {
    const response = await this.client.post('/api/admin/scheduler/stop');
    return response.data.data;
  }

  async triggerManualDistribution() {
    const response = await this.client.post('/api/admin/scheduler/distribute');
    return response.data.data;
  }

  // === CHEER API METHODS ===

  /**
   * Get cheer statistics for current user
   * @returns {Promise<Object>} Cheer statistics
   */
  async getCheerStats() {
    const response = await this.client.get('/api/cheer/stats');
    return response.data;
  }

  /**
   * Get cheers received by current user
   * @param {Object} params - Query parameters
   * @returns {Promise<Object>} Received cheers
   */
  async getReceivedCheers(params = {}) {
    const response = await this.client.get('/api/cheer/received', { params });
    return response.data;
  }

  /**
   * Get recent cheers (all users)
   * @param {Object} params - Query parameters
   * @returns {Promise<Object>} Recent cheers
   */
  async getRecentCheers(params = {}) {
    const response = await this.client.get('/api/cheer/recent', { params });
    return response.data;
  }

  /**
   * Create a new cheer
   * @param {Object} cheerData - Cheer data
   * @returns {Promise<Object>} Created cheer
   */
  async createCheer(cheerData) {
    const response = await this.client.post('/api/points/cheer', cheerData);
    return response.data;
  }

  /**
   * Get leaderboards
   * @param {string} period - Period (weekly, monthly, alltime)
   * @returns {Promise<Object>} Leaderboard data
   */
  async getLeaderboards(period = 'weekly') {
    const response = await this.client.get('/api/cheer/leaderboards', { 
      params: { period } 
    });
    return response.data;
  }

  /**
   * Search users for cheering
   * @param {Object} params - Search parameters
   * @returns {Promise<Object>} Search results
   */
  async searchUsers(params = {}) {
    const response = await this.client.get('/api/cheer/search-users', { params });
    return response.data;
  }

  /**
   * Add a comment to a cheer
   * @param {string} cheerID - The cheer ID
   * @param {string} comment - The comment text
   * @returns {Promise<Object>} Created comment
   */
  async addComment(cheerID, comment) {
    const response = await this.client.post(`/api/cheer/${cheerID}/comments`, { comment });
    return response.data;
  }

  /**
   * Get comments for a cheer
   * @param {string} cheerID - The cheer ID
   * @param {Object} params - Query parameters (page, limit)
   * @returns {Promise<Object>} Comments data
   */
  async getComments(cheerID, params = {}) {
    const response = await this.client.get(`/api/cheer/${cheerID}/comments`, { params });
    return response.data;
  }

  /**
   * Get comment counts for multiple cheers
   * @param {string[]} cheerIDs - Array of cheer IDs
   * @returns {Promise<Object>} Comment counts object
   */
  async getCommentCounts(cheerIDs) {
    const response = await this.client.post('/api/cheer/comments/counts', { cheerIDs });
    return response.data;
  }

  /**
   * Delete a comment
   * @param {string} commentID - The comment ID
   * @returns {Promise<Object>} Deletion result
   */
  async deleteComment(commentID) {
    const response = await this.client.delete(`/api/cheer/comments/${commentID}`);
    return response.data;
  }
}

// Create and export a singleton instance
export const apiClient = new ApiClient();
export default apiClient;

// Export configuration for components that need it
export { config };
