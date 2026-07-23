import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface AppNotification {
  id: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  receivedAt: string;
  read: boolean;
}

interface NotificationState {
  notifications: AppNotification[];
  addNotification: (n: Omit<AppNotification, 'id' | 'receivedAt' | 'read'>) => void;
  markAllRead: () => void;
  markRead: (id: string) => void;
  clear: () => void;
}

export const useNotificationStore = create<NotificationState>()(
  persist(
    (set) => ({
      notifications: [],
      addNotification: (n) =>
        set((s) => {
          // Dublikatni oldini olish: oxirgi bildirishnoma bir xil bo'lsa (foreground'da
          // kelib keyin bosilganda ikkita yozuv paydo bo'lardi) qayta qo'shmaymiz.
          const last = s.notifications[0];
          if (last && last.title === n.title && last.body === n.body &&
              Date.now() - new Date(last.receivedAt).getTime() < 10000) {
            return s;
          }
          return {
            notifications: [
              {
                ...n,
                id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
                receivedAt: new Date().toISOString(),
                read: false,
              },
              ...s.notifications.slice(0, 99),
            ],
          };
        }),
      markAllRead: () =>
        set((s) => ({ notifications: s.notifications.map((n) => ({ ...n, read: true })) })),
      markRead: (id) =>
        set((s) => ({ notifications: s.notifications.map((n) => n.id === id ? { ...n, read: true } : n) })),
      clear: () => set({ notifications: [] }),
    }),
    { name: 'app-notifications', storage: createJSONStorage(() => AsyncStorage) }
  )
);
