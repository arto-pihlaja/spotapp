import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateWiki } from '../api/wiki';
import { isNetworkError } from '@/lib/networkError';
import { enqueueMutation } from '@/lib/offlineQueue';
import { showToast } from '@/components/Toast';

export function useUpdateWiki(spotId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (content: string) => updateWiki(spotId, content),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wiki', spotId] });
    },
    onError: (error, content) => {
      if (isNetworkError(error)) {
        enqueueMutation({
          type: 'updateWiki',
          label: 'Wiki update',
          endpoint: `/spots/${spotId}/wiki`,
          method: 'PUT',
          body: { content },
        });
      } else {
        showToast('Failed to update wiki', 'error');
      }
    },
  });
}
