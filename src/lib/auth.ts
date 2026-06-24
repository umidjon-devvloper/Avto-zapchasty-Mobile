import { useEffect, useState } from 'react';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { User } from './types';

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  user: User | null;
  pushToken: string | null;
  isBlocked: boolean;
  setSession: (a: string, r: string, u: User) => void;
  setTokens: (a: string, r: string) => void;
  setUser: (u: User) => void;
  setPushToken: (t: string | null) => void;
  setBlocked: (v: boolean) => void;
  logout: () => void;
}

export const useAuth = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      refreshToken: null,
      user: null,
      pushToken: null,
      isBlocked: false,
      setSession: (accessToken, refreshToken, user) =>
        set({ accessToken, refreshToken, user, isBlocked: !!user.blocked }),
      setPushToken: (pushToken) => set({ pushToken }),
      setTokens: (accessToken, refreshToken) => set({ accessToken, refreshToken }),
      setUser: (user) => set({ user, isBlocked: !!user.blocked }),
      setBlocked: (isBlocked) => set({ isBlocked }),
      logout: () =>
        set({ accessToken: null, refreshToken: null, user: null, pushToken: null, isBlocked: false }),
    }),
    { name: 'ap-auth', storage: createJSONStorage(() => AsyncStorage) }
  )
);

// Persist hydratsiyasi tugaganini kuzatuvchi hook
export function useAuthHydrated() {
  const [hydrated, setHydrated] = useState(useAuth.persist.hasHydrated());
  useEffect(() => {
    const unsub = useAuth.persist.onFinishHydration(() => setHydrated(true));
    setHydrated(useAuth.persist.hasHydrated());
    return unsub;
  }, []);
  return hydrated;
}
