export interface LatestCondition {
  waveHeight: number | null;
  windSpeed: number | null;
  windDirection: string | null;
  createdAt: string;
}

export interface Spot {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  createdAt: string;
  sessionCount: number;
  latestCondition: LatestCondition | null;
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
