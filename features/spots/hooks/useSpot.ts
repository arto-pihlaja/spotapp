import { useQuery } from '@tanstack/react-query';
import { fetchSpot } from '../api/spots';

export function useSpot(spotId: string | null) {
  return useQuery({
    queryKey: ['spot', spotId],
    queryFn: () => fetchSpot(spotId!),
    enabled: !!spotId,
    staleTime: 30_000,
  });
}
