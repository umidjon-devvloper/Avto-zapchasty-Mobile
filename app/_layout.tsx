import { useEffect } from 'react';
import { Stack, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as Notifications from 'expo-notifications';
import { QueryProvider } from '../src/lib/query';
import { api } from '../src/lib/api';
import { useAuth, useAuthHydrated } from '../src/lib/auth';
import { registerForPush } from '../src/lib/push';
import { Loading } from '../src/components/Loading';
import { BlockedScreen } from '../src/components/BlockedScreen';
import { theme } from '../src/theme';

export default function RootLayout() {
  const hydrated = useAuthHydrated();
  const accessToken = useAuth((s) => s.accessToken);
  const isBlocked = useAuth((s) => s.isBlocked);
  const setBlocked = useAuth((s) => s.setBlocked);
  const setUser = useAuth((s) => s.setUser);

  useEffect(() => {
    if (!accessToken) return;
    registerForPush();
    // Profilni yangilab, blocked holatini tekshiramiz
    api.me()
      .then((u) => {
        setUser(u);
        if (u.blocked) setBlocked(true);
      })
      .catch(() => {});
  }, [accessToken]);

  useEffect(() => {
    const sub = Notifications.addNotificationResponseReceivedListener((resp) => {
      const data = resp.notification.request.content.data as { listingId?: string };
      if (data?.listingId) router.push(`/listing/${data.listingId}`);
    });
    return () => sub.remove();
  }, []);

  if (!hydrated) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.colors.bg }}>
        <Loading />
      </View>
    );
  }

  if (isBlocked) {
    return (
      <SafeAreaProvider>
        <BlockedScreen />
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <QueryProvider>
        <StatusBar style="dark" />
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: theme.colors.bg } }}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="listing/[id]" options={{ headerShown: false }} />
          <Stack.Screen name="category/[id]" options={{ headerShown: true }} />
          <Stack.Screen name="auth/login" options={{ headerShown: false, animation: 'slide_from_bottom' }} />
          <Stack.Screen name="create-listing" options={{ headerShown: false }} />
          <Stack.Screen name="chat/[id]" options={{ headerShown: false }} />
          <Stack.Screen name="my-listings" options={{ headerShown: false }} />
        </Stack>
      </QueryProvider>
    </SafeAreaProvider>
  );
}
