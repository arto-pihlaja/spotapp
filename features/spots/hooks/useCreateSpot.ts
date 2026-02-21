import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createSpot } from '../api/spots';

export function useCreateSpot() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createSpot,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['spots'] });
    },
  });
}
