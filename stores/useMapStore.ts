import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DEFAULT_REGION } from '@/types/map';
import type { Region } from '@/types/map';

interface MapState {
  region: Region;
  selectedSpotId: string | null;
  mapReady: boolean;
  setRegion: (region: Region) => void;
  selectSpot: (spotId: string | null) => void;
  setMapReady: (ready: boolean) => void;
}

export const useMapStore = create<MapState>()(
  persist(
    (set) => ({
      region: DEFAULT_REGION,
      selectedSpotId: null,
      mapReady: false,
      setRegion: (region) => set({ region }),
      selectSpot: (spotId) => set({ selectedSpotId: spotId }),
      setMapReady: (ready) => set({ mapReady: ready }),
    }),
    {
      name: 'spotapp-map',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ region: state.region }),
    },
  ),
);
