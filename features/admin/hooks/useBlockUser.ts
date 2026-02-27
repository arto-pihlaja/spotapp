import { useMutation, useQueryClient } from '@tanstack/react-query';
import { blockUser } from '../api/admin';
import { showToast } from '@/components/Toast';

export function useBlockUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userId: string) => blockUser(userId),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      showToast(`${data.username} has been blocked`, 'success');
    },
    onError: () => {
      showToast('Failed to block user', 'error');
    },
  });
}
