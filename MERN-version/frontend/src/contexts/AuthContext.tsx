import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { User, UserPoints, AuthResponse } from '../types';
import { apiClient } from '../lib/api';
import toast from 'react-hot-toast';

interface AuthContextType {
  user: User | null;
  points: UserPoints | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: { email: string; password: string; name: string; department: string }) => Promise<void>;
  logout: () => Promise<void>;
  refreshUserData: () => Promise<void>;
  updatePoints: (newPoints: UserPoints) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [points, setPoints] = useState<UserPoints | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const queryClient = useQueryClient();

  const isAuthenticated = !!user;

  // Initialize auth state on app load
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Check if we have a stored token
        const token = localStorage.getItem('auth_token');
        if (!token) {
          setIsLoading(false);
          return;
        }

        // Try to get current user data
        const userData = await apiClient.getCurrentUser();
        setUser(userData.user);
        setPoints(userData.points);
      } catch (error) {
        console.error('Failed to initialize auth:', error);
        // Clear any invalid tokens
        apiClient.clearAuth();
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  // Listen for auth logout events
  useEffect(() => {
    const handleAuthLogout = () => {
      setUser(null);
      setPoints(null);
      toast.error('Session expired. Please log in again.');
    };

    window.addEventListener('auth:logout', handleAuthLogout);
    return () => window.removeEventListener('auth:logout', handleAuthLogout);
  }, []);

  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      const authData: AuthResponse = await apiClient.login({ email, password });
      
      setUser(authData.user);
      setPoints(authData.points || null);
      
      toast.success(`Welcome back, ${authData.user.name}!`);
    } catch (error: any) {
      toast.error(error.message || 'Login failed');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: { email: string; password: string; name: string; department: string }) => {
    try {
      setIsLoading(true);
      const authData: AuthResponse = await apiClient.register(data);
      
      setUser(authData.user);
      setPoints(authData.points || null);
      
      toast.success(`Welcome to the team, ${authData.user.name}!`);
    } catch (error: any) {
      toast.error(error.message || 'Registration failed');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await apiClient.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      setPoints(null);
      
      // Clear all React Query cache when logging out
      queryClient.clear();
      
      toast.success('Logged out successfully');
    }
  };

  const refreshUserData = async () => {
    try {
      if (!user) return;
      
      console.log('Refreshing user data...'); // Debug log
      const userData = await apiClient.getCurrentUser();
      console.log('Refreshed user data:', userData); // Debug log
      setUser(userData.user);
      setPoints(userData.points);
    } catch (error) {
      console.error('Failed to refresh user data:', error);
      toast.error('Failed to refresh user data');
    }
  };

  const updatePoints = (newPoints: UserPoints) => {
    setPoints(newPoints);
  };

  const value: AuthContextType = {
    user,
    points,
    isLoading,
    isAuthenticated,
    login,
    register,
    logout,
    refreshUserData,
    updatePoints,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
