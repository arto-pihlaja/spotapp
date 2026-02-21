import { useEffect, useCallback, useMemo, useState } from 'react';
import { StyleSheet, View, Pressable, Text, Platform } from 'react-native';
import * as Location from 'expo-location';
import MapView from '@/components/MapView';
import { useMapStore } from '@/stores/useMapStore';
import { useSpots } from '@/features/spots/hooks/useSpots';
import { useDebounce } from '@/lib/useDebounce';
import type { Region, MapMarker } from '@/types/map';

export default function MapScreen() {
  const { region, setRegion, selectSpot } = useMapStore();
  const [locationDenied, setLocationDenied] = useState(false);

  // Debounce region to avoid excessive API calls during pan/zoom
  const debouncedRegion = useDebounce(region, 300);
  const { data: spots } = useSpots(debouncedRegion);

  const markers: MapMarker[] = useMemo(
    () =>
      spots?.map((spot) => ({
        id: spot.id,
        latitude: spot.latitude,
        longitude: spot.longitude,
        title: spot.name,
      })) ?? [],
    [spots],
  );

  const centerOnUser = useCallback(async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      setLocationDenied(true);
      return;
    }
    setLocationDenied(false);
    const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
    setRegion({
      latitude: loc.coords.latitude,
      longitude: loc.coords.longitude,
      latitudeDelta: region.latitudeDelta,
      longitudeDelta: region.longitudeDelta,
    });
  }, [region.latitudeDelta, region.longitudeDelta, setRegion]);

  // Center on user location on first load
  useEffect(() => {
    centerOnUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleRegionChange = useCallback(
    (newRegion: Region) => {
      setRegion(newRegion);
    },
    [setRegion],
  );

  const handleMarkerPress = useCallback(
    (markerId: string) => {
      selectSpot(markerId);
    },
    [selectSpot],
  );

  return (
    <View style={styles.container}>
      <MapView
        region={region}
        markers={markers}
        onRegionChange={handleRegionChange}
        onMarkerPress={handleMarkerPress}
      />

      {/* Find Me FAB */}
      <Pressable
        style={styles.fab}
        onPress={centerOnUser}
        accessibilityLabel="Center map on my location"
        accessibilityRole="button"
      >
        <Text style={styles.fabIcon}>📍</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  fabIcon: {
    fontSize: 24,
  },
});
