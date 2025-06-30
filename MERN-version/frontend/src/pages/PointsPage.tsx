import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../lib/api';
import LoadingSpinner from '../components/LoadingSpinner';
import {
  HeartIcon,
  ChartBarIcon,
  UsersIcon,
  ClockIcon,
  GiftIcon,
  TrophyIcon
} from '@heroicons/react/24/outline';

const PointsPage: React.FC = () => {
  const { user, points } = useAuth();
  const queryClient = useQueryClient();
  const [selectedUser, setSelectedUser] = useState('');
  const [cheerMessage, setCheerMessage] = useState('');
  const [isCheerModalOpen, setIsCheerModalOpen] = useState(false);

  // Fetch users for cheering
  const { data: users, isLoading: usersLoading } = useQuery({
    queryKey: ['users'],
    queryFn: () => apiClient.getUsers(),
  });

  // Fetch transactions
  const { data: transactions, isLoading: transactionsLoading } = useQuery({
    queryKey: ['transactions'],
    queryFn: () => apiClient.getTransactions({}),
  });

  // Cheer mutation
  const cheerMutation = useMutation({
    mutationFn: ({ toUserId, message }: { toUserId: string; message: string }) =>
      apiClient.cheerUser({ toUserId, amount: 10, message }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['points'] });
      setIsCheerModalOpen(false);
      setSelectedUser('');
      setCheerMessage('');
    },
  });

  const handleCheer = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedUser && cheerMessage.trim()) {
      cheerMutation.mutate({ toUserId: selectedUser, message: cheerMessage.trim() });
    }
  };

  const filteredUsers = users?.data?.filter((u: any) => u._id !== user?._id) || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-blue-900">Points & Recognition</h1>
          <p className="text-blue-600">Manage your points and cheer your peers</p>
        </div>
        <button
          onClick={() => setIsCheerModalOpen(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
        >
          <HeartIcon className="w-4 h-4" />
          <span>Cheer a Peer</span>
        </button>
      </div>

      {/* Points Summary */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-blue-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-700">Available Points</p>
              <p className="text-2xl font-bold text-blue-900">{points?.availablePoints || 0}</p>
            </div>
            <ChartBarIcon className="w-8 h-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-blue-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-700">Total Earned</p>
              <p className="text-2xl font-bold text-blue-900">{points?.totalEarned || 0}</p>
            </div>
            <TrophyIcon className="w-8 h-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-blue-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-700">Total Spent</p>
              <p className="text-2xl font-bold text-blue-900">{points?.totalSpent || 0}</p>
            </div>
            <GiftIcon className="w-8 h-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-blue-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-700">Monthly Cheer</p>
              <p className="text-2xl font-bold text-blue-900">
                {points?.monthlyCheerUsed || 0}/{points?.monthlyCheerLimit || 100}
              </p>
            </div>
            <HeartIcon className="w-8 h-8 text-blue-600" />
          </div>
        </div>
      </div>

      {/* Transaction History */}
      <div className="bg-white rounded-lg shadow-sm border border-blue-100">
        <div className="p-6 border-b border-blue-100">
          <h3 className="text-lg font-semibold text-blue-900">Transaction History</h3>
        </div>
        <div className="p-6">
          {transactionsLoading ? (
            <div className="flex justify-center py-8">
              <LoadingSpinner size="md" text="Loading transactions..." />
            </div>
          ) : (
            <div className="space-y-4">
              {transactions?.data?.map((transaction) => (
                <div key={transaction._id} className="flex items-center space-x-4 p-4 rounded-lg bg-blue-50 border border-blue-200">
                  <div className="flex-shrink-0">
                    {transaction.type === 'earned' ? (
                      <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                        <ChartBarIcon className="w-5 h-5 text-green-600" />
                      </div>
                    ) : (
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <GiftIcon className="w-5 h-5 text-blue-600" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-blue-900">{transaction.description}</p>
                    {transaction.message && (
                      <p className="text-sm text-blue-600 italic mt-1">"{transaction.message}"</p>
                    )}
                    <div className="flex items-center space-x-4 mt-2 text-xs text-blue-600">
                      <div className="flex items-center space-x-1">
                        <ClockIcon className="w-3 h-3" />
                        <span>{new Date(transaction.createdAt).toLocaleDateString()}</span>
                      </div>
                      {transaction.fromUserId && typeof transaction.fromUserId === 'object' && (
                        <div className="flex items-center space-x-1">
                          <UsersIcon className="w-3 h-3" />
                          <span>From: {(transaction.fromUserId as any).name}</span>
                        </div>
                      )}
                      {transaction.toUserId && typeof transaction.toUserId === 'object' && (
                        <div className="flex items-center space-x-1">
                          <UsersIcon className="w-3 h-3" />
                          <span>To: {(transaction.toUserId as any).name}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`text-lg font-semibold ${
                      transaction.amount > 0 ? 'text-green-600' : 'text-blue-600'
                    }`}>
                      {transaction.amount > 0 ? '+' : ''}{transaction.amount} pts
                    </span>
                  </div>
                </div>
              ))}
              {(!transactions?.data || transactions.data.length === 0) && (
                <p className="text-center text-gray-500 py-8">No transactions found</p>
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
                  ) : (
                    filteredUsers.map((user: any) => (
                      <option key={user._id} value={user._id}>
                        {user.name} ({user.department})
                      </option>
                    ))
                  )}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Message (optional)
                </label>
                <textarea
                  value={cheerMessage}
                  onChange={(e) => setCheerMessage(e.target.value)}
                  placeholder="Add a positive message..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsCheerModalOpen(false)}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!selectedUser || cheerMutation.isPending}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center space-x-2"
                >
                  {cheerMutation.isPending ? (
                    <LoadingSpinner size="sm" />
                  ) : (
                    <>
                      <HeartIcon className="w-4 h-4" />
                      <span>Send Cheer (10 pts)</span>
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
