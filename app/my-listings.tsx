import { useQuery } from '@tanstack/react-query';
import { FlatList, View, Text, Pressable, StyleSheet, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { api } from '../src/lib/api';
import { theme, STATUS_LABELS, s, ms } from '../src/theme';
import { resolveImage } from '../src/lib/image';
import { formatPrice } from '../src/lib/format';
import { Badge } from '../src/components/Badge';
import { Loading } from '../src/components/Loading';
import { EmptyState } from '../src/components/EmptyState';

const STATUS_ICON: Record<string, keyof typeof Ionicons.glyphMap> = {
  active: 'checkmark-circle',
  pending: 'time',
  rejected: 'close-circle',
  sold: 'bag-check',
  draft: 'document',
  archived: 'archive',
};

export default function MyListings() {
  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['my-listings'],
    queryFn: () => api.myListings({ limit: 50 }),
  });

  const items = data?.items ?? [];
  const activeCount = items.filter((i: any) => i.status === 'active').length;

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
            <Pressable
              style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.7 }]}
              onPress={() => router.back()}
              hitSlop={10}
            >
              <Ionicons name="arrow-back" size={ms(20)} color="#fff" />
            </Pressable>
            <View style={styles.headerCenter}>
              <Text style={styles.headerTitle}>Mening e'lonlarim</Text>
              {activeCount > 0 && (
                <Text style={styles.headerSub}>{activeCount} ta faol e'lon</Text>
              )}
            </View>
            <Pressable
              style={({ pressed }) => [styles.addBtn, pressed && { opacity: 0.8 }]}
              onPress={() => router.push('/create-listing')}
            >
              <Ionicons name="add" size={ms(22)} color="#fff" />
            </Pressable>
          </View>

          {/* Stats strip */}
          {items.length > 0 && (
            <View style={styles.statsStrip}>
              {[
                { key: 'active', label: 'Faol', color: theme.colors.success },
                { key: 'pending', label: 'Tekshiruvda', color: theme.colors.star },
                { key: 'sold', label: 'Sotilgan', color: theme.colors.brand },
              ].map((s) => {
                const cnt = items.filter((i: any) => i.status === s.key).length;
                return (
                  <View key={s.key} style={styles.statItem}>
                    <Text style={[styles.statNum, { color: '#fff' }]}>{cnt}</Text>
                    <Text style={styles.statLabel}>{s.label}</Text>
                  </View>
                );
              })}
            </View>
          )}
        </SafeAreaView>
      </LinearGradient>

      {isLoading ? (
        <Loading />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(it) => it._id}
          renderItem={({ item }) => {
            const tone: 'success' | 'danger' | 'neutral' =
              item.status === 'active' ? 'success'
                : item.status === 'rejected' ? 'danger'
                  : 'neutral';
            const iconName = STATUS_ICON[item.status] ?? 'ellipse-outline';

            return (
              <Pressable
                style={({ pressed }) => [
                  styles.row,
                  pressed && { opacity: 0.9, transform: [{ scale: 0.995 }] },
                ]}
                onPress={() => router.push(`/listing/${item._id}`)}
              >
                <View style={styles.imgWrap}>
                  {item.photos?.[0] ? (
                    <Image
                      source={{ uri: resolveImage(item.photos[0]) }}
                      style={styles.img}
                      contentFit="cover"
                      transition={120}
                    />
                  ) : (
                    <View style={styles.imgFallback}>
                      <Ionicons name="image-outline" size={ms(22)} color={theme.colors.faint} />
                    </View>
                  )}
                  {item.status === 'active' && (
                    <View style={styles.activeDot} />
                  )}
                </View>

                <View style={styles.info}>
                  <Text numberOfLines={2} style={styles.title}>{item.title}</Text>
                  <Text style={styles.price}>
                    {formatPrice(item.price.amount, item.price.currency)}
                  </Text>
                  <View style={styles.bottomRow}>
                    <Badge label={STATUS_LABELS[item.status] || item.status} tone={tone} />
                    {item.views != null && (
                      <View style={styles.viewRow}>
                        <Ionicons name="eye-outline" size={ms(12)} color={theme.colors.faint} />
                        <Text style={styles.viewText}>{item.views}</Text>
                      </View>
                    )}
                  </View>
                </View>

                <Ionicons name="chevron-forward" size={ms(17)} color={theme.colors.faint} />
              </Pressable>
            );
          }}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <EmptyState icon="pricetags-outline" text="Hali e'lon bermagansiz" />
              <Pressable
                style={({ pressed }) => [styles.createBtn, pressed && { opacity: 0.85 }]}
                onPress={() => router.push('/create-listing')}
              >
                <LinearGradient
                  colors={theme.gradients.primary}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.createFill}
                >
                  <Ionicons name="add-circle-outline" size={ms(18)} color="#fff" />
                  <Text style={styles.createText}>Birinchi e'lonni berish</Text>
                </LinearGradient>
              </Pressable>
            </View>
          }
          refreshing={isRefetching}
          onRefresh={refetch}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.colors.bg },

  header: {
    paddingHorizontal: s(16),
    paddingBottom: s(16),
    borderBottomLeftRadius: s(24),
    borderBottomRightRadius: s(24),
    ...theme.shadow.navy,
  },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: s(12), paddingTop: s(6) },
  backBtn: {
    width: s(36),
    height: s(36),
    borderRadius: s(18),
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: { flex: 1 },
  headerTitle: { fontSize: ms(18), fontWeight: '800', color: '#fff', letterSpacing: -0.2 },
  headerSub: { fontSize: ms(12), color: 'rgba(255,255,255,0.65)', marginTop: s(2) },
  addBtn: {
    width: s(36),
    height: s(36),
    borderRadius: s(18),
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.shadow.brand,
  },

  statsStrip: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: theme.radius.lg,
    marginTop: s(14),
    paddingVertical: s(12),
    paddingHorizontal: s(8),
  },
  statItem: { flex: 1, alignItems: 'center', gap: s(2) },
  statNum: { fontSize: ms(18), fontWeight: '900', color: '#fff' },
  statLabel: { fontSize: ms(11), color: 'rgba(255,255,255,0.65)', fontWeight: '500' },

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

  imgWrap: {
    width: s(72),
    height: s(72),
    borderRadius: theme.radius.lg,
    overflow: 'hidden',
    backgroundColor: theme.colors.surface,
  },
  img: { width: '100%', height: '100%' },
  imgFallback: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  activeDot: {
    position: 'absolute',
    right: s(5),
    top: s(5),
    width: s(10),
    height: s(10),
    borderRadius: s(5),
    backgroundColor: theme.colors.success,
    borderWidth: 1.5,
    borderColor: '#fff',
  },

  info: { flex: 1, gap: s(4) },
  title: { fontSize: ms(14.5), fontWeight: '600', color: theme.colors.text, lineHeight: ms(19) },
  price: {
    fontSize: ms(16),
    fontWeight: '800',
    color: theme.colors.ink,
    fontVariant: ['tabular-nums'],
  },
  bottomRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  viewRow: { flexDirection: 'row', alignItems: 'center', gap: s(3) },
  viewText: { fontSize: ms(11), color: theme.colors.faint, fontWeight: '500' },

  emptyWrap: { flex: 1, alignItems: 'center' },
  createBtn: {
    borderRadius: theme.radius.lg,
    overflow: 'hidden',
    marginTop: s(8),
    ...theme.shadow.brand,
  },
  createFill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(8),
    paddingHorizontal: s(24),
    height: s(50),
  },
  createText: { fontSize: ms(15), fontWeight: '800', color: '#fff' },
});
