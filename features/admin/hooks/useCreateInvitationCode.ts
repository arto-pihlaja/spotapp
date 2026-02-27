import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createInvitationCode } from '../api/admin';
import { showToast } from '@/components/Toast';
import type { CreateInvitationCodeInput } from '../types';

export function useCreateInvitationCode() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateInvitationCodeInput) => createInvitationCode(input),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'invitation-codes'] });
      showToast(`Code created: ${data.code}`, 'success');
    },
    onError: () => {
      showToast('Failed to create invitation code', 'error');
    },
  });
}
