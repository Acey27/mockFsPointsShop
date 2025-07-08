import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../lib/api';
import LoadingSpinner from '../components/LoadingSpinner';
import ProductManagement from '../components/ProductManagement';
import { useEventDrivenRefresh } from '../hooks/useUnifiedAutoRefresh';
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
  BoltIcon,
  ShoppingBagIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  MagnifyingGlassIcon,
  DocumentTextIcon,
  CalendarIcon,
  UserIcon,
  CurrencyDollarIcon,
  XMarkIcon,
  ArrowDownTrayIcon
} from '@heroicons/react/24/outline';

const AdminPage= () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orderStatusFilter, setOrderStatusFilter] = useState('all');
  const [orderSearch, setOrderSearch] = useState('');
  const [orderPage, setOrderPage] = useState(1);
  const [orderDateRange, setOrderDateRange] = useState('30');
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [orderAction, setOrderAction] = useState('');
  const [adminNotes, setAdminNotes] = useState('');
  const queryClient = useQueryClient();
  const { triggerOrderCancelRefresh } = useEventDrivenRefresh();

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

  const { data: orders, isLoading: ordersLoading } = useQuery({
    queryKey: ['admin-orders', orderPage, orderStatusFilter, orderSearch, orderDateRange],
    queryFn: () => {
      const params = { 
        page: orderPage, 
        limit: 20,
        ...(orderStatusFilter !== 'all' && { status: orderStatusFilter }),
        ...(orderSearch && { search: orderSearch }),
        ...(orderDateRange !== 'all' && { days: parseInt(orderDateRange) })
      };
      return apiClient.getAdminOrders(params);
    },
    enabled: activeTab === 'orders' || activeTab === 'dashboard',
  });

  const { data: cancellationRequests, isLoading: cancellationLoading } = useQuery({
    queryKey: ['admin-cancellation-requests'],
    queryFn: () => apiClient.getCancellationRequests({ limit: 50 }),
    enabled: activeTab === 'orders',
  });

  // Order management mutations
  const updateOrderStatusMutation = useMutation({
    mutationFn: ({ orderId, status, adminNotes }) => 
      apiClient.updateOrderStatus(orderId, status, adminNotes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
      setShowOrderModal(false);
      setSelectedOrder(null);
      setAdminNotes('');
    },
  });

  const processCancellationMutation = useMutation({
    mutationFn: ({ orderId, action, adminNotes }) => 
      apiClient.processCancellationRequest(orderId, action, adminNotes),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
      queryClient.invalidateQueries({ queryKey: ['admin-cancellation-requests'] });
      
      // If cancellation was approved, trigger a comprehensive refresh
      // This ensures that user points are updated in real-time across all tabs
      if (variables.action === 'approve') {
        triggerOrderCancelRefresh();
      }
    },
  });

  // Helper functions
  const handleOrderAction = (order, action) => {
    setSelectedOrder(order);
    setOrderAction(action);
    setShowOrderModal(true);
  };

  const handleConfirmOrderAction = () => {
    if (selectedOrder && orderAction) {
      updateOrderStatusMutation.mutate({
        orderId: selectedOrder._id,
        status: orderAction,
        adminNotes: adminNotes
      });
    }
  };

  const handleCancellationAction = (order, action) => {
    const adminNotes = window.prompt(
      action === 'approve' 
        ? 'Add notes for approval (optional):' 
        : 'Add notes for denial (required):'
    );
    
    if (adminNotes !== null) {
      if (action === 'deny' && !adminNotes.trim()) {
        alert('Please provide a reason for denial.');
        return;
      }
      
      processCancellationMutation.mutate({
        orderId: order._id,
        action: action,
        adminNotes: adminNotes
      });
    }
  };

  const exportToCSV = () => {
    const orderData = orders?.data || [];
    if (orderData.length === 0) {
      alert('No orders to export');
      return;
    }

    const csvData = orderData.map((order) => ({
      'Order Number': order.orderNumber || `#${order._id.slice(-6)}`,
      'Customer': order.userId?.name || 'Unknown',
      'Email': order.userId?.email || 'Unknown',
      'Date': new Date(order.createdAt).toLocaleDateString(),
      'Status': order.status,
      'Items': order.items?.length || 0,
      'Total Points': order.totalPoints,
      'Products': order.items?.map((item) => item.productId?.name || 'Unknown Product').join('; ') || ''
    }));

    const csv = [
      Object.keys(csvData[0]).join(','),
      ...csvData.map(row => Object.values(row).map(value => 
        typeof value === 'string' && (value.includes(',') || value.includes('"')) 
          ? `"${value.replace(/"/g, '""')}"` 
          : value
      ).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `order-logs-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const getTotalRevenue = () => {
    return orders?.data?.reduce((sum, order) => sum + order.totalPoints, 0) || 0;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending': return <ClockIcon className="w-4 h-4" />;
      case 'completed': return <CheckCircleIcon className="w-4 h-4" />;
      case 'cancelled': return <XCircleIcon className="w-4 h-4" />;
      default: return <ExclamationTriangleIcon className="w-4 h-4" />;
    }
  };

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: ChartBarIcon },
    { id: 'users', label: 'Users', icon: UsersIcon },
    { id: 'products', label: 'Products', icon: CubeIcon },
    { id: 'orders', label: 'Orders', icon: ShoppingBagIcon },
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
                {users?.data?.filter((u) => u.isActive).length || 0}
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
            {users?.data?.slice(0, 5).map((user) => (
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
            {orders?.data?.slice(0, 5).map((order) => (
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
                users?.data?.map((user) => (
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

  const renderOrders = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h3 className="text-xl font-semibold text-blue-900">Order Management & Purchase Logs</h3>
          <p className="text-blue-600">Monitor all customer purchases, manage order status, and handle cancellation requests</p>
        </div>
        <div className="mt-4 lg:mt-0 flex items-center space-x-4">
          <button
            onClick={exportToCSV}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <ShoppingBagIcon className="h-8 w-8 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Orders</p>
              <p className="text-2xl font-bold text-gray-900">{orders?.pagination?.total || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <CurrencyDollarIcon className="h-8 w-8 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-900">{getTotalRevenue()} pts</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <ClockIcon className="h-8 w-8 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Pending Orders</p>
              <p className="text-2xl font-bold text-gray-900">
                {orders?.data?.filter(order => order.status === 'pending').length || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <ExclamationTriangleIcon className="h-8 w-8 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Cancellation Requests</p>
              <p className="text-2xl font-bold text-gray-900">{cancellationRequests?.data?.length || 0}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-blue-100">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search orders, customers, or products..."
                value={orderSearch}
                onChange={(e) => setOrderSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div>
            <select
              value={orderStatusFilter}
              onChange={(e) => setOrderStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          <div>
            <select
              value={orderDateRange}
              onChange={(e) => setOrderDateRange(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Time</option>
              <option value="1">Today</option>
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days</option>
              <option value="90">Last 90 days</option>
            </select>
          </div>
        </div>
      </div>

      {/* Cancellation Requests Section */}
      {cancellationRequests?.data?.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-red-100 overflow-hidden">
          <div className="px-6 py-4 bg-red-50 border-b border-red-200">
            <h4 className="text-lg font-semibold text-red-900 flex items-center">
              <ExclamationTriangleIcon className="w-5 h-5 mr-2" />
              Pending Cancellation Requests ({cancellationRequests.data.length})
            </h4>
          </div>
          <div className="divide-y divide-gray-200">
            {cancellationRequests.data.map((order) => (
              <CancellationRequestCard
                key={order._id}
                order={order}
                onProcess={handleCancellationAction}
                isProcessing={processCancellationMutation.isPending}
              />
            ))}
          </div>
        </div>
      )}

      {/* Orders Table */}
      <div className="bg-white rounded-lg shadow-sm border border-blue-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Order
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Items
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Points
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
              {ordersLoading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center">
                    <LoadingSpinner size="md" text="Loading orders..." />
                  </td>
                </tr>
              ) : orders?.data?.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                    No orders found
                  </td>
                </tr>
              ) : (
                orders?.data?.map((order) => (
                  <tr key={order._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <ShoppingBagIcon className="w-5 h-5 text-gray-400 mr-2" />
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {order.orderNumber || `#${order._id.slice(-6)}`}
                          </div>
                          <div className="text-sm text-gray-500">
                            ID: {order._id.slice(-8)}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <UserIcon className="w-5 h-5 text-gray-400 mr-2" />
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {order.userId?.name || 'Unknown'}
                          </div>
                          <div className="text-sm text-gray-500">
                            {order.userId?.email || 'N/A'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="flex items-center">
                        <CalendarIcon className="w-4 h-4 text-gray-400 mr-1" />
                        <div>
                          {new Date(order.createdAt).toLocaleDateString()}
                          <div className="text-xs text-gray-500">
                            {new Date(order.createdAt).toLocaleTimeString()}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {order.items?.length || 0} items
                      <div className="text-xs text-gray-500">
                        {order.items?.reduce((sum, item) => sum + item.quantity, 0) || 0} qty
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <CurrencyDollarIcon className="w-4 h-4 text-gray-400 mr-1" />
                        <span className="text-sm font-semibold text-gray-900">
                          {order.totalPoints} pts
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                        {getStatusIcon(order.status)}
                        <span className="ml-1 capitalize">{order.status}</span>
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => setSelectedOrder(order)}
                          className="text-blue-600 hover:text-blue-900"
                          title="View Details"
                        >
                          <EyeIcon className="w-4 h-4" />
                        </button>
                        {order.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleOrderAction(order, 'completed')}
                              className="text-green-600 hover:text-green-900"
                              title="Mark as Completed"
                            >
                              <CheckCircleIcon className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleOrderAction(order, 'cancelled')}
                              className="text-red-600 hover:text-red-900"
                              title="Cancel Order"
                            >
                              <XCircleIcon className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {orders?.pagination && (
        <div className="flex items-center justify-between px-4 py-3 bg-white border-t border-gray-200 sm:px-6">
          <div className="flex-1 flex justify-between sm:hidden">
            <button
              onClick={() => setOrderPage(prev => Math.max(prev - 1, 1))}
              disabled={orderPage === 1}
              className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
            >
              Previous
            </button>
            <button
              onClick={() => setOrderPage(prev => prev + 1)}
              disabled={orderPage >= orders.pagination.totalPages}
              className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
            >
              Next
            </button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Showing <span className="font-medium">{((orderPage - 1) * 20) + 1}</span> to{' '}
                <span className="font-medium">{Math.min(orderPage * 20, orders.pagination.total)}</span> of{' '}
                <span className="font-medium">{orders.pagination.total}</span> results
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                <button
                  onClick={() => setOrderPage(prev => Math.max(prev - 1, 1))}
                  disabled={orderPage === 1}
                  className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  onClick={() => setOrderPage(prev => prev + 1)}
                  disabled={orderPage >= orders.pagination.totalPages}
                  className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                >
                  Next
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderSystem = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-semibold text-blue-900">System Management</h3>
        <p className="text-blue-600">Manage automated point distribution and system settings</p>
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
      case 'orders':
        return renderOrders();
      case 'system':
        return renderSystem();
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
                onClick={() => setActiveTab(tab.id)}
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

      {/* Order Action Modal */}
      {showOrderModal && selectedOrder && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3 text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100">
                <ExclamationTriangleIcon className="h-6 w-6 text-yellow-600" />
              </div>
              <h3 className="text-lg leading-6 font-medium text-gray-900 mt-2">
                {orderAction === 'completed' ? 'Mark Order as Completed' : 'Cancel Order'}
              </h3>
              <div className="mt-2 px-7 py-3">
                <p className="text-sm text-gray-500">
                  Are you sure you want to {orderAction === 'completed' ? 'mark this order as completed' : 'cancel this order'}?
                </p>
                <p className="text-sm font-medium text-gray-900 mt-2">
                  Order: {selectedOrder.orderNumber || `#${selectedOrder._id.slice(-6)}`}
                </p>
                <p className="text-sm text-gray-500">
                  Customer: {selectedOrder.userId?.name || 'Unknown'}
                </p>
                <p className="text-sm text-gray-500">
                  Points: {selectedOrder.totalPoints}
                </p>
                {orderAction === 'cancelled' && (
                  <p className="text-sm text-red-600 mt-2">
                    Points will be refunded to the customer.
                  </p>
                )}
              </div>
              <div className="mt-4">
                <textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Add admin notes (optional)"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows="3"
                />
              </div>
              <div className="items-center px-4 py-3 space-x-2">
                <button
                  onClick={handleConfirmOrderAction}
                  disabled={updateOrderStatusMutation.isPending}
                  className={`px-4 py-2 text-white text-base font-medium rounded-md w-full shadow-sm ${
                    orderAction === 'completed' 
                      ? 'bg-green-600 hover:bg-green-700' 
                      : 'bg-red-600 hover:bg-red-700'
                  } focus:outline-none focus:ring-2 focus:ring-blue-300 disabled:opacity-50`}
                >
                  {updateOrderStatusMutation.isPending ? 'Processing...' : 'Confirm'}
                </button>
                <button
                  onClick={() => {
                    setShowOrderModal(false);
                    setSelectedOrder(null);
                    setAdminNotes('');
                  }}
                  className="px-4 py-2 bg-gray-600 text-white text-base font-medium rounded-md w-full shadow-sm hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-300"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Order Details Modal */}
      {selectedOrder && !showOrderModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border max-w-2xl shadow-lg rounded-md bg-white">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Order Details</h3>
              <button
                onClick={() => setSelectedOrder(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">Order Number</p>
                  <p className="text-sm text-gray-900">{selectedOrder.orderNumber || `#${selectedOrder._id.slice(-6)}`}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Status</p>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(selectedOrder.status)}`}>
                    {getStatusIcon(selectedOrder.status)}
                    <span className="ml-1 capitalize">{selectedOrder.status}</span>
                  </span>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Customer</p>
                  <p className="text-sm text-gray-900">{selectedOrder.userId?.name || 'Unknown'}</p>
                  <p className="text-xs text-gray-500">{selectedOrder.userId?.email || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Total Points</p>
                  <p className="text-sm text-gray-900">{selectedOrder.totalPoints}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Order Date</p>
                  <p className="text-sm text-gray-900">{new Date(selectedOrder.createdAt).toLocaleDateString()}</p>
                </div>
                {selectedOrder.processedAt && (
                  <div>
                    <p className="text-sm font-medium text-gray-500">Processed Date</p>
                    <p className="text-sm text-gray-900">{new Date(selectedOrder.processedAt).toLocaleDateString()}</p>
                  </div>
                )}
              </div>
              
              <div>
                <p className="text-sm font-medium text-gray-500 mb-2">Items</p>
                <div className="space-y-2">
                  {selectedOrder.items?.map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <div className="flex items-center space-x-3">
                        {item.productId?.image && (
                          <img src={item.productId.image} alt={item.productId.name} className="w-8 h-8 rounded" />
                        )}
                        <div>
                          <p className="text-sm font-medium text-gray-900">{item.productId?.name || 'Unknown Product'}</p>
                          <p className="text-xs text-gray-500">Quantity: {item.quantity}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900">{item.totalPoints} points</p>
                        <p className="text-xs text-gray-500">{item.pointsCostPerItem} per item</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {selectedOrder.shippingAddress && (
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-2">Shipping Address</p>
                  <div className="p-3 bg-gray-50 rounded">
                    <p className="text-sm text-gray-900">{selectedOrder.shippingAddress.name}</p>
                    <p className="text-sm text-gray-600">{selectedOrder.shippingAddress.address}</p>
                    <p className="text-sm text-gray-600">
                      {selectedOrder.shippingAddress.city}, {selectedOrder.shippingAddress.state} {selectedOrder.shippingAddress.zipCode}
                    </p>
                  </div>
                </div>
              )}

              {selectedOrder.notes && (
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-2">Admin Notes</p>
                  <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded">{selectedOrder.notes}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Cancellation Request Card Component
const CancellationRequestCard = ({ order, onProcess, isProcessing }) => {
  const handleApprove = () => {
    const adminNotes = window.prompt('Add notes for approval (optional):');
    if (adminNotes !== null) {
      onProcess(order, 'approve', adminNotes);
    }
  };

  const handleDeny = () => {
    const adminNotes = window.prompt('Add notes for denial (required):');
    if (adminNotes !== null && adminNotes.trim()) {
      onProcess(order, 'deny', adminNotes);
    } else if (adminNotes !== null) {
      alert('Please provide a reason for denial.');
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <div className="flex items-center space-x-4 mb-3">
            <h3 className="text-lg font-semibold text-gray-900">
              Order #{order.orderNumber || order._id.slice(-6)}
            </h3>
            <span className="px-2 py-1 bg-orange-100 text-orange-800 text-xs font-medium rounded-full">
              Cancellation Requested
            </span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <p className="text-sm text-gray-600">Customer</p>
              <p className="font-medium">{order.userId?.name || 'Unknown'}</p>
              <p className="text-sm text-gray-500">{order.userId?.email || 'Unknown'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Order Date</p>
              <p className="font-medium">{new Date(order.createdAt).toLocaleDateString()}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Points</p>
              <p className="font-medium">{order.totalPoints} points</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Request Date</p>
              <p className="font-medium">{new Date(order.cancellationRequest.requestedAt).toLocaleDateString()}</p>
            </div>
          </div>

          {order.cancellationRequest.reason && (
            <div className="mb-4">
              <p className="text-sm text-gray-600">Reason for Cancellation</p>
              <p className="text-sm bg-gray-50 p-3 rounded-lg">{order.cancellationRequest.reason}</p>
            </div>
          )}

          <div className="mb-4">
            <p className="text-sm text-gray-600 mb-2">Items ({order.items.length})</p>
            <div className="space-y-2">
              {order.items.slice(0, 3).map((item, index) => (
                <div key={index} className="flex items-center space-x-3 text-sm">
                  {item.productId ? (
                    <>
                      <img
                        src={item.productId.image || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjMyIiBoZWlnaHQ9IjMyIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0xNiAyMkMyMCAyMiAyMCAyMiAyMCAyMkMyMCAyMiAyMCAyMiAxNiAyMkMxMiAyMiAxMiAyMiAxMiAyMkMxMiAyMiAxMiAyMiAxNiAyMloiIGZpbGw9IiM5Q0EzQUYiLz4KPGNpcmNsZSBjeD0iMTYiIGN5PSIxNiIgcj0iNiIgZmlsbD0iIzlDQTNBRiIvPgo8L3N2Zz4K'}
                        alt={item.productId.name || 'Product'}
                        className="w-8 h-8 object-cover rounded"
                      />
                      <span>{item.productId.name || 'Unknown Product'} × {item.quantity}</span>
                    </>
                  ) : (
                    <>
                      <div className="w-8 h-8 bg-gray-200 rounded flex items-center justify-center">
                        <span className="text-xs text-gray-500">?</span>
                      </div>
                      <span>Unknown Product × {item.quantity}</span>
                    </>
                  )}
                  <span className="text-gray-500">({item.totalPoints} pts)</span>
                </div>
              ))}
              {order.items.length > 3 && (
                <p className="text-sm text-gray-500">+{order.items.length - 3} more items</p>
              )}
            </div>
          </div>
        </div>

        <div className="flex space-x-2 ml-4">
          <button
            onClick={handleApprove}
            disabled={isProcessing}
            className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <CheckCircleIcon className="h-4 w-4 mr-2" />
            {isProcessing ? 'Processing...' : 'Approve'}
          </button>
          <button
            onClick={handleDeny}
            disabled={isProcessing}
            className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <XMarkIcon className="h-4 w-4 mr-2" />
            {isProcessing ? 'Processing...' : 'Deny'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminPage;
