import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../hooks/useAuth';
import { apiClient } from '../lib/api';
import LoadingSpinner from '../components/LoadingSpinner';
import {
  DocumentTextIcon,
  ShoppingBagIcon,
  CalendarIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  ChevronDownIcon,
  EyeIcon
} from '@heroicons/react/24/outline';

const OrderHistoryPage= () => {
  const { user, isAuthenticated } = useAuth();
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);

  const { data: orderHistory, isLoading, error } = useQuery({
    queryKey: ['orderHistory', page, statusFilter, user?._id], // Include user ID for proper caching
    queryFn: () => {
      console.log('Fetching order history for user:', user?._id); // Debug log
      return apiClient.getOrderHistory({ 
        page, 
        limit: 10,
        ...(statusFilter !== 'all' && { status: statusFilter })
      });
    },
    enabled: !!isAuthenticated && !!user, // Only run when authenticated
  });

  // Debug log
  React.useEffect(() => {
    if (error) {
      console.error('Order history error:', error);
    }
  }, [error]);

  if (!isAuthenticated || !user) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Please log in to view your order history.</p>
      </div>
    );
  }

  if (isLoading) {
    return <LoadingSpinner />;
  }

  const orders = orderHistory?.data || [];
  const pagination = orderHistory?.pagination;

  const filteredOrders = orders.filter((order) =>
    order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.items.some((item) => 
      item.productId.name.toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-blue-900">Order History</h1>
          <p className="text-blue-600">View your purchase history and receipts</p>
        </div>
        <div className="mt-4 sm:mt-0">
          <span className="text-sm text-gray-500">
            {pagination?.total || 0} total orders
          </span>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search orders or products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Status Filter */}
          <div className="sm:w-48">
            <div className="relative">
              <FunnelIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="pl-10 pr-8 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
              >
                <option value="all">All Status</option>
                <option value="completed">Completed</option>
                <option value="pending">Pending</option>
                <option value="cancelled">Cancelled</option>
              </select>
              <ChevronDownIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Orders List */}
      {filteredOrders.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <ShoppingBagIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No orders found</h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchTerm ? 'Try adjusting your search terms.' : "You haven't made any purchases yet."}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => (
            <OrderCard 
              key={order._id} 
              order={order} 
              onViewDetails={() => setSelectedOrder(order)}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination && pagination.pages > 1 && (
        <div className="flex justify-center space-x-2">
          <button
            onClick={() => setPage(page - 1)}
            disabled={page <= 1}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <span className="px-4 py-2 text-sm text-gray-700">
            Page {page} of {pagination.pages}
          </span>
          <button
            onClick={() => setPage(page + 1)}
            disabled={page >= pagination.pages}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      )}

      {/* Order Details Modal */}
      {selectedOrder && (
        <OrderDetailsModal 
          order={selectedOrder} 
          onClose={() => setSelectedOrder(null)} 
        />
      )}
    </div>
  );
};

const OrderCard = ({ order, onViewDetails }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow border border-gray-200 hover:shadow-md transition-shadow duration-200">
      <div className="p-6">
        {/* Order Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
          <div className="flex items-center space-x-3">
            <DocumentTextIcon className="h-6 w-6 text-blue-600" />
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                {order.orderNumber}
              </h3>
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <CalendarIcon className="h-4 w-4" />
                <span>{new Date(order.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-3 mt-3 sm:mt-0">
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
              {order.status}
            </span>
            <button
              onClick={onViewDetails}
              className="flex items-center text-sm text-blue-600 hover:text-blue-700"
            >
              <EyeIcon className="h-4 w-4 mr-1" />
              View Details
            </button>
          </div>
        </div>

        {/* Order Items */}
        <div className="space-y-3">
          {order.items.slice(0, 2).map((item, index) => (
            <div key={index} className="flex items-center space-x-3">
              <img
                src={item.productId.image}
                alt={item.productId.name}
                className="w-12 h-12 object-cover rounded-lg"
              />
              <div className="flex-1">
                <h4 className="text-sm font-medium text-gray-900">
                  {item.productId.name}
                </h4>
                <p className="text-xs text-gray-500">
                  Qty: {item.quantity} × {item.pointsCostPerItem} points
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-gray-900">
                  {item.totalPoints} points
                </p>
              </div>
            </div>
          ))}
          {order.items.length > 2 && (
            <p className="text-sm text-gray-500 text-center">
              +{order.items.length - 2} more items
            </p>
          )}
        </div>

        {/* Order Total */}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Total</span>
            <span className="text-lg font-bold text-gray-900">
              {order.totalPoints} points
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

const OrderDetailsModal = ({ order, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Modal Header */}
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-900">Order Details</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Receipt Content */}
          {order.receipt && (
            <div className="space-y-6">
              {/* Receipt Header */}
              <div className="text-center border-b pb-4">
                <h3 className="text-lg font-semibold">Purchase Receipt</h3>
                <p className="text-sm text-gray-600">{order.receipt.receiptId}</p>
              </div>

              {/* Customer Info */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-600">Order Number:</p>
                  <p className="font-medium">{order.receipt.orderNumber}</p>
                </div>
                <div>
                  <p className="text-gray-600">Date:</p>
                  <p className="font-medium">{new Date(order.receipt.timestamp).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-gray-600">Customer:</p>
                  <p className="font-medium">{order.receipt.customer?.name}</p>
                </div>
                <div>
                  <p className="text-gray-600">Status:</p>
                  <p className="font-medium capitalize">{order.receipt.status}</p>
                </div>
              </div>

              {/* Items */}
              <div>
                <h4 className="font-semibold mb-3">Items Purchased</h4>
                <div className="space-y-3">
                  {order.receipt.items.map((item, index) => (
                    <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded">
                      <img
                        src={item.image}
                        alt={item.productName}
                        className="w-12 h-12 object-cover rounded"
                      />
                      <div className="flex-1">
                        <h5 className="font-medium">{item.productName}</h5>
                        <p className="text-sm text-gray-600">{item.description}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm">Qty: {item.quantity}</p>
                        <p className="font-semibold">{item.totalPoints} pts</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Summary */}
              <div className="border-t pt-4">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Items:</span>
                    <span>{order.receipt.summary.itemCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Quantity:</span>
                    <span>{order.receipt.summary.totalQuantity}</span>
                  </div>
                  <div className="flex justify-between font-semibold text-lg border-t pt-2">
                    <span>Total:</span>
                    <span>{order.receipt.summary.total} points</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrderHistoryPage;
