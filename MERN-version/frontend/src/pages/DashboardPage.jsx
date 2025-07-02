import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../lib/api';
import LoadingSpinner from '../components/LoadingSpinner';
import {
  ChartBarIcon,
  GiftIcon,
  HeartIcon,
  FaceSmileIcon,
  CalendarIcon,
  TrophyIcon
} from '@heroicons/react/24/outline';

const DashboardPage= () => {
  const { user, points } = useAuth();

  // Fetch recent transactions
  const { data: transactions, isLoading: transactionsLoading } = useQuery({
    queryKey: ['transactions', { limit: 5 }],
    queryFn: () => apiClient.getTransactions({ limit: 5 }),
  });

  // Fetch recent mood entries
  const { data: moods, isLoading: moodsLoading } = useQuery({
    queryKey: ['mood-history', { limit: 3 }],
    queryFn: () => apiClient.getMoodHistory({ limit: 3 }),
  });

  if (transactionsLoading || moodsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" text="Loading dashboard..." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-blue-900">Welcome back, {user?.name}!</h1>
          <p className="text-blue-600">Here's your activity overview.</p>
        </div>
        <div className="flex items-center space-x-2 bg-white px-4 py-2 rounded-lg shadow-sm">
          <CalendarIcon className="w-4 h-4 text-blue-600" />
          <span className="text-sm text-blue-800">
            {new Date().toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </span>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-blue-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-700">Available Points</p>
              <p className="text-2xl font-bold text-blue-900">{points?.availablePoints || 0}</p>
              <p className="text-xs text-blue-600">Ready to spend</p>
            </div>
            <ChartBarIcon className="w-8 h-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-blue-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-700">Points Earned</p>
              <p className="text-2xl font-bold text-blue-900">{points?.totalEarned || 0}</p>
              <p className="text-xs text-blue-600">Total lifetime</p>
            </div>
            <TrophyIcon className="w-8 h-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-blue-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-700">Points Spent</p>
              <p className="text-2xl font-bold text-blue-900">{points?.totalSpent || 0}</p>
              <p className="text-xs text-blue-600">On rewards</p>
            </div>
            <GiftIcon className="w-8 h-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-blue-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-700">Monthly Limit</p>
              <p className="text-2xl font-bold text-blue-900">
                {points?.monthlyCheerUsed || 0}/{points?.monthlyCheerLimit || 100}
              </p>
              <p className="text-xs text-blue-600">Cheer points</p>
            </div>
            <HeartIcon className="w-8 h-8 text-blue-600" />
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Link
          to="/points"
          className="bg-blue-600 text-white p-6 rounded-lg hover:bg-blue-700 transition-colors flex flex-col items-center space-y-2 h-20 justify-center"
        >
          <HeartIcon className="w-5 h-5" />
          <span className="font-medium">Cheer a Peer</span>
        </Link>
        <Link
          to="/shop"
          className="bg-white text-blue-600 border border-blue-200 p-6 rounded-lg hover:bg-blue-50 transition-colors flex flex-col items-center space-y-2 h-20 justify-center"
        >
          <GiftIcon className="w-5 h-5" />
          <span className="font-medium">Rewards Shop</span>
        </Link>
        <Link
          to="/points"
          className="bg-white text-blue-600 border border-blue-200 p-6 rounded-lg hover:bg-blue-50 transition-colors flex flex-col items-center space-y-2 h-20 justify-center"
        >
          <ChartBarIcon className="w-5 h-5" />
          <span className="font-medium">View Points</span>
        </Link>
        <Link
          to="/mood"
          className="bg-white text-blue-600 border border-blue-200 p-6 rounded-lg hover:bg-blue-50 transition-colors flex flex-col items-center space-y-2 h-20 justify-center"
        >
          <FaceSmileIcon className="w-5 h-5" />
          <span className="font-medium">Mood Check</span>
        </Link>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Recent Activity */}
        <div className="bg-white rounded-lg shadow-sm border border-blue-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-blue-900">Recent Activity</h3>
            <Link to="/points" className="text-sm text-blue-600 hover:text-blue-800">
              View all
            </Link>
          </div>
          <div className="space-y-4">
            {transactions?.data?.slice(0, 5).map((transaction) => (
              <div key={transaction._id} className="flex items-center space-x-4 p-3 rounded-lg bg-blue-50 border border-blue-200">
                <div className="flex-shrink-0">
                  {transaction.type === 'earned' ? (
                    <ChartBarIcon className="w-5 h-5 text-green-600" />
                  ) : (
                    <GiftIcon className="w-5 h-5 text-blue-600" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-blue-900">{transaction.description}</p>
                  {transaction.message && (
                    <p className="text-xs text-blue-600 italic">"{transaction.message}"</p>
                  )}
                  <p className="text-xs text-blue-600 mt-1">
                    {new Date(transaction.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-right">
                  <span className={`text-sm font-medium ${
                    transaction.amount > 0 ? 'text-green-600' : 'text-blue-600'
                  }`}>
                    {transaction.amount > 0 ? '+' : ''}{transaction.amount} pts
                  </span>
                </div>
              </div>
            ))}
            {(!transactions?.data || transactions.data.length === 0) && (
              <p className="text-sm text-gray-500 text-center py-4">No recent activity</p>
            )}
          </div>
        </div>

        {/* Recent Mood Check-ins */}
        <div className="bg-white rounded-lg shadow-sm border border-blue-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-blue-900">Recent Mood Check-ins</h3>
            <Link to="/mood" className="text-sm text-blue-600 hover:text-blue-800">
              Check mood
            </Link>
          </div>
          <div className="space-y-4">
            {moods?.slice(0, 3).map((mood) => (
              <div key={mood._id} className="flex items-center space-x-4 p-3 rounded-lg bg-blue-50 border border-blue-200">
                <div className="text-2xl">
                  {mood.mood === 'excellent' ? '😄' : 
                   mood.mood === 'good' ? '😊' : 
                   mood.mood === 'okay' ? '😐' : 
                   mood.mood === 'not-great' ? '😔' : '😞'}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-blue-900 capitalize">{mood.mood}</p>
                  {mood.comment && (
                    <p className="text-xs text-blue-600">"{mood.comment}"</p>
                  )}
                  <p className="text-xs text-blue-600 mt-1">
                    {new Date(mood.date).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
            {(!moods || moods.length === 0) && (
              <p className="text-sm text-gray-500 text-center py-4">No recent mood entries</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
