import { api } from '@/lib/apiClient';
import type { WikiContent } from '../types';

export async function fetchWiki(spotId: string): Promise<WikiContent> {
  const res = await api.get<WikiContent>(`/spots/${spotId}/wiki`);
  return res.data;
}

export async function updateWiki(spotId: string, content: string): Promise<WikiContent> {
  const res = await api.put<WikiContent>(`/spots/${spotId}/wiki`, { content });
  return res.data;
}
