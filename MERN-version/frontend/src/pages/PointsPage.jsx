import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../lib/api';
import { useEventDrivenRefresh } from '../hooks/useUnifiedAutoRefresh';
import { useCheer } from '../hooks/useCheer';
import LoadingSpinner from '../components/LoadingSpinner';
import {
  HeartIcon,
  ChartBarIcon,
  UsersIcon,
  ClockIcon,
  GiftIcon,
  TrophyIcon
} from '@heroicons/react/24/outline';

const PointsPage = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedUser, setSelectedUser] = useState('');
  const [cheerAmount, setCheerAmount] = useState(10);
  const [cheerMessage, setCheerMessage] = useState('');
  const [isCheerModalOpen, setIsCheerModalOpen] = useState(false);
  const [transactionFilter, setTransactionFilter] = useState('all');
  const { triggerCheerRefresh } = useEventDrivenRefresh();

  // Auto-refresh is now handled globally

  // Use shared cheer hook for global cache invalidation
  const cheerMutation = useCheer({
    onSuccess: () => {
      // Reset cheer form on successful submission
      setIsCheerModalOpen(false);
      setSelectedUser('');
      setCheerMessage('');
      setCheerAmount(10);
    }
  });

  // Fetch points data with reasonable refresh settings
  const { data: points, isLoading: pointsLoading } = useQuery({
    queryKey: ['points'],
    queryFn: async () => {
      console.log('🔍 PointsPage - Fetching fresh points data...');
      const result = await apiClient.getPoints();
      console.log('📊 PointsPage - Fresh points data received:', result);
      return result;
    },
    staleTime: 1 * 60 * 1000, // 1 minute
    cacheTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    retry: (failureCount, error) => {
      if (error?.response?.status === 429) return false;
      return failureCount < 2;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  // Fetch users for cheering (non-admin endpoint)
  const { data: users, isLoading: usersLoading } = useQuery({
    queryKey: ['users-for-cheering'],
    queryFn: () => apiClient.getUsersForCheering(),
    retry: false,
  });

  // Fetch transactions with optional filtering
  const { data: transactions, isLoading: transactionsLoading } = useQuery({
    queryKey: ['transactions', transactionFilter],
    queryFn: () => apiClient.getTransactions({ 
      type: transactionFilter === 'all' ? undefined : transactionFilter 
    }),
  });

  // Safety helper to validate transaction data and handle edge cases
  const validateTransaction = (transaction) => {
    if (!transaction || typeof transaction !== 'object') {
      console.warn('Invalid transaction object:', transaction);
      return false;
    }
    
    if (!transaction._id || !transaction.type || typeof transaction.amount !== 'number') {
      console.warn('Transaction missing required fields:', transaction);
      return false;
    }
    
    if (!['earned', 'spent', 'given', 'received', 'admin_grant', 'admin_deduct'].includes(transaction.type)) {
      console.warn('Unknown transaction type:', transaction.type);
      return false;
    }
    
    if (transaction.amount < 0) {
      console.warn('Negative transaction amount:', transaction.amount);
      return false;
    }
    
    return true;
  };

  // Enhanced helper function to safely handle null/undefined user references
  const getSafeUserInfo = (userRef) => {
    if (!userRef) return null;
    
    // Handle populated user object
    if (typeof userRef === 'object' && userRef._id) {
      return {
        id: userRef._id,
        name: userRef.name || 'Unknown User',
        department: userRef.department || 'Unknown Department'
      };
    }
    
    // Handle user ID string
    if (typeof userRef === 'string') {
      return {
        id: userRef,
        name: 'Loading...',
        department: ''
      };
    }
    
    return null;
  };

  // Enhanced helper function to format transaction type and message with better categorization and safety
  const getTransactionDisplay = (transaction) => {
    // Validate transaction first
    if (!validateTransaction(transaction)) {
      return {
        title: 'Invalid Transaction',
        subtitle: 'Data error',
        icon: <ClockIcon className="w-5 h-5 text-red-600" />,
        isReceived: false,
        isSpent: false,
        involvedParty: 'Error'
      };
    }

    const isReceived = transaction.type === 'earned' || transaction.type === 'received' || transaction.type === 'admin_grant';
    const isSpent = transaction.type === 'spent' || transaction.type === 'given' || transaction.type === 'admin_deduct';
    
    let title = '';
    let subtitle = '';
    let icon = null;
    let involvedParty = '';
    
    if (isReceived) {
      // Only show received cheer transactions (remove the "given" duplicate)
      if (transaction.type === 'received' && transaction.fromUserId) {
        const fromUser = getSafeUserInfo(transaction.fromUserId);
        if (fromUser) {
          title = `Received cheer from ${fromUser.name}`;
          involvedParty = `${fromUser.name} (${fromUser.department})`;
        } else {
          title = 'Received cheer';
          involvedParty = 'Unknown User';
        }
        icon = <HeartIcon className="w-5 h-5 text-pink-600" />;
      } 
      else if (transaction.type === 'admin_grant' || transaction.description?.includes('admin')) {
        title = 'System bonus points';
        subtitle = 'Administrative grant';
        involvedParty = 'System Administrator';
        icon = <TrophyIcon className="w-5 h-5 text-blue-600" />;
      } 
      // Generic earned points (excluding automatic distribution)
      else if (!transaction.description?.includes('Automatic point distribution') && !transaction.description?.includes('daily')) {
        title = 'Points earned';
        subtitle = 'General earnings';
        involvedParty = 'System';
        icon = <ChartBarIcon className="w-5 h-5 text-green-600" />;
      } else {
        // Skip automatic distribution transactions
        return null;
      }
    } 
    else if (isSpent) {
      // Only show given cheer transactions (remove the "received" duplicate)
      if (transaction.type === 'given' && transaction.toUserId) {
        const toUser = getSafeUserInfo(transaction.toUserId);
        if (toUser) {
          title = `Cheered ${toUser.name}`;
          involvedParty = `${toUser.name} (${toUser.department})`;
        } else {
          title = 'Cheered colleague';
          involvedParty = 'Unknown User';
        }
        icon = <HeartIcon className="w-5 h-5 text-pink-600" />;
      } 
      // Redeemed shop items
      else if (transaction.description?.includes('purchase') || transaction.description?.includes('bought') || transaction.description?.includes('Redeemed')) {
        // Extract item name from description with better pattern matching
        const itemMatch = transaction.description.match(/(?:Redeemed|bought|purchase[d]?)\s+(.+?)(?:\s+for|\s+\(|\s*$)/i);
        const itemName = itemMatch ? itemMatch[1].trim() : 'shop item';
        title = `Redeemed ${itemName}`;
        subtitle = 'Shop purchase';
        involvedParty = 'Company Store';
        icon = <GiftIcon className="w-5 h-5 text-purple-600" />;
      } 
      // Admin deduction
      else if (transaction.type === 'admin_deduct') {
        title = 'Points deducted';
        subtitle = 'Administrative action';
        involvedParty = 'System Administrator';
        icon = <GiftIcon className="w-5 h-5 text-red-600" />;
      }
      // Generic spent points
      else {
        title = 'Points spent';
        subtitle = 'General spending';
        involvedParty = 'System';
        icon = <GiftIcon className="w-5 h-5 text-red-600" />;
      }
    }
    
    return { title, subtitle, icon, isReceived, isSpent, involvedParty };
  };

  // Enhanced helper function to format date and time with better readability
  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    // Format date portion
    let dateStr = '';
    if (diffInDays === 0) {
      dateStr = 'Today';
    } else if (diffInDays === 1) {
      dateStr = 'Yesterday';
    } else if (diffInDays < 7) {
      dateStr = date.toLocaleDateString('en-US', { weekday: 'long' });
    } else {
      dateStr = date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
      });
    }
    
    // Format time portion
    const timeStr = date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true
    });
    
    return `${dateStr} at ${timeStr}`;
  };

  const handleCheer = (e) => {
    e.preventDefault();
    if (selectedUser && cheerAmount > 0) {
      cheerMutation.mutate({ 
        toUserId: selectedUser, 
        amount: cheerAmount,
        message: cheerMessage.trim() 
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-blue-900">Points & Recognition</h1>
          <p className="text-blue-600">Manage your points, view transactions, and cheer your peers</p>
        </div>
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setIsCheerModalOpen(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
          >
            <HeartIcon className="w-4 h-4" />
            <span>Cheer a Peer</span>
          </button>
        </div>
      </div>

      {/* Points Summary */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Available Points</p>
              <p className="text-3xl font-bold text-blue-900">{points?.availablePoints || 0}</p>
              <p className="text-xs text-gray-500 mt-1">Ready to use</p>
            </div>
            <ChartBarIcon className="w-8 h-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Earned</p>
              <p className="text-3xl font-bold text-green-700">{points?.totalEarned || 0}</p>
              <p className="text-xs text-gray-500 mt-1">All time earnings</p>
            </div>
            <TrophyIcon className="w-8 h-8 text-green-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-red-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Spent</p>
              <p className="text-3xl font-bold text-red-700">{points?.totalSpent || 0}</p>
              <p className="text-xs text-gray-500 mt-1">All time spending</p>
            </div>
            <GiftIcon className="w-8 h-8 text-red-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-pink-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Monthly Cheer Usage</p>
              <p className="text-3xl font-bold text-pink-700">
                {points?.monthlyCheerUsed || 0}/{points?.monthlyCheerLimit || 100}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {((points?.monthlyCheerUsed || 0) / (points?.monthlyCheerLimit || 100) * 100).toFixed(0)}% used
              </p>
            </div>
            <HeartIcon className="w-8 h-8 text-pink-600" />
          </div>
        </div>
      </div>

      {/* Transaction History */}
      <div className="bg-white rounded-lg shadow-sm border border-blue-100">
        <div className="p-6 border-b border-blue-100">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-blue-900">Transaction History</h3>
              <p className="text-sm text-gray-600 mt-1">
                Chronological log of all point-related activities with complete accountability
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <div className="text-xs text-gray-500">
                Filter by type:
              </div>
              <select
                value={transactionFilter}
                onChange={(e) => setTransactionFilter(e.target.value)}
                className="px-3 py-2 border border-blue-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
              >
                <option value="all">All Transactions</option>
                <option value="earned">📈 Received Points</option>
                <option value="spent">📉 Spent Points</option>
              </select>
            </div>
          </div>
        </div>
        <div className="p-6">
          {transactionsLoading ? (
            <div className="flex justify-center py-8">
              <LoadingSpinner size="md" text="Loading transaction history..." />
            </div>
          ) : (
            <div className="space-y-3">
              {transactions?.data && transactions.data.length > 0 ? (
                transactions.data
                  .filter(transaction => validateTransaction(transaction)) // Filter out invalid transactions
                  .map((transaction) => {
                    try {
                      const display = getTransactionDisplay(transaction);
                      return (
                        <div key={transaction._id} className={`p-4 rounded-lg border-l-4 transition-all hover:shadow-md ${
                          display.isReceived 
                            ? 'bg-gradient-to-r from-green-50 to-blue-50 border-green-400' 
                            : 'bg-gradient-to-r from-red-50 to-orange-50 border-red-400'
                        }`}>
                          <div className="flex items-start justify-between">
                            <div className="flex items-start space-x-3 flex-1">
                              <div className={`w-12 h-12 rounded-full flex items-center justify-center shadow-sm ${
                                display.isReceived ? 'bg-green-100' : 'bg-red-100'
                              }`}>
                                {display.icon}
                              </div>
                              <div className="flex-1 min-w-0">
                                {/* Transaction Type - Main Title */}
                                <h4 className="text-base font-semibold text-gray-900 mb-1">
                                  {display.title}
                                </h4>
                                
                                {/* Subtitle if applicable */}
                                {display.subtitle && (
                                  <p className="text-sm text-gray-600 mb-2">{display.subtitle}</p>
                                )}
                                
                                {/* Message - Personal touch for cheers with enhanced styling */}
                                {transaction.message && (
                                  <div className="bg-white p-3 rounded-lg border-l-3 border-blue-400 mb-3 shadow-sm">
                                    <div className="flex items-start space-x-2">
                                      <span className="text-blue-500 text-lg">"</span>
                                      <p className="text-sm text-blue-700 italic flex-1">{transaction.message}</p>
                                      <span className="text-blue-500 text-lg">"</span>
                                    </div>
                                  </div>
                                )}
                                
                                {/* Enhanced Information Row */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-gray-500">
                                  {/* Date and Time - Formatted timestamp */}
                                  <div className="flex items-center space-x-1">
                                    <ClockIcon className="w-4 h-4 text-gray-400" />
                                    <span className="font-medium">
                                      {transaction.createdAt ? formatDateTime(transaction.createdAt) : 'Unknown date'}
                                    </span>
                                  </div>
                                  
                                  {/* Involved Party Information - Enhanced display */}
                                  <div className="flex items-center space-x-1">
                                    <UsersIcon className="w-4 h-4 text-gray-400" />
                                    <span className="font-medium">
                                      {display.isReceived ? 'From: ' : 'To: '}
                                      {display.involvedParty}
                                    </span>
                                  </div>
                                </div>
                                
                                {/* Transaction Type Badge */}
                                <div className="mt-2">
                                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                    display.isReceived 
                                      ? 'bg-green-100 text-green-800' 
                                      : 'bg-red-100 text-red-800'
                                  }`}>
                                    {display.isReceived ? '↗ RECEIVED' : '↙ SPENT'}
                                  </span>
                                </div>
                              </div>
                            </div>
                            
                            {/* Point Value - Enhanced with better visual distinction */}
                            <div className="text-right ml-4 min-w-0">
                              <div className={`text-2xl font-bold ${
                                display.isReceived ? 'text-blue-600' : 'text-red-600'
                              }`}>
                                {display.isReceived ? '+' : '-'}{Math.abs(transaction.amount || 0)}
                              </div>
                              <p className="text-xs text-gray-500 font-medium">points</p>
                              
                              {/* Additional context for the amount */}
                              {(transaction.amount || 0) >= 50 && (
                                <p className="text-xs text-orange-600 font-medium mt-1">
                                  High Value
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    } catch (error) {
                      console.error('Error rendering transaction:', transaction._id, error);
                      return (
                        <div key={transaction._id || Math.random()} className="p-4 rounded-lg border-l-4 bg-red-50 border-red-400">
                          <div className="flex items-center space-x-2">
                            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                              <span className="text-red-600 text-sm">!</span>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-red-800">Error displaying transaction</p>
                              <p className="text-xs text-red-600">Transaction ID: {transaction._id || 'Unknown'}</p>
                            </div>
                          </div>
                        </div>
                      );
                    }
                  })
              ) : null}
              {(!transactions?.data || transactions.data.length === 0) && (
                <div className="text-center py-16">
                  <div className="mx-auto mb-6">
                    <ClockIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    {transactionFilter === 'all' 
                      ? 'No transactions found' 
                      : transactionFilter === 'earned' 
                        ? 'No received transactions found' 
                        : 'No spent transactions found'
                    }
                  </h3>
                  <p className="text-gray-500 text-sm mb-4">
                    {transactionFilter === 'all' 
                      ? 'Your transaction history will appear here earn and spend points'
                      : transactionFilter === 'earned'
                        ? 'You haven\'t received any points yet. Get cheers from colleagues or system bonuses!'
                        : 'You haven\'t spent any points yet. Try redeeming items from the shop or cheering peers!'
                    }
                  </p>
                  {transactionFilter !== 'all' && (
                    <button 
                      onClick={() => setTransactionFilter('all')}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      View all transactions
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Cheer Modal */}
      {isCheerModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Cheer a Peer</h3>
              <p className="text-sm text-gray-600 mt-1">
                Monthly cheer limit: {points?.monthlyCheerUsed || 0}/{points?.monthlyCheerLimit || 100} points used
              </p>
            </div>
            <form onSubmit={handleCheer} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select a colleague
                </label>
                <select
                  value={selectedUser}
                  onChange={(e) => setSelectedUser(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Choose someone to cheer...</option>
                  {usersLoading ? (
                    <option disabled>Loading users...</option>
                  ) : users ? (
                    users
                      .filter((u) => u._id !== user?._id)
                      .map((u) => (
                        <option key={u._id} value={u._id}>
                          {u.name} ({u.department})
                        </option>
                      ))
                  ) : (
                    <option disabled>Unable to load users</option>
                  )}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Points to send
                </label>
                <select
                  value={cheerAmount}
                  onChange={(e) => setCheerAmount(parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value={5}>5 points</option>
                  <option value={10}>10 points</option>
                  <option value={15}>15 points</option>
                  <option value={20}>20 points</option>
                  <option value={25}>25 points</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Message
                </label>
                <textarea
                  value={cheerMessage}
                  onChange={(e) => setCheerMessage(e.target.value)}
                  placeholder="Add a positive message to encourage your peer..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setIsCheerModalOpen(false);
                    setSelectedUser('');
                    setCheerMessage('');
                    setCheerAmount(10);
                  }}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!selectedUser || !cheerMessage.trim() || cheerMutation.isPending}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center space-x-2"
                >
                  {cheerMutation.isPending ? (
                    <LoadingSpinner size="sm" />
                  ) : (
                    <>
                      <HeartIcon className="w-4 h-4" />
                      <span>Send Cheer ({cheerAmount} pts)</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PointsPage;
