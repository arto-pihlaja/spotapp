import { useMutation, useQueryClient } from '@tanstack/react-query';
import { submitCondition } from '../api/conditions';
import type { CreateConditionInput } from '../types';
import { isNetworkError } from '@/lib/networkError';
import { enqueueMutation } from '@/lib/offlineQueue';
import { showToast } from '@/components/Toast';

export function useCreateCondition(spotId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateConditionInput) => submitCondition(spotId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['spot', spotId, 'conditions'] });
      queryClient.invalidateQueries({ queryKey: ['spot', spotId] });
    },
    onError: (error, input) => {
      if (isNetworkError(error)) {
        enqueueMutation({
          type: 'createCondition',
          label: 'Condition report',
          endpoint: `/spots/${spotId}/conditions`,
          method: 'POST',
          body: input,
        });
      } else {
        showToast('Failed to submit condition report', 'error');
      }
    },
  });
}
