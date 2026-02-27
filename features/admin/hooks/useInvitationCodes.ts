import { useQuery } from '@tanstack/react-query';
import { fetchInvitationCodes } from '../api/admin';
import type { InvitationCode } from '../types';

export function useInvitationCodes() {
  return useQuery<InvitationCode[]>({
    queryKey: ['admin', 'invitation-codes'],
    queryFn: fetchInvitationCodes,
    staleTime: 30_000,
  });
}
