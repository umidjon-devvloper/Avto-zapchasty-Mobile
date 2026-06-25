import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type SchemePreference = 'system' | 'light' | 'dark';

interface ThemeState {
  preference: SchemePreference;
  setPreference: (p: SchemePreference) => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      preference: 'system',
      setPreference: (preference) => set({ preference }),
    }),
    {
      name: 'theme-preference',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
