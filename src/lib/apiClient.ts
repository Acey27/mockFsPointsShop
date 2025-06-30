import api from './api';

export interface User {
  id: number;
  email: string;
  name: string;
  department: string;
  role: string;
  avatar?: string;
}

export interface AuthResponse {
  message: string;
  user: User;
  token: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  name: string;
  department: string;
  avatar?: string;
}

// Auth API calls
export const authApi = {
  login: async (data: LoginData): Promise<AuthResponse> => {
    const response = await api.post('/auth/login', data);
    return response.data;
  },

  register: async (data: RegisterData): Promise<AuthResponse> => {
    const response = await api.post('/auth/register', data);
    return response.data;
  },
};

// Points API calls
export const pointsApi = {
  getBalance: async () => {
    const response = await api.get('/points/balance');
    return response.data;
  },

  getTransactions: async (page = 1, limit = 20) => {
    const response = await api.get(`/points/transactions?page=${page}&limit=${limit}`);
    return response.data;
  },

  sendCheer: async (data: { toUserId: number; points: number; message: string }) => {
    const response = await api.post('/points/cheer', data);
    return response.data;
  },
};

// Shop API calls
export const shopApi = {
  getProducts: async (params: { category?: string; search?: string; page?: number; limit?: number } = {}) => {
    const queryParams = new URLSearchParams();
    if (params.category) queryParams.append('category', params.category);
    if (params.search) queryParams.append('search', params.search);
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());
    
    const response = await api.get(`/shop/products?${queryParams}`);
    return response.data;
  },

  getProduct: async (id: number) => {
    const response = await api.get(`/shop/products/${id}`);
    return response.data;
  },

  createOrder: async (data: { 
    items: { productId: number; quantity: number }[]; 
    shippingAddress?: any; 
    notes?: string;
  }) => {
    const response = await api.post('/shop/orders', data);
    return response.data;
  },

  getOrders: async (page = 1, limit = 10) => {
    const response = await api.get(`/shop/orders?page=${page}&limit=${limit}`);
    return response.data;
  },

  getOrder: async (id: number) => {
    const response = await api.get(`/shop/orders/${id}`);
    return response.data;
  },
};

// Users API calls
export const usersApi = {
  getUsers: async (params: { search?: string; department?: string } = {}) => {
    const queryParams = new URLSearchParams();
    if (params.search) queryParams.append('search', params.search);
    if (params.department) queryParams.append('department', params.department);
    
    const response = await api.get(`/users?${queryParams}`);
    return response.data;
  },

  getProfile: async () => {
    const response = await api.get('/users/profile');
    return response.data;
  },

  updateProfile: async (data: { name?: string; department?: string; avatar?: string }) => {
    const response = await api.put('/users/profile', data);
    return response.data;
  },
};

// Mood API calls
export const moodApi = {
  logMood: async (data: { mood: string; comment?: string }) => {
    const response = await api.post('/mood', data);
    return response.data;
  },

  getMoodHistory: async (params: { days?: number; page?: number; limit?: number } = {}) => {
    const queryParams = new URLSearchParams();
    if (params.days) queryParams.append('days', params.days.toString());
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());
    
    const response = await api.get(`/mood/history?${queryParams}`);
    return response.data;
  },

  getMoodInsights: async (days = 7) => {
    const response = await api.get(`/mood/insights?days=${days}`);
    return response.data;
  },
};
