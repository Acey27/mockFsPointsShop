import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { useAuth } from './hooks/useAuth';
import { useGlobalAutoRefresh } from './hooks/useUnifiedAutoRefresh';

// Page components (we'll create these)
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import PointsPage from './pages/PointsPage';
import ShopPage from './pages/ShopPage';
import MoodPage from './pages/MoodPage';
import AdminPage from './pages/AdminPage';
import ProfilePage from './pages/ProfilePage';
import PurchaseSuccessPage from './pages/PurchaseSuccessPage';
import OrderHistoryPage from './pages/OrderHistoryPage';
import AdminPurchaseLogsPage from './pages/AdminPurchaseLogsPage';
import CheerPage from './pages/CheerPage';

// Layout components
import Layout from './components/Layout';
import LoadingSpinner from './components/LoadingSpinner';

// Protected Route component
const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (adminOnly && user.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

// Public Route component (redirect to dashboard if already logged in)
const PublicRoute = ({ children }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

// Main App component with event-driven refresh
const AppRoutes = () => {
  // Enable event-driven auto-refresh for the entire application
  useGlobalAutoRefresh();
  
  return (
    <Routes>
      {/* Public routes */}
      <Route 
        path="/login" 
        element={
          <PublicRoute>
            <LoginPage />
          </PublicRoute>
        } 
      />
      <Route 
        path="/register" 
        element={
          <PublicRoute>
            <RegisterPage />
          </PublicRoute>
        } 
      />

      {/* Protected routes */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="points" element={<PointsPage />} />
        <Route path="shop" element={<ShopPage />} />
        <Route path="mood" element={<MoodPage />} />
        <Route path="cheer" element={<CheerPage />} />
        <Route path="profile" element={<ProfilePage />} />
        <Route path="purchase-success" element={<PurchaseSuccessPage />} />
        <Route path="orders" element={<OrderHistoryPage />} />
        
        {/* Admin only routes */}
        <Route 
          path="admin/*" 
          element={
            <ProtectedRoute adminOnly>
              <AdminPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="admin/purchase-logs" 
          element={
            <ProtectedRoute adminOnly>
              <AdminPurchaseLogsPage />
            </ProtectedRoute>
          } 
        />
      </Route>

      {/* Catch all - redirect to login */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
};

// App wrapper with providers
const App = () => {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
};

export default App;
