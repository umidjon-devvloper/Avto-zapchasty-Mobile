import * as Location from 'expo-location';
import { create } from 'zustand';

export interface Coords { lat: number; lng: number }

interface LocationState {
  coords: Coords | null;
  status: 'idle' | 'requesting' | 'granted' | 'denied';
  setCoords: (c: Coords | null) => void;
  setStatus: (s: LocationState['status']) => void;
}

export const useLocationStore = create<LocationState>((set) => ({
  coords: null,
  status: 'idle',
  setCoords: (coords) => set({ coords }),
  setStatus: (status) => set({ status }),
}));

let _requested = false;

// Ilova ochilganda (mehmon ham) bir marta chaqiriladi:
// ruxsat so'raydi va koordinatani store'ga yozadi.
export async function requestLocation(): Promise<Coords | null> {
  if (_requested) return useLocationStore.getState().coords;
  _requested = true;

  const st = useLocationStore.getState();
  st.setStatus('requesting');
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      st.setStatus('denied');
      return null;
    }
    // Avval tez keshdan, bo'lmasa aniq joylashuv
    const last = await Location.getLastKnownPositionAsync();
    const pos = last ?? (await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }));
    const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
    useLocationStore.getState().setCoords(coords);
    useLocationStore.getState().setStatus('granted');
    return coords;
  } catch {
    st.setStatus('denied');
    return null;
  }
}

// "1.2 km" / "800 m" ko'rinishida
export function formatDistance(km?: number): string {
  if (km == null) return '';
  if (km < 1) return `${Math.round(km * 1000)} m`;
  return `${km < 10 ? km.toFixed(1) : Math.round(km)} km`;
}
