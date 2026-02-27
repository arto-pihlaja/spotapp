import { useMutation, useQueryClient } from '@tanstack/react-query';
import { unblockUser } from '../api/admin';
import { showToast } from '@/components/Toast';

export function useUnblockUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userId: string) => unblockUser(userId),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      showToast(`${data.username} has been unblocked`, 'success');
    },
    onError: () => {
      showToast('Failed to unblock user', 'error');
    },
  });
}
