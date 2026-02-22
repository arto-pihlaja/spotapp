import { useEffect, useRef, useCallback, useState } from 'react';
import type { MapViewProps, Region, MapMarker } from '@/types/map';

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

// Wind direction arrow mapping
const WIND_ARROWS: Record<string, string> = {
  N: '\u2193', S: '\u2191', E: '\u2190', W: '\u2192',
  NE: '\u2199', NW: '\u2198', SE: '\u2196', SW: '\u2197',
};

function getRecencyColor(createdAt: string): string {
  const minutesAgo = (Date.now() - new Date(createdAt).getTime()) / 60_000;
  if (minutesAgo < 30) return '#10B981';   // green - fresh
  if (minutesAgo < 90) return '#FBBF24';   // yellow - recent
  if (minutesAgo < 180) return '#F97316';  // orange - stale
  return '#9CA3AF';                         // grey - old
}

const NO_DATA_COLOR = '#9CA3AF';

function buildSpotMarkerElement(spot: MapMarker): HTMLDivElement {
  const hasCondition = spot.latestCondition &&
    (spot.latestCondition.waveHeight != null || spot.latestCondition.windSpeed != null);
  const bgColor = hasCondition ? getRecencyColor(spot.latestCondition!.createdAt) : NO_DATA_COLOR;

  const el = document.createElement('div');
  el.style.cssText = `position:relative;display:flex;flex-direction:column;align-items:center;gap:2px;cursor:pointer;`;

  // Main card
  const card = document.createElement('div');
  card.style.cssText = `
    background:${bgColor};border-radius:8px;padding:4px 8px;box-shadow:0 2px 6px rgba(0,0,0,0.3);
    border:2px solid #fff;min-width:56px;text-align:center;position:relative;
  `.replace(/\n\s*/g, '');

  // Spot name
  const name = document.createElement('div');
  name.textContent = spot.title.length > 12 ? spot.title.slice(0, 11) + '\u2026' : spot.title;
  name.style.cssText = 'color:#fff;font-size:11px;font-weight:700;white-space:nowrap;text-shadow:0 1px 2px rgba(0,0,0,0.3);line-height:14px;';
  card.appendChild(name);

  // Condition summary line
  if (hasCondition) {
    const cond = spot.latestCondition!;
    const parts: string[] = [];
    if (cond.waveHeight != null) parts.push(`${cond.waveHeight}m`);
    if (cond.windSpeed != null) {
      const arrow = cond.windDirection ? (WIND_ARROWS[cond.windDirection] || '') : '';
      parts.push(`${arrow}${cond.windSpeed}`);
    }
    if (parts.length > 0) {
      const condLine = document.createElement('div');
      condLine.textContent = parts.join(' ');
      condLine.style.cssText = 'color:rgba(255,255,255,0.95);font-size:10px;font-weight:600;white-space:nowrap;line-height:13px;text-shadow:0 1px 2px rgba(0,0,0,0.3);';
      card.appendChild(condLine);
    }
  }

  el.appendChild(card);

  // Session count badge (top-right)
  if (spot.sessionCount && spot.sessionCount > 0) {
    const badge = document.createElement('div');
    badge.textContent = String(spot.sessionCount);
    badge.style.cssText =
      'position:absolute;top:-7px;right:-7px;min-width:18px;height:18px;background:#0284C7;color:#fff;font-size:10px;font-weight:700;border-radius:9px;display:flex;align-items:center;justify-content:center;padding:0 4px;border:2px solid #fff;z-index:1;';
    card.appendChild(badge);
  }

  // Pointer triangle
  const pointer = document.createElement('div');
  pointer.style.cssText = `width:0;height:0;border-left:6px solid transparent;border-right:6px solid transparent;border-top:6px solid ${bgColor};margin-top:-1px;`;
  el.appendChild(pointer);

  return el;
}

function regionToCenter(region: Region): [number, number] {
  return [region.longitude, region.latitude];
}

function regionToZoom(region: Region): number {
  return Math.round(Math.log2(360 / region.latitudeDelta));
}

export default function MapView({ region, markers, displayItems, onRegionChange, onMarkerPress, onLongPress }: MapViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const [ready, setReady] = useState(false);
  const onLongPressRef = useRef(onLongPress);
  onLongPressRef.current = onLongPress;

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

      // Long-press detection (500ms hold, <5px movement)
      let lpTimer: ReturnType<typeof setTimeout> | null = null;
      let startX = 0;
      let startY = 0;

      const canvas = map.getCanvas();

      canvas.addEventListener('mousedown', (e: MouseEvent) => {
        startX = e.offsetX;
        startY = e.offsetY;
        lpTimer = setTimeout(() => {
          const cb = onLongPressRef.current;
          if (!cb) return;
          const lngLat = map.unproject([startX, startY]);
          cb({ latitude: lngLat.lat, longitude: lngLat.lng });
        }, 500);
      });

      canvas.addEventListener('mousemove', (e: MouseEvent) => {
        if (!lpTimer) return;
        const dx = e.offsetX - startX;
        const dy = e.offsetY - startY;
        if (dx * dx + dy * dy > 25) {
          clearTimeout(lpTimer);
          lpTimer = null;
        }
      });

      canvas.addEventListener('mouseup', () => {
        if (lpTimer) {
          clearTimeout(lpTimer);
          lpTimer = null;
        }
      });

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

  // Sync display items (clusters + spots)
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;

    const maplibregl = (window as any).maplibregl;

    // Clear existing markers
    markersRef.current.forEach((m: any) => m.remove());
    markersRef.current = [];

    // Use displayItems if available, fall back to markers
    if (displayItems) {
      displayItems.forEach((item) => {
        if (item.type === 'cluster') {
          const { cluster } = item;
          const size = Math.min(40 + Math.floor(Math.log2(cluster.pointCount)) * 8, 64);

          const el = document.createElement('div');
          el.style.cssText = `width:${size}px;height:${size}px;background:rgba(2,132,199,0.75);border:2px solid #fff;border-radius:50%;cursor:pointer;box-shadow:0 2px 6px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;`;

          const label = document.createElement('span');
          label.textContent = String(cluster.pointCount);
          label.style.cssText = 'color:#fff;font-weight:700;font-size:14px;user-select:none;';
          el.appendChild(label);

          el.addEventListener('click', (e) => {
            e.stopPropagation();
            map.flyTo({
              center: [cluster.longitude, cluster.latitude],
              zoom: cluster.expansionZoom,
              duration: 500,
            });
          });

          const marker = new maplibregl.Marker({ element: el })
            .setLngLat([cluster.longitude, cluster.latitude])
            .addTo(map);

          markersRef.current.push(marker);
        } else {
          const spot = item.marker;
          const el = buildSpotMarkerElement(spot);

          if (onMarkerPress) {
            el.addEventListener('click', (e) => {
              e.stopPropagation();
              onMarkerPress(spot.id);
            });
          }

          const marker = new maplibregl.Marker({ element: el, anchor: 'bottom' })
            .setLngLat([spot.longitude, spot.latitude])
            .addTo(map);

          markersRef.current.push(marker);
        }
      });
    } else if (markers) {
      // Fallback: render raw markers without clustering
      markers.forEach((spot) => {
        const el = buildSpotMarkerElement(spot);

        if (onMarkerPress) {
          el.addEventListener('click', (e) => {
            e.stopPropagation();
            onMarkerPress(spot.id);
          });
        }

        const marker = new maplibregl.Marker({ element: el, anchor: 'bottom' })
          .setLngLat([spot.longitude, spot.latitude])
          .addTo(map);

        markersRef.current.push(marker);
      });
    }
  }, [displayItems, markers, onMarkerPress, ready]);

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
