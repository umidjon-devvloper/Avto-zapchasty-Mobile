import { useEffect } from 'react';
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
  const qc = useQueryClient();
  const token = useAuth((s) => s.accessToken);
  const myId = useAuth((s) => s.user?._id ?? s.user?.id);
  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['conversations'],
    queryFn: api.conversations,
    enabled: !!token,
  });

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

  if (!token) return <AuthPrompt text="Xabarlarni ko'rish uchun tizimga kiring" />;

  const totalUnread = (data ?? []).reduce((s: number, c: any) => s + c.unread, 0);

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.brand} />

      {/* Gradient header */}
      <LinearGradient
        colors={theme.gradients.brand}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <SafeAreaView edges={['top']}>
          <View style={styles.headerRow}>
            <View>
              <Text style={styles.headerTitle}>Xabarlar</Text>
              {totalUnread > 0 && (
                <Text style={styles.headerSub}>{totalUnread} ta o'qilmagan xabar</Text>
              )}
            </View>
            {totalUnread > 0 && (
              <View style={styles.unreadBadge}>
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
              ? (isMine ? 'Siz: ' : '') + item.lastMessage.text
              : 'Suhbat boshlandi';
            const unread = item.unread > 0;
            const initial = (item.other?.shopName || item.other?.name || '?').charAt(0).toUpperCase();

            return (
              <Pressable
                style={({ pressed }) => [
                  styles.row,
                  unread && styles.rowUnread,
                  pressed && { opacity: 0.9, transform: [{ scale: 0.995 }] },
                ]}
                onPress={() => router.push(`/chat/${item._id}`)}
              >
                {/* Thumb */}
                <View style={[styles.thumb, unread && styles.thumbUnread]}>
                  {photo ? (
                    <Image
                      source={{ uri: resolveImage(photo) }}
                      style={styles.thumbImg}
                      contentFit="cover"
                    />
                  ) : (
                    <View style={styles.thumbFallback}>
                      <Text style={styles.thumbInitial}>{initial}</Text>
                    </View>
                  )}
                  {unread && <View style={styles.onlineDot} />}
                </View>

                <View style={styles.content}>
                  <View style={styles.topLine}>
                    <Text numberOfLines={1} style={[styles.name, unread && styles.nameUnread]}>
                      {item.other?.shopName || item.other?.name || 'Foydalanuvchi'}
                    </Text>
                    <Text style={styles.time}>
                      {item.lastMessage ? shortTime(item.lastMessage.at) : ''}
                    </Text>
                  </View>

                  {item.listing?.title ? (
                    <View style={styles.listingRow}>
                      <Ionicons name="pricetag-outline" size={ms(10)} color={theme.colors.brand} />
                      <Text numberOfLines={1} style={styles.listingTitle}>{item.listing.title}</Text>
                    </View>
                  ) : null}

                  <View style={styles.bottomLine}>
                    <Text numberOfLines={1} style={[styles.preview, unread && styles.previewUnread]}>
                      {preview}
                    </Text>
                    {unread && (
                      <View style={styles.badge}>
                        <Text style={styles.badgeText}>{item.unread}</Text>
                      </View>
                    )}
                  </View>
                </View>

                <Ionicons
                  name="chevron-forward"
                  size={ms(15)}
                  color={theme.colors.faint}
                  style={styles.chevron}
                />
              </Pressable>
            );
          }}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <EmptyState icon="chatbubbles-outline" text="Hozircha xabarlar yo'q" />
          }
          refreshing={isRefetching}
          onRefresh={refetch}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.colors.bg },

  header: {
    paddingHorizontal: s(16),
    paddingBottom: s(20),
    borderBottomLeftRadius: s(24),
    borderBottomRightRadius: s(24),
    ...theme.shadow.navy,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: s(6),
  },
  headerTitle: { fontSize: ms(24), fontWeight: '800', color: '#fff', letterSpacing: -0.3 },
  headerSub: { fontSize: ms(12), color: 'rgba(255,255,255,0.65)', marginTop: s(3), fontWeight: '500' },
  unreadBadge: {
    width: s(34),
    height: s(34),
    borderRadius: s(17),
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.shadow.brand,
  },
  unreadBadgeText: { fontSize: ms(14), fontWeight: '800', color: '#fff' },

  list: { padding: s(16), gap: s(10), flexGrow: 1 },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.xl,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: s(12),
    gap: s(12),
    ...theme.shadow.sm,
  },
  rowUnread: {
    borderColor: theme.colors.primary + '30',
    backgroundColor: theme.colors.primarySoft + 'a0',
  },

  thumb: {
    width: s(58),
    height: s(58),
    borderRadius: theme.radius.lg,
    overflow: 'hidden',
    backgroundColor: theme.colors.brandSoft,
  },
  thumbUnread: { borderWidth: 2, borderColor: theme.colors.primary },
  thumbImg: { width: '100%', height: '100%' },
  thumbFallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.brandSoft,
  },
  thumbInitial: { fontSize: ms(22), fontWeight: '800', color: theme.colors.brand },
  onlineDot: {
    position: 'absolute',
    right: s(3),
    bottom: s(3),
    width: s(12),
    height: s(12),
    borderRadius: s(6),
    backgroundColor: theme.colors.success,
    borderWidth: 2,
    borderColor: theme.colors.card,
  },

  content: { flex: 1, gap: s(3) },
  topLine: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: s(8) },
  name: { fontSize: ms(15), fontWeight: '700', color: theme.colors.text, flex: 1 },
  nameUnread: { fontWeight: '800', color: theme.colors.ink },
  time: { fontSize: ms(11.5), color: theme.colors.faint, fontWeight: '500' },

  listingRow: { flexDirection: 'row', alignItems: 'center', gap: s(4) },
  listingTitle: { fontSize: ms(11.5), color: theme.colors.brand, fontWeight: '600', flex: 1 },

  bottomLine: { flexDirection: 'row', alignItems: 'center', gap: s(8) },
  preview: { fontSize: ms(13), color: theme.colors.muted, flex: 1 },
  previewUnread: { color: theme.colors.text, fontWeight: '600' },
  badge: {
    minWidth: s(20),
    height: s(20),
    borderRadius: s(10),
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: s(6),
    ...theme.shadow.brand,
  },
  badgeText: { color: '#fff', fontSize: ms(11), fontWeight: '800' },
  chevron: { marginLeft: 2 },
});
