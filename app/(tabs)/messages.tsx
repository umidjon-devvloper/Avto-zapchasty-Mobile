import { useCallback, useEffect, useState } from 'react';
import { FlatList, View, Text, Pressable, StyleSheet, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../../src/lib/api';
import { useAuth } from '../../src/lib/auth';
import { getSocket } from '../../src/lib/socket';
import { useT } from '../../src/lib/i18n';
import { useColors } from '../../src/theme/useColors';
import { theme, s, ms } from '../../src/theme';
import { resolveImage } from '../../src/lib/image';
import { Loading } from '../../src/components/Loading';
import { EmptyState } from '../../src/components/EmptyState';
import { AuthPrompt } from '../../src/components/AuthPrompt';

function shortTime(iso: string): string {
  const min = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (min < 1) return 'hozir';
  if (min < 60) return `${min} daq`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr} soat`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `${day} kun`;
  return new Date(iso).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
}

export default function Messages() {
  const colors = useColors();
  const t = useT();
  const qc = useQueryClient();
  const token = useAuth((s) => s.accessToken);
  const myId = useAuth((s) => s.user?._id ?? s.user?.id);
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['conversations'],
    queryFn: api.conversations,
    enabled: !!token,
  });

  // Spinner faqat foydalanuvchi qo'lda tortganda ko'rinadi
  // (isRefetching ishlatilsa, fon yangilanishlarida ham chiqib qotib qoladi)
  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try { await refetch(); } finally { setRefreshing(false); }
  }, [refetch]);

  useEffect(() => {
    if (!token) return;
    const socket = getSocket();
    if (!socket) return;
    const onUpdate = () => qc.invalidateQueries({ queryKey: ['conversations'] });
    socket.on('conversation:update', onUpdate);
    socket.on('message:new', onUpdate);
    return () => {
      socket.off('conversation:update', onUpdate);
      socket.off('message:new', onUpdate);
    };
  }, [token, qc]);

  if (!token) return <AuthPrompt text={t.messages.loginPrompt} />;

  const totalUnread = (data ?? []).reduce((s: number, c: any) => s + c.unread, 0);

  return (
    <View style={[styles.root, { backgroundColor: colors.bg }]}>
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.brand} />

      <LinearGradient colors={theme.gradients.brand} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.header}>
        <SafeAreaView edges={['top']}>
          <View style={styles.headerRow}>
            <View>
              <Text style={styles.headerTitle}>{t.messages.title}</Text>
              {totalUnread > 0 && <Text style={styles.headerSub}>{t.messages.unreadN(totalUnread)}</Text>}
            </View>
            {totalUnread > 0 && (
              <View style={[styles.unreadBadge, { backgroundColor: colors.primary }]}>
                <Text style={styles.unreadBadgeText}>{totalUnread}</Text>
              </View>
            )}
          </View>
        </SafeAreaView>
      </LinearGradient>

      {isLoading ? (
        <Loading />
      ) : (
        <FlatList
          data={data ?? []}
          keyExtractor={(c) => c._id}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => {
            const photo = item.listing?.photos?.[0];
            const isMine = item.lastMessage?.senderId === myId;
            const preview = item.lastMessage
              ? (isMine ? t.messages.you : '') + item.lastMessage.text
              : t.messages.started;
            const unread = item.unread > 0;
            const initial = (item.other?.shopName || item.other?.name || '?').charAt(0).toUpperCase();

            return (
              <Pressable
                style={({ pressed }) => [
                  styles.row,
                  { backgroundColor: colors.card, borderColor: colors.border },
                  unread && { borderColor: colors.primary + '30', backgroundColor: colors.primarySoft + 'a0' },
                  pressed && { opacity: 0.9, transform: [{ scale: 0.995 }] },
                ]}
                onPress={() => router.push(`/chat/${item._id}`)}
              >
                <View style={[
                  styles.thumb,
                  { backgroundColor: colors.brandSoft },
                  unread && { borderWidth: 2, borderColor: colors.primary },
                ]}>
                  {photo ? (
                    <Image source={{ uri: resolveImage(photo) }} style={styles.thumbImg} contentFit="cover" />
                  ) : (
                    <View style={[styles.thumbFallback, { backgroundColor: colors.brandSoft }]}>
                      <Text style={[styles.thumbInitial, { color: colors.ink }]}>{initial}</Text>
                    </View>
                  )}
                  {unread && <View style={[styles.onlineDot, { backgroundColor: colors.success, borderColor: colors.card }]} />}
                </View>

                <View style={styles.content}>
                  <View style={styles.topLine}>
                    <Text numberOfLines={1} style={[styles.name, { color: colors.text }, unread && { fontWeight: '800', color: colors.ink }]}>
                      {item.other?.shopName || item.other?.name || t.common.user}
                    </Text>
                    <Text style={[styles.time, { color: colors.faint }]}>
                      {item.lastMessage ? shortTime(item.lastMessage.at) : ''}
                    </Text>
                  </View>

                  {item.listing?.title ? (
                    <View style={styles.listingRow}>
                      <Ionicons name="pricetag-outline" size={ms(10)} color={colors.inkSoft} />
                      <Text numberOfLines={1} style={[styles.listingTitle, { color: colors.inkSoft }]}>{item.listing.title}</Text>
                    </View>
                  ) : null}

                  <View style={styles.bottomLine}>
                    <Text numberOfLines={1} style={[
                      styles.preview, { color: colors.muted },
                      unread && { color: colors.text, fontWeight: '600' },
                    ]}>
                      {preview}
                    </Text>
                    {unread && (
                      <View style={[styles.badge, { backgroundColor: colors.primary }]}>
                        <Text style={styles.badgeText}>{item.unread}</Text>
                      </View>
                    )}
                  </View>
                </View>

                <Ionicons name="chevron-forward" size={ms(15)} color={colors.faint} style={styles.chevron} />
              </Pressable>
            );
          }}
          contentContainerStyle={styles.list}
          ListEmptyComponent={<EmptyState icon="chatbubbles-outline" text={t.messages.empty} />}
          refreshing={refreshing}
          onRefresh={onRefresh}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { paddingHorizontal: s(16), paddingBottom: s(20), borderBottomLeftRadius: s(24), borderBottomRightRadius: s(24), ...theme.shadow.navy },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: s(6) },
  headerTitle: { fontSize: ms(24), fontWeight: '800', color: '#fff', letterSpacing: -0.3 },
  headerSub: { fontSize: ms(12), color: 'rgba(255,255,255,0.65)', marginTop: s(3), fontWeight: '500' },
  unreadBadge: { width: s(34), height: s(34), borderRadius: s(17), alignItems: 'center', justifyContent: 'center', ...theme.shadow.brand },
  unreadBadgeText: { fontSize: ms(14), fontWeight: '800', color: '#fff' },

  list: { padding: s(16), gap: s(10), flexGrow: 1 },
  row: { flexDirection: 'row', alignItems: 'center', borderRadius: theme.radius.xl, borderWidth: 1, padding: s(12), gap: s(12), ...theme.shadow.sm },

  thumb: { width: s(58), height: s(58), borderRadius: theme.radius.lg, overflow: 'hidden' },
  thumbImg: { width: '100%', height: '100%' },
  thumbFallback: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  thumbInitial: { fontSize: ms(22), fontWeight: '800' },
  onlineDot: { position: 'absolute', right: s(3), bottom: s(3), width: s(12), height: s(12), borderRadius: s(6), borderWidth: 2 },

  content: { flex: 1, gap: s(3) },
  topLine: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: s(8) },
  name: { fontSize: ms(15), fontWeight: '700', flex: 1 },
  time: { fontSize: ms(11.5), fontWeight: '500' },

  listingRow: { flexDirection: 'row', alignItems: 'center', gap: s(4) },
  listingTitle: { fontSize: ms(11.5), fontWeight: '600', flex: 1 },

  bottomLine: { flexDirection: 'row', alignItems: 'center', gap: s(8) },
  preview: { fontSize: ms(13), flex: 1 },
  badge: { minWidth: s(20), height: s(20), borderRadius: s(10), alignItems: 'center', justifyContent: 'center', paddingHorizontal: s(6), ...theme.shadow.brand },
  badgeText: { color: '#fff', fontSize: ms(11), fontWeight: '800' },
  chevron: { marginLeft: 2 },
});
