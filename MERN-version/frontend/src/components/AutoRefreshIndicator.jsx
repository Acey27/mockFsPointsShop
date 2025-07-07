import React, { useState, useEffect } from 'react';
import { ArrowPathIcon } from '@heroicons/react/24/outline';

const AutoRefreshIndicator = () => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(null);

  useEffect(() => {
    // Listen for storage events to detect data updates
    const handleStorageChange = (e) => {
      if (e.key === 'data-updated') {
        setIsRefreshing(true);
        setLastRefresh(new Date());
        
        // Show refreshing state for 1 second
        setTimeout(() => {
          setIsRefreshing(false);
        }, 1000);
      }
    };

    // Listen for React Query events
    const handleRefreshStart = () => {
      setIsRefreshing(true);
      setLastRefresh(new Date());
    };

    const handleRefreshEnd = () => {
      setTimeout(() => setIsRefreshing(false), 1000);
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('app:refresh:start', handleRefreshStart);
    window.addEventListener('app:refresh:end', handleRefreshEnd);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('app:refresh:start', handleRefreshStart);
      window.removeEventListener('app:refresh:end', handleRefreshEnd);
    };
  }, []);

  if (!lastRefresh) return null;

  return (
    <div className="fixed top-4 right-4 z-50 pointer-events-none">
      <div className={`flex items-center space-x-2 px-3 py-2 rounded-lg shadow-lg border transition-all duration-300 ${
        isRefreshing 
          ? 'bg-blue-50 border-blue-200 text-blue-700 animate-pulse' 
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

export default AutoRefreshIndicator;
