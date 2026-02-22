import { useQuery } from '@tanstack/react-query';
import { fetchSessions } from '../api/sessions';
import type { SessionsResult } from '../types';

export function useSessions(spotId: string | null) {
  return useQuery<SessionsResult>({
    queryKey: ['spot', spotId, 'sessions'],
    queryFn: () => fetchSessions(spotId!),
    enabled: !!spotId,
    staleTime: 30_000,
  });
}
