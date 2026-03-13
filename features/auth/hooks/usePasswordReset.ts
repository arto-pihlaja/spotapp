import { useMutation, useQuery } from '@tanstack/react-query';
import {
  requestPasswordReset,
  executePasswordReset,
  setEmail,
  verifyEmail,
  fetchMe,
} from '../api/passwordReset';

export function useForgotPassword() {
  return useMutation({
    mutationFn: (email: string) => requestPasswordReset(email),
  });
}

export function useResetPassword() {
  return useMutation({
    mutationFn: ({ token, newPassword }: { token: string; newPassword: string }) =>
      executePasswordReset(token, newPassword),
  });
}

export function useSetEmail() {
  return useMutation({
    mutationFn: (email: string) => setEmail(email),
  });
}

export function useVerifyEmail() {
  return useMutation({
    mutationFn: (token: string) => verifyEmail(token),
  });
}

export function useMe() {
  return useQuery({
    queryKey: ['me'],
    queryFn: fetchMe,
  });
}
