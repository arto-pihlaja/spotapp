import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createSpot } from '../api/spots';
import { isNetworkError } from '@/lib/networkError';
import { enqueueMutation } from '@/lib/offlineQueue';
import { showToast } from '@/components/Toast';

export function useCreateSpot() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createSpot,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['spots'] });
    },
    onError: (error, variables) => {
      if (isNetworkError(error)) {
        enqueueMutation({
          type: 'createSpot',
          label: 'New spot',
          endpoint: '/spots',
          method: 'POST',
          body: variables,
        });
      } else {
        showToast('Failed to create spot', 'error');
      }
    },
  });
}
