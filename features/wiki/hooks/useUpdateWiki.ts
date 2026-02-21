import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateWiki } from '../api/wiki';

export function useUpdateWiki(spotId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (content: string) => updateWiki(spotId, content),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wiki', spotId] });
    },
  });
}
