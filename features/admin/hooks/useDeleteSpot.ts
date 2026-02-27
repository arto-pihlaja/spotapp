import { useMutation, useQueryClient } from '@tanstack/react-query';
import { deleteSpot } from '../api/admin';
import { showToast } from '@/components/Toast';

export function useDeleteSpot() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (spotId: string) => deleteSpot(spotId),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'spots'] });
      queryClient.invalidateQueries({ queryKey: ['spots'] });
      showToast(`"${data.spotName}" has been deleted`, 'success');
    },
    onError: () => {
      showToast('Failed to delete spot', 'error');
    },
  });
}
