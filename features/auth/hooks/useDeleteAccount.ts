import { useMutation } from '@tanstack/react-query';
import { api } from '@/lib/apiClient';

export function useDeleteAccount() {
  return useMutation({
    mutationFn: (password: string) =>
      api.post<{ message: string }>('/users/me/delete', { password }),
  });
}
