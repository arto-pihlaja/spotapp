import { api } from '@/lib/apiClient';
import type { Spot } from '../types';

interface Viewport {
  swLat: number;
  swLng: number;
  neLat: number;
  neLng: number;
}

export async function fetchSpotsByViewport(viewport: Viewport): Promise<Spot[]> {
  const vp = `${viewport.swLat},${viewport.swLng},${viewport.neLat},${viewport.neLng}`;
  const res = await api.get<Spot[]>(`/spots?viewport=${vp}`);
  return res.data;
}
