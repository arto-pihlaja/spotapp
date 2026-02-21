import { useQuery } from '@tanstack/react-query';
import { fetchSpotsByViewport } from '../api/spots';
import type { Region } from '@/types/map';

function regionToViewport(region: Region) {
  return {
    swLat: region.latitude - region.latitudeDelta / 2,
    swLng: region.longitude - region.longitudeDelta / 2,
    neLat: region.latitude + region.latitudeDelta / 2,
    neLng: region.longitude + region.longitudeDelta / 2,
  };
}

export function useSpots(region: Region) {
  const viewport = regionToViewport(region);

  return useQuery({
    queryKey: ['spots', viewport],
    queryFn: () => fetchSpotsByViewport(viewport),
    staleTime: 30_000,
  });
}
