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
import { useNotificationStore } from '../src/lib/notificationStore';
import { Loading } from '../src/components/Loading';
import { BlockedScreen } from '../src/components/BlockedScreen';
import { useColors, useScheme } from '../src/theme/useColors';

export default function RootLayout() {
  const hydrated = useAuthHydrated();
  const accessToken = useAuth((s) => s.accessToken);
  const isBlocked = useAuth((s) => s.isBlocked);
  const setBlocked = useAuth((s) => s.setBlocked);
  const setUser = useAuth((s) => s.setUser);
  const colors = useColors();
  const scheme = useScheme();
  const addNotification = useNotificationStore((s) => s.addNotification);

  useEffect(() => {
    if (!accessToken) return;
    registerForPush();
    api.me()
      .then((u) => {
        setUser(u);
        if (u.blocked) setBlocked(true);
      })
      .catch(() => {});
  }, [accessToken]);

  useEffect(() => {
    // Ilova foreground'da notification kelganda saqlash
    const receiveSub = Notifications.addNotificationReceivedListener((notif) => {
      const { title, body, data } = notif.request.content;
      if (title || body) {
        addNotification({
          title: title ?? '',
          body: body ?? '',
          data: (data ?? {}) as Record<string, unknown>,
        });
      }
    });

    // Notification bosilganda sahifaga o'tish
    const tapSub = Notifications.addNotificationResponseReceivedListener((resp) => {
      const { title, body, data } = resp.notification.request.content;
      const d = (data ?? {}) as Record<string, unknown>;
      if (title || body) {
        addNotification({ title: title ?? '', body: body ?? '', data: d });
      }
      if (d?.listingId) router.push(`/listing/${d.listingId}`);
    });

    return () => {
      receiveSub.remove();
      tapSub.remove();
    };
  }, []);

  if (!hydrated) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg }}>
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
        <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg }, headerBackTitle: '' }}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="listing/[id]" options={{ headerShown: false }} />
          <Stack.Screen name="category/[id]" options={{ headerShown: false }} />
          <Stack.Screen name="auth/login" options={{ headerShown: false, animation: 'slide_from_bottom' }} />
          <Stack.Screen name="create-listing" options={{ headerShown: false }} />
          <Stack.Screen name="chat/[id]" options={{ headerShown: false }} />
          <Stack.Screen name="my-listings" options={{ headerShown: false }} />
          <Stack.Screen name="notifications" options={{ headerShown: false }} />
        </Stack>
      </QueryProvider>
    </SafeAreaProvider>
  );
}
