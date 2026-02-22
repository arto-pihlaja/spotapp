export interface Region {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
}

export interface MarkerCondition {
  waveHeight: number | null;
  windSpeed: number | null;
  windDirection: string | null;
  createdAt: string;
}

export interface MapMarker {
  id: string;
  latitude: number;
  longitude: number;
  title: string;
  sessionCount?: number;
  latestCondition?: MarkerCondition | null;
}

export interface ClusterMarker {
  id: string;            // "cluster-{clusterId}" to avoid collision with spot IDs
  clusterId: number;     // supercluster internal ID
  latitude: number;
  longitude: number;
  pointCount: number;    // spots in this cluster
  expansionZoom: number; // zoom level at which cluster splits
}

export type MapDisplayItem =
  | { type: 'spot'; marker: MapMarker }
  | { type: 'cluster'; cluster: ClusterMarker };

export interface MapViewProps {
  region: Region;
  markers?: MapMarker[];
  displayItems?: MapDisplayItem[];
  onRegionChange?: (region: Region) => void;
  onMarkerPress?: (markerId: string) => void;
  onLongPress?: (coordinate: { latitude: number; longitude: number }) => void;
}

// Default region: Tarifa, Spain (matches seed data)
export const DEFAULT_REGION: Region = {
  latitude: 36.0143,
  longitude: -5.6044,
  latitudeDelta: 0.1,
  longitudeDelta: 0.1,
};
