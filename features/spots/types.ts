export interface Spot {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  createdAt: string;
}

export interface SpotsResponse {
  data: Spot[];
  meta: { count: number };
}
