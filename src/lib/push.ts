import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { api } from './api';
import { useAuth } from './auth';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function registerForPush(): Promise<string | null> {
  // Haqiqiy qurilma bo'lmasa (simulator/emulator) — push ishlamaydi
  if (!Device.isDevice) {
    console.log('[push] Simulator aniqlandi — push notifications ishlamaydi. Development build kerak.');
    return null;
  }

  try {
    const existing = await Notifications.getPermissionsAsync();
    let status = existing.status;
    if (status !== 'granted') {
      const req = await Notifications.requestPermissionsAsync();
      status = req.status;
    }
    if (status !== 'granted') {
      console.log('[push] Foydalanuvchi push ruxsatini bermadi');
      return null;
    }

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Standart',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#f47a1f',
      });
    }

    const projectId =
      Constants.expoConfig?.extra?.eas?.projectId as string | undefined
      ?? Constants.easConfig?.projectId;

    if (!projectId) {
      console.log('[push] EAS projectId topilmadi — expo-notifications SDK 53+ da projectId majburiy.');
      return null;
    }

    const resp = await Notifications.getExpoPushTokenAsync({ projectId });
    const token = resp.data;
    console.log('[push] Token:', token);
    useAuth.getState().setPushToken(token);
    await api.registerPushToken(token);
    return token;
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    console.log('[push] Xatolik:', msg);
    return null;
  }
}

export async function unregisterPush(): Promise<void> {
  const token = useAuth.getState().pushToken;
  if (token) {
    try { await api.removePushToken(token); } catch { /* ignore */ }
  }
  useAuth.getState().setPushToken(null);
}
