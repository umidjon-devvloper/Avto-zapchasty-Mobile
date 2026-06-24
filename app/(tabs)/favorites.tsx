import { useQuery } from '@tanstack/react-query';
import {
  View, Text, ScrollView, StyleSheet, Pressable, RefreshControl, StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { api } from '../../src/lib/api';
import { useAuth } from '../../src/lib/auth';
import { theme, s, ms } from '../../src/theme';
import { ListingCard } from '../../src/components/ListingCard';
import { Loading } from '../../src/components/Loading';
import { AuthPrompt } from '../../src/components/AuthPrompt';
import type { Listing } from '../../src/lib/types';

function chunk<T>(arr: T[], n: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += n) out.push(arr.slice(i, i + n));
  return out;
}

export default function Favorites() {
  const token = useAuth((s) => s.accessToken);
  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['favorites'],
    queryFn: api.favorites,
    enabled: !!token,
  });

  if (!token) return <AuthPrompt text="Saralangan e'lonlarni ko'rish uchun tizimga kiring" />;

  const items = data ?? [];

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.brand} />

      <LinearGradient
        colors={theme.gradients.brand}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <SafeAreaView edges={['top']}>
          <View style={styles.headerRow}>
            <View>
              <Text style={styles.headerTitle}>Saralangan</Text>
              <Text style={styles.headerSub}>
                {items.length > 0 ? `${items.length} ta saqlangan e'lon` : 'Yoqtirgan e\'lonlaringiz'}
              </Text>
            </View>
            {items.length > 0 && (
              <View style={styles.heartWrap}>
                <Ionicons name="heart" size={ms(22)} color={theme.colors.danger} />
                <Text style={styles.heartCount}>{items.length}</Text>
              </View>
            )}
          </View>
        </SafeAreaView>
      </LinearGradient>

      {isLoading ? (
        <Loading />
      ) : items.length === 0 ? (
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={theme.colors.brand} />
          }
        >
          <EmptyFavorites />
        </ScrollView>
      ) : (
        <ScrollView
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={theme.colors.brand} />
          }
        >
          {chunk<Listing>(items, 2).map((row, i) => (
            <View key={i} style={styles.row}>
              {row.map((it) => <ListingCard key={it._id} listing={it} variant="grid" />)}
              {row.length < 2 && <View style={{ flex: 1 }} />}
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

function EmptyFavorites() {
  return (
    <View style={styles.empty}>
      <LinearGradient
        colors={[theme.colors.dangerSoft, '#ffe5e5']}
        style={styles.emptyIconWrap}
      >
        <Ionicons name="heart-outline" size={ms(44)} color={theme.colors.danger} />
      </LinearGradient>
      <Text style={styles.emptyTitle}>Hali hech narsa yo'q</Text>
      <Text style={styles.emptyText}>
        Yoqqan e'lonlarni yurakcha belgisi bilan saqlang — ular shu yerda paydo bo'ladi
      </Text>
      <Pressable
        style={({ pressed }) => [styles.browseBtn, pressed && { opacity: 0.88 }]}
        onPress={() => router.push('/search')}
      >
        <LinearGradient
          colors={theme.gradients.brand}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.browseFill}
        >
          <Ionicons name="search" size={ms(17)} color="#fff" />
          <Text style={styles.browseText}>E'lonlarni ko'rish</Text>
        </LinearGradient>
      </Pressable>
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
  heartWrap: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    borderRadius: theme.radius.lg,
    paddingHorizontal: s(12),
    paddingVertical: s(8),
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(6),
  },
  heartCount: { fontSize: ms(16), fontWeight: '800', color: '#fff' },

  list: {
    paddingHorizontal: theme.space.lg,
    paddingTop: s(16),
    paddingBottom: theme.space.xl,
    gap: theme.space.md,
  },
  row: { flexDirection: 'row', gap: theme.space.md },

  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: s(40), gap: s(16) },
  emptyIconWrap: {
    width: s(96),
    height: s(96),
    borderRadius: s(32),
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: { fontSize: ms(20), fontWeight: '800', color: theme.colors.text, letterSpacing: -0.3 },
  emptyText: {
    fontSize: ms(14),
    color: theme.colors.muted,
    textAlign: 'center',
    lineHeight: ms(21),
    maxWidth: s(280),
  },
  browseBtn: {
    borderRadius: theme.radius.lg,
    overflow: 'hidden',
    marginTop: s(4),
    ...theme.shadow.navy,
  },
  browseFill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(8),
    paddingHorizontal: s(28),
    height: s(52),
  },
  browseText: { color: '#fff', fontWeight: '800', fontSize: ms(15) },
});
