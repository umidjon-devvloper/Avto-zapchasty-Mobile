import { useEffect, useMemo, useRef, useState } from 'react';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import {
  View, TextInput, FlatList, StyleSheet, Text, Pressable, ScrollView, StatusBar, KeyboardAvoidingView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import { api } from '../../src/lib/api';
import { useT, useLocalize } from '../../src/lib/i18n';
import { useColors } from '../../src/theme/useColors';
import { theme, s, ms } from '../../src/theme';
import { ListingCard } from '../../src/components/ListingCard';
import { Loading } from '../../src/components/Loading';
import { EmptyState } from '../../src/components/EmptyState';
import { PickerSheet } from '../../src/components/PickerSheet';
import { Button } from '../../src/components/Button';

type SortKey = 'newest' | 'cheap' | 'expensive';

export default function Search() {
  const colors = useColors();
  const t = useT();
  const lz = useLocalize();

  const SORTS: { key: SortKey; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
    { key: 'newest', label: t.search.sortNewest, icon: 'sparkles-outline' },
    { key: 'cheap', label: t.search.sortCheap, icon: 'trending-down-outline' },
    { key: 'expensive', label: t.search.sortExpensive, icon: 'trending-up-outline' },
  ];
  const ALL = { value: '', label: t.common.all };
  const CONDITIONS = [
    ALL,
    { value: 'new', label: t.conditionsFull.new },
    { value: 'used', label: t.conditionsFull.used },
    { value: 'contract', label: t.conditionsFull.contract },
    { value: 'original', label: t.conditionsFull.original },
    { value: 'duplicate', label: t.conditionsFull.duplicate },
  ];
  const params = useLocalSearchParams<{ q?: string; brandId?: string; categoryId?: string; title?: string }>();
  const [q, setQ] = useState(params.q ?? '');
  const [debounced, setDebounced] = useState(q);
  const [sort, setSort] = useState<SortKey>('newest');
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<TextInput>(null);

  // Filtrlar
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [categoryId, setCategoryId] = useState(params.categoryId ?? '');
  const [brandId, setBrandId] = useState(params.brandId ?? '');
  const [modelId, setModelId] = useState('');
  const [condition, setCondition] = useState('');
  const [city, setCity] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [debouncedPrice, setDebouncedPrice] = useState({ min: '', max: '' });

  useEffect(() => {
    const t = setTimeout(() => setDebouncedPrice({ min: minPrice, max: maxPrice }), 600);
    return () => clearTimeout(t);
  }, [minPrice, maxPrice]);

  // Boshqa ekrandan (bosh sahifa kategoriya/brend) kelganda filtrlarni sinxronlash
  useEffect(() => { setCategoryId(params.categoryId ?? ''); }, [params.categoryId]);
  useEffect(() => { setBrandId(params.brandId ?? ''); setModelId(''); }, [params.brandId]);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(q), 400);
    return () => clearTimeout(t);
  }, [q]);

  const activeCount = [categoryId, brandId, modelId, condition, city, minPrice, maxPrice]
    .filter(Boolean).length;

  const searchParams = useMemo(() => ({
    q: debounced || undefined,
    categoryId: categoryId || undefined,
    brandId: brandId || undefined,
    modelId: modelId || undefined,
    condition: condition || undefined,
    city: city || undefined,
    minPrice: debouncedPrice.min ? Number(debouncedPrice.min) : undefined,
    maxPrice: debouncedPrice.max ? Number(debouncedPrice.max) : undefined,
    sort,
  }), [debounced, categoryId, brandId, modelId, condition, city, debouncedPrice, sort]);

  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage, refetch } =
    useInfiniteQuery({
      queryKey: ['search', searchParams],
      queryFn: ({ pageParam }) => api.search({ ...searchParams, page: pageParam, limit: 20 }),
      initialPageParam: 1,
      getNextPageParam: (last) => (last.page < last.pages ? last.page + 1 : undefined),
    });

  // Filtr paneli uchun katalog ma'lumotlari
  const { data: categories = [] } = useQuery({ queryKey: ['categories'], queryFn: api.categories });
  const { data: brands = [] } = useQuery({ queryKey: ['brands'], queryFn: () => api.brands() });
  const { data: models = [] } = useQuery({
    queryKey: ['models', brandId],
    queryFn: () => api.brandModels(brandId),
    enabled: !!brandId,
  });
  const { data: cities = [] } = useQuery({ queryKey: ['cities'], queryFn: api.cities });

  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = async () => {
    setRefreshing(true);
    try { await refetch(); } finally { setRefreshing(false); }
  };

  const resetFilters = () => {
    setCategoryId(''); setBrandId(''); setModelId('');
    setCondition(''); setCity(''); setMinPrice(''); setMaxPrice('');
  };

  const items = data?.pages.flatMap((p) => p.items) ?? [];
  const total = data?.pages[0]?.total ?? 0;
  const pageTitle = params.title || t.search.title;

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
              placeholder={t.search.placeholder}
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
          <Pressable
            onPress={() => setFiltersOpen(true)}
            style={({ pressed }) => [
              styles.sortChip,
              { borderColor: activeCount > 0 ? colors.primary : colors.border, backgroundColor: colors.card },
              pressed && { opacity: 0.85 },
            ]}
          >
            <View style={styles.sortChipInner}>
              <Ionicons name="options-outline" size={ms(14)} color={activeCount > 0 ? colors.primary : colors.muted} />
              <Text style={[styles.sortText, { color: activeCount > 0 ? colors.primary : colors.muted }]}>{t.search.filter}</Text>
              {activeCount > 0 && (
                <View style={[styles.filterBadge, { backgroundColor: colors.primary }]}>
                  <Text style={styles.filterBadgeText}>{activeCount}</Text>
                </View>
              )}
            </View>
          </Pressable>

          {SORTS.map((so) => {
            const active = sort === so.key;
            return (
              <Pressable
                key={so.key}
                onPress={() => setSort(so.key)}
                style={({ pressed }) => [
                  styles.sortChip,
                  { borderColor: colors.border, backgroundColor: colors.card },
                  active && { borderColor: 'transparent' },
                  pressed && { opacity: 0.85 },
                ]}
              >
                {active ? (
                  <LinearGradient colors={theme.gradients.brand} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.sortChipGrad}>
                    <Ionicons name={so.icon} size={ms(13)} color="#fff" />
                    <Text style={styles.sortTextActive}>{so.label}</Text>
                  </LinearGradient>
                ) : (
                  <View style={styles.sortChipInner}>
                    <Ionicons name={so.icon} size={ms(13)} color={colors.muted} />
                    <Text style={[styles.sortText, { color: colors.muted }]}>{so.label}</Text>
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
                <Text style={[styles.count, { color: colors.muted }]}>{t.search.foundN(total)}</Text>
              </View>
            ) : null
          }
          ListEmptyComponent={
            <EmptyState
              icon="search-outline"
              text={debounced || activeCount > 0 ? t.common.notFound : t.search.startSearch}
            />
          }
          onEndReached={() => { if (hasNextPage && !isFetchingNextPage) fetchNextPage(); }}
          onEndReachedThreshold={0.5}
          refreshing={refreshing}
          onRefresh={onRefresh}
          ListFooterComponent={isFetchingNextPage ? <Loading /> : null}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Filtr paneli (overlay — PickerSheet modallari bilan mos ishlashi uchun Modal emas) */}
      {filtersOpen && (
        <View style={StyleSheet.absoluteFill}>
          <Pressable style={[styles.filterBackdrop, { backgroundColor: colors.overlay }]} onPress={() => setFiltersOpen(false)} />
          <View style={[styles.filterPanel, { backgroundColor: colors.bg }]}>
            <SafeAreaView edges={['bottom']} style={{ flex: 1 }}>
              <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding">
              <View style={[styles.filterHeader, { borderBottomColor: colors.border }]}>
                <Text style={[styles.filterTitle, { color: colors.text }]}>{t.search.filters}</Text>
                <View style={styles.filterHeaderRight}>
                  {activeCount > 0 && (
                    <Pressable onPress={resetFilters} hitSlop={8}>
                      <Text style={[styles.resetText, { color: colors.primary }]}>{t.search.reset}</Text>
                    </Pressable>
                  )}
                  <Pressable onPress={() => setFiltersOpen(false)} hitSlop={8}>
                    <Ionicons name="close" size={ms(24)} color={colors.muted} />
                  </Pressable>
                </View>
              </View>

              <ScrollView contentContainerStyle={styles.filterBody} showsVerticalScrollIndicator={false}>
                <PickerSheet
                  label={t.search.category}
                  placeholder={t.common.all}
                  value={categoryId}
                  options={[ALL, ...categories.map((c) => ({ value: c._id, label: lz(c.name) })).sort((a, b) => a.label.localeCompare(b.label))]}
                  onChange={setCategoryId}
                />
                <PickerSheet
                  label={t.search.brand}
                  placeholder={t.common.all}
                  value={brandId}
                  options={[ALL, ...brands.map((b) => ({ value: b._id, label: b.name })).sort((a, b) => a.label.localeCompare(b.label))]}
                  onChange={(v) => { setBrandId(v); setModelId(''); }}
                />
                {!!brandId && (
                  <PickerSheet
                    label={t.search.model}
                    placeholder={t.common.all}
                    value={modelId}
                    options={[ALL, ...models.map((m) => ({ value: m._id, label: m.name }))]}
                    onChange={setModelId}
                  />
                )}
                <PickerSheet
                  label={t.search.condition}
                  placeholder={t.common.all}
                  value={condition}
                  options={CONDITIONS}
                  onChange={setCondition}
                />
                <PickerSheet
                  label={t.search.city}
                  placeholder={t.common.all}
                  value={city}
                  options={[ALL, ...cities.map((c) => ({ value: c.name.uz ?? "", label: lz(c.name) })).sort((a, b) => a.label.localeCompare(b.label))]}
                  onChange={setCity}
                />

                <View>
                  <Text style={[styles.priceLabel, { color: colors.muted }]}>{t.search.priceLabel}</Text>
                  <View style={styles.priceRow}>
                    <TextInput
                      style={[styles.priceInput, { borderColor: colors.border, backgroundColor: colors.card, color: colors.text }]}
                      placeholder={t.search.from}
                      placeholderTextColor={colors.faint}
                      value={minPrice}
                      onChangeText={setMinPrice}
                      keyboardType="numeric"
                    />
                    <Text style={{ color: colors.muted }}>—</Text>
                    <TextInput
                      style={[styles.priceInput, { borderColor: colors.border, backgroundColor: colors.card, color: colors.text }]}
                      placeholder={t.search.to}
                      placeholderTextColor={colors.faint}
                      value={maxPrice}
                      onChangeText={setMaxPrice}
                      keyboardType="numeric"
                    />
                  </View>
                </View>
              </ScrollView>

              <View style={styles.filterFooter}>
                <Button
                  title={total > 0 ? t.search.showN(total) : t.search.showResults}
                  onPress={() => setFiltersOpen(false)}
                />
              </View>
              </KeyboardAvoidingView>
            </SafeAreaView>
          </View>
        </View>
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
  filterBadge: { minWidth: s(18), height: s(18), borderRadius: 999, alignItems: 'center', justifyContent: 'center', paddingHorizontal: s(4) },
  filterBadgeText: { fontSize: ms(10.5), fontWeight: '800', color: '#fff' },

  list: { paddingHorizontal: theme.space.lg, paddingTop: s(8), paddingBottom: theme.space.xl, gap: theme.space.md, flexGrow: 1 },
  countRow: { flexDirection: 'row', alignItems: 'center', gap: s(5), marginBottom: s(10) },
  count: { fontSize: ms(13), fontWeight: '600' },

  filterBackdrop: { ...StyleSheet.absoluteFillObject },
  filterPanel: {
    position: 'absolute', left: 0, right: 0, bottom: 0, top: '18%',
    borderTopLeftRadius: s(22), borderTopRightRadius: s(22), overflow: 'hidden', ...theme.shadow.navy,
  },
  filterHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: s(18), paddingVertical: s(14), borderBottomWidth: 1,
  },
  filterTitle: { fontSize: ms(17), fontWeight: '800' },
  filterHeaderRight: { flexDirection: 'row', alignItems: 'center', gap: s(16) },
  resetText: { fontSize: ms(13.5), fontWeight: '700' },
  filterBody: { padding: s(18), gap: s(14) },
  priceLabel: { fontSize: ms(12.5), fontWeight: '700', marginBottom: s(6) },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: s(8) },
  priceInput: { flex: 1, height: s(48), borderWidth: 1, borderRadius: theme.radius.lg, paddingHorizontal: s(14), fontSize: ms(14.5) },
  filterFooter: { padding: s(18), paddingTop: s(10) },
});
