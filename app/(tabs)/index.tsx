import { useQuery } from '@tanstack/react-query';
import { ScrollView, View, Text, Pressable, StyleSheet } from 'react-native';
import { useCallback } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { setStatusBarStyle } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { api } from '../../src/lib/api';
import { theme, s, ms } from '../../src/theme';
import { Wordmark, LogoMark } from '../../src/components/Brand';
import { CategoryTile } from '../../src/components/CategoryTile';
import { ListingCard } from '../../src/components/ListingCard';
import { Loading } from '../../src/components/Loading';
import type { Brand, Listing, PartCategory } from '../../src/lib/types';

function chunk<T>(arr: T[], n: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += n) out.push(arr.slice(i, i + n));
  return out;
}

export default function Home() {
  const { data: categories, isLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: api.categories,
  });
  const { data: brands } = useQuery({
    queryKey: ['brands-popular'],
    queryFn: () => api.brands(true),
  });
  const { data: latest, isLoading: latestLoading } = useQuery({
    queryKey: ['latest-listings'],
    queryFn: () => api.search({ sort: 'newest', limit: 10, page: 1 }),
  });

  const latestItems = latest?.items ?? [];

  useFocusEffect(useCallback(() => {
    setStatusBarStyle('light');
    return () => setStatusBarStyle('dark');
  }, []));

  return (
    <View style={styles.root}>
      {/* Premium navy hero */}
      <LinearGradient
        colors={theme.gradients.brand}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.hero}
      >
        <SafeAreaView edges={['top']}>
          {/* Top bar */}
          <View style={styles.heroTop}>
            <View style={styles.logoRow}>
              <LogoMark size={s(40)} />
              <View>
                <Wordmark size={ms(19)} light />
                <Text style={styles.heroTagline}>Ehtiyot qismlar bozori</Text>
              </View>
            </View>
            <Pressable
              style={({ pressed }) => [styles.notifBtn, pressed && { opacity: 0.8 }]}
              onPress={() => router.push('/messages')}
            >
              <Ionicons name="notifications-outline" size={ms(20)} color="#fff" />
            </Pressable>
          </View>

          {/* Hero text */}
          <Text style={styles.heroTitle}>Kerakli detalni{'\n'}tez va ishonchli toping</Text>

          {/* Search bar */}
          <Pressable
            style={({ pressed }) => [styles.searchBar, pressed && { opacity: 0.96 }]}
            onPress={() => router.push('/search')}
          >
            <View style={styles.searchIcon}>
              <Ionicons name="search" size={ms(17)} color={theme.colors.primary} />
            </View>
            <Text style={styles.searchText}>Detal, OEM yoki mashina...</Text>
            <View style={styles.searchArrow}>
              <Ionicons name="arrow-forward" size={ms(15)} color={theme.colors.muted} />
            </View>
          </Pressable>
        </SafeAreaView>
      </LinearGradient>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Ommabop brendlar */}
        {brands && brands.length > 0 && (
          <View>
            <SectionHeader title="Ommabop brendlar" />
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.brandRow}
            >
              {brands.map((b: Brand) => (
                <Pressable
                  key={b._id}
                  style={({ pressed }) => [styles.brandChip, pressed && { opacity: 0.82 }]}
                  onPress={() =>
                    router.push({ pathname: '/search', params: { brandId: b._id, title: b.name } })
                  }
                >
                  <Text style={styles.brandChipText}>{b.name}</Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Kategoriyalar — 2 ustunli grid */}
        <View>
          <SectionHeader title="Kategoriyalar" />
          {isLoading ? (
            <Loading />
          ) : (
            <View style={styles.catGrid}>
              {(categories ?? []).map((c: PartCategory) => (
                <CategoryTile key={c._id} category={c} variant="grid" />
              ))}
            </View>
          )}
        </View>

        {/* So'nggi e'lonlar */}
        <View>
          <SectionHeader
            title="So'nggi e'lonlar"
            actionLabel="Barchasi"
            onAction={() => router.push('/search')}
          />
          {latestLoading ? (
            <Loading />
          ) : latestItems.length === 0 ? (
            <Text style={styles.emptyHint}>Hozircha e'lonlar yo'q</Text>
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
  title, actionLabel, onAction,
}: {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <View style={styles.sectionHead}>
      <View style={styles.sectionTitleRow}>
        <View style={styles.sectionAccent} />
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      {actionLabel && onAction ? (
        <Pressable
          style={({ pressed }) => [styles.seeAll, pressed && { opacity: 0.6 }]}
          onPress={onAction}
          hitSlop={8}
        >
          <Text style={styles.seeAllText}>{actionLabel}</Text>
          <Ionicons name="chevron-forward" size={ms(14)} color={theme.colors.primaryDark} />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.colors.bg },

  hero: {
    paddingHorizontal: s(16),
    paddingBottom: s(28),
    borderBottomLeftRadius: s(32),
    borderBottomRightRadius: s(32),
    ...theme.shadow.navy,
  },
  heroTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: s(6),
    paddingBottom: s(16),
  },
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: s(10) },
  heroTagline: { fontSize: ms(11), color: 'rgba(255,255,255,0.65)', marginTop: s(2), fontWeight: '500' },
  notifBtn: {
    width: s(38),
    height: s(38),
    borderRadius: s(19),
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  heroTitle: {
    fontSize: ms(24),
    fontWeight: '800',
    color: '#fff',
    lineHeight: ms(31),
    letterSpacing: -0.4,
    marginBottom: s(16),
  },

  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(10),
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.xl,
    paddingRight: s(14),
    paddingLeft: s(6),
    height: s(54),
    ...theme.shadow.md,
  },
  searchIcon: {
    width: s(38),
    height: s(38),
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchText: { color: theme.colors.muted, fontSize: ms(14.5), flex: 1 },
  searchArrow: {
    width: s(30),
    height: s(30),
    borderRadius: s(15),
    backgroundColor: theme.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },

  scroll: { paddingBottom: s(32), gap: s(8) },

  brandRow: { gap: s(8), paddingHorizontal: s(16), paddingVertical: s(4) },
  brandChip: {
    backgroundColor: theme.colors.card,
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    paddingHorizontal: s(16),
    paddingVertical: s(10),
    borderRadius: theme.radius.pill,
    ...theme.shadow.sm,
  },
  brandChipText: { color: theme.colors.brand, fontWeight: '800', fontSize: ms(13) },

  catRow: { gap: theme.space.sm, paddingHorizontal: theme.space.lg, paddingVertical: s(4) },
  catGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: s(12),
    paddingHorizontal: theme.space.lg,
    paddingVertical: s(4),
    justifyContent: 'space-between',
  },

  sectionHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.space.lg,
    marginTop: s(22),
    marginBottom: s(12),
  },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: s(8) },
  sectionAccent: {
    width: s(4),
    height: s(18),
    borderRadius: 2,
    backgroundColor: theme.colors.primary,
  },
  sectionTitle: { fontSize: ms(17), fontWeight: '800', color: theme.colors.text, letterSpacing: -0.3 },
  seeAll: { flexDirection: 'row', alignItems: 'center', gap: s(2) },
  seeAllText: { fontSize: ms(13.5), fontWeight: '700', color: theme.colors.primaryDark },

  feed: { paddingHorizontal: theme.space.lg, gap: theme.space.md },
  feedRow: { flexDirection: 'row', gap: theme.space.md },
  emptyHint: { color: theme.colors.muted, fontSize: ms(14), paddingHorizontal: theme.space.lg, paddingVertical: s(8) },
});
