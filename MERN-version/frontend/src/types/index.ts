// User types
export interface User {
  _id: string;
  email: string;
  name: string;
  department: string;
  avatar?: string;
  role: 'user' | 'admin';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// User Points types
export interface UserPoints {
  _id: string;
  userId: string | User;
  availablePoints: number;
  totalEarned: number;
  totalSpent: number;
  monthlyCheerLimit: number;
  monthlyCheerUsed: number;
  lastMonthlyReset: string;
  updatedAt: string;
}

// Transaction types
export interface Transaction {
  _id: string;
  fromUserId?: string | User;
  toUserId?: string | User;
  type: 'earned' | 'spent' | 'given' | 'received' | 'admin_grant' | 'admin_deduct';
  amount: number;
  description: string;
  message?: string;
  metadata?: Record<string, any>;
  createdAt: string;
}

// Product types
export interface Product {
  _id: string;
  name: string;
  description: string;
  image: string;
  pointsCost: number;
  category: string;
  inventory: number;
  rating: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Order types
export interface OrderItem {
  productId: string | Product;
  quantity: number;
  pointsCostPerItem: number;
  totalPoints: number;
}

export interface ShippingAddress {
  name: string;
  email: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

export interface Order {
  _id: string;
  userId: string | User;
  items: OrderItem[];
  totalPoints: number;
  status: 'pending' | 'processing' | 'completed' | 'cancelled' | 'refunded';
  shippingAddress?: ShippingAddress;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// Mood types
export interface Mood {
  _id: string;
  userId: string | User;
  mood: 'excellent' | 'good' | 'okay' | 'not-great' | 'poor';
  comment?: string;
  date: string;
  createdAt: string;
}

// API Response types
export interface ApiResponse<T = any> {
  status: 'success' | 'error';
  message?: string;
  data?: T;
  error?: string;
}

export interface PaginatedResponse<T = any> extends ApiResponse<T[]> {
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// Auth types
export interface LoginCredentials {
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

export interface AuthResponse {
  user: User;
  points?: UserPoints;
  token: string;
  refreshToken: string;
}

// Form types
export interface CheerForm {
  toUserId: string;
  amount: number;
  message?: string;
}

export interface CartItem {
  productId: string;
  quantity: number;
}

export interface CheckoutForm {
  items: CartItem[];
  shippingAddress?: ShippingAddress;
  notes?: string;
}

export interface MoodForm {
  mood: 'excellent' | 'good' | 'okay' | 'not-great' | 'poor';
  comment?: string;
  date?: string;
}

// Analytics types
export interface MoodAnalytics {
  averageMoodScore: number;
  moodDistribution: Record<string, number>;
  totalEntries: number;
  streak?: number;
  departmentBreakdown?: Record<string, any>;
}

export interface PointsHistory {
  totalEarned: number;
  totalSpent: number;
  recentTransactions: Transaction[];
}

// Filter and search types
export interface ProductFilters {
  category?: string;
  minPoints?: number;
  maxPoints?: number;
  search?: string;
  sortBy?: 'name' | 'pointsCost' | 'rating' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
}

export interface UserFilters {
  department?: string;
  role?: 'user' | 'admin';
  isActive?: boolean;
  search?: string;
}

export interface TransactionFilters {
  type?: string;
  startDate?: string;
  endDate?: string;
  userId?: string;
}

// Notification types
export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

// Component prop types
export interface BaseComponentProps {
  className?: string;
  children?: React.ReactNode;
}

export interface LoadingState {
  isLoading: boolean;
  error?: string | null;
}

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  isLoading?: boolean;
}

// Theme types
export type Theme = 'light' | 'dark' | 'system';

// Navigation types
export interface NavItem {
  label: string;
  href?: string;
  onClick?: () => void;
  icon?: React.ComponentType<any>;
  isActive?: boolean;
  badge?: string | number;
  children?: NavItem[];
}

// Chart data types
export interface ChartDataPoint {
  label: string;
  value: number;
  color?: string;
}

export interface TimeSeriesDataPoint {
  date: string;
  value: number;
  label?: string;
}

// Error types
export interface FormError {
  field: string;
  message: string;
}

export interface ValidationError {
  message: string;
  details?: FormError[];
}

// Environment types
export interface AppConfig {
  API_BASE_URL: string;
  APP_NAME: string;
  APP_VERSION: string;
  DEV_MODE: boolean;
  ENABLE_MOCK_DATA: boolean;
}
