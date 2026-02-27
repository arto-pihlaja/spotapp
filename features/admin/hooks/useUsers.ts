import { useQuery } from '@tanstack/react-query';
import { fetchUsers } from '../api/admin';
import type { UserForModeration } from '../types';

export function useUsers() {
  return useQuery<UserForModeration[]>({
    queryKey: ['admin', 'users'],
    queryFn: fetchUsers,
    staleTime: 30_000,
  });
}
