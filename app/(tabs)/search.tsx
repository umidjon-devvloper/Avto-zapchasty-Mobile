import { useEffect, useRef, useState } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { View, TextInput, FlatList, StyleSheet, Text, Pressable, ScrollView, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import { api } from '../../src/lib/api';
import { useColors } from '../../src/theme/useColors';
import { theme, s, ms } from '../../src/theme';
import { ListingCard } from '../../src/components/ListingCard';
import { Loading } from '../../src/components/Loading';
import { EmptyState } from '../../src/components/EmptyState';

type SortKey = 'newest' | 'cheap' | 'expensive';
const SORTS: { key: SortKey; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: 'newest', label: 'Yangi', icon: 'sparkles-outline' },
  { key: 'cheap', label: 'Arzon', icon: 'trending-down-outline' },
  { key: 'expensive', label: 'Qimmat', icon: 'trending-up-outline' },
];

export default function Search() {
  const colors = useColors();
  const params = useLocalSearchParams<{ q?: string; brandId?: string; categoryId?: string; title?: string }>();
  const [q, setQ] = useState(params.q ?? '');
  const [debounced, setDebounced] = useState(q);
  const [sort, setSort] = useState<SortKey>('newest');
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(q), 400);
    return () => clearTimeout(t);
  }, [q]);

  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage, refetch, isRefetching } =
    useInfiniteQuery({
      queryKey: ['search', debounced, params.brandId, params.categoryId, sort],
      queryFn: ({ pageParam }) =>
        api.search({ q: debounced || undefined, brandId: params.brandId, categoryId: params.categoryId, sort, page: pageParam, limit: 20 }),
      initialPageParam: 1,
      getNextPageParam: (last) => (last.page < last.pages ? last.page + 1 : undefined),
    });

  const items = data?.pages.flatMap((p) => p.items) ?? [];
  const total = data?.pages[0]?.total ?? 0;
  const pageTitle = params.title || 'Qidiruv';

  return (
    <View style={[styles.root, { backgroundColor: colors.bg }]}>
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.brand} />

      <LinearGradient colors={theme.gradients.brand} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.header}>
        <SafeAreaView edges={['top']}>
          <View style={styles.headerTop}>
            <Text style={styles.headerTitle}>{pageTitle}</Text>
            {total > 0 && (
              <View style={styles.totalPill}>
                <Text style={styles.totalText}>{total}</Text>
              </View>
            )}
          </View>

          <Pressable
            style={[
              styles.searchBar,
              { backgroundColor: colors.card },
              focused && { borderColor: colors.primary + '40' },
            ]}
            onPress={() => inputRef.current?.focus()}
          >
            <Ionicons name="search" size={ms(19)} color={focused ? colors.primary : colors.muted} />
            <TextInput
              ref={inputRef}
              autoFocus={!params.brandId && !params.categoryId}
              value={q}
              onChangeText={setQ}
              placeholder="Detal, OEM yoki mashina..."
              placeholderTextColor={colors.muted}
              style={[styles.searchInput, { color: colors.text }]}
              returnKeyType="search"
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
            />
            {q.length > 0 && (
              <Pressable onPress={() => setQ('')} hitSlop={10}>
                <Ionicons name="close-circle" size={ms(18)} color={colors.faint} />
              </Pressable>
            )}
          </Pressable>
        </SafeAreaView>
      </LinearGradient>

      <View style={styles.sortWrap}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.sortRow}>
          {SORTS.map((s) => {
            const active = sort === s.key;
            return (
              <Pressable
                key={s.key}
                onPress={() => setSort(s.key)}
                style={({ pressed }) => [
                  styles.sortChip,
                  { borderColor: colors.border, backgroundColor: colors.card },
                  active && { borderColor: 'transparent' },
                  pressed && { opacity: 0.85 },
                ]}
              >
                {active ? (
                  <LinearGradient colors={theme.gradients.brand} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.sortChipGrad}>
                    <Ionicons name={s.icon} size={ms(13)} color="#fff" />
                    <Text style={styles.sortTextActive}>{s.label}</Text>
                  </LinearGradient>
                ) : (
                  <View style={styles.sortChipInner}>
                    <Ionicons name={s.icon} size={ms(13)} color={colors.muted} />
                    <Text style={[styles.sortText, { color: colors.muted }]}>{s.label}</Text>
                  </View>
                )}
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {isLoading ? (
        <Loading />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(it) => it._id}
          renderItem={({ item }) => <ListingCard listing={item} />}
          contentContainerStyle={styles.list}
          ListHeaderComponent={
            total > 0 ? (
              <View style={styles.countRow}>
                <Ionicons name="funnel-outline" size={ms(13)} color={colors.muted} />
                <Text style={[styles.count, { color: colors.muted }]}>{total} ta natija topildi</Text>
              </View>
            ) : null
          }
          ListEmptyComponent={
            <EmptyState icon="search-outline" text={debounced ? 'Hech narsa topilmadi' : 'Qidirishni boshlang'} />
          }
          onEndReached={() => { if (hasNextPage && !isFetchingNextPage) fetchNextPage(); }}
          onEndReachedThreshold={0.5}
          refreshing={isRefetching}
          onRefresh={refetch}
          ListFooterComponent={isFetchingNextPage ? <Loading /> : null}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    paddingHorizontal: s(16), paddingBottom: s(20),
    borderBottomLeftRadius: s(24), borderBottomRightRadius: s(24), ...theme.shadow.navy,
  },
  headerTop: { flexDirection: 'row', alignItems: 'center', gap: s(10), paddingTop: s(6), paddingBottom: s(14) },
  headerTitle: { fontSize: ms(22), fontWeight: '800', color: '#fff', letterSpacing: -0.3, flex: 1 },
  totalPill: { backgroundColor: 'rgba(255,255,255,0.18)', paddingHorizontal: s(10), paddingVertical: s(4), borderRadius: 999 },
  totalText: { fontSize: ms(12.5), fontWeight: '800', color: '#fff' },
  searchBar: {
    flexDirection: 'row', alignItems: 'center', gap: s(10),
    borderRadius: theme.radius.lg, paddingHorizontal: s(14), height: s(52),
    borderWidth: 2, borderColor: 'transparent', ...theme.shadow.md,
  },
  searchInput: { flex: 1, fontSize: ms(15) },

  sortWrap: { paddingTop: s(14), paddingBottom: s(6) },
  sortRow: { gap: s(8), paddingHorizontal: s(16) },
  sortChip: { borderRadius: 999, borderWidth: 1.5, overflow: 'hidden', ...theme.shadow.sm },
  sortChipGrad: { flexDirection: 'row', alignItems: 'center', gap: s(5), paddingHorizontal: s(14), paddingVertical: s(8) },
  sortChipInner: { flexDirection: 'row', alignItems: 'center', gap: s(5), paddingHorizontal: s(14), paddingVertical: s(8) },
  sortText: { fontSize: ms(13), fontWeight: '700' },
  sortTextActive: { fontSize: ms(13), fontWeight: '700', color: '#fff' },

  list: { paddingHorizontal: theme.space.lg, paddingTop: s(8), paddingBottom: theme.space.xl, gap: theme.space.md, flexGrow: 1 },
  countRow: { flexDirection: 'row', alignItems: 'center', gap: s(5), marginBottom: s(10) },
  count: { fontSize: ms(13), fontWeight: '600' },
});
