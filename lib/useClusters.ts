import { useMemo } from 'react';
import Supercluster from 'supercluster';
import type { Region, MapMarker, MapDisplayItem } from '@/types/map';

function regionToZoom(region: Region): number {
  return Math.round(Math.log2(360 / region.latitudeDelta));
}

function regionToBBox(region: Region): [number, number, number, number] {
  return [
    region.longitude - region.longitudeDelta / 2, // westLng
    region.latitude - region.latitudeDelta / 2,    // southLat
    region.longitude + region.longitudeDelta / 2,  // eastLng
    region.latitude + region.latitudeDelta / 2,    // northLat
  ];
}

export function useClusters(markers: MapMarker[], region: Region): { displayItems: MapDisplayItem[] } {
  // Build supercluster index, memoized on markers array reference
  const index = useMemo(() => {
    const sc = new Supercluster({ radius: 60, maxZoom: 14 });
    const points: Supercluster.PointFeature<{ markerId: string }>[] = markers.map((m) => ({
      type: 'Feature' as const,
      geometry: { type: 'Point' as const, coordinates: [m.longitude, m.latitude] },
      properties: { markerId: m.id },
    }));
    sc.load(points);
    return sc;
  }, [markers]);

  // Lookup map for markers by id
  const markerMap = useMemo(() => {
    const map = new Map<string, MapMarker>();
    for (const m of markers) {
      map.set(m.id, m);
    }
    return map;
  }, [markers]);

  // Get clusters for current viewport
  const displayItems = useMemo(() => {
    const zoom = regionToZoom(region);
    const bbox = regionToBBox(region);
    const raw = index.getClusters(bbox, zoom);

    return raw.map((feature): MapDisplayItem => {
      const props = feature.properties as any;
      if (props.cluster) {
        const clusterId = props.cluster_id as number;
        const [lng, lat] = feature.geometry.coordinates;
        return {
          type: 'cluster',
          cluster: {
            id: `cluster-${clusterId}`,
            clusterId,
            latitude: lat,
            longitude: lng,
            pointCount: props.point_count as number,
            expansionZoom: index.getClusterExpansionZoom(clusterId),
          },
        };
      }
      // Individual point
      const marker = markerMap.get(props.markerId);
      if (!marker) {
        // Fallback — shouldn't happen
        const [lng, lat] = feature.geometry.coordinates;
        return {
          type: 'spot',
          marker: { id: props.markerId, latitude: lat, longitude: lng, title: '' },
        };
      }
      return { type: 'spot', marker };
    });
  }, [index, markerMap, region]);

  return { displayItems };
}
