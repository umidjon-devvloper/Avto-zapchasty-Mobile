import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import { FlatList, View, Text, Pressable, StyleSheet, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { api } from '../../src/lib/api';
import { useT } from '../../src/lib/i18n';
import { useColors } from '../../src/theme/useColors';
import { theme, s, ms } from '../../src/theme';
import { ListingCard } from '../../src/components/ListingCard';
import { Loading } from '../../src/components/Loading';
import { EmptyState } from '../../src/components/EmptyState';
import type { Listing } from '../../src/lib/types';

function memberSince(iso: string): string {
  return new Date(iso).toLocaleDateString('ru-RU', { year: 'numeric', month: 'long' });
}

function chunk<T>(arr: T[], n: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += n) out.push(arr.slice(i, i + n));
  return out;
}

export default function SellerProfile() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const t = useT();

  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ['seller-profile', id],
    queryFn: () => api.sellerProfile(id),
  });

  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteQuery({
    queryKey: ['seller-listings', id],
    queryFn: ({ pageParam }) =>
      api.search({ sellerId: id, sort: 'newest', page: pageParam, limit: 20 }),
    initialPageParam: 1,
    getNextPageParam: (last) => (last.page < last.pages ? last.page + 1 : undefined),
  });

  const items = data?.pages.flatMap((p) => p.items) ?? [];
  const rows = chunk<Listing>(items, 2);
  const shopName = profile?.sellerProfile?.shopName || profile?.name || t.seller.fallback;
  const initial = shopName.charAt(0).toUpperCase();

  return (
    <View style={[styles.root, { backgroundColor: colors.bg }]}>
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.brand} />

      <LinearGradient colors={theme.gradients.brand} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.header}>
        <SafeAreaView edges={['top']}>
          <View style={styles.headerRow}>
            <Pressable style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.7 }]} onPress={() => router.back()} hitSlop={10}>
              <Ionicons name="arrow-back" size={ms(20)} color="#fff" />
            </Pressable>
            <Text style={styles.headerTitle}>{t.seller.title}</Text>
            <View style={{ width: s(36) }} />
          </View>

          {!profileLoading && profile && (
            <View style={styles.profileRow}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{initial}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <View style={styles.nameRow}>
                  <Text style={styles.shopName} numberOfLines={1}>{shopName}</Text>
                  {profile.sellerProfile?.verified && (
                    <Ionicons name="shield-checkmark" size={ms(16)} color="#7fd4a0" />
                  )}
                </View>
                {profile.sellerProfile?.city ? (
                  <View style={styles.metaRow}>
                    <Ionicons name="location-outline" size={ms(12)} color="rgba(255,255,255,0.7)" />
                    <Text style={styles.metaText}>{profile.sellerProfile.city}</Text>
                  </View>
                ) : null}
                <Text style={styles.metaText}>{t.seller.member}: {memberSince(profile.createdAt)}</Text>
              </View>
              <View style={styles.countPill}>
                <Text style={styles.countNum}>{profile.activeListings}</Text>
                <Text style={styles.countLabel}>{t.seller.listingWord}</Text>
              </View>
            </View>
          )}
        </SafeAreaView>
      </LinearGradient>

      {isLoading || profileLoading ? (
        <Loading />
      ) : (
        <FlatList
          data={rows}
          keyExtractor={(_, i) => String(i)}
          renderItem={({ item: row }) => (
            <View style={styles.feedRow}>
              {row.map((it) => <ListingCard key={it._id} listing={it} variant="grid" />)}
              {row.length < 2 && <View style={{ flex: 1 }} />}
            </View>
          )}
          contentContainerStyle={styles.list}
          ListHeaderComponent={
            items.length > 0 ? (
              <Text style={[styles.sectionTitle, { color: colors.text }]}>{t.seller.sectionTitle}</Text>
            ) : null
          }
          ListEmptyComponent={<EmptyState icon="cube-outline" text={t.seller.empty} />}
          onEndReached={() => { if (hasNextPage && !isFetchingNextPage) fetchNextPage(); }}
          onEndReachedThreshold={0.5}
          ListFooterComponent={isFetchingNextPage ? <Loading /> : null}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { paddingHorizontal: s(16), paddingBottom: s(18), borderBottomLeftRadius: s(24), borderBottomRightRadius: s(24), ...theme.shadow.navy },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: s(6) },
  backBtn: { width: s(36), height: s(36), borderRadius: s(18), backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: ms(17), fontWeight: '800', color: '#fff' },

  profileRow: { flexDirection: 'row', alignItems: 'center', gap: s(12), marginTop: s(14) },
  avatar: {
    width: s(56), height: s(56), borderRadius: s(28),
    backgroundColor: 'rgba(255,255,255,0.16)', borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { fontSize: ms(22), fontWeight: '800', color: '#fff' },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: s(6) },
  shopName: { fontSize: ms(17), fontWeight: '800', color: '#fff', flexShrink: 1 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: s(3), marginTop: s(2) },
  metaText: { fontSize: ms(12), color: 'rgba(255,255,255,0.7)', fontWeight: '500', marginTop: s(1) },
  countPill: {
    backgroundColor: 'rgba(255,255,255,0.14)', borderRadius: theme.radius.lg,
    paddingHorizontal: s(14), paddingVertical: s(8), alignItems: 'center',
  },
  countNum: { fontSize: ms(17), fontWeight: '900', color: '#fff' },
  countLabel: { fontSize: ms(10.5), color: 'rgba(255,255,255,0.7)', fontWeight: '600' },

  list: { padding: theme.space.lg, gap: theme.space.md, flexGrow: 1 },
  sectionTitle: { fontSize: ms(16), fontWeight: '800', letterSpacing: -0.2, marginBottom: s(4) },
  feedRow: { flexDirection: 'row', gap: theme.space.md },
});
