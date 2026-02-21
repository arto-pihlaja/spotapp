import { useEffect, useCallback, useMemo, useState } from 'react';
import { StyleSheet, View, Pressable, Text, Platform } from 'react-native';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import MapView from '@/components/MapView';
import { useMapStore } from '@/stores/useMapStore';
import { useAuthStore } from '@/stores/useAuthStore';
import { useSpots } from '@/features/spots/hooks/useSpots';
import { useDebounce } from '@/lib/useDebounce';
import { CreateSpotModal } from '@/features/spots/components/CreateSpotModal';
import { SpotDetailSheet } from '@/features/spots/components/SpotDetailSheet';
import type { Region, MapMarker } from '@/types/map';

export default function MapScreen() {
  const router = useRouter();
  const { region, setRegion, selectSpot, selectedSpotId } = useMapStore();
  const user = useAuthStore((s) => s.user);
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const [locationDenied, setLocationDenied] = useState(false);
  const [createCoord, setCreateCoord] = useState<{ latitude: number; longitude: number } | null>(null);

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

  const handleLongPress = useCallback(
    (coordinate: { latitude: number; longitude: number }) => {
      const token = useAuthStore.getState().accessToken;
      if (!token) return; // anonymous users can't create spots
      setCreateCoord(coordinate);
    },
    [],
  );

  return (
    <View style={styles.container}>
      <MapView
        region={region}
        markers={markers}
        onRegionChange={handleRegionChange}
        onMarkerPress={handleMarkerPress}
        onLongPress={handleLongPress}
      />

      {/* Account button */}
      <Pressable
        style={styles.accountButton}
        onPress={() => {
          if (user) {
            clearAuth();
          } else {
            router.push('/login');
          }
        }}
        accessibilityLabel={user ? 'Log out' : 'Log in'}
        accessibilityRole="button"
      >
        <Text style={styles.accountText} numberOfLines={1}>
          {user ? user.username : 'Log In'}
        </Text>
      </Pressable>

      {/* Find Me FAB */}
      <Pressable
        style={styles.fab}
        onPress={centerOnUser}
        accessibilityLabel="Center map on my location"
        accessibilityRole="button"
      >
        <Text style={styles.fabIcon}>📍</Text>
      </Pressable>

      <CreateSpotModal
        visible={createCoord !== null}
        coordinate={createCoord}
        onClose={() => setCreateCoord(null)}
      />

      <SpotDetailSheet
        spotId={selectedSpotId}
        onDismiss={() => selectSpot(null)}
      />
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
    zIndex: 10,
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
  accountButton: {
    position: 'absolute',
    top: 48,
    left: 16,
    zIndex: 10,
    backgroundColor: '#fff',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    maxWidth: 140,
  },
  accountText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0284C7',
  },
});
