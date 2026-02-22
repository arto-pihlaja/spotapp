import { useMutation, useQueryClient } from '@tanstack/react-query';
import { confirmCondition } from '../api/conditions';
import type { ConditionReport } from '../types';
import { isNetworkError } from '@/lib/networkError';
import { enqueueMutation } from '@/lib/offlineQueue';
import { showToast } from '@/components/Toast';

export function useConfirmCondition(spotId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (conditionId: string) => confirmCondition(spotId, conditionId),
    onMutate: async (conditionId) => {
      const queryKey = ['spot', spotId, 'conditions'];
      await queryClient.cancelQueries({ queryKey });

      const previous = queryClient.getQueryData<ConditionReport[]>(queryKey);

      queryClient.setQueryData<ConditionReport[]>(queryKey, (old) =>
        old?.map((c) =>
          c.id === conditionId
            ? { ...c, confirmCount: c.confirmCount + 1, hasConfirmed: true }
            : c,
        ),
      );

      return { previous };
    },
    onError: (error, conditionId, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['spot', spotId, 'conditions'], context.previous);
      }
      if (isNetworkError(error)) {
        enqueueMutation({
          type: 'confirmCondition',
          label: 'Condition confirmation',
          endpoint: `/spots/${spotId}/conditions/${conditionId}/confirm`,
          method: 'POST',
          body: {},
        });
      } else {
        showToast('Failed to confirm condition', 'error');
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['spot', spotId, 'conditions'] });
      queryClient.invalidateQueries({ queryKey: ['spot', spotId] });
    },
  });
}
