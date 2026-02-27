import { useMutation, useQueryClient } from '@tanstack/react-query';
import { revertWiki } from '../api/admin';
import { showToast } from '@/components/Toast';

export function useRevertWiki() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (spotId: string) => revertWiki(spotId),
    onSuccess: (_data, spotId) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'spots'] });
      queryClient.invalidateQueries({ queryKey: ['spot', spotId] });
      showToast('Wiki content has been cleared', 'success');
    },
    onError: () => {
      showToast('Failed to revert wiki', 'error');
    },
  });
}
