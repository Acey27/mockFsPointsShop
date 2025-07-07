import { useEffect, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';

/**
 * Unified Auto-Refresh Hook System
 * Event-driven refresh system that eliminates polling and only refreshes when database is updated
 * Handles mutations, cross-tab communication, window focus, and visibility changes
 */

/**
 * Core event-driven refresh hook
 * Triggers refresh only when database mutations occur or when notified by other tabs
 * NO polling or intervals - purely event-driven
 */
export const useEventDrivenRefresh = () => {
  const queryClient = useQueryClient();

  /**
   * Manual refresh function for components
   */
  const forceRefresh = useCallback(() => {
    console.log('🔄 Manual refresh triggered...');
    
    // Invalidate all queries
    queryClient.invalidateQueries();
    
    // Trigger AuthContext refresh
    window.dispatchEvent(new CustomEvent('user-data-updated'));
    
    console.log('✅ Manual refresh completed successfully');
  }, [queryClient]);

  /**
   * Trigger refresh after a cheer mutation
   */
  const triggerCheerRefresh = useCallback(() => {
    console.log('🎉 Cheer mutation completed, refreshing relevant data...');
    
    // Invalidate all transaction queries (regardless of filter)
    queryClient.invalidateQueries({ queryKey: ['transactions'] });
    
    // Invalidate current user and points
    queryClient.invalidateQueries({ queryKey: ['currentUser'] });
    queryClient.invalidateQueries({ queryKey: ['points'] });
    
    // Trigger AuthContext refresh
    window.dispatchEvent(new CustomEvent('user-data-updated'));
    
    // Notify other tabs
    localStorage.setItem('data-updated', Date.now().toString());
    
    console.log('✅ Cheer refresh completed successfully');
  }, [queryClient]);

  /**
   * Trigger refresh after a purchase mutation
   */
  const triggerPurchaseRefresh = useCallback(() => {
    console.log('🛍️ Purchase mutation completed, refreshing relevant data...');
    
    // Invalidate all product queries (regardless of search/category)
    queryClient.invalidateQueries({ queryKey: ['products'] });
    
    // Invalidate order history
    queryClient.invalidateQueries({ queryKey: ['orderHistory'] });
    
    // Invalidate current user and points
    queryClient.invalidateQueries({ queryKey: ['currentUser'] });
    queryClient.invalidateQueries({ queryKey: ['points'] });
    
    // Invalidate admin orders
    queryClient.invalidateQueries({ queryKey: ['adminOrders'] });
    
    // Trigger AuthContext refresh
    window.dispatchEvent(new CustomEvent('user-data-updated'));
    
    // Notify other tabs
    localStorage.setItem('data-updated', Date.now().toString());
    
    console.log('✅ Purchase refresh completed successfully');
  }, [queryClient]);

  /**
   * Trigger refresh after an order cancellation
   */
  const triggerOrderCancelRefresh = useCallback(() => {
    console.log('❌ Order cancellation completed, refreshing relevant data...');
    
    // Invalidate order history
    queryClient.invalidateQueries({ queryKey: ['orderHistory'] });
    
    // Invalidate current user and points (refund might have occurred)
    queryClient.invalidateQueries({ queryKey: ['currentUser'] });
    queryClient.invalidateQueries({ queryKey: ['points'] });
    
    // Invalidate admin orders
    queryClient.invalidateQueries({ queryKey: ['adminOrders'] });
    
    // Trigger AuthContext refresh
    window.dispatchEvent(new CustomEvent('user-data-updated'));
    
    // Notify other tabs
    localStorage.setItem('data-updated', Date.now().toString());
    
    console.log('✅ Order cancel refresh completed successfully');
  }, [queryClient]);

  /**
   * Trigger refresh after admin product management
   */
  const triggerProductManagementRefresh = useCallback(() => {
    console.log('🏷️ Product management action completed, refreshing relevant data...');
    
    // Invalidate all product queries
    queryClient.invalidateQueries({ queryKey: ['products'] });
    
    // Invalidate admin orders
    queryClient.invalidateQueries({ queryKey: ['adminOrders'] });
    
    // Notify other tabs
    localStorage.setItem('data-updated', Date.now().toString());
    
    console.log('✅ Product management refresh completed successfully');
  }, [queryClient]);

  /**
   * Trigger refresh after admin user management
   */
  const triggerUserManagementRefresh = useCallback(() => {
    console.log('👥 User management action completed, refreshing relevant data...');
    
    // Invalidate users for cheering
    queryClient.invalidateQueries({ queryKey: ['users-for-cheering'] });
    
    // Invalidate admin orders
    queryClient.invalidateQueries({ queryKey: ['adminOrders'] });
    
    // Invalidate admin transactions
    queryClient.invalidateQueries({ queryKey: ['adminTransactions'] });
    
    // Notify other tabs
    localStorage.setItem('data-updated', Date.now().toString());
    
    console.log('✅ User management refresh completed successfully');
  }, [queryClient]);

  return {
    // Core functions
    forceRefresh,
    
    // Specialized mutation triggers
    triggerCheerRefresh,
    triggerPurchaseRefresh,
    triggerOrderCancelRefresh,
    triggerProductManagementRefresh,
    triggerUserManagementRefresh
  };
};

/**
 * Global auto-refresh hook for the entire application
 * Handles cross-tab communication only - purely event-driven
 * NO polling, NO window focus, NO visibility changes - only database mutations
 */
export const useGlobalAutoRefresh = () => {
  const queryClient = useQueryClient();

  useEffect(() => {
    console.log('🌍 Setting up global auto-refresh (event-driven only)...');

    // Handle storage events (for cross-tab communication)
    const handleStorageChange = (e) => {
      if (e.key === 'data-updated') {
        console.log('📡 Data updated in another tab, refreshing...');
        queryClient.invalidateQueries();
      }
    };

    // Handle custom refresh events
    const handleCustomRefresh = (e) => {
      console.log('🔄 Custom refresh event received:', e.detail);
      
      if (e.detail && e.detail.queryKeys) {
        // Refresh specific queries
        e.detail.queryKeys.forEach(key => {
          queryClient.invalidateQueries({ queryKey: [key] });
        });
      } else {
        // Refresh all queries
        queryClient.invalidateQueries();
      }
    };

    // Set up event listeners (NO window focus or visibility handlers)
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('app:data-updated', handleCustomRefresh);

    // Cleanup function
    return () => {
      console.log('🧹 Cleaning up global auto-refresh...');
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('app:data-updated', handleCustomRefresh);
    };
  }, [queryClient]);

  return { 
    forceRefresh: () => {
      queryClient.invalidateQueries();
    }
  };
};

/**
 * Basic auto-refresh hook for simple components
 * Provides basic refresh functionality without specialized mutation handlers
 */
export const useAutoRefresh = () => {
  const queryClient = useQueryClient();

  const refreshData = useCallback((queryKeys = []) => {
    console.log('🔄 Basic refresh triggered...', queryKeys);
    
    if (queryKeys.length > 0) {
      queryKeys.forEach(key => {
        queryClient.invalidateQueries({ queryKey: [key] });
      });
    } else {
      queryClient.invalidateQueries();
    }
    
    // Trigger AuthContext refresh
    window.dispatchEvent(new CustomEvent('user-data-updated'));
    
    console.log('✅ Basic refresh completed successfully');
  }, [queryClient]);

  const forceRefresh = useCallback(() => {
    console.log('🔄 Force refresh triggered...');
    queryClient.invalidateQueries();
    window.dispatchEvent(new CustomEvent('user-data-updated'));
    console.log('✅ Force refresh completed successfully');
  }, [queryClient]);

  return { refreshData, forceRefresh };
};

/**
 * Smart refresh hook - provides manual refresh only
 * NO automatic window focus/visibility refreshes - purely event-driven
 */
export const useSmartRefresh = () => {
  const queryClient = useQueryClient();

  // No automatic listeners - purely manual refresh
  return { 
    forceRefresh: () => {
      console.log('� Manual refresh triggered');
      queryClient.invalidateQueries();
    }
  };
};

/**
 * Backward compatibility hook for existing code
 * @deprecated Use useEventDrivenRefresh instead
 */
export const useRefreshAfterMutation = () => {
  const queryClient = useQueryClient();

  const refreshAfterMutation = useCallback((queryKeys = []) => {
    console.log('⚠️ useRefreshAfterMutation is deprecated. Use useEventDrivenRefresh instead.');
    
    if (queryKeys.length > 0) {
      queryKeys.forEach(key => {
        queryClient.invalidateQueries({ queryKey: [key] });
      });
    } else {
      queryClient.invalidateQueries();
    }
    
    window.dispatchEvent(new CustomEvent('user-data-updated'));
    localStorage.setItem('data-updated', Date.now().toString());
  }, [queryClient]);

  return { refreshAfterMutation };
};

/**
 * Default export for the main event-driven refresh hook
 */
export default useEventDrivenRefresh;
