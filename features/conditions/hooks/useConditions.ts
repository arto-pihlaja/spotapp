import { useQuery } from '@tanstack/react-query';
import { fetchConditions } from '../api/conditions';

export function useConditions(spotId: string | null) {
  return useQuery({
    queryKey: ['spot', spotId, 'conditions'],
    queryFn: () => fetchConditions(spotId!),
    enabled: !!spotId,
    staleTime: 30_000,
  });
}
