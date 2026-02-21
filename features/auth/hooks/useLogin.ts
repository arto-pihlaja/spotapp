import { useMutation } from '@tanstack/react-query';
import { loginUser } from '../api/auth';
import { useAuthStore } from '@/stores/useAuthStore';

export function useLogin() {
  return useMutation({
    mutationFn: loginUser,
    onSuccess: (data) => {
      useAuthStore.getState().setTokens(data.accessToken, data.refreshToken, data.user);
    },
  });
}
