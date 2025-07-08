import React, { useState, useRef, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import apiClient from '../lib/apiClient';
import { useCheer } from '../hooks/useCheer';
import LoadingSpinner from '../components/LoadingSpinner';
import { formatTimeAgo } from '../lib/utils';
import {
  HeartIcon,
  SparklesIcon,
  UserGroupIcon,
  ChatBubbleLeftEllipsisIcon,
  TrophyIcon,
  CalendarDaysIcon,
  FireIcon
} from '@heroicons/react/24/outline';
import { HeartIcon as HeartIconSolid } from '@heroicons/react/24/solid';

const CheerPage = () => {
  const [cheerText, setCheerText] = useState('');
  const [cheerPoints, setCheerPoints] = useState(1);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [activeTab, setActiveTab] = useState('weekly');
  const [likedCheers, setLikedCheers] = useState(new Set());
  const [commentingCheer, setCommentingCheer] = useState(null);
  const [commentText, setCommentText] = useState('');
  const [commentCounts, setCommentCounts] = useState(new Map());
  const [cheerComments, setCheerComments] = useState(new Map());
  const [loadingComments, setLoadingComments] = useState(false);
  const [submittingComment, setSubmittingComment] = useState(false);

  const textareaRef = useRef(null);
  const dropdownRef = useRef(null);

  // Get cheer stats
  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ['cheer-stats'],
    queryFn: () => apiClient.getCheerStats(),
    staleTime: 2 * 60 * 1000, // 2 minutes
    cacheTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    refetchOnReconnect: true,
    retry: (failureCount, error) => {
      if (error?.response?.status === 429) return false;
      return failureCount < 2;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  // Get user points with reasonable refresh settings
  const { data: pointsData, isLoading: pointsLoading } = useQuery({
    queryKey: ['points'],
    queryFn: async () => {
      console.log('🔍 Fetching fresh points data...');
      const result = await apiClient.getPoints();
      console.log('📊 Fresh points data received:', result);
      return result;
    },
    staleTime: 1 * 60 * 1000, // 1 minute
    cacheTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    refetchOnReconnect: true,
    retry: (failureCount, error) => {
      if (error?.response?.status === 429) return false;
      return failureCount < 2;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  // Get received cheers
  const { data: receivedData, isLoading: receivedLoading } = useQuery({
    queryKey: ['received-cheers'],
    queryFn: () => apiClient.getReceivedCheers(),
    staleTime: 2 * 60 * 1000, // 2 minutes
    cacheTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    refetchOnReconnect: true,
    retry: (failureCount, error) => {
      if (error?.response?.status === 429) return false;
      return failureCount < 2;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  // Get recent cheers
  const { data: recentData, isLoading: recentLoading } = useQuery({
    queryKey: ['recent-cheers'],
    queryFn: () => apiClient.getRecentCheers(),
    staleTime: 1 * 60 * 1000, // 1 minute
    cacheTime: 3 * 60 * 1000, // 3 minutes
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    refetchOnReconnect: true,
    retry: (failureCount, error) => {
      if (error?.response?.status === 429) return false;
      return failureCount < 2;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  // Get leaderboard
  const { data: leaderboardData, isLoading: leaderboardLoading } = useQuery({
    queryKey: ['leaderboard', activeTab],
    queryFn: () => apiClient.getLeaderboards(activeTab),
    staleTime: 2 * 60 * 1000, // 2 minutes
    cacheTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    refetchOnReconnect: true,
    retry: (failureCount, error) => {
      if (error?.response?.status === 429) return false;
      return failureCount < 2;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  // Use shared cheer hook for global cache invalidation
  const createCheerMutation = useCheer({
    onSuccess: () => {
      // Reset form on successful submission
      setCheerText('');
      setSelectedUser(null);
      setCheerPoints(1);
      setShowSuccessMessage(true);
      setTimeout(() => setShowSuccessMessage(false), 3000);
    }
  });

  const stats = statsData?.data || {};
  const points = pointsData || {}; // Fix: pointsData is the direct response, not wrapped in .data
  const receivedCheers = receivedData?.data || [];
  const recentCheers = recentData?.data || [];
  const leaderboard = leaderboardData?.data?.leaderboard || [];
  const currentUserLeaderboard = leaderboardData?.data?.currentUser || null;

  // Debug logging with more details
  console.log('🔍 CheerPage - Raw points data:', pointsData);
  console.log('🔍 CheerPage - Processed points:', {
    monthlyCheerUsed: points.monthlyCheerUsed,
    monthlyCheerLimit: points.monthlyCheerLimit,
    remaining: (points.monthlyCheerLimit || 100) - (points.monthlyCheerUsed || 0),
    timestamp: new Date().toISOString()
  });
  console.log('🏆 CheerPage - Leaderboard data:', {
    activeTab,
    leaderboardData,
    leaderboard,
    loading: leaderboardLoading,
    timestamp: new Date().toISOString()
  });
  
  // Additional debugging for all API responses
  console.log('📊 CheerPage - Stats data:', { statsData, stats, loading: statsLoading });
  console.log('📨 CheerPage - Received data:', { receivedData, receivedCheers, loading: receivedLoading });
  console.log('📝 CheerPage - Recent data:', { recentData, recentCheers, loading: recentLoading });

  const handleCheerTextChange = async (e) => {
    const value = e.target.value;
    setCheerText(value);

    // Check for @ mentions
    const mentionMatch = value.match(/@(\w*)$/);
    if (mentionMatch) {
      const query = mentionMatch[1];
      setSearchQuery(query);
      setShowUserDropdown(true);

      if (query.length > 1) { // Only search after 2+ characters
        setSearchLoading(true);
        
        // Debounce the search to avoid too many requests
        clearTimeout(window.searchTimeout);
        window.searchTimeout = setTimeout(async () => {
          try {
            const response = await apiClient.searchUsers({ query });
            setSearchResults(response.data || []);
          } catch (error) {
            console.error('Error searching users:', error);
            setSearchResults([]);
          }
          setSearchLoading(false);
        }, 300); // 300ms debounce
      } else {
        setSearchResults([]);
        setSearchLoading(false);
      }
    } else {
      setShowUserDropdown(false);
      setSearchQuery('');
      setSearchResults([]);
      clearTimeout(window.searchTimeout);
    }
  };

  const handleUserSelect = (user) => {
    setSelectedUser(user);
    setShowUserDropdown(false);
    
    // Replace the @mention with the user's name
    const newText = cheerText.replace(/@\w*$/, `@${user.name} `);
    setCheerText(newText);
    
    // Focus back on textarea
    textareaRef.current?.focus();
  };

  const handleCheerSubmit = (e) => {
    e.preventDefault();
    if (!selectedUser || !cheerText.trim()) return;

    createCheerMutation.mutate({
      toUserId: selectedUser._id,
      amount: cheerPoints,
      message: cheerText,
    });

    // Reset form on successful submission (moved to shared hook success handler)
  };

  const handleLikeCheer = (cheerId) => {
    setLikedCheers(prev => {
      const newSet = new Set(prev);
      if (newSet.has(cheerId)) {
        newSet.delete(cheerId);
      } else {
        newSet.add(cheerId);
      }
      return newSet;
    });
  };

  const handleCommentCheer = async (cheer) => {
    setCommentingCheer(cheer);
    setCommentText('');
    setLoadingComments(true);
    
    try {
      // Load existing comments for this cheer
      const response = await apiClient.getComments(cheer._id);
      setCheerComments(prev => {
        const newComments = new Map(prev);
        newComments.set(cheer._id, response.data || []);
        return newComments;
      });
    } catch (error) {
      console.error('Error loading comments:', error);
    } finally {
      setLoadingComments(false);
    }
  };

  const handleSubmitComment = async () => {
    if (!commentText.trim() || !commentingCheer || submittingComment) return;

    setSubmittingComment(true);
    try {
      // Submit comment to API
      const response = await apiClient.addComment(commentingCheer._id, commentText.trim());
      
      // Update local comments
      setCheerComments(prev => {
        const newComments = new Map(prev);
        const existing = newComments.get(commentingCheer._id) || [];
        newComments.set(commentingCheer._id, [response.data, ...existing]);
        return newComments;
      });

      // Update comment counts
      setCommentCounts(prev => {
        const newCounts = new Map(prev);
        const currentCount = newCounts.get(commentingCheer._id) || 0;
        newCounts.set(commentingCheer._id, currentCount + 1);
        return newCounts;
      });

      setCommentText('');
      setCommentingCheer(null);
    } catch (error) {
      console.error('Error submitting comment:', error);
      alert('Failed to add comment. Please try again.');
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleCancelComment = () => {
    setCommentingCheer(null);
    setCommentText('');
  };

  const getCommentCount = (cheerId) => {
    return commentCounts.get(cheerId) || 0;
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowUserDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    
    // Cleanup timeout on unmount
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      clearTimeout(window.searchTimeout);
    };
  }, []);

  // Load comment counts when recent cheers change
  useEffect(() => {
    const loadCommentCounts = async () => {
      if (recentCheers && recentCheers.length > 0) {
        try {
          const cheerIDs = recentCheers.map(cheer => cheer._id);
          const response = await apiClient.getCommentCounts(cheerIDs);
          
          const newCounts = new Map();
          Object.entries(response.data).forEach(([cheerID, count]) => {
            newCounts.set(cheerID, count);
          });
          setCommentCounts(newCounts);
        } catch (error) {
          console.error('Error loading comment counts:', error);
        }
      }
    };

    loadCommentCounts();
  }, [recentCheers]);

  const getLeaderboardSections = () => {
    const sections = [];
    const itemsPerSection = Math.ceil(leaderboard.length / 3);
    
    for (let i = 0; i < 3; i++) {
      const start = i * itemsPerSection;
      const end = start + itemsPerSection;
      sections.push(leaderboard.slice(start, end));
    }
    
    return sections;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      {/* Success Message */}
      {showSuccessMessage && (
        <div className="fixed top-4 right-4 z-50 bg-green-500 text-white px-6 py-4 rounded-lg shadow-lg flex items-center space-x-2 animate-pulse">
          <HeartIconSolid className="w-5 h-5" />
          <span className="font-medium">Cheer sent successfully! 🎉</span>
        </div>
      )}
      
      <div className="max-w-full mx-auto px-2 sm:px-4 lg:px-6 py-6">
        {/* Header */}
        <div className="mb-6">
          <div>
            <h1 className="text-3xl font-bold text-blue-900 mb-1 flex items-center">
              <HeartIconSolid className="w-7 h-7 mr-2 text-orange-500" />
              Cheer a Peer
            </h1>
            <p className="text-base text-blue-600">Spread positivity and recognize your colleagues</p>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Create Cheer & Heartbits */}
          <div className="lg:col-span-1 flex flex-col min-h-[600px]">
            {/* Create Cheer Form */}
            <div className="bg-white rounded-lg shadow-sm border border-blue-100 p-4 hover:shadow-md transition-shadow mb-4">
              <h3 className="text-base font-semibold text-blue-900 mb-3 flex items-center">
                <SparklesIcon className="w-4 h-4 mr-2 text-orange-500" />
                Create a Cheer Post
              </h3>
              <form onSubmit={handleCheerSubmit} className="space-y-3">
                <div className="relative" ref={dropdownRef}>
                  <textarea
                    ref={textareaRef}
                    value={cheerText}
                    onChange={handleCheerTextChange}
                    placeholder="Mention a peer using '@' and spread some positivity! 😊"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-sm bg-gray-50 focus:bg-white transition-colors"
                    rows={3}
                  />
                  
                  {showUserDropdown && (
                    <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                      {searchLoading ? (
                        <div className="p-3 text-center">
                          <LoadingSpinner size="sm" />
                        </div>
                      ) : searchResults.length > 0 ? (
                        <div className="py-1">
                          {searchResults.map(user => (
                            <div
                              key={user._id}
                              className="flex items-center space-x-3 p-3 hover:bg-blue-50 cursor-pointer transition-colors border-b last:border-b-0 border-gray-100"
                              onClick={() => handleUserSelect(user)}
                            >
                              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-xs">
                                {user.name.charAt(0).toUpperCase()}
                              </div>
                              <div className="flex-1">
                                <div className="font-medium text-gray-900 text-sm">{user.name}</div>
                                <div className="text-xs text-gray-500">{user.department}</div>
                              </div>
                              <HeartIcon className="w-4 h-4 text-orange-400" />
                            </div>
                          ))}
                        </div>
                      ) : searchQuery ? (
                        <div className="p-3 text-center text-gray-500 text-sm">
                          <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-2">
                            <span className="text-gray-400">?</span>
                          </div>
                          No users found for "{searchQuery}"
                        </div>
                      ) : (
                        <div className="p-3 text-center text-gray-500 text-sm">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                            <span className="text-blue-400">@</span>
                          </div>
                          Start typing to search for colleagues
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {selectedUser && (
                  <div className="flex items-center space-x-3 p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
                    <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-xs">
                      {selectedUser.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <span className="text-sm text-blue-700">
                        🎉 Cheering: <span className="font-semibold">{selectedUser.name}</span>
                      </span>
                      <div className="text-xs text-blue-600">{selectedUser.department}</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedUser(null);
                        setCheerText('');
                      }}
                      className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      ✕
                    </button>
                  </div>
                )}

                {points.monthlyCheerUsed && points.monthlyCheerLimit && (
                  <div className={`p-3 rounded-lg border text-sm ${
                    (points.monthlyCheerUsed + cheerPoints) > points.monthlyCheerLimit
                      ? 'bg-red-50 border-red-200 text-red-700'
                      : points.monthlyCheerUsed > (points.monthlyCheerLimit * 0.8)
                      ? 'bg-yellow-50 border-yellow-200 text-yellow-700'
                      : 'bg-green-50 border-green-200 text-green-700'
                  }`}>
                    <div className="flex items-center space-x-2">
                      <div className="w-5 h-5 rounded-full bg-current opacity-20 flex items-center justify-center">
                        {(points.monthlyCheerUsed + cheerPoints) > points.monthlyCheerLimit ? '⚠️' : 
                         points.monthlyCheerUsed > (points.monthlyCheerLimit * 0.8) ? '⚡' : '✅'}
                      </div>
                      <div>
                        {(points.monthlyCheerUsed + cheerPoints) > points.monthlyCheerLimit ? (
                          <>⚠️ This cheer would exceed your monthly limit of {points.monthlyCheerLimit} heartbits</>
                        ) : points.monthlyCheerUsed > (points.monthlyCheerLimit * 0.8) ? (
                          <>⚡ You're close to your monthly limit: {points.monthlyCheerUsed + cheerPoints}/{points.monthlyCheerLimit} heartbits used</>
                        ) : (
                          <>✅ After this cheer: {points.monthlyCheerUsed + cheerPoints}/{points.monthlyCheerLimit} heartbits used, {points.monthlyCheerLimit - (points.monthlyCheerUsed + cheerPoints)} remaining</>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                  <div className="flex items-center space-x-3">
                    <label htmlFor="cheerPoints" className="text-sm font-medium text-gray-700">Points:</label>
                    <input
                      id="cheerPoints"
                      type="number"
                      min="1"
                      max="100"
                      value={cheerPoints}
                      onChange={(e) => setCheerPoints(Math.min(Math.max(1, parseInt(e.target.value) || 1), 100))}
                      className="w-20 px-2 py-1 text-center border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm font-semibold bg-white hover:border-orange-300 transition-colors"
                      placeholder="1-100"
                    />
                    <span className="text-xs text-gray-500">max 100</span>
                  </div>
                  <button
                    type="submit"
                    disabled={
                      !selectedUser || 
                      !cheerText.trim() || 
                      createCheerMutation.isPending ||
                      (points.monthlyCheerUsed && points.monthlyCheerLimit && 
                       (points.monthlyCheerUsed + cheerPoints) > points.monthlyCheerLimit)
                    }
                    className="bg-gradient-to-r from-orange-500 to-pink-500 text-white px-4 py-2 rounded-lg hover:from-orange-600 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm transition-all flex items-center space-x-2 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                  >
                    {createCheerMutation.isPending ? (
                      <>
                        <LoadingSpinner size="sm" />
                        <span>Sending...</span>
                      </>
                    ) : (
                      <>
                        <HeartIcon className="w-4 h-4" />
                        <span>Cheer</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>

            {/* Heartbits Widget */}
            <div className="bg-gradient-to-br from-orange-50 to-pink-50 rounded-lg shadow-sm border border-orange-200 p-4 hover:shadow-md transition-shadow flex-1">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-base font-semibold text-orange-900">Heartbits</h3>
                <div className="w-8 h-8 bg-gradient-to-br from-orange-400 to-pink-500 rounded-full flex items-center justify-center">
                  <HeartIconSolid className="w-5 h-5 text-white" />
                </div>
              </div>
              
              {statsLoading || pointsLoading ? (
                <div className="flex justify-center py-4">
                  <LoadingSpinner size="md" />
                </div>
              ) : (
                <div className="space-y-4 h-full flex flex-col justify-center">
                  <div className="text-center">
                    <div className="text-5xl font-bold text-orange-600 mb-2">
                      {(points.monthlyCheerLimit || 100) - (points.monthlyCheerUsed || 0)}/{points.monthlyCheerLimit || 100}
                    </div>
                    <div className="text-lg text-gray-700 font-semibold">heartbits remaining this month</div>
                  </div>
                  
                  <div className="border-t border-orange-200 pt-4 space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-bold text-gray-800">
                        {points.monthlyCheerUsed || 0} used
                      </span>
                      <span className="text-sm text-gray-600 bg-white px-3 py-2 rounded-full font-medium">
                        out of {points.monthlyCheerLimit || 100}
                      </span>
                    </div>
                    <div className="relative">
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div 
                          className="bg-gradient-to-r from-orange-400 to-pink-500 h-3 rounded-full transition-all duration-700 ease-out"
                          style={{ width: `${Math.min(((points.monthlyCheerUsed || 0) / (points.monthlyCheerLimit || 100)) * 100, 100)}%` }}
                        ></div>
                      </div>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-sm font-bold text-gray-700">
                          {Math.round(((points.monthlyCheerUsed || 0) / (points.monthlyCheerLimit || 100)) * 100)}%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Peers & Recent Cheers */}
          <div className="lg:col-span-2 flex flex-col min-h-[600px]">
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 flex-1 h-full">
              {/* Peers Who Cheered You */}
              <div className="bg-white rounded-lg shadow-sm border border-blue-100 hover:shadow-md transition-shadow flex flex-col">
                <div className="p-3 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-purple-50 flex-shrink-0">
                  <h3 className="text-base font-semibold text-blue-900 flex items-center">
                    <UserGroupIcon className="w-4 h-4 mr-2 text-blue-600" />
                    Peers Who Cheered You
                    <span className="ml-2 bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full font-semibold">
                      {receivedCheers.length}
                    </span>
                  </h3>
                </div>
                <div className="p-2 flex-1 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 400px)', minHeight: '400px' }}>
                  {receivedLoading ? (
                    <div className="flex justify-center py-4">
                      <LoadingSpinner size="md" />
                    </div>
                  ) : receivedCheers.length > 0 ? (
                    <div className="space-y-1">
                      {receivedCheers.map(cheer => (
                        <div key={cheer._id} className="flex items-start space-x-2 p-2 rounded-lg hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 transition-all border border-transparent hover:border-blue-200">
                          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-xs shadow-lg flex-shrink-0">
                            {cheer.fromUser?.name?.charAt(0).toUpperCase() || '?'}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <div className="font-semibold text-gray-900 text-sm truncate">{cheer.fromUser?.name || 'Anonymous'}</div>
                              <div className="flex items-center space-x-1 text-orange-500 bg-orange-100 px-2 py-1 rounded-full shadow-sm flex-shrink-0">
                                <span className="text-xs font-bold">+{cheer.points}</span>
                                <HeartIconSolid className="w-3 h-3" />
                              </div>
                            </div>
                            <div className="text-xs text-gray-700 mb-1 leading-relaxed line-clamp-2">{cheer.message}</div>
                            <div className="text-xs text-gray-500 flex items-center justify-between">
                              <span className="flex items-center space-x-1">
                                <span>⏰</span>
                                <span>{formatTimeAgo(cheer.createdAt)} ago</span>
                              </span>
                              <span className="text-blue-600 font-medium truncate ml-2">• {cheer.fromUser?.department}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6 text-gray-500 flex flex-col items-center justify-center h-full">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-2">
                        <UserGroupIcon className="w-6 h-6 text-blue-400" />
                      </div>
                      <p className="text-sm font-semibold text-gray-600 mb-1">No cheers received yet</p>
                      <p className="text-xs text-gray-400">Be the first to spread some positivity!</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Recent Cheers */}
              <div className="bg-white rounded-lg shadow-sm border border-blue-100 hover:shadow-md transition-shadow flex flex-col">
                <div className="p-3 border-b border-gray-100 bg-gradient-to-r from-green-50 to-teal-50 flex-shrink-0">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-semibold text-blue-900 flex items-center">
                      <ChatBubbleLeftEllipsisIcon className="w-4 h-4 mr-2 text-blue-600" />
                      Recent Cheers
                      <span className="ml-2 bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full font-semibold">
                        {recentCheers.length}
                      </span>
                    </h3>
                    <button className="text-xs text-blue-600 hover:text-blue-800 font-semibold transition-colors hover:bg-blue-50 px-2 py-1 rounded-full border border-blue-200 hover:border-blue-300 flex-shrink-0">
                      See all →
                    </button>
                  </div>
                </div>
                <div className="p-2 flex-1 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 400px)', minHeight: '400px' }}>
                  {recentLoading ? (
                    <div className="flex justify-center py-4">
                      <LoadingSpinner size="md" />
                    </div>
                  ) : recentCheers.length > 0 ? (
                    <div className="space-y-1">
                      {recentCheers.map(cheer => (
                        <div key={cheer._id} className="p-2 rounded-lg hover:bg-gradient-to-r hover:from-green-50 hover:to-teal-50 transition-all border border-transparent hover:border-green-200">
                          <div className="flex items-start space-x-2">
                            <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-teal-600 rounded-full flex items-center justify-center text-white font-bold text-xs shadow-lg flex-shrink-0">
                              {cheer.fromUser?.name?.charAt(0).toUpperCase() || '?'}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-1">
                                <div className="text-sm">
                                  <span className="font-semibold text-gray-900 truncate">{cheer.fromUser?.name || 'Anonymous'}</span>
                                </div>
                                <div className="flex items-center space-x-1 text-orange-500 bg-orange-100 px-2 py-1 rounded-full shadow-sm flex-shrink-0">
                                  <span className="text-xs font-bold">+{cheer.points}</span>
                                  <HeartIconSolid className="w-3 h-3" />
                                </div>
                              </div>
                              <div className="text-xs text-blue-600 mb-1 font-semibold truncate">
                                → @{cheer.toUser?.name || 'Unknown'}
                              </div>
                              <div className="text-xs text-gray-700 mb-1 leading-relaxed line-clamp-2">{cheer.message}</div>
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-2">
                                  <button 
                                    onClick={() => handleLikeCheer(cheer._id)}
                                    className={`flex items-center space-x-1 text-xs transition-all hover:scale-110 ${
                                      likedCheers.has(cheer._id) 
                                        ? 'text-red-500 bg-red-100 px-2 py-1 rounded-full shadow-sm' 
                                        : 'text-gray-500 hover:text-red-500 hover:bg-red-50 px-2 py-1 rounded-full'
                                    }`}
                                  >
                                    <HeartIcon className={`w-3 h-3 ${likedCheers.has(cheer._id) ? 'fill-current' : ''}`} />
                                    <span className="font-medium">{likedCheers.has(cheer._id) ? '1' : '0'}</span>
                                  </button>
                                  <button 
                                    onClick={() => handleCommentCheer(cheer)}
                                    className="flex items-center space-x-1 text-xs text-gray-500 hover:text-blue-500 transition-colors hover:bg-blue-50 px-2 py-1 rounded-full"
                                  >
                                    <ChatBubbleLeftEllipsisIcon className="w-3 h-3" />
                                    <span className="font-medium">{getCommentCount(cheer._id)}</span>
                                  </button>
                                </div>
                                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full font-medium flex-shrink-0">
                                  ⏰ {formatTimeAgo(cheer.createdAt)} ago
                                </span>
                              </div>
                              
                              {/* Comments Display */}
                              {cheerComments.get(cheer._id)?.length > 0 && (
                                <div className="mt-2 pt-2 border-t border-gray-100">
                                  <div className="space-y-2">
                                    {cheerComments.get(cheer._id).slice(0, 2).map((comment) => (
                                      <div key={comment._id} className="flex items-start space-x-2">
                                        <div className="w-4 h-4 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-xs">
                                          {comment.fromUser?.name?.charAt(0).toUpperCase() || '?'}
                                        </div>
                                        <div className="flex-1">
                                          <div className="bg-gray-50 rounded px-2 py-1">
                                            <span className="text-xs font-semibold text-gray-800">{comment.fromUser?.name || 'Anonymous'}: </span>
                                            <span className="text-xs text-gray-700">{comment.comment}</span>
                                          </div>
                                        </div>
                                      </div>
                                    ))}
                                    {cheerComments.get(cheer._id).length > 2 && (
                                      <button 
                                        onClick={() => handleCommentCheer(cheer)}
                                        className="text-xs text-blue-600 hover:text-blue-800 font-medium ml-6"
                                      >
                                        View all {cheerComments.get(cheer._id).length} comments
                                      </button>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6 text-gray-500 flex flex-col items-center justify-center h-full">
                      <div className="w-12 h-12 bg-gradient-to-br from-green-100 to-teal-100 rounded-full flex items-center justify-center mx-auto mb-2">
                        <ChatBubbleLeftEllipsisIcon className="w-6 h-6 text-green-400" />
                      </div>
                      <p className="text-sm font-semibold text-gray-600 mb-1">No recent cheers</p>
                      <p className="text-xs text-gray-400">Start the conversation!</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Leaderboards */}
        <div className="mt-6 bg-white rounded-lg shadow-lg border border-blue-100 overflow-hidden">
          <div className="p-4 border-b border-gray-100 bg-gradient-to-r from-yellow-50 to-orange-50">
            <h3 className="text-lg font-bold text-blue-900 flex items-center">
              <TrophyIcon className="w-5 h-5 mr-2 text-yellow-500" />
              Leaderboards
              <span className="ml-auto text-xs font-normal text-gray-600">
                Top performers across different time periods
              </span>
            </h3>
          </div>
          
          {/* Leaderboard Tabs */}
          <div className="border-b border-gray-200 bg-gray-50">
            <nav className="flex space-x-0">
              {[
                { id: 'weekly', label: 'Weekly Leaderboards', color: 'orange' },
                { id: 'monthly', label: 'Monthly Leaderboards', color: 'orange' },
                { id: 'alltime', label: 'All Time Leaderboards', color: 'orange' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 py-4 px-6 font-medium text-sm transition-all border-b-2 ${
                    activeTab === tab.id
                      ? 'border-orange-500 text-orange-600 bg-white'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <span>{tab.label}</span>
                </button>
              ))}
            </nav>
          </div>

          {/* Leaderboard Content */}
          <div className="p-6 bg-white">
            {leaderboardLoading ? (
              <div className="flex justify-center py-12">
                <div className="text-center">
                  <LoadingSpinner size="lg" />
                  <p className="mt-3 text-gray-600">Loading leaderboard...</p>
                </div>
              </div>
            ) : leaderboard.length > 0 ? (
              <div className="space-y-6">
                {/* User's Current Rank */}
                {currentUserLeaderboard && (
                  <div className="bg-gradient-to-r from-orange-50 to-orange-100 rounded-lg p-4 border border-orange-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <span className="text-sm text-gray-600">Your rank:</span>
                        <div className="bg-orange-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm">
                          {currentUserLeaderboard.rank}
                        </div>
                        <span className="font-semibold text-gray-900">
                          {currentUserLeaderboard.info?.name || 'You'}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-orange-600 text-lg">
                          {currentUserLeaderboard.info?.totalPoints || 0}
                        </span>
                        <span className="text-sm text-gray-600">🔥 received</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Leaderboard List */}
                <div className="space-y-3">
                  {leaderboard.slice(0, 10).map((user, index) => {
                    const rank = index + 1;
                    const isCurrentUser = currentUserLeaderboard && user._id === currentUserLeaderboard.info?._id;
                    
                    return (
                      <div key={user._id} className={`flex items-center justify-between p-4 rounded-lg border transition-all duration-200 hover:shadow-md ${
                        isCurrentUser 
                          ? 'bg-orange-50 border-orange-200 shadow-sm' 
                          : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                      }`}>
                        <div className="flex items-center space-x-4">
                          {/* Rank Badge */}
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
                            rank === 1 ? 'bg-gradient-to-br from-yellow-400 to-yellow-600 text-white' :
                            rank === 2 ? 'bg-gradient-to-br from-gray-400 to-gray-600 text-white' :
                            rank === 3 ? 'bg-gradient-to-br from-orange-400 to-orange-600 text-white' :
                            isCurrentUser ? 'bg-orange-500 text-white' :
                            'bg-gray-300 text-gray-700'
                          }`}>
                            {rank <= 3 ? (
                              rank === 1 ? '🥇' : rank === 2 ? '🥈' : '🥉'
                            ) : (
                              rank
                            )}
                          </div>
                          
                          {/* User Info */}
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center">
                              <span className="text-white font-semibold text-sm">
                                {user.name?.charAt(0)?.toUpperCase() || 'U'}
                              </span>
                            </div>
                            <div>
                              <div className={`font-semibold ${isCurrentUser ? 'text-orange-700' : 'text-gray-900'}`}>
                                {user.name}
                              </div>
                              <div className="text-sm text-gray-500">{user.department}</div>
                            </div>
                          </div>
                        </div>

                        {/* Points */}
                        <div className="flex items-center space-x-2">
                          <span className={`font-bold text-lg ${isCurrentUser ? 'text-orange-600' : 'text-gray-700'}`}>
                            {user.totalPoints || 0}
                          </span>
                          <span className="text-sm text-gray-500">🔥 received</span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Show More Button */}
                {leaderboard.length > 10 && (
                  <div className="text-center pt-4">
                    <button className="text-orange-600 hover:text-orange-700 font-medium text-sm">
                      Show more
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-6 text-gray-500">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <TrophyIcon className="w-8 h-8 text-gray-300" />
                </div>
                <h4 className="text-base font-semibold text-gray-600 mb-1">No leaderboard data yet</h4>
                <p className="text-sm text-gray-400">Start cheering your peers to see the leaderboard!</p>
                <div className="mt-3 flex justify-center space-x-1">
                  <div className="w-2 h-2 bg-blue-200 rounded-full animate-pulse"></div>
                  <div className="w-2 h-2 bg-purple-200 rounded-full animate-pulse delay-75"></div>
                  <div className="w-2 h-2 bg-pink-200 rounded-full animate-pulse delay-150"></div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Comment Modal */}
      {commentingCheer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-96 overflow-hidden">
            {/* Modal Header */}
            <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <ChatBubbleLeftEllipsisIcon className="w-5 h-5 mr-2 text-blue-600" />
                  Add Comment
                </h3>
                <button
                  onClick={handleCancelComment}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              {/* Original Cheer */}
              <div className="mt-3 p-3 bg-white rounded-lg border border-gray-200">
                <div className="flex items-start space-x-2">
                  <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-teal-600 rounded-full flex items-center justify-center text-white font-bold text-xs">
                    {commentingCheer.fromUser?.name?.charAt(0).toUpperCase() || '?'}
                  </div>
                  <div className="flex-1">
                    <div className="text-sm">
                      <span className="font-semibold text-gray-900">{commentingCheer.fromUser?.name}</span>
                      <span className="text-blue-600 mx-1">→</span>
                      <span className="text-blue-600">@{commentingCheer.toUser?.name}</span>
                    </div>
                    <div className="text-sm text-gray-700 mt-1">{commentingCheer.message}</div>
                  </div>
                  <div className="flex items-center space-x-1 text-orange-500 bg-orange-100 px-2 py-1 rounded-full">
                    <span className="text-xs font-bold">+{commentingCheer.points}</span>
                    <HeartIconSolid className="w-3 h-3" />
                  </div>
                </div>
              </div>
            </div>

            {/* Comments List */}
            <div className="p-4 max-h-40 overflow-y-auto">
              {loadingComments ? (
                <div className="flex justify-center py-4">
                  <LoadingSpinner size="sm" />
                </div>
              ) : cheerComments.get(commentingCheer._id)?.length > 0 ? (
                <div className="space-y-3 mb-4">
                  {cheerComments.get(commentingCheer._id).map((comment) => (
                    <div key={comment._id} className="flex items-start space-x-2">
                      <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-xs">
                        {comment.fromUser?.name?.charAt(0).toUpperCase() || '?'}
                      </div>
                      <div className="flex-1">
                        <div className="bg-gray-100 rounded-lg px-3 py-2">
                          <div className="text-xs font-semibold text-gray-800 mb-1">{comment.fromUser?.name || 'Anonymous'}</div>
                          <div className="text-sm text-gray-700">{comment.comment}</div>
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {formatTimeAgo(comment.createdAt)} ago
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 text-gray-500">
                  <ChatBubbleLeftEllipsisIcon className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                  <p className="text-sm">Be the first to comment!</p>
                </div>
              )}
            </div>

            {/* Comment Input */}
            <div className="p-4 border-t border-gray-200 bg-gray-50">
              <div className="flex space-x-2">
                <textarea
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Write a comment..."
                  className="flex-1 resize-none border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={2}
                  maxLength={500}
                />
                <div className="flex flex-col space-y-2">
                  <button
                    onClick={handleSubmitComment}
                    disabled={!commentText.trim() || submittingComment}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                  >
                    {submittingComment ? (
                      <>
                        <LoadingSpinner size="sm" />
                        <span className="ml-2">Posting...</span>
                      </>
                    ) : (
                      'Post'
                    )}
                  </button>
                  <button
                    onClick={handleCancelComment}
                    disabled={submittingComment}
                    className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-400 disabled:opacity-50 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
              <div className="text-xs text-gray-500 mt-2">
                {commentText.length}/500 characters
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CheerPage;
