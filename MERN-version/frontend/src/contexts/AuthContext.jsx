import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { useQueryClient, useQuery } from '@tanstack/react-query';
// Types are now documented as JSDoc in ../types/index.js
import { apiClient } from '../lib/api';
import toast from 'react-hot-toast';

/**
 * Auth Context Type
 * @typedef {Object} AuthContextType
 * @property {User|null} user - Current user or null
 * @property {UserPoints|null} points - User points or null
 * @property {boolean} isLoading - Loading state
 * @property {boolean} isAuthenticated - Authentication state
 * @property {function} login - Login function
 * @property {function} register - Register function
 * @property {function} logout - Logout function
 * @property {function} refreshUserData - Refresh user data function
 * @property {function} updatePoints - Update points function
 */

const AuthContext = createContext(undefined);



export const AuthProvider= ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const queryClient = useQueryClient();

  const isAuthenticated = !!user;

  // Use React Query for points data to enable auto-refresh across all pages
  const { data: pointsData, isLoading: pointsLoading, refetch: refetchPoints } = useQuery({
    queryKey: ['points'],
    queryFn: () => apiClient.getPoints(),
    enabled: isAuthenticated,
    staleTime: 30000, // 30 seconds
    refetchInterval: 60000, // Refetch every minute
    refetchOnWindowFocus: true,
  });

  // Extract points from the API response
  const points = pointsData || null;

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
        // Points will be fetched by React Query automatically
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
      // Points will be cleared by React Query automatically
      toast.error('Session expired. Please log in again.');
    };

    window.addEventListener('auth:logout', handleAuthLogout);
    return () => window.removeEventListener('auth:logout', handleAuthLogout);
  }, []);

  const refreshUserData = useCallback(async () => {
    try {
      if (!user) return;
      
      console.log('Refreshing user data...'); // Debug log
      const userData = await apiClient.getCurrentUser();
      console.log('Refreshed user data:', userData); // Debug log
      setUser(userData.user);
      // Points are managed by React Query, so we'll refetch them
      refetchPoints();
    } catch (error) {
      console.error('Failed to refresh user data:', error);
      toast.error('Failed to refresh user data');
    }
  }, [user, refetchPoints]);

  // Listen for user data update events
  useEffect(() => {
    const handleUserDataUpdate = () => {
      console.log('📡 Received user data update event, refreshing...');
      if (user) {
        refreshUserData();
      }
    };

    window.addEventListener('user-data-updated', handleUserDataUpdate);
    return () => window.removeEventListener('user-data-updated', handleUserDataUpdate);
  }, [user]); // Removed refreshUserData from dependencies to prevent excessive re-registering

  const login = async (email, password) => {
    try {
      setIsLoading(true);
      const authData = await apiClient.login({ email, password });
      
      setUser(authData.user);
      // Points will be fetched by React Query automatically
      
      toast.success(`Welcome back, ${authData.user.name}!`);
    } catch (error) {
      toast.error(error.message || 'Login failed');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data) => {
    try {
      setIsLoading(true);
      const authData = await apiClient.register(data);
      
      setUser(authData.user);
      // Points will be fetched by React Query automatically
      
      toast.success(`Welcome to the team, ${authData.user.name}!`);
    } catch (error) {
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
      // Points will be cleared by React Query automatically
      
      // Clear all React Query cache when logging out
      queryClient.clear();
      
      toast.success('Logged out successfully');
    }
  };

  const updatePoints = (newPoints) => {
    // Instead of directly updating state, invalidate the query to refetch
    queryClient.invalidateQueries({ queryKey: ['points'] });
  };

  const value = {
    user,
    points,
    isLoading: isLoading || pointsLoading,
    isAuthenticated,
    login,
    register,
    logout,
    refreshUserData,
    updatePoints,
    refetchPoints, // Add this to allow manual refresh
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
