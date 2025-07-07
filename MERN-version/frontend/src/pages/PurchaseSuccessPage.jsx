import React, { useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../hooks/useAuth';
import {
  CheckCircleIcon,
  DocumentTextIcon,
  ClockIcon,
  ShoppingBagIcon,
  CurrencyDollarIcon,
  CalendarIcon,
  UserIcon,
  PrinterIcon
} from '@heroicons/react/24/outline';

const PurchaseSuccessPage= () => {
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const purchaseData = location.state;

  useEffect(() => {
    // If no purchase data, redirect to shop
    if (!purchaseData) {
      navigate('/shop');
      return;
    }

    // The refresh is already handled by the ShopPage triggerPurchaseRefresh()
    // No need to refresh again here as it causes excessive API calls
    console.log('📄 Purchase success page loaded with data:', purchaseData);
  }, [purchaseData, navigate]);

  const handleViewOrderHistory = () => {
    // Force refresh of order history before navigating
    queryClient.invalidateQueries({ queryKey: ['orderHistory'] });
    navigate('/orders');
  };

  if (!purchaseData) {
    return null;
  }

  const { order, receipt, newBalance } = purchaseData;

  // Additional safety check
  if (!order || !receipt) {
    console.error('Missing order or receipt data:', purchaseData);
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow p-8 max-w-md w-full text-center">
          <div className="text-red-500 text-sm mb-4">
            Error: Missing order data
          </div>
          <Link
            to="/shop"
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
          >
            Back to Shop
          </Link>
        </div>
      </div>
    );
  }

  const handlePrintReceipt = () => {
    window.print();
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      {/* Success Header */}
      <div className="text-center space-y-4">
        <div className="flex justify-center">
          <CheckCircleIcon className="h-16 w-16 text-green-500" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900">Purchase Successful!</h1>
        <p className="text-lg text-gray-600">
          Thank you for your purchase. Your order has been processed successfully.
        </p>
      </div>

      {/* Order Summary Card */}
      <div className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
        <div className="bg-green-50 px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center">
              <DocumentTextIcon className="h-6 w-6 mr-2 text-green-600" />
              Order Receipt
            </h2>
            <button
              onClick={handlePrintReceipt}
              className="flex items-center text-sm text-green-600 hover:text-green-700"
            >
              <PrinterIcon className="h-4 w-4 mr-1" />
              Print Receipt
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Order Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <div className="flex items-center text-sm">
                <DocumentTextIcon className="h-4 w-4 mr-2 text-gray-400" />
                <span className="text-gray-600">Order Number:</span>
                <span className="ml-2 font-mono font-semibold text-gray-900">
                  {order?.orderNumber || 'N/A'}
                </span>
              </div>
              <div className="flex items-center text-sm">
                <CalendarIcon className="h-4 w-4 mr-2 text-gray-400" />
                <span className="text-gray-600">Date:</span>
                <span className="ml-2 text-gray-900">
                  {receipt?.timestamp ? new Date(receipt.timestamp).toLocaleString() : 'N/A'}
                </span>
              </div>
              <div className="flex items-center text-sm">
                <ClockIcon className="h-4 w-4 mr-2 text-gray-400" />
                <span className="text-gray-600">Status:</span>
                <span className="ml-2 px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                  {order?.status || 'Completed'}
                </span>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center text-sm">
                <UserIcon className="h-4 w-4 mr-2 text-gray-400" />
                <span className="text-gray-600">Customer:</span>
                <span className="ml-2 text-gray-900">{receipt?.customer?.name || 'N/A'}</span>
              </div>
              <div className="flex items-center text-sm">
                <CurrencyDollarIcon className="h-4 w-4 mr-2 text-gray-400" />
                <span className="text-gray-600">Points Used:</span>
                <span className="ml-2 font-semibold text-gray-900">
                  {receipt?.summary?.total || 0} points
                </span>
              </div>
              <div className="flex items-center text-sm">
                <CurrencyDollarIcon className="h-4 w-4 mr-2 text-gray-400" />
                <span className="text-gray-600">New Balance:</span>
                <span className="ml-2 font-semibold text-blue-600">
                  {newBalance || 0} points
                </span>
              </div>
            </div>
          </div>

          {/* Items Purchased */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Items Purchased</h3>
            <div className="space-y-4">
              {receipt?.items?.map((item, index) => (
                <div
                  key={index}
                  className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg"
                >
                  <img
                    src={item?.image || '/placeholder-image.jpg'}
                    alt={item?.productName || 'Product'}
                    className="w-16 h-16 object-cover rounded-lg"
                  />
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{item?.productName || 'Unknown Product'}</h4>
                    <p className="text-sm text-gray-600">{item?.description || 'No description'}</p>
                    <p className="text-xs text-gray-500 capitalize">{item?.category || 'uncategorized'}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">Qty: {item?.quantity || 0}</p>
                    <p className="font-semibold text-gray-900">
                      {item?.totalPoints || 0} points
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Order Summary */}
          <div className="border-t pt-4">
            <div className="flex justify-between items-center">
              <div className="space-y-1">
                <p className="text-sm text-gray-600">
                  Total Items: {receipt?.summary?.itemCount || 0}
                </p>
                <p className="text-sm text-gray-600">
                  Total Quantity: {receipt?.summary?.totalQuantity || 0}
                </p>
              </div>
              <div className="text-right">
                <p className="text-lg font-semibold text-gray-900">
                  Total: {receipt?.summary?.total || 0} points
                </p>
                <p className="text-sm text-gray-600">
                  Payment Method: Points
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Link
          to="/shop"
          className="inline-flex items-center justify-center px-6 py-3 border border-blue-600 text-base font-medium rounded-md text-blue-600 bg-white hover:bg-blue-50 transition-colors duration-200"
        >
          <ShoppingBagIcon className="h-5 w-5 mr-2" />
          Continue Shopping
        </Link>
        <button
          onClick={handleViewOrderHistory}
          className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors duration-200"
        >
          <DocumentTextIcon className="h-5 w-5 mr-2" />
          View Order History
        </button>
      </div>

      {/* Receipt ID */}
      <div className="text-center text-sm text-gray-500">
        Receipt ID: {receipt?.receiptId || 'N/A'}
      </div>
    </div>
  );
};

export default PurchaseSuccessPage;
