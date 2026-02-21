import { useQuery } from '@tanstack/react-query';
import { fetchWiki } from '../api/wiki';

export function useWiki(spotId: string | null) {
  return useQuery({
    queryKey: ['wiki', spotId],
    queryFn: () => fetchWiki(spotId!),
    enabled: !!spotId,
    staleTime: 30_000,
  });
}
