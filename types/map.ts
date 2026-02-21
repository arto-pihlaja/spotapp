export interface Region {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
}

export interface MapMarker {
  id: string;
  latitude: number;
  longitude: number;
  title: string;
}

export interface MapViewProps {
  region: Region;
  markers?: MapMarker[];
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
