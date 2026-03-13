import { useMutation, useQueryClient } from '@tanstack/react-query';
import { resetPassword } from '../api/admin';
import { showToast } from '@/components/Toast';

export function useResetPassword() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userId: string) => resetPassword(userId),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      showToast(`Temporary password for ${data.username}: ${data.temporaryPassword}`, 'success');
    },
    onError: () => {
      showToast('Failed to reset password', 'error');
    },
  });
}
