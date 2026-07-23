import * as Location from 'expo-location';
import { create } from 'zustand';

export interface Coords { lat: number; lng: number }

interface LocationState {
  coords: Coords | null;
  cityName: string | null; // reverse geocode natijasi (masalan "Tashkent")
  status: 'idle' | 'requesting' | 'granted' | 'denied';
  setCoords: (c: Coords | null) => void;
  setCityName: (c: string | null) => void;
  setStatus: (s: LocationState['status']) => void;
}

export const useLocationStore = create<LocationState>((set) => ({
  coords: null,
  cityName: null,
  status: 'idle',
  setCoords: (coords) => set({ coords }),
  setCityName: (cityName) => set({ cityName }),
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
      _requested = false; // rad etilsa keyin qayta urinish mumkin (foydalanuvchi sozlamadan yoqishi mumkin)
      return null;
    }
    // Avval tez keshdan, bo'lmasa aniq joylashuv
    const last = await Location.getLastKnownPositionAsync();
    const pos = last ?? (await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }));
    const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
    useLocationStore.getState().setCoords(coords);
    useLocationStore.getState().setStatus('granted');
    resolveCityName(coords); // fon rejimida — koordinata baribir bor
    return coords;
  } catch {
    st.setStatus('denied');
    _requested = false; // xato bo'lsa keyin qayta urinsin
    return null;
  }
}

// Koordinatadan shahar nomini aniqlab store'ga yozadi. Bir nechta maydonni
// (city, district, subregion, region) birlashtiramiz — reverseGeocode ba'zан
// city o'rniga tuman/viloyat beradi, matchCity substring orqali topib oladi.
export async function resolveCityName(coords: Coords): Promise<void> {
  try {
    const res = await Location.reverseGeocodeAsync({ latitude: coords.lat, longitude: coords.lng });
    const g = res[0];
    if (!g) return;
    const parts = [g.city, g.district, g.subregion, g.region].filter(Boolean);
    if (parts.length) useLocationStore.getState().setCityName(parts.join(' '));
  } catch { /* e'tiborsiz */ }
}

// Shahar nomlarining inglizcha/ruscha/o'zbekcha variantlarini yagona kalitga keltiradi.
// (reverseGeocode ko'pincha inglizcha beradi: "Tashkent", DB esa "Toshkent")
const CITY_ALIASES: Record<string, string> = {
  tashkent: 'toshkent', toshkent: 'toshkent', ташкент: 'toshkent',
  samarkand: 'samarqand', samarqand: 'samarqand', самарканд: 'samarqand',
  bukhara: 'buxoro', buxoro: 'buxoro', бухара: 'buxoro',
  andijan: 'andijon', andijon: 'andijon', андижан: 'andijon',
  namangan: 'namangan', наманган: 'namangan',
  fergana: 'fargona', fargona: 'fargona', фергана: 'fargona',
  nukus: 'nukus', нукус: 'nukus',
  navoi: 'navoiy', navoiy: 'navoiy', навои: 'navoiy',
  jizzakh: 'jizzax', jizzax: 'jizzax', джизак: 'jizzax',
  gulistan: 'guliston', guliston: 'guliston', гулистан: 'guliston',
  termez: 'termiz', termiz: 'termiz', термез: 'termiz',
  karshi: 'qarshi', qarshi: 'qarshi', карши: 'qarshi',
  urgench: 'urganch', urganch: 'urganch', ургенч: 'urganch',
  nurafshan: 'nurafshon', nurafshon: 'nurafshon',
};

// Matnni tozalash (kichik harf, apostrofsiz). O'zbek lotin nomlarida
// turli apostrof belgilari uchraydi (Farg'ona, To'rtko'l ...)
function normCity(s: string): string {
  return s.toLowerCase().replace(/['`´ʻʼ‘’ʹ]/g, '').replace(/\s+/g, ' ').trim();
}

// Alias jadvalidan kanonik nom. To'liq mos kelmasa, matn ichidan
// alias kalitini qidiradi ("Tashkent Region" -> "toshkent").
function canonCity(s: string): string {
  const n = normCity(s);
  if (CITY_ALIASES[n]) return CITY_ALIASES[n];
  for (const key of Object.keys(CITY_ALIASES)) {
    if (n.includes(key)) return CITY_ALIASES[key];
  }
  return n;
}

// reverseGeocode nomini shaharlar ro'yxatidan topadi. Topilmasa null.
export function matchCity(cityName: string | null, options: { value: string; label: string }[]): string | null {
  if (!cityName) return null;
  const target = canonCity(cityName);
  const found = options.find((o) => {
    const l = canonCity(o.label);
    return l === target || l.includes(target) || target.includes(l);
  });
  return found?.value ?? null;
}

// "1.2 km" / "800 m" ko'rinishida
export function formatDistance(km?: number): string {
  if (km == null) return '';
  if (km < 1) return `${Math.round(km * 1000)} m`;
  return `${km < 10 ? km.toFixed(1) : Math.round(km)} km`;
}
