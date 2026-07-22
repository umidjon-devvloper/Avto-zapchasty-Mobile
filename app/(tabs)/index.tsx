import { useQuery } from '@tanstack/react-query';
import { ScrollView, View, Text, Pressable, StyleSheet, FlatList, NativeSyntheticEvent, NativeScrollEvent, RefreshControl } from 'react-native';
import { useCallback, useRef, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { setStatusBarStyle } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { api } from '../../src/lib/api';
import { useT, useLocalize } from '../../src/lib/i18n';
import { useColors, useScheme } from '../../src/theme/useColors';
import { theme, s, ms } from '../../src/theme';
import { Wordmark, LogoMark } from '../../src/components/Brand';
import { ListingCard } from '../../src/components/ListingCard';
import { useLocationStore } from '../../src/lib/location';
import { Loading } from '../../src/components/Loading';
import { categoryIcon } from '../../src/lib/category-icons';
import type { Brand, Listing, PartCategory } from '../../src/lib/types';

function chunk<T>(arr: T[], n: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += n) out.push(arr.slice(i, i + n));
  return out;
}

function CategoryRow({ categories }: { categories: PartCategory[] }) {
  const colors = useColors();
  const scheme = useScheme();
  const lz = useLocalize();
  // Ikki tonli premium sxema — navy va amber (accent) almashib turadi
  const tones = scheme === 'dark'
    ? [
        { grad: ['rgba(120,150,255,0.20)', 'rgba(80,110,220,0.08)'] as const, icon: colors.ink },
        { grad: ['rgba(244,122,31,0.20)', 'rgba(244,122,31,0.08)'] as const, icon: colors.primary },
      ]
    : [
        { grad: [colors.brandSoft, colors.brandSoftAlt] as const, icon: colors.brand },
        { grad: [colors.primarySoft, '#ffe4c7'] as const, icon: colors.primary },
      ];

  return (
    <FlatList
      data={categories}
      horizontal
      showsHorizontalScrollIndicator={false}
      keyExtractor={(c) => c._id}
      contentContainerStyle={styles.catRow}
      ItemSeparatorComponent={() => <View style={{ width: s(10) }} />}
      renderItem={({ item: c, index }) => {
        const tone = tones[index % tones.length];
        return (
          <Pressable
            style={({ pressed }) => [
              styles.catCard,
              { backgroundColor: colors.card, borderColor: colors.border },
              pressed && { opacity: 0.82, transform: [{ scale: 0.95 }] },
            ]}
            onPress={() =>
              router.push({ pathname: '/category/[id]', params: { id: c._id, name: lz(c.name), slug: c.slug } })
            }
          >
            <LinearGradient colors={tone.grad} style={styles.catIconWrap}>
              <Ionicons name={categoryIcon(c.slug)} size={ms(22)} color={tone.icon} />
            </LinearGradient>
            <Text numberOfLines={2} style={[styles.catName, { color: colors.text }]}>
              {lz(c.name)}
            </Text>
          </Pressable>
        );
      }}
    />
  );
}

export default function Home() {
  const colors = useColors();
  const t = useT();
  const { data: categories, isLoading, refetch: refetchCategories } = useQuery({ queryKey: ['categories'], queryFn: api.categories });
  const { data: brands, refetch: refetchBrands } = useQuery({ queryKey: ['brands-popular'], queryFn: () => api.brands(true) });
  const { data: latest, isLoading: latestLoading, refetch: refetchLatest } = useQuery({
    queryKey: ['latest-listings'],
    queryFn: () => api.search({ sort: 'newest', limit: 10, page: 1 }),
  });

  // Yaqin-atrofdagi e'lonlar — joylashuv ruxsati berilgan bo'lsa
  const coords = useLocationStore((st) => st.coords);
  const { data: nearby, refetch: refetchNearby } = useQuery({
    queryKey: ['nearby-listings', coords?.lat, coords?.lng],
    queryFn: () => api.nearby(coords!.lat, coords!.lng, 10),
    enabled: !!coords,
  });
  const nearbyItems = nearby?.items ?? [];

  const latestItems = latest?.items ?? [];

  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([refetchCategories(), refetchBrands(), refetchLatest(), refetchNearby()]);
    } finally {
      setRefreshing(false);
    }
  }, [refetchCategories, refetchBrands, refetchLatest, refetchNearby]);

  const scrolledPastHero = useRef(false);

  useFocusEffect(useCallback(() => {
    setStatusBarStyle('light');
    scrolledPastHero.current = false;
    return () => setStatusBarStyle('dark');
  }, []));

  const onScroll = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const past = e.nativeEvent.contentOffset.y > s(150);
    if (past !== scrolledPastHero.current) {
      scrolledPastHero.current = past;
      setStatusBarStyle(past ? 'dark' : 'light');
    }
  }, []);

  return (
    <View style={[styles.root, { backgroundColor: colors.bg }]}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={32}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#fff"
            colors={[theme.colors.brand]}
            progressBackgroundColor="#fff"
          />
        }
      >
        <LinearGradient colors={theme.gradients.brand} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.hero}>
          <SafeAreaView edges={['top']}>
            <View style={styles.heroTop}>
              <View style={styles.logoRow}>
                <LogoMark size={s(40)} />
                <View>
                  <Wordmark size={ms(19)} light />
                  <Text style={styles.heroTagline}>{t.home.tagline}</Text>
                </View>
              </View>
              <Pressable
                style={({ pressed }) => [styles.notifBtn, pressed && { opacity: 0.8 }]}
                onPress={() => router.push('/messages')}
              >
                <Ionicons name="notifications-outline" size={ms(20)} color="#fff" />
              </Pressable>
            </View>

            <Text style={styles.heroTitle}>{t.home.heroTitle}</Text>

            <Pressable
              style={({ pressed }) => [styles.searchBar, { backgroundColor: colors.card }, pressed && { opacity: 0.96 }]}
              onPress={() => router.push('/search')}
            >
              <View style={[styles.searchIcon, { backgroundColor: colors.primarySoft }]}>
                <Ionicons name="search" size={ms(17)} color={colors.primary} />
              </View>
              <Text style={[styles.searchText, { color: colors.muted }]}>{t.home.searchPlaceholder}</Text>
              <View style={[styles.searchArrow, { backgroundColor: colors.surface }]}>
                <Ionicons name="arrow-forward" size={ms(15)} color={colors.muted} />
              </View>
            </Pressable>
          </SafeAreaView>
        </LinearGradient>

        {brands && brands.length > 0 && (
          <View>
            <SectionHeader title={t.home.popularBrands} colors={colors} />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.brandRow}>
              {brands.map((b: Brand) => (
                <Pressable
                  key={b._id}
                  style={({ pressed }) => [
                    styles.brandChip,
                    { backgroundColor: colors.card, borderColor: colors.border },
                    pressed && { opacity: 0.82 },
                  ]}
                  onPress={() => router.push({ pathname: '/search', params: { brandId: b._id, title: b.name } })}
                >
                  <Text style={[styles.brandChipText, { color: colors.ink }]}>{b.name}</Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        )}

        <View>
          <SectionHeader
            title={t.home.categories}
            actionLabel={t.home.viewAll}
            onAction={() => router.push('/search')}
            colors={colors}
          />
          {isLoading ? (
            <Loading />
          ) : (
            <CategoryRow categories={categories ?? []} />
          )}
        </View>

        {nearbyItems.length > 0 && (
          <View>
            <SectionHeader
              title={nearby?.tier === 'city' ? t.home.nearbyCity : t.home.nearby}
              colors={colors}
            />
            <View style={styles.feed}>
              {chunk<Listing>(nearbyItems, 2).map((row, i) => (
                <View key={i} style={styles.feedRow}>
                  {row.map((it) => <ListingCard key={it._id} listing={it} variant="grid" />)}
                  {row.length < 2 && <View style={{ flex: 1 }} />}
                </View>
              ))}
            </View>
          </View>
        )}

        <View>
          <SectionHeader
            title={t.home.latest}
            actionLabel={t.home.viewAll}
            onAction={() => router.push('/search')}
            colors={colors}
          />
          {latestLoading ? (
            <Loading />
          ) : latestItems.length === 0 ? (
            <Text style={[styles.emptyHint, { color: colors.muted }]}>{t.home.noListings}</Text>
          ) : (
            <View style={styles.feed}>
              {chunk<Listing>(latestItems, 2).map((row, i) => (
                <View key={i} style={styles.feedRow}>
                  {row.map((it) => <ListingCard key={it._id} listing={it} variant="grid" />)}
                  {row.length < 2 && <View style={{ flex: 1 }} />}
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

function SectionHeader({
  title, actionLabel, onAction, colors,
}: {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
  colors: ReturnType<typeof useColors>;
}) {
  return (
    <View style={styles.sectionHead}>
      <View style={styles.sectionTitleRow}>
        <View style={[styles.sectionAccent, { backgroundColor: colors.primary }]} />
        <Text style={[styles.sectionTitle, { color: colors.text }]}>{title}</Text>
      </View>
      {actionLabel && onAction ? (
        <Pressable style={({ pressed }) => [styles.seeAll, pressed && { opacity: 0.6 }]} onPress={onAction} hitSlop={8}>
          <Text style={[styles.seeAllText, { color: colors.primaryDark }]}>{actionLabel}</Text>
          <Ionicons name="chevron-forward" size={ms(14)} color={colors.primaryDark} />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  hero: {
    paddingHorizontal: s(16), paddingBottom: s(28),
    borderBottomLeftRadius: s(32), borderBottomRightRadius: s(32), ...theme.shadow.navy,
  },
  heroTop: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingTop: s(6), paddingBottom: s(16),
  },
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: s(10) },
  heroTagline: { fontSize: ms(11), color: 'rgba(255,255,255,0.65)', marginTop: s(2), fontWeight: '500' },
  notifBtn: {
    width: s(38), height: s(38), borderRadius: s(19),
    backgroundColor: 'rgba(255,255,255,0.12)', borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)', alignItems: 'center', justifyContent: 'center',
  },
  heroTitle: {
    fontSize: ms(24), fontWeight: '800', color: '#fff',
    lineHeight: ms(31), letterSpacing: -0.4, marginBottom: s(16),
  },
  searchBar: {
    flexDirection: 'row', alignItems: 'center', gap: s(10),
    borderRadius: theme.radius.xl, paddingRight: s(14), paddingLeft: s(6), height: s(54), ...theme.shadow.md,
  },
  searchIcon: { width: s(38), height: s(38), borderRadius: theme.radius.lg, alignItems: 'center', justifyContent: 'center' },
  searchText: { fontSize: ms(14.5), flex: 1 },
  searchArrow: { width: s(30), height: s(30), borderRadius: s(15), alignItems: 'center', justifyContent: 'center' },

  scroll: { paddingBottom: s(32), gap: s(8) },
  brandRow: { gap: s(8), paddingHorizontal: s(16), paddingVertical: s(4) },
  brandChip: {
    borderWidth: 1.5, paddingHorizontal: s(16), paddingVertical: s(10),
    borderRadius: 999, ...theme.shadow.sm,
  },
  brandChipText: { fontWeight: '800', fontSize: ms(13) },

  catRow: { paddingHorizontal: s(16), paddingVertical: s(4) },
  catCard: {
    width: s(88),
    borderRadius: theme.radius.xl,
    borderWidth: 1,
    paddingVertical: s(10),
    paddingHorizontal: s(6),
    alignItems: 'center',
    gap: s(6),
    ...theme.shadow.sm,
  },
  catIconWrap: {
    width: s(44), height: s(44), borderRadius: theme.radius.lg,
    alignItems: 'center', justifyContent: 'center',
  },
  catName: { fontSize: ms(11), fontWeight: '700', textAlign: 'center', lineHeight: ms(14) },

  sectionHead: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: theme.space.lg, marginTop: s(22), marginBottom: s(12),
  },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: s(8) },
  sectionAccent: { width: s(4), height: s(18), borderRadius: 2 },
  sectionTitle: { fontSize: ms(17), fontWeight: '800', letterSpacing: -0.3 },
  seeAll: { flexDirection: 'row', alignItems: 'center', gap: s(2) },
  seeAllText: { fontSize: ms(13.5), fontWeight: '700' },

  feed: { paddingHorizontal: theme.space.lg, gap: theme.space.md },
  feedRow: { flexDirection: 'row', gap: theme.space.md },
  emptyHint: { fontSize: ms(14), paddingHorizontal: theme.space.lg, paddingVertical: s(8) },
});
