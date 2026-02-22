import { useMutation, useQueryClient } from '@tanstack/react-query';
import { leaveSession } from '../api/sessions';
import type { SessionsResult } from '../types';

export function useLeaveSession(spotId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (sessionId: string) => leaveSession(spotId, sessionId),
    onMutate: async (sessionId) => {
      const queryKey = ['spot', spotId, 'sessions'];
      await queryClient.cancelQueries({ queryKey });

      const previous = queryClient.getQueryData<SessionsResult>(queryKey);

      if (previous) {
        queryClient.setQueryData<SessionsResult>(queryKey, {
          sessions: previous.sessions.filter((s) => s.id !== sessionId),
          sessionCount: previous.sessionCount - 1,
        });
      }

      return { previous };
    },
    onError: (_err, _sessionId, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['spot', spotId, 'sessions'], context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['spot', spotId, 'sessions'] });
      queryClient.invalidateQueries({ queryKey: ['spot', spotId] });
    },
  });
}
