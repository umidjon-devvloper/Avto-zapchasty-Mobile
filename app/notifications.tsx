import { useCallback } from 'react';
import { View, Text, FlatList, Pressable, StyleSheet, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { setStatusBarStyle } from 'expo-status-bar';
import { useFocusEffect, router } from 'expo-router';
import { useNotificationStore, type AppNotification } from '../src/lib/notificationStore';
import { useColors } from '../src/theme/useColors';
import { theme, s, ms } from '../src/theme';
import { useT, timeAgoT } from '../src/lib/i18n';
import { EmptyState } from '../src/components/EmptyState';

function NotifIcon({ data }: { data?: Record<string, unknown> }) {
  const colors = useColors();
  const type = data?.type as string | undefined;
  const icon =
    type === 'listing_approved' ? 'checkmark-circle' :
    type === 'listing_rejected' ? 'close-circle' :
    type === 'broadcast' ? 'megaphone' :
    (type === 'new_message' || type === 'message') ? 'chatbubble' :
    'notifications';
  const color =
    type === 'listing_approved' ? colors.success :
    type === 'listing_rejected' ? colors.danger :
    colors.primary;
  return (
    <View style={[styles.iconWrap, { backgroundColor: color + '1a' }]}>
      <Ionicons name={icon} size={ms(22)} color={color} />
    </View>
  );
}

export default function NotificationsScreen() {
  const colors = useColors();
  const t = useT();
  const { notifications, markAllRead, markRead, clear } = useNotificationStore();
  const unread = notifications.filter((n) => !n.read).length;

  useFocusEffect(useCallback(() => {
    setStatusBarStyle('light');
    return () => setStatusBarStyle('dark');
  }, []));

  useFocusEffect(useCallback(() => {
    const t = setTimeout(() => markAllRead(), 1500);
    return () => clearTimeout(t);
  }, [markAllRead]));

  const handlePress = (n: AppNotification) => {
    markRead(n.id);
    const conversationId = n.data?.conversationId as string | undefined;
    const listingId = n.data?.listingId as string | undefined;
    if (conversationId) router.push(`/chat/${conversationId}`);
    else if (listingId) router.push(`/listing/${listingId}`);
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.bg }]}>
      <StatusBar barStyle="light-content" />
      <LinearGradient
        colors={theme.gradients.brand}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <SafeAreaView edges={['top']}>
          <View style={styles.headerRow}>
            <View>
              <Text style={styles.headerTitle}>{t.notifications.title}</Text>
              {unread > 0 && (
                <Text style={styles.headerSub}>{t.notifications.newN(unread)}</Text>
              )}
            </View>
            {notifications.length > 0 && (
              <Pressable
                style={({ pressed }) => [styles.clearBtn, pressed && { opacity: 0.7 }]}
                onPress={clear}
                hitSlop={8}
              >
                <Text style={styles.clearText}>{t.notifications.clear}</Text>
              </Pressable>
            )}
          </View>
        </SafeAreaView>
      </LinearGradient>

      <FlatList
        data={notifications}
        keyExtractor={(n) => n.id}
        contentContainerStyle={[styles.list, notifications.length === 0 && { flex: 1 }]}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <EmptyState icon="notifications-off-outline" text={t.notifications.empty} />
        }
        renderItem={({ item: n }) => (
          <Pressable
            style={({ pressed }) => [
              styles.card,
              { backgroundColor: colors.card, borderColor: colors.border },
              !n.read && { borderLeftColor: colors.primary, borderLeftWidth: 3 },
              pressed && { opacity: 0.85 },
            ]}
            onPress={() => handlePress(n)}
          >
            <NotifIcon data={n.data} />
            <View style={styles.content}>
              <Text style={[styles.title, { color: colors.text }, !n.read && { color: colors.ink }]}>
                {n.title}
              </Text>
              {!!n.body && (
                <Text style={[styles.body, { color: colors.muted }]} numberOfLines={2}>
                  {n.body}
                </Text>
              )}
              <Text style={[styles.time, { color: colors.faint }]}>{timeAgoT(n.receivedAt, t)}</Text>
            </View>
            {!n.read && <View style={[styles.dot, { backgroundColor: colors.primary }]} />}
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    paddingHorizontal: s(16), paddingBottom: s(18),
    borderBottomLeftRadius: s(28), borderBottomRightRadius: s(28),
    ...theme.shadow.navy,
  },
  headerRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', paddingTop: s(6) },
  headerTitle: { fontSize: ms(22), fontWeight: '800', color: '#fff', letterSpacing: -0.3 },
  headerSub: { fontSize: ms(12), color: 'rgba(255,255,255,0.65)', marginTop: s(3) },
  clearBtn: { paddingHorizontal: s(12), paddingVertical: s(6), borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.15)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
  clearText: { fontSize: ms(12), fontWeight: '700', color: '#fff' },
  list: { padding: s(16), gap: s(10) },
  card: {
    flexDirection: 'row', alignItems: 'flex-start', gap: s(12),
    borderRadius: theme.radius.xl, borderWidth: 1,
    padding: s(14), ...theme.shadow.sm,
  },
  iconWrap: { width: s(44), height: s(44), borderRadius: theme.radius.lg, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  content: { flex: 1, gap: s(3) },
  title: { fontSize: ms(14.5), fontWeight: '600', lineHeight: ms(20) },
  body: { fontSize: ms(13), lineHeight: ms(18) },
  time: { fontSize: ms(11.5), fontWeight: '500', marginTop: s(2) },
  dot: { width: s(8), height: s(8), borderRadius: s(4), marginTop: s(4), flexShrink: 0 },
});
