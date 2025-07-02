import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
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
  const [points, setPoints] = useState(null);
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

  const login = async (email, password) => {
    try {
      setIsLoading(true);
      const authData = await apiClient.login({ email, password });
      
      setUser(authData.user);
      setPoints(authData.points || null);
      
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
      setPoints(authData.points || null);
      
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

  const updatePoints = (newPoints) => {
    setPoints(newPoints);
  };

  const value = {
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

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
