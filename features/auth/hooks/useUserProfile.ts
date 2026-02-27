import { useQuery } from '@tanstack/react-query';
import { fetchUserProfile } from '../api/profile';
import type { UserProfile } from '../types';

export function useUserProfile(userId: string | null) {
  return useQuery<UserProfile>({
    queryKey: ['user', 'profile', userId],
    queryFn: () => fetchUserProfile(userId!),
    enabled: !!userId,
    staleTime: 30_000,
  });
}
