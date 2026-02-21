import { api } from '@/lib/apiClient';
import type { Spot, SpotDetail } from '../types';

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

export async function fetchSpot(spotId: string): Promise<SpotDetail> {
  const res = await api.get<SpotDetail>(`/spots/${spotId}`);
  return res.data;
}

export async function createSpot(input: { name: string; lat: number; lng: number }): Promise<Spot> {
  const res = await api.post<Spot>('/spots', input);
  return res.data;
}
