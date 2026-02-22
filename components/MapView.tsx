import { useCallback } from 'react';
import { StyleSheet, View, Text } from 'react-native';
import NativeMapView, { Marker, Callout, type Region as NativeRegion } from 'react-native-maps';
import type { MapViewProps } from '@/types/map';

export default function MapView({ region, markers, onRegionChange, onMarkerPress, onLongPress }: MapViewProps) {
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

  return (
    <NativeMapView
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
      {markers?.map((spot) => (
        <Marker
          key={spot.id}
          coordinate={{ latitude: spot.latitude, longitude: spot.longitude }}
          title={spot.sessionCount ? `${spot.title} (${spot.sessionCount})` : spot.title}
          onPress={() => onMarkerPress?.(spot.id)}
        />
      ))}
    </NativeMapView>
  );
}

const styles = StyleSheet.create({
  map: {
    flex: 1,
  },
});
