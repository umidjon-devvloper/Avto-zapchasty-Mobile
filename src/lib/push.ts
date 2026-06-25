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
let _registered = false;

export async function registerForPush(): Promise<string | null> {
  if (!Device.isDevice) return null;
  if (_registered || _registering) return null;
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
      ?? '204db17c-cd95-46b5-a16a-b668480776b0';

    const resp = await Notifications.getExpoPushTokenAsync({ projectId });
    const token = resp.data;
    console.log('[push] Token olindi:', token);
    useAuth.getState().setPushToken(token);
    try {
      await api.registerPushToken(token);
      console.log('[push] Token serverga yuborildi ✓');
    } catch (apiErr) {
      console.log('[push] Token serverga yuborishda xato:', apiErr);
    }
    _registered = true;
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
  _registered = false;
  _registering = false;
}
