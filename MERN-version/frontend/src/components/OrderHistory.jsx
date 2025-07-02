import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../lib/api';
import LoadingSpinner from './LoadingSpinner';
import {
  ClockIcon,
  CheckCircleIcon,
  DocumentTextIcon,
  ShoppingBagIcon
} from '@heroicons/react/24/outline';

const OrderHistory= () => {
  const { data: orderHistory, isLoading } = useQuery({
    queryKey: ['orderHistory'],
    queryFn: () => apiClient.getOrderHistory({ limit: 10 }),
  });

  if (isLoading) {
    return <LoadingSpinner />;
  }

  const orders = orderHistory?.data || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-blue-900">Order History</h1>
          <p className="text-blue-600">View your purchase history and receipts</p>
        </div>
      </div>

      {orders.length === 0 ? (
        <div className="text-center py-12">
          <ShoppingBagIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No orders</h3>
          <p className="mt-1 text-sm text-gray-500">You haven't made any purchases yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <OrderCard key={order._id} order={order} />
          ))}
        </div>
      )}
    </div>
  );
};

const OrderCard = ({ order }) => {
  const [showReceipt, setShowReceipt] = React.useState(false);
  const receipt = order.receipt;

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircleIcon className="w-5 h-5 text-green-500" />;
      case 'processing':
        return <ClockIcon className="w-5 h-5 text-yellow-500" />;
      default:
        return <ClockIcon className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'processing':
        return 'bg-yellow-100 text-yellow-800';
      case 'pending':
        return 'bg-blue-100 text-blue-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            {getStatusIcon(order.status)}
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                {receipt?.orderNumber || `Order #${order._id}`}
              </h3>
              <p className="text-sm text-gray-500">
                {new Date(order.createdAt).toLocaleDateString()} at{' '}
                {new Date(order.createdAt).toLocaleTimeString()}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
              {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
            </span>
            <button
              onClick={() => setShowReceipt(!showReceipt)}
              className="flex items-center space-x-1 text-blue-600 hover:text-blue-800"
            >
              <DocumentTextIcon className="w-4 h-4" />
              <span className="text-sm">Receipt</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <p className="text-sm text-gray-500">Items</p>
            <p className="font-semibold">{receipt?.summary?.itemCount || order.items.length}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Total Quantity</p>
            <p className="font-semibold">{receipt?.summary?.totalQuantity || 'N/A'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Total Points</p>
            <p className="font-semibold text-blue-600">{order.totalPoints} pts</p>
          </div>
        </div>

        <div className="space-y-2">
          <h4 className="font-medium text-gray-900">Items Purchased:</h4>
          {order.items.map((item, index) => (
            <div key={index} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
              <div className="flex items-center space-x-3">
                {item.productId?.image && (
                  <img
                    src={item.productId.image}
                    alt={item.productId.name}
                    className="w-12 h-12 rounded-lg object-cover"
                  />
                )}
                <div>
                  <p className="font-medium text-gray-900">{item.productId?.name || 'Unknown Product'}</p>
                  <p className="text-sm text-gray-500">Quantity: {item.quantity}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-semibold text-gray-900">{item.totalPoints} pts</p>
                <p className="text-sm text-gray-500">{item.pointsCostPerItem} pts each</p>
              </div>
            </div>
          ))}
        </div>

        {showReceipt && receipt && (
          <div className="mt-6 p-4 bg-gray-50 rounded-lg border">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-semibold text-gray-900">Receipt</h4>
              <span className="text-sm text-gray-500">ID: {receipt.receiptId}</span>
            </div>
            
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Order Number:</span>
                <span className="font-medium">{receipt.orderNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Date:</span>
                <span className="font-medium">{new Date(receipt.timestamp).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Payment Method:</span>
                <span className="font-medium capitalize">{receipt.payment?.method || 'Points'}</span>
              </div>
              {receipt.payment?.previousBalance && (
                <>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Previous Balance:</span>
                    <span className="font-medium">{receipt.payment.previousBalance} pts</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Points Used:</span>
                    <span className="font-medium text-red-600">-{receipt.payment.pointsUsed} pts</span>
                  </div>
                  <div className="flex justify-between border-t pt-2">
                    <span className="text-gray-900 font-semibold">New Balance:</span>
                    <span className="font-bold text-blue-600">{receipt.payment.newBalance} pts</span>
                  </div>
                </>
              )}
              
              {receipt.shippingAddress && (
                <div className="border-t pt-3 mt-3">
                  <p className="font-medium text-gray-900 mb-2">Shipping Address:</p>
                  <div className="text-gray-600 space-y-1">
                    <p>{receipt.shippingAddress.name}</p>
                    <p>{receipt.shippingAddress.address}</p>
                    <p>{receipt.shippingAddress.city}, {receipt.shippingAddress.state} {receipt.shippingAddress.zipCode}</p>
                    <p>{receipt.shippingAddress.country}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderHistory;
