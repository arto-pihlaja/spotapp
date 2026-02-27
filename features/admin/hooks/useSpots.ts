import { useQuery } from '@tanstack/react-query';
import { fetchSpots } from '../api/admin';
import type { SpotForModeration } from '../types';

export function useAdminSpots() {
  return useQuery<SpotForModeration[]>({
    queryKey: ['admin', 'spots'],
    queryFn: fetchSpots,
    staleTime: 30_000,
  });
}
