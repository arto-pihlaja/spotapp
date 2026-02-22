import { useCallback, useRef } from 'react';
import { StyleSheet, View, Text } from 'react-native';
import NativeMapView, { Marker, Callout, type Region as NativeRegion } from 'react-native-maps';
import type { MapViewProps, MapDisplayItem, MapMarker } from '@/types/map';

const WIND_ARROWS: Record<string, string> = {
  N: '\u2193', S: '\u2191', E: '\u2190', W: '\u2192',
  NE: '\u2199', NW: '\u2198', SE: '\u2196', SW: '\u2197',
};

const NO_DATA_COLOR = '#9CA3AF';

function getRecencyColor(createdAt: string): string {
  const minutesAgo = (Date.now() - new Date(createdAt).getTime()) / 60_000;
  if (minutesAgo < 30) return '#10B981';
  if (minutesAgo < 90) return '#FBBF24';
  if (minutesAgo < 180) return '#F97316';
  return '#9CA3AF';
}

function SpotMarkerView({ spot }: { spot: MapMarker }) {
  const hasCondition = spot.latestCondition &&
    (spot.latestCondition.waveHeight != null || spot.latestCondition.windSpeed != null);
  const bgColor = hasCondition ? getRecencyColor(spot.latestCondition!.createdAt) : NO_DATA_COLOR;

  const condParts: string[] = [];
  if (hasCondition) {
    const cond = spot.latestCondition!;
    if (cond.waveHeight != null) condParts.push(`${cond.waveHeight}m`);
    if (cond.windSpeed != null) {
      const arrow = cond.windDirection ? (WIND_ARROWS[cond.windDirection] || '') : '';
      condParts.push(`${arrow}${cond.windSpeed}`);
    }
  }

  const displayName = spot.title.length > 12 ? spot.title.slice(0, 11) + '\u2026' : spot.title;

  return (
    <View style={nativeStyles.spotCardWrapper}>
      <View style={[nativeStyles.spotCard, { backgroundColor: bgColor }]}>
        <Text style={nativeStyles.spotName} numberOfLines={1}>{displayName}</Text>
        {condParts.length > 0 && (
          <Text style={nativeStyles.spotCondition} numberOfLines={1}>{condParts.join(' ')}</Text>
        )}
        {spot.sessionCount != null && spot.sessionCount > 0 && (
          <View style={nativeStyles.sessionBadge}>
            <Text style={nativeStyles.sessionBadgeText}>{spot.sessionCount}</Text>
          </View>
        )}
      </View>
      <View style={[nativeStyles.spotPointer, { borderTopColor: bgColor }]} />
    </View>
  );
}

function expansionZoomToRegion(lat: number, lng: number, zoom: number) {
  const latitudeDelta = 360 / Math.pow(2, zoom);
  return {
    latitude: lat,
    longitude: lng,
    latitudeDelta,
    longitudeDelta: latitudeDelta,
  };
}

export default function MapView({ region, markers, displayItems, onRegionChange, onMarkerPress, onLongPress }: MapViewProps) {
  const mapRef = useRef<NativeMapView>(null);

  const handleRegionChangeComplete = useCallback(
    (nativeRegion: NativeRegion) => {
      onRegionChange?.({
        latitude: nativeRegion.latitude,
        longitude: nativeRegion.longitude,
        latitudeDelta: nativeRegion.latitudeDelta,
        longitudeDelta: nativeRegion.longitudeDelta,
      });
    },
    [onRegionChange],
  );

  const handleClusterPress = useCallback((lat: number, lng: number, expansionZoom: number) => {
    const targetRegion = expansionZoomToRegion(lat, lng, expansionZoom);
    mapRef.current?.animateToRegion(targetRegion, 500);
  }, []);

  const renderItems = displayItems ?? markers?.map((m): MapDisplayItem => ({ type: 'spot', marker: m }));

  return (
    <NativeMapView
      ref={mapRef}
      style={styles.map}
      initialRegion={{
        latitude: region.latitude,
        longitude: region.longitude,
        latitudeDelta: region.latitudeDelta,
        longitudeDelta: region.longitudeDelta,
      }}
      onRegionChangeComplete={handleRegionChangeComplete}
      onLongPress={(e) => onLongPress?.(e.nativeEvent.coordinate)}
      showsUserLocation
      showsMyLocationButton={false}
    >
      {renderItems?.map((item) => {
        if (item.type === 'cluster') {
          const { cluster } = item;
          const size = Math.min(40 + Math.floor(Math.log2(cluster.pointCount)) * 8, 64);
          return (
            <Marker
              key={cluster.id}
              coordinate={{ latitude: cluster.latitude, longitude: cluster.longitude }}
              onPress={() => handleClusterPress(cluster.latitude, cluster.longitude, cluster.expansionZoom)}
            >
              <View style={[styles.cluster, { width: size, height: size, borderRadius: size / 2 }]}>
                <Text style={styles.clusterText}>{cluster.pointCount}</Text>
              </View>
            </Marker>
          );
        }
        const spot = item.marker;
        return (
          <Marker
            key={spot.id}
            coordinate={{ latitude: spot.latitude, longitude: spot.longitude }}
            onPress={() => onMarkerPress?.(spot.id)}
            anchor={{ x: 0.5, y: 1 }}
          >
            <SpotMarkerView spot={spot} />
          </Marker>
        );
      })}
    </NativeMapView>
  );
}

const styles = StyleSheet.create({
  map: {
    flex: 1,
  },
  cluster: {
    backgroundColor: 'rgba(2, 132, 199, 0.75)',
    borderWidth: 2,
    borderColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 4,
  },
  clusterText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
});

const nativeStyles = StyleSheet.create({
  spotCardWrapper: {
    alignItems: 'center',
  },
  spotCard: {
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 2,
    borderColor: '#fff',
    minWidth: 56,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 4,
  },
  spotName: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
    lineHeight: 14,
  },
  spotCondition: {
    color: 'rgba(255,255,255,0.95)',
    fontSize: 10,
    fontWeight: '600',
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
    lineHeight: 13,
  },
  sessionBadge: {
    position: 'absolute',
    top: -7,
    right: -7,
    minWidth: 18,
    height: 18,
    backgroundColor: '#0284C7',
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: '#fff',
    zIndex: 1,
  },
  sessionBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
  spotPointer: {
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 6,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    marginTop: -2,
  },
});
