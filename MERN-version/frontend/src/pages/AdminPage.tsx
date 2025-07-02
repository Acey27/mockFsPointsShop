import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../lib/api';
import LoadingSpinner from '../components/LoadingSpinner';
import ProductManagement from '../components/ProductManagement';
import {
  UsersIcon,
  CubeIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  ClockIcon,
  PlayIcon,
  StopIcon,
  BoltIcon
} from '@heroicons/react/24/outline';

const AdminPage: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'users' | 'products' | 'orders' | 'analytics' | 'system'>('dashboard');
  const queryClient = useQueryClient();

  // Redirect if not admin
  if (user?.role !== 'admin') {
    return (
      <div className="space-y-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">Access denied. This page is for administrators only.</p>
        </div>
      </div>
    );
  }

  // Fetch admin data
  const { data: users, isLoading: usersLoading } = useQuery({
    queryKey: ['admin-users'],
    queryFn: () => apiClient.getUsers({ limit: 100 }),
    enabled: activeTab === 'users' || activeTab === 'dashboard',
  });

  const { data: products } = useQuery({
    queryKey: ['admin-products'],
    queryFn: () => apiClient.getProducts({}),
    enabled: activeTab === 'products' || activeTab === 'dashboard',
  });

  const { data: orders } = useQuery({
    queryKey: ['admin-orders'],
    queryFn: () => apiClient.getOrders({ limit: 50 }),
    enabled: activeTab === 'orders' || activeTab === 'dashboard',
  });

  // Scheduler status query
  const { data: schedulerStatus, isLoading: schedulerStatusLoading } = useQuery({
    queryKey: ['scheduler-status'],
    queryFn: () => apiClient.getSchedulerStatus(),
    enabled: activeTab === 'system',
    refetchInterval: 5000, // Refetch every 5 seconds when on system tab
  });

  // Scheduler control mutations
  const startSchedulerMutation = useMutation({
    mutationFn: () => apiClient.startScheduler(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scheduler-status'] });
    },
  });

  const stopSchedulerMutation = useMutation({
    mutationFn: () => apiClient.stopScheduler(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scheduler-status'] });
    },
  });

  const manualDistributionMutation = useMutation({
    mutationFn: () => apiClient.triggerManualDistribution(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scheduler-status'] });
      // Also refresh users data to see updated points
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    },
  });

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: ChartBarIcon },
    { id: 'users', label: 'Users', icon: UsersIcon },
    { id: 'products', label: 'Products', icon: CubeIcon },
    { id: 'orders', label: 'Orders', icon: Cog6ToothIcon },
    { id: 'analytics', label: 'Analytics', icon: ChartBarIcon },
    { id: 'system', label: 'System', icon: ClockIcon },
  ];

  const renderDashboard = () => (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-blue-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-700">Total Users</p>
              <p className="text-2xl font-bold text-blue-900">{users?.data?.length || 0}</p>
            </div>
            <UsersIcon className="w-8 h-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-blue-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-700">Total Products</p>
              <p className="text-2xl font-bold text-blue-900">{products?.data?.length || 0}</p>
            </div>
            <CubeIcon className="w-8 h-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-blue-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-700">Total Orders</p>
              <p className="text-2xl font-bold text-blue-900">{orders?.data?.length || 0}</p>
            </div>
            <Cog6ToothIcon className="w-8 h-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-blue-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-700">Active Users</p>
              <p className="text-2xl font-bold text-blue-900">
                {users?.data?.filter((u: any) => u.isActive).length || 0}
              </p>
            </div>
            <ChartBarIcon className="w-8 h-8 text-blue-600" />
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid gap-6 md:grid-cols-2">
        <div className="bg-white rounded-lg shadow-sm border border-blue-100 p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-4">Recent Users</h3>
          <div className="space-y-3">
            {users?.data?.slice(0, 5).map((user: any) => (
              <div key={user._id} className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium text-blue-600">
                    {user.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">{user.name}</p>
                  <p className="text-xs text-gray-500">{user.department}</p>
                </div>
                <span className={`px-2 py-1 text-xs rounded-full ${
                  user.isActive
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                }`}>
                  {user.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-blue-100 p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-4">Recent Orders</h3>
          <div className="space-y-3">
            {orders?.data?.slice(0, 5).map((order: any) => (
              <div key={order._id} className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <Cog6ToothIcon className="w-4 h-4 text-green-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">
                    Order #{order._id.slice(-6)}
                  </p>
                  <p className="text-xs text-gray-500">
                    {order.totalPoints} points • {order.items?.length || 0} items
                  </p>
                </div>
                <span className={`px-2 py-1 text-xs rounded-full ${
                  order.status === 'completed'
                    ? 'bg-green-100 text-green-800'
                    : order.status === 'processing'
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-blue-100 text-blue-800'
                }`}>
                  {order.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderUsers = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold text-blue-900">User Management</h3>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2">
          <PlusIcon className="w-4 h-4" />
          <span>Add User</span>
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-blue-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Department
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {usersLoading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center">
                    <LoadingSpinner size="md" text="Loading users..." />
                  </td>
                </tr>
              ) : (
                users?.data?.map((user: any) => (
                  <tr key={user._id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium text-blue-600">
                            {user.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="ml-3">
                          <div className="text-sm font-medium text-gray-900">{user.name}</div>
                          <div className="text-sm text-gray-500">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {user.department}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        user.role === 'admin'
                          ? 'bg-purple-100 text-purple-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        user.isActive
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {user.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <button className="text-blue-600 hover:text-blue-900">
                        <EyeIcon className="w-4 h-4" />
                      </button>
                      <button className="text-indigo-600 hover:text-indigo-900">
                        <PencilIcon className="w-4 h-4" />
                      </button>
                      <button className="text-red-600 hover:text-red-900">
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderProducts = () => (
    <ProductManagement />
  );

  const renderSystem = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-semibold text-blue-900">System Management</h3>
        <p className="text-blue-600">Manage automated point distribution and system settings</p>
      </div>

      {/* Points Scheduler Card */}
      <div className="bg-white rounded-lg shadow-sm border border-blue-100 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <ClockIcon className="w-6 h-6 text-blue-600" />
            <div>
              <h4 className="text-lg font-semibold text-blue-900">Points Scheduler</h4>
              <p className="text-sm text-blue-600">Automatic point distribution every minute</p>
            </div>
          </div>
          <div className={`px-3 py-1 rounded-full text-sm font-medium ${
            schedulerStatus?.isRunning
              ? 'bg-green-100 text-green-800'
              : 'bg-red-100 text-red-800'
          }`}>
            {schedulerStatusLoading ? 'Loading...' : schedulerStatus?.isRunning ? 'Running' : 'Stopped'}
          </div>
        </div>

        {/* Scheduler Statistics */}
        {schedulerStatus && (
          <div className="grid gap-4 md:grid-cols-3 mb-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-700">Total Distributions</p>
                  <p className="text-2xl font-bold text-blue-900">{schedulerStatus.totalDistributions || 0}</p>
                </div>
                <BoltIcon className="w-6 h-6 text-blue-600" />
              </div>
            </div>

            <div className="bg-green-50 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-700">Last Distribution</p>
                  <p className="text-sm font-bold text-green-900">
                    {schedulerStatus.lastDistribution 
                      ? new Date(schedulerStatus.lastDistribution).toLocaleString()
                      : 'Never'
                    }
                  </p>
                </div>
                <ClockIcon className="w-6 h-6 text-green-600" />
              </div>
            </div>

            <div className="bg-purple-50 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-700">Next Distribution</p>
                  <p className="text-sm font-bold text-purple-900">
                    {schedulerStatus.isRunning ? 'Within 1 minute' : 'Scheduler stopped'}
                  </p>
                </div>
                <PlayIcon className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>
        )}

        {/* Scheduler Controls */}
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => startSchedulerMutation.mutate()}
            disabled={schedulerStatus?.isRunning || startSchedulerMutation.isPending}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors ${
              schedulerStatus?.isRunning || startSchedulerMutation.isPending
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-green-600 text-white hover:bg-green-700'
            }`}
          >
            <PlayIcon className="w-4 h-4" />
            <span>{startSchedulerMutation.isPending ? 'Starting...' : 'Start Scheduler'}</span>
          </button>

          <button
            onClick={() => stopSchedulerMutation.mutate()}
            disabled={!schedulerStatus?.isRunning || stopSchedulerMutation.isPending}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors ${
              !schedulerStatus?.isRunning || stopSchedulerMutation.isPending
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-red-600 text-white hover:bg-red-700'
            }`}
          >
            <StopIcon className="w-4 h-4" />
            <span>{stopSchedulerMutation.isPending ? 'Stopping...' : 'Stop Scheduler'}</span>
          </button>

          <button
            onClick={() => manualDistributionMutation.mutate()}
            disabled={manualDistributionMutation.isPending}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed font-medium transition-colors"
          >
            <BoltIcon className="w-4 h-4" />
            <span>{manualDistributionMutation.isPending ? 'Distributing...' : 'Manual Distribution'}</span>
          </button>
        </div>

        {/* Error Messages */}
        {(startSchedulerMutation.error || stopSchedulerMutation.error || manualDistributionMutation.error) && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800 text-sm">
              Error: {
                startSchedulerMutation.error?.message ||
                stopSchedulerMutation.error?.message ||
                manualDistributionMutation.error?.message
              }
            </p>
          </div>
        )}

        {/* Success Messages */}
        {(startSchedulerMutation.isSuccess || stopSchedulerMutation.isSuccess || manualDistributionMutation.isSuccess) && (
          <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-800 text-sm">
              {startSchedulerMutation.isSuccess && 'Scheduler started successfully!'}
              {stopSchedulerMutation.isSuccess && 'Scheduler stopped successfully!'}
              {manualDistributionMutation.isSuccess && 'Manual distribution completed successfully!'}
            </p>
          </div>
        )}
      </div>

      {/* Additional System Settings Placeholder */}
      <div className="bg-white rounded-lg shadow-sm border border-blue-100 p-6">
        <h4 className="text-lg font-semibold text-blue-900 mb-4">Additional Settings</h4>
        <p className="text-gray-600">More system management features coming soon...</p>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return renderDashboard();
      case 'users':
        return renderUsers();
      case 'products':
        return renderProducts();
      case 'system':
        return renderSystem();
      case 'orders':
      case 'analytics':
        return (
          <div className="bg-white p-8 rounded-lg shadow-sm border border-blue-100">
            <p className="text-gray-600">This section is coming soon...</p>
          </div>
        );
      default:
        return renderDashboard();
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-blue-900">Admin Dashboard</h1>
        <p className="text-blue-600">Manage users, products, and system settings</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Content */}
      {renderContent()}
    </div>
  );
};

export default AdminPage;
