import { useMutation } from '@tanstack/react-query';
import { registerUser } from '../api/auth';
import { useAuthStore } from '@/stores/useAuthStore';

export function useRegister() {
  return useMutation({
    mutationFn: registerUser,
    onSuccess: (data) => {
      useAuthStore.getState().setTokens(data.accessToken, data.refreshToken, data.user);
    },
  });
}
