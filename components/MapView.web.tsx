import { useEffect, useRef, useCallback, useState } from 'react';
import type { MapViewProps, Region } from '@/types/map';

// Dynamically load MapLibre GL from CDN (avoids Metro import.meta issue)
function loadMapLibre(): Promise<any> {
  if ((window as any).maplibregl) {
    return Promise.resolve((window as any).maplibregl);
  }

  return new Promise((resolve, reject) => {
    // CSS
    if (!document.getElementById('maplibre-css')) {
      const link = document.createElement('link');
      link.id = 'maplibre-css';
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/maplibre-gl@4.7.1/dist/maplibre-gl.css';
      document.head.appendChild(link);
    }

    // JS
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/maplibre-gl@4.7.1/dist/maplibre-gl.js';
    script.onload = () => resolve((window as any).maplibregl);
    script.onerror = () => reject(new Error('Failed to load MapLibre GL'));
    document.head.appendChild(script);
  });
}

function regionToCenter(region: Region): [number, number] {
  return [region.longitude, region.latitude];
}

function regionToZoom(region: Region): number {
  return Math.round(Math.log2(360 / region.latitudeDelta));
}

export default function MapView({ region, markers, onRegionChange, onMarkerPress }: MapViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const [ready, setReady] = useState(false);

  const handleMoveEnd = useCallback(() => {
    const map = mapRef.current;
    if (!map || !onRegionChange) return;

    const center = map.getCenter();
    const bounds = map.getBounds();

    onRegionChange({
      latitude: center.lat,
      longitude: center.lng,
      latitudeDelta: bounds.getNorth() - bounds.getSouth(),
      longitudeDelta: bounds.getEast() - bounds.getWest(),
    });
  }, [onRegionChange]);

  // Load library and initialize map
  useEffect(() => {
    let cancelled = false;

    loadMapLibre().then((maplibregl) => {
      if (cancelled || !containerRef.current || mapRef.current) return;

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
      setReady(true);
    });

    return () => {
      cancelled = true;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update moveend handler
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    map.off('moveend', handleMoveEnd);
    map.on('moveend', handleMoveEnd);
  }, [handleMoveEnd]);

  // Sync markers
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;

    const maplibregl = (window as any).maplibregl;

    markersRef.current.forEach((m: any) => m.remove());
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
  }, [markers, onMarkerPress, ready]);

  return (
    <div
      ref={containerRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
      }}
    />
  );
}
