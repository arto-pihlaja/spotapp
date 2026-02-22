import { api } from '@/lib/apiClient';
import type { Spot, SpotDetail } from '../types';

export interface Viewport {
  swLat: number;
  swLng: number;
  neLat: number;
  neLng: number;
}

export interface TimeFilter {
  timeFrom?: string;
  timeTo?: string;
}

export async function fetchSpotsByViewport(viewport: Viewport, timeFilter?: TimeFilter): Promise<Spot[]> {
  const vp = `${viewport.swLat},${viewport.swLng},${viewport.neLat},${viewport.neLng}`;
  const params = new URLSearchParams({ viewport: vp });
  if (timeFilter?.timeFrom) params.set('timeFrom', timeFilter.timeFrom);
  if (timeFilter?.timeTo) params.set('timeTo', timeFilter.timeTo);
  const res = await api.get<Spot[]>(`/spots?${params.toString()}`);
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
