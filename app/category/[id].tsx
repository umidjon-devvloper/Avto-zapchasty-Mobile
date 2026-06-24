import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import { FlatList, View, Text, Pressable, StyleSheet, ScrollView } from 'react-native';
import { Stack, useLocalSearchParams, router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../src/lib/api';
import { theme, s, ms } from '../../src/theme';
import { ListingCard } from '../../src/components/ListingCard';
import { Loading } from '../../src/components/Loading';
import { EmptyState } from '../../src/components/EmptyState';
import { categoryIcon } from '../../src/lib/category-icons';
import type { PartCategory, PartType, Listing } from '../../src/lib/types';

// ── Level 1 → Level 2 subcategory grid ──────────────────────────────
function SubcategoryGrid({ categoryId, categoryName }: { categoryId: string; categoryName: string }) {
  const { data: subs, isLoading } = useQuery({
    queryKey: ['subcategories', categoryId],
    queryFn: () => api.subcategories(categoryId),
  });

  return (
    <>
      <Stack.Screen options={{ title: categoryName }} />
      {isLoading ? (
        <Loading />
      ) : !subs?.length ? (
        <EmptyState icon="folder-open-outline" text="Pastki kategoriyalar topilmadi" />
      ) : (
        <ScrollView contentContainerStyle={styles.subGrid}>
          {subs.map((sub: PartCategory) => (
            <Pressable
              key={sub._id}
              style={({ pressed }) => [styles.subCard, pressed && { opacity: 0.82, transform: [{ scale: 0.97 }] }]}
              onPress={() =>
                router.push({ pathname: '/category/[id]', params: { id: sub._id, name: sub.name.ru, level: '2' } })
              }
            >
              <LinearGradient colors={[theme.colors.brandSoft, '#dce5f8']} style={styles.subIcon}>
                <Ionicons name={categoryIcon(sub.slug)} size={ms(28)} color={theme.colors.brand} />
              </LinearGradient>
              <View style={styles.subInfo}>
                <Text style={styles.subName}>{sub.name.uz || sub.name.ru}</Text>
                <Text style={styles.subHint}>Detallarni ko'rish →</Text>
              </View>
              <Ionicons name="chevron-forward" size={ms(16)} color={theme.colors.muted} />
            </Pressable>
          ))}
        </ScrollView>
      )}
    </>
  );
}

// ── Level 2 → Level 3 part-type list ────────────────────────────────
function PartTypeList({ categoryId, categoryName }: { categoryId: string; categoryName: string }) {
  const { data: partTypes, isLoading } = useQuery({
    queryKey: ['part-types', categoryId],
    queryFn: () => api.categoryPartTypes(categoryId),
  });

  return (
    <>
      <Stack.Screen options={{ title: categoryName }} />
      {isLoading ? (
        <Loading />
      ) : !partTypes?.length ? (
        <EmptyState icon="cube-outline" text="Detal turlari topilmadi" />
      ) : (
        <ScrollView contentContainerStyle={styles.ptList}>
          {partTypes.map((pt: PartType) => (
            <Pressable
              key={pt._id}
              style={({ pressed }) => [styles.ptRow, pressed && { opacity: 0.82 }]}
              onPress={() =>
                router.push({ pathname: '/category/[id]', params: { id: pt._id, name: pt.name, level: '3', partTypeId: pt._id } })
              }
            >
              <Text style={styles.ptName}>{pt.name}</Text>
              <Ionicons name="chevron-forward" size={ms(15)} color={theme.colors.muted} />
            </Pressable>
          ))}
        </ScrollView>
      )}
    </>
  );
}

// ── Level 3 → Product listings ───────────────────────────────────────
function ListingsByPartType({ partTypeId, name }: { partTypeId: string; name: string }) {
  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteQuery({
    queryKey: ['listings-by-parttype', partTypeId],
    queryFn: ({ pageParam }) => api.search({ partTypeId, page: pageParam, limit: 20 }),
    initialPageParam: 1,
    getNextPageParam: (last) => (last.page < last.pages ? last.page + 1 : undefined),
  });
  const items = data?.pages.flatMap((p) => p.items) ?? [];

  return (
    <>
      <Stack.Screen options={{ title: name }} />
      {isLoading ? (
        <Loading />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(it) => it._id}
          renderItem={({ item }) => <ListingCard listing={item} />}
          contentContainerStyle={{ padding: theme.space.lg, gap: theme.space.md, flexGrow: 1 }}
          ListEmptyComponent={<EmptyState icon="cube-outline" text="Bu bo'limda e'lon yo'q" />}
          onEndReached={() => { if (hasNextPage && !isFetchingNextPage) fetchNextPage(); }}
          onEndReachedThreshold={0.5}
          ListFooterComponent={isFetchingNextPage ? <Loading /> : null}
        />
      )}
    </>
  );
}

// ── Router: determines which view to render based on `level` param ───
export default function CategoryScreen() {
  const { id, name, level, partTypeId } = useLocalSearchParams<{
    id: string;
    name?: string;
    level?: string;
    partTypeId?: string;
  }>();

  // Level 3: show listings for a specific part type
  if (level === '3' && partTypeId) {
    return <ListingsByPartType partTypeId={partTypeId} name={name || 'E\'lonlar'} />;
  }

  // Level 2: show part types inside this subcategory
  if (level === '2') {
    return <PartTypeList categoryId={id} categoryName={name || 'Kategoriya'} />;
  }

  // Level 1 (default): show subcategories
  return <SubcategoryGrid categoryId={id} categoryName={name || 'Kategoriya'} />;
}

const styles = StyleSheet.create({
  // Subcategory grid (Level 1 view)
  subGrid: {
    padding: s(16),
    gap: s(12),
  },
  subCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(14),
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.xl,
    padding: s(14),
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadow.sm,
  },
  subIcon: {
    width: s(52),
    height: s(52),
    borderRadius: theme.radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subInfo: { flex: 1 },
  subName: { fontSize: ms(15), fontWeight: '700', color: theme.colors.text },
  subHint: { fontSize: ms(12), color: theme.colors.muted, marginTop: s(2) },

  // Part-type list (Level 2 view)
  ptList: {
    padding: s(16),
    gap: s(8),
  },
  ptRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.lg,
    paddingVertical: s(14),
    paddingHorizontal: s(16),
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  ptName: { fontSize: ms(14.5), fontWeight: '600', color: theme.colors.text, flex: 1 },
});
