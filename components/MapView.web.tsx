import { useEffect, useRef, useCallback } from 'react';
import { StyleSheet, View } from 'react-native';
import maplibregl from 'maplibre-gl';
import type { MapViewProps, Region } from '@/types/map';

// Inject MapLibre CSS once
const CSS_ID = 'maplibre-gl-css';
if (typeof document !== 'undefined' && !document.getElementById(CSS_ID)) {
  const link = document.createElement('link');
  link.id = CSS_ID;
  link.rel = 'stylesheet';
  link.href = 'https://unpkg.com/maplibre-gl@latest/dist/maplibre-gl.css';
  document.head.appendChild(link);
}

function regionToCenter(region: Region): [number, number] {
  return [region.longitude, region.latitude];
}

function regionToZoom(region: Region): number {
  // Approximate zoom from latitudeDelta
  return Math.round(Math.log2(360 / region.latitudeDelta));
}

export default function MapView({ region, markers, onRegionChange, onMarkerPress }: MapViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);
  const isUserInteracting = useRef(false);

  const handleMoveEnd = useCallback(() => {
    const map = mapRef.current;
    if (!map || !onRegionChange) return;

    const center = map.getCenter();
    const bounds = map.getBounds();
    const latDelta = bounds.getNorth() - bounds.getSouth();
    const lngDelta = bounds.getEast() - bounds.getWest();

    onRegionChange({
      latitude: center.lat,
      longitude: center.lng,
      latitudeDelta: latDelta,
      longitudeDelta: lngDelta,
    });
  }, [onRegionChange]);

  // Initialize map
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
      center: regionToCenter(region),
      zoom: regionToZoom(region),
      attributionControl: false,
    });

    map.addControl(new maplibregl.AttributionControl({ compact: true }), 'bottom-left');

    map.on('moveend', handleMoveEnd);

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
    // Only run on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update moveend handler when callback changes
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    map.off('moveend', handleMoveEnd);
    map.on('moveend', handleMoveEnd);
  }, [handleMoveEnd]);

  // Sync markers
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Remove old markers
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    if (!markers) return;

    markers.forEach((spot) => {
      const el = document.createElement('div');
      el.style.cssText =
        'width:32px;height:32px;background:#0284C7;border:2px solid #fff;border-radius:50%;cursor:pointer;box-shadow:0 2px 4px rgba(0,0,0,0.3);';

      if (onMarkerPress) {
        el.addEventListener('click', (e) => {
          e.stopPropagation();
          onMarkerPress(spot.id);
        });
      }

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([spot.longitude, spot.latitude])
        .setPopup(new maplibregl.Popup({ offset: 20 }).setText(spot.title))
        .addTo(map);

      markersRef.current.push(marker);
    });
  }, [markers, onMarkerPress]);

  return (
    <View style={styles.container}>
      <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
