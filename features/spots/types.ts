export interface Spot {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  createdAt: string;
  sessionCount: number;
}

export interface SpotDetail {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  createdAt: string;
  creator: { id: string; username: string };
  wikiContent: { content: string; updatedAt: string } | null;
}

export interface SpotsResponse {
  data: Spot[];
  meta: { count: number };
}
