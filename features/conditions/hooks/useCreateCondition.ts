import { useMutation, useQueryClient } from '@tanstack/react-query';
import { submitCondition } from '../api/conditions';
import type { CreateConditionInput } from '../types';

export function useCreateCondition(spotId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateConditionInput) => submitCondition(spotId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['spot', spotId, 'conditions'] });
      queryClient.invalidateQueries({ queryKey: ['spot', spotId] });
    },
  });
}
