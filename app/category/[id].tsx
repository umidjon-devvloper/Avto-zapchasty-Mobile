import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import { FlatList, View, Text, Pressable, StyleSheet, ScrollView, StatusBar } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { api } from '../../src/lib/api';
import { useT, useLocalize, useLocalizePart } from '../../src/lib/i18n';
import { useColors, useScheme } from '../../src/theme/useColors';
import { theme, s, ms } from '../../src/theme';
import { ListingCard } from '../../src/components/ListingCard';
import { Loading } from '../../src/components/Loading';
import { EmptyState } from '../../src/components/EmptyState';
import { categoryIcon } from '../../src/lib/category-icons';
import type { PartCategory, PartType } from '../../src/lib/types';

// Ikki tonli premium sxema — navy va amber (accent) almashib turadi
function useTones() {
  const colors = useColors();
  const scheme = useScheme();
  return scheme === 'dark'
    ? [
        { grad: ['rgba(120,150,255,0.18)', 'rgba(80,110,220,0.08)'] as const, icon: colors.ink },
        { grad: ['rgba(244,122,31,0.18)', 'rgba(244,122,31,0.07)'] as const, icon: colors.primary },
      ]
    : [
        { grad: [colors.brandSoft, colors.brandSoftAlt] as const, icon: colors.brand },
        { grad: [colors.primarySoft, '#ffe4c7'] as const, icon: colors.primary },
      ];
}

function CategoryHeader({ title, subtitle, slug }: { title: string; subtitle?: string; slug?: string }) {
  const insets = useSafeAreaInsets();
  return (
    <LinearGradient
      colors={theme.gradients.brand}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.header, { paddingTop: insets.top + s(8) }]}
    >
      <StatusBar barStyle="light-content" />
      <View style={styles.headerTop}>
        <Pressable
          style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.7 }]}
          onPress={() => router.back()}
          hitSlop={10}
        >
          <Ionicons name="chevron-back" size={ms(24)} color="#fff" />
        </Pressable>
        <Text style={styles.headerTitle} numberOfLines={1}>{title}</Text>
        <View style={{ width: s(40) }} />
      </View>
      {slug && (
        <View style={styles.headerHero}>
          <View style={styles.headerIconWrap}>
            <Ionicons name={categoryIcon(slug)} size={ms(28)} color="#fff" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerHeroTitle} numberOfLines={1}>{title}</Text>
            {subtitle && <Text style={styles.headerHeroSubtitle}>{subtitle}</Text>}
          </View>
        </View>
      )}
    </LinearGradient>
  );
}

function SubcategoryGrid({ categoryId, categoryName, slug }: { categoryId: string; categoryName: string; slug?: string }) {
  const colors = useColors();
  const tones = useTones();
  const t = useT();
  const lz = useLocalize();
  const { data: subs, isLoading } = useQuery({
    queryKey: ['subcategories', categoryId],
    queryFn: () => api.subcategories(categoryId),
  });

  return (
    <View style={[styles.root, { backgroundColor: colors.bg }]}>
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>
        <CategoryHeader
          title={categoryName}
          slug={slug}
          subtitle={subs?.length ? t.category.sectionsN(subs.length) : undefined}
        />
        {isLoading ? (
          <Loading />
        ) : !subs?.length ? (
          <EmptyState icon="folder-open-outline" text={t.category.noSubcategories} />
        ) : (
          <View style={styles.subGrid}>
            {subs.map((sub: PartCategory, i: number) => {
              const tone = tones[i % tones.length];
              return (
                <Pressable
                  key={sub._id}
                  style={({ pressed }) => [
                    styles.subCard,
                    { backgroundColor: colors.card, borderColor: colors.border },
                    pressed && { opacity: 0.82, transform: [{ scale: 0.97 }] },
                  ]}
                  onPress={() =>
                    router.push({
                      pathname: '/category/[id]',
                      params: { id: sub._id, name: lz(sub.name), slug: sub.slug, level: '2' },
                    })
                  }
                >
                  <LinearGradient colors={tone.grad} style={styles.subIcon}>
                    <Ionicons name={categoryIcon(sub.slug)} size={ms(28)} color={tone.icon} />
                  </LinearGradient>
                  <View style={styles.subInfo}>
                    <Text style={[styles.subName, { color: colors.text }]}>{lz(sub.name)}</Text>
                    <Text style={[styles.subHint, { color: colors.muted }]}>{t.category.viewParts}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={ms(16)} color={colors.muted} />
                </Pressable>
              );
            })}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function PartTypeList({ categoryId, categoryName, slug }: { categoryId: string; categoryName: string; slug?: string }) {
  const colors = useColors();
  const tones = useTones();
  const t = useT();
  const lzp = useLocalizePart();
  const { data: partTypes, isLoading } = useQuery({
    queryKey: ['part-types', categoryId],
    queryFn: () => api.categoryPartTypes(categoryId),
  });

  return (
    <View style={[styles.root, { backgroundColor: colors.bg }]}>
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>
        <CategoryHeader title={categoryName} slug={slug} subtitle={t.category.selectPartType} />
        {isLoading ? (
          <Loading />
        ) : !partTypes?.length ? (
          <EmptyState icon="cube-outline" text={t.category.noPartTypes} />
        ) : (
          <View style={styles.ptList}>
            {partTypes.map((pt: PartType, i: number) => {
              const tone = tones[i % tones.length];
              return (
                <Pressable
                  key={pt._id}
                  style={({ pressed }) => [
                    styles.ptRow,
                    { backgroundColor: colors.card, borderColor: colors.border },
                    pressed && { opacity: 0.82 },
                  ]}
                  onPress={() =>
                    router.push({
                      pathname: '/category/[id]',
                      params: { id: pt._id, name: lzp(pt), level: '3', partTypeId: pt._id },
                    })
                  }
                >
                  <LinearGradient colors={tone.grad} style={styles.ptIcon}>
                    <Ionicons name="build-outline" size={ms(17)} color={tone.icon} />
                  </LinearGradient>
                  <Text style={[styles.ptName, { color: colors.text }]}>{lzp(pt)}</Text>
                  <Ionicons name="chevron-forward" size={ms(15)} color={colors.muted} />
                </Pressable>
              );
            })}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function ListingsByPartType({ partTypeId, name }: { partTypeId: string; name: string }) {
  const colors = useColors();
  const t = useT();
  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteQuery({
    queryKey: ['listings-by-parttype', partTypeId],
    queryFn: ({ pageParam }) => api.search({ partTypeId, page: pageParam, limit: 20 }),
    initialPageParam: 1,
    getNextPageParam: (last) => (last.page < last.pages ? last.page + 1 : undefined),
  });
  const items = data?.pages.flatMap((p) => p.items) ?? [];

  return (
    <View style={[styles.root, { backgroundColor: colors.bg }]}>
      {isLoading ? (
        <ScrollView contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>
          <CategoryHeader title={name} />
          <Loading />
        </ScrollView>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(it) => it._id}
          renderItem={({ item }) => (
            <View style={{ paddingHorizontal: theme.space.lg }}>
              <ListingCard listing={item} />
            </View>
          )}
          ListHeaderComponent={<CategoryHeader title={name} />}
          contentContainerStyle={{ paddingBottom: theme.space.lg, gap: theme.space.md, flexGrow: 1 }}
          ListEmptyComponent={
            <View style={{ padding: theme.space.lg }}>
              <EmptyState icon="cube-outline" text={t.category.noListings} />
            </View>
          }
          onEndReached={() => { if (hasNextPage && !isFetchingNextPage) fetchNextPage(); }}
          onEndReachedThreshold={0.5}
          ListFooterComponent={isFetchingNextPage ? <Loading /> : null}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

export default function CategoryScreen() {
  const t = useT();
  const { id, name, level, partTypeId, slug } = useLocalSearchParams<{
    id: string; name?: string; level?: string; partTypeId?: string; slug?: string;
  }>();

  if (level === '3' && partTypeId) return <ListingsByPartType partTypeId={partTypeId} name={name || t.category.listingsFallback} />;
  if (level === '2') return <PartTypeList categoryId={id} categoryName={name || t.category.fallback} slug={slug} />;
  return <SubcategoryGrid categoryId={id} categoryName={name || t.category.fallback} slug={slug} />;
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    paddingHorizontal: s(12), paddingBottom: s(16),
    borderBottomLeftRadius: s(22), borderBottomRightRadius: s(22),
    ...theme.shadow.navy,
  },
  headerTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  backBtn: {
    width: s(40), height: s(40), borderRadius: s(20),
    backgroundColor: 'rgba(255,255,255,0.14)', borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { fontSize: ms(17), fontWeight: '800', color: '#fff', letterSpacing: -0.2, flex: 1, textAlign: 'center' },
  headerHero: { flexDirection: 'row', alignItems: 'center', gap: s(12), marginTop: s(16), paddingHorizontal: s(4) },
  headerIconWrap: {
    width: s(48), height: s(48), borderRadius: theme.radius.lg,
    backgroundColor: 'rgba(255,255,255,0.14)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
  },
  headerHeroTitle: { fontSize: ms(18), fontWeight: '800', color: '#fff', letterSpacing: -0.3 },
  headerHeroSubtitle: { fontSize: ms(12.5), color: 'rgba(255,255,255,0.7)', marginTop: s(2) },
  subGrid: { padding: s(16), gap: s(12) },
  subCard: { flexDirection: 'row', alignItems: 'center', gap: s(14), borderRadius: theme.radius.xl, padding: s(14), borderWidth: 1, ...theme.shadow.sm },
  subIcon: { width: s(52), height: s(52), borderRadius: theme.radius.lg, alignItems: 'center', justifyContent: 'center' },
  subInfo: { flex: 1 },
  subName: { fontSize: ms(15), fontWeight: '700' },
  subHint: { fontSize: ms(12), marginTop: s(2) },
  ptList: { padding: s(16), gap: s(8) },
  ptRow: { flexDirection: 'row', alignItems: 'center', gap: s(12), borderRadius: theme.radius.lg, paddingVertical: s(10), paddingHorizontal: s(12), borderWidth: 1 },
  ptIcon: { width: s(36), height: s(36), borderRadius: theme.radius.md, alignItems: 'center', justifyContent: 'center' },
  ptName: { fontSize: ms(14.5), fontWeight: '600', flex: 1 },
});
