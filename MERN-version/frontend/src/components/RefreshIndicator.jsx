import React, { useState, useEffect } from 'react';
import { ArrowPathIcon } from '@heroicons/react/24/outline';

const RefreshIndicator = () => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(null);

  useEffect(() => {
    // Listen for refresh events
    const handleRefreshStart = () => {
      setIsRefreshing(true);
      setLastRefresh(new Date());
    };

    const handleRefreshEnd = () => {
      setTimeout(() => setIsRefreshing(false), 1000); // Show for 1 second
    };

    // Create custom events for refresh indication
    window.addEventListener('app:refresh:start', handleRefreshStart);
    window.addEventListener('app:refresh:end', handleRefreshEnd);

    return () => {
      window.removeEventListener('app:refresh:start', handleRefreshStart);
      window.removeEventListener('app:refresh:end', handleRefreshEnd);
    };
  }, []);

  if (!lastRefresh) return null;

  return (
    <div className="fixed top-4 right-4 z-50">
      <div className={`flex items-center space-x-2 px-3 py-2 rounded-lg shadow-sm border transition-all duration-300 ${
        isRefreshing 
          ? 'bg-blue-50 border-blue-200 text-blue-700' 
          : 'bg-green-50 border-green-200 text-green-700'
      }`}>
        <ArrowPathIcon className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
        <span className="text-sm font-medium">
          {isRefreshing ? 'Refreshing...' : `Updated ${lastRefresh.toLocaleTimeString()}`}
        </span>
      </div>
    </div>
  );
};

export default RefreshIndicator;
