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

let _registering = false;

export async function registerForPush(): Promise<string | null> {
  if (!Device.isDevice) return null;
  if (_registering) return null;
  _registering = true;

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

    const projectId: string =
      (Constants.expoConfig?.extra?.eas?.projectId as string | undefined)
      ?? Constants.easConfig?.projectId
      ?? 'd329bab0-e7ac-4ec0-a5e4-c06806ae69ae';

    const resp = await Notifications.getExpoPushTokenAsync({ projectId });
    const token = resp.data;
    console.log('[push] Token olindi:', token);
    useAuth.getState().setPushToken(token);
    // Har chaqiruvda serverga yuboramiz — login o'zgarsa token yangi userga bog'lanishi uchun.
    // (Avval faqat bir marta yuborilar, mehmon holatidagi token userga bog'lanmay qolardi.)
    try {
      await api.registerPushToken(token);
      console.log('[push] Token serverga yuborildi ✓');
    } catch (apiErr) {
      console.log('[push] Token serverga yuborishda xato:', apiErr);
    }
    return token;
  } catch (e: unknown) {
    console.log('[push] registerForPush xato:', e);
    return null;
  } finally {
    _registering = false;
  }
}

export async function unregisterPush(): Promise<void> {
  const token = useAuth.getState().pushToken;
  if (token) {
    try { await api.removePushToken(token); } catch { /* ignore */ }
  }
  useAuth.getState().setPushToken(null);
  _registering = false;
}
