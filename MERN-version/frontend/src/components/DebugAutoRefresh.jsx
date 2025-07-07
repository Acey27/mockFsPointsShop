import React, { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { ClockIcon, EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';

const DebugAutoRefresh = () => {
  const [lastRefresh, setLastRefresh] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [queryStats, setQueryStats] = useState({});
  const [isVisible, setIsVisible] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    const handleRefreshStart = () => {
      setIsRefreshing(true);
      setLastRefresh(new Date());
    };

    const handleRefreshEnd = () => {
      setIsRefreshing(false);
      // Update query stats
      const cache = queryClient.getQueryCache();
      const queries = cache.getAll();
      const stats = {};
      queries.forEach((query) => {
        const key = query.queryKey.join(':');
        stats[key] = {
          dataUpdatedAt: new Date(query.dataUpdatedAt).toLocaleTimeString(),
          status: query.state.status,
          fetchStatus: query.state.fetchStatus,
        };
      });
      setQueryStats(stats);
    };

    window.addEventListener('app:refresh:start', handleRefreshStart);
    window.addEventListener('app:refresh:end', handleRefreshEnd);

    return () => {
      window.removeEventListener('app:refresh:start', handleRefreshStart);
      window.removeEventListener('app:refresh:end', handleRefreshEnd);
    };
  }, [queryClient]);

  if (!isVisible) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <button
          onClick={() => setIsVisible(true)}
          className="p-2 bg-gray-800 text-white rounded-full shadow-lg hover:bg-gray-700"
          title="Show Debug Info"
        >
          <EyeIcon className="w-5 h-5" />
        </button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 w-80 bg-white border border-gray-300 rounded-lg shadow-lg p-4 max-h-96 overflow-y-auto">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold text-gray-800">Auto-Refresh Debug</h3>
        <button
          onClick={() => setIsVisible(false)}
          className="text-gray-500 hover:text-gray-700"
        >
          <EyeSlashIcon className="w-5 h-5" />
        </button>
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <ClockIcon className="w-4 h-4 text-gray-500" />
          <span className="text-sm">
            Last Refresh: {lastRefresh ? lastRefresh.toLocaleTimeString() : 'Never'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${isRefreshing ? 'bg-blue-500 animate-pulse' : 'bg-green-500'}`} />
          <span className="text-sm">
            Status: {isRefreshing ? 'Refreshing...' : 'Idle'}
          </span>
        </div>

        <div className="mt-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Query Status:</h4>
          <div className="space-y-1 text-xs">
            {Object.entries(queryStats).map(([key, stats]) => (
              <div key={key} className="p-2 bg-gray-50 rounded">
                <div className="font-medium">{key}</div>
                <div className="text-gray-600">
                  Last Updated: {stats.dataUpdatedAt}
                </div>
                <div className="text-gray-600">
                  Status: {stats.status} / {stats.fetchStatus}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DebugAutoRefresh;
