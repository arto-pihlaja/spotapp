import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createSession } from '../api/sessions';
import type { CreateSessionInput, SessionsResult } from '../types';
import { useAuthStore } from '@/stores/useAuthStore';
import { isNetworkError } from '@/lib/networkError';
import { enqueueMutation } from '@/lib/offlineQueue';
import { showToast } from '@/components/Toast';

export function useCreateSession(spotId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateSessionInput) => createSession(spotId, input),
    onMutate: async (input) => {
      const queryKey = ['spot', spotId, 'sessions'];
      await queryClient.cancelQueries({ queryKey });

      const previous = queryClient.getQueryData<SessionsResult>(queryKey);
      const user = useAuthStore.getState().user;

      if (previous && user) {
        const optimistic = {
          id: `optimistic-${Date.now()}`,
          spotId,
          type: input.type === 'now' ? 'NOW' : 'PLANNED',
          sportType: input.sportType,
          scheduledAt: input.scheduledAt ?? new Date().toISOString(),
          expiresAt: null,
          createdAt: new Date().toISOString(),
          user: { id: user.id, username: user.username },
          isOwn: true,
        } as const;

        queryClient.setQueryData<SessionsResult>(queryKey, {
          sessions: [...previous.sessions, optimistic],
          sessionCount: previous.sessionCount + 1,
        });
      }

      return { previous };
    },
    onError: (error, input, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['spot', spotId, 'sessions'], context.previous);
      }
      if (isNetworkError(error)) {
        enqueueMutation({
          type: 'createSession',
          label: 'Session',
          endpoint: `/spots/${spotId}/sessions`,
          method: 'POST',
          body: input,
        });
      } else {
        showToast('Failed to create session', 'error');
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['spot', spotId, 'sessions'] });
      queryClient.invalidateQueries({ queryKey: ['spot', spotId] });
    },
  });
}
