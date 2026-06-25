import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import { FlatList, View, Text, Pressable, StyleSheet, ScrollView, StatusBar } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { api } from '../../src/lib/api';
import { useColors, useScheme } from '../../src/theme/useColors';
import { theme, s, ms } from '../../src/theme';
import { ListingCard } from '../../src/components/ListingCard';
import { Loading } from '../../src/components/Loading';
import { EmptyState } from '../../src/components/EmptyState';
import { categoryIcon } from '../../src/lib/category-icons';
import type { PartCategory, PartType } from '../../src/lib/types';

function CategoryHeader({ title }: { title: string }) {
  const insets = useSafeAreaInsets();
  return (
    <LinearGradient
      colors={theme.gradients.brand}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.header, { paddingTop: insets.top + s(8) }]}
    >
      <StatusBar barStyle="light-content" />
      <Pressable
        style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.7 }]}
        onPress={() => router.back()}
        hitSlop={10}
      >
        <Ionicons name="chevron-back" size={ms(24)} color="#fff" />
      </Pressable>
      <Text style={styles.headerTitle} numberOfLines={1}>{title}</Text>
      <View style={{ width: s(40) }} />
    </LinearGradient>
  );
}

function SubcategoryGrid({ categoryId, categoryName }: { categoryId: string; categoryName: string }) {
  const colors = useColors();
  const scheme = useScheme();
  const iconGrad = scheme === 'dark'
    ? ['rgba(120,150,255,0.18)', 'rgba(80,110,220,0.08)'] as const
    : [colors.brandSoft, colors.brandSoftAlt] as const;
  const { data: subs, isLoading } = useQuery({
    queryKey: ['subcategories', categoryId],
    queryFn: () => api.subcategories(categoryId),
  });

  return (
    <View style={[styles.root, { backgroundColor: colors.bg }]}>
      <CategoryHeader title={categoryName} />
      {isLoading ? (
        <Loading />
      ) : !subs?.length ? (
        <EmptyState icon="folder-open-outline" text="Pastki kategoriyalar topilmadi" />
      ) : (
        <ScrollView contentContainerStyle={styles.subGrid} showsVerticalScrollIndicator={false}>
          {subs.map((sub: PartCategory) => (
            <Pressable
              key={sub._id}
              style={({ pressed }) => [
                styles.subCard,
                { backgroundColor: colors.card, borderColor: colors.border },
                pressed && { opacity: 0.82, transform: [{ scale: 0.97 }] },
              ]}
              onPress={() =>
                router.push({ pathname: '/category/[id]', params: { id: sub._id, name: sub.name.ru, level: '2' } })
              }
            >
              <LinearGradient colors={iconGrad} style={styles.subIcon}>
                <Ionicons name={categoryIcon(sub.slug)} size={ms(28)} color={colors.ink} />
              </LinearGradient>
              <View style={styles.subInfo}>
                <Text style={[styles.subName, { color: colors.text }]}>{sub.name.uz || sub.name.ru}</Text>
                <Text style={[styles.subHint, { color: colors.muted }]}>Detallarni ko'rish →</Text>
              </View>
              <Ionicons name="chevron-forward" size={ms(16)} color={colors.muted} />
            </Pressable>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

function PartTypeList({ categoryId, categoryName }: { categoryId: string; categoryName: string }) {
  const colors = useColors();
  const { data: partTypes, isLoading } = useQuery({
    queryKey: ['part-types', categoryId],
    queryFn: () => api.categoryPartTypes(categoryId),
  });

  return (
    <View style={[styles.root, { backgroundColor: colors.bg }]}>
      <CategoryHeader title={categoryName} />
      {isLoading ? (
        <Loading />
      ) : !partTypes?.length ? (
        <EmptyState icon="cube-outline" text="Detal turlari topilmadi" />
      ) : (
        <ScrollView contentContainerStyle={styles.ptList} showsVerticalScrollIndicator={false}>
          {partTypes.map((pt: PartType) => (
            <Pressable
              key={pt._id}
              style={({ pressed }) => [
                styles.ptRow,
                { backgroundColor: colors.card, borderColor: colors.border },
                pressed && { opacity: 0.82 },
              ]}
              onPress={() =>
                router.push({ pathname: '/category/[id]', params: { id: pt._id, name: pt.name, level: '3', partTypeId: pt._id } })
              }
            >
              <Text style={[styles.ptName, { color: colors.text }]}>{pt.name}</Text>
              <Ionicons name="chevron-forward" size={ms(15)} color={colors.muted} />
            </Pressable>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

function ListingsByPartType({ partTypeId, name }: { partTypeId: string; name: string }) {
  const colors = useColors();
  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteQuery({
    queryKey: ['listings-by-parttype', partTypeId],
    queryFn: ({ pageParam }) => api.search({ partTypeId, page: pageParam, limit: 20 }),
    initialPageParam: 1,
    getNextPageParam: (last) => (last.page < last.pages ? last.page + 1 : undefined),
  });
  const items = data?.pages.flatMap((p) => p.items) ?? [];

  return (
    <View style={[styles.root, { backgroundColor: colors.bg }]}>
      <CategoryHeader title={name} />
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
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

export default function CategoryScreen() {
  const { id, name, level, partTypeId } = useLocalSearchParams<{
    id: string; name?: string; level?: string; partTypeId?: string;
  }>();

  if (level === '3' && partTypeId) return <ListingsByPartType partTypeId={partTypeId} name={name || "E'lonlar"} />;
  if (level === '2') return <PartTypeList categoryId={id} categoryName={name || 'Kategoriya'} />;
  return <SubcategoryGrid categoryId={id} categoryName={name || 'Kategoriya'} />;
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: s(12), paddingBottom: s(14),
    borderBottomLeftRadius: s(22), borderBottomRightRadius: s(22),
    ...theme.shadow.navy,
  },
  backBtn: {
    width: s(40), height: s(40), borderRadius: s(20),
    backgroundColor: 'rgba(255,255,255,0.14)', borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { fontSize: ms(17), fontWeight: '800', color: '#fff', letterSpacing: -0.2, flex: 1, textAlign: 'center' },
  subGrid: { padding: s(16), gap: s(12) },
  subCard: { flexDirection: 'row', alignItems: 'center', gap: s(14), borderRadius: theme.radius.xl, padding: s(14), borderWidth: 1, ...theme.shadow.sm },
  subIcon: { width: s(52), height: s(52), borderRadius: theme.radius.lg, alignItems: 'center', justifyContent: 'center' },
  subInfo: { flex: 1 },
  subName: { fontSize: ms(15), fontWeight: '700' },
  subHint: { fontSize: ms(12), marginTop: s(2) },
  ptList: { padding: s(16), gap: s(8) },
  ptRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderRadius: theme.radius.lg, paddingVertical: s(14), paddingHorizontal: s(16), borderWidth: 1 },
  ptName: { fontSize: ms(14.5), fontWeight: '600', flex: 1 },
});
