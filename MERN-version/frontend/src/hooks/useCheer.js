import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../lib/api';

/**
 * Global cheer hook that handles cache invalidation across all pages
 * This ensures that when a cheer is sent from any page, all other pages
 * get updated with the latest data
 */
export const useCheer = (options = {}) => {
  const { onSuccess: customOnSuccess, onError: customOnError } = options;
  const queryClient = useQueryClient();

  const cheerMutation = useMutation({
    mutationFn: ({ toUserId, amount, message }) =>
      apiClient.cheerUser({ toUserId, amount, message }),
    
    onSuccess: async (data, variables) => {
      console.log('🎉 Cheer sent successfully!');
      console.log('🔄 Invalidating cache to force refresh...');
      
      // Simple but effective cache invalidation
      queryClient.invalidateQueries({ queryKey: ['points'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['recent-cheers'] });
      queryClient.invalidateQueries({ queryKey: ['received-cheers'] });
      queryClient.invalidateQueries({ queryKey: ['cheer-stats'] });
      queryClient.invalidateQueries({ queryKey: ['leaderboard'] });
      
      // Small delay to ensure backend has processed the cheer
      setTimeout(() => {
        console.log('🔄 Secondary cache invalidation...');
        queryClient.invalidateQueries({ queryKey: ['points'] });
      }, 500);
      
      // Call custom success handler if provided
      if (customOnSuccess) {
        customOnSuccess(data, variables);
      }
    },
    
    onError: (error, variables, context) => {
      console.error('❌ Cheer error:', error);
      
      // Handle specific error cases
      if (error?.response?.status === 429) {
        alert('Too many requests. Please wait a moment before trying again.');
      } else if (error?.response?.status === 400) {
        alert(error?.response?.data?.message || 'Invalid cheer request. Please check your inputs.');
      } else if (error?.response?.status === 403) {
        alert('Insufficient heartbits or permission denied.');
      } else {
        alert('Failed to send cheer. Please try again.');
      }
      
      // Call custom error handler if provided
      if (customOnError) {
        customOnError(error, variables, context);
      }
    },
  });

  return cheerMutation;
};
