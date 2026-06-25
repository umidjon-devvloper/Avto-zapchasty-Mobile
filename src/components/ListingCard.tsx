import { Pressable, View, Text, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useColors } from '../theme/useColors';
import { theme, s, ms, CONDITION_LABELS } from '../theme';
import { formatPrice, timeAgo } from '../lib/format';
import { resolveImage } from '../lib/image';
import type { Listing } from '../lib/types';

type Variant = 'row' | 'grid';

export function ListingCard({ listing, variant = 'row' }: { listing: Listing; variant?: Variant }) {
  if (variant === 'grid') return <GridCard listing={listing} />;
  return <RowCard listing={listing} />;
}

function GridCard({ listing }: { listing: Listing }) {
  const photo = listing.photos?.[0];
  const colors = useColors();
  return (
    <Pressable
      onPress={() => router.push(`/listing/${listing._id}`)}
      style={({ pressed }) => [
        styles.gCard,
        { backgroundColor: colors.card, borderColor: colors.border },
        pressed && styles.pressed,
      ]}
    >
      <View style={[styles.gImgWrap, { backgroundColor: colors.surface }]}>
        {photo ? (
          <Image source={{ uri: resolveImage(photo) }} style={styles.gImg} contentFit="cover" transition={180} />
        ) : (
          <View style={styles.gImgEmpty}>
            <Ionicons name="image-outline" size={ms(28)} color={colors.faint} />
          </View>
        )}
        <LinearGradient colors={['transparent', 'rgba(9,16,40,0.55)']} style={styles.gImgGrad} pointerEvents="none" />
        <View style={styles.condTag}>
          <Text style={styles.condTagText}>{CONDITION_LABELS[listing.condition] || listing.condition}</Text>
        </View>
        {listing.delivery && (
          <View style={[styles.deliveryTag, { backgroundColor: colors.successSoft, borderColor: colors.success + '40' }]}>
            <Ionicons name="bicycle" size={ms(10)} color={colors.success} />
          </View>
        )}
      </View>

      <View style={styles.gInfo}>
        <Text style={[styles.gPrice, { color: colors.text }]}>
          {formatPrice(listing.price.amount, listing.price.currency)}
        </Text>
        <Text numberOfLines={2} style={[styles.gTitle, { color: colors.inkSoft }]}>{listing.title}</Text>
        <View style={styles.gFoot}>
          <Ionicons name="location-outline" size={ms(11)} color={colors.faint} />
          <Text numberOfLines={1} style={[styles.gMeta, { color: colors.faint }]}>
            {listing.city || "O'zbekiston"}
          </Text>
          <View style={[styles.dot, { backgroundColor: colors.faint }]} />
          <Text style={[styles.gMeta, { color: colors.faint }]}>{timeAgo(listing.createdAt)}</Text>
        </View>
      </View>
    </Pressable>
  );
}

function RowCard({ listing }: { listing: Listing }) {
  const photo = listing.photos?.[0];
  const colors = useColors();
  return (
    <Pressable
      onPress={() => router.push(`/listing/${listing._id}`)}
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: colors.card, borderColor: colors.border },
        pressed && styles.pressed,
      ]}
    >
      <View style={[styles.imgWrap, { backgroundColor: colors.surface }]}>
        {photo ? (
          <Image source={{ uri: resolveImage(photo) }} style={styles.img} contentFit="cover" transition={150} />
        ) : (
          <View style={styles.imgFallback}>
            <Ionicons name="image-outline" size={ms(24)} color={colors.faint} />
          </View>
        )}
        {listing.delivery && (
          <View style={[styles.deliveryBadge, { backgroundColor: colors.success }]}>
            <Ionicons name="bicycle" size={ms(10)} color="#fff" />
          </View>
        )}
      </View>

      <View style={styles.info}>
        <Text numberOfLines={2} style={[styles.title, { color: colors.text }]}>{listing.title}</Text>
        <Text style={[styles.price, { color: colors.ink }]}>
          {formatPrice(listing.price.amount, listing.price.currency)}
        </Text>
        <View style={styles.meta}>
          <View style={[styles.condChip, { backgroundColor: colors.primarySoft }]}>
            <Text style={[styles.condChipText, { color: colors.primaryDark }]}>
              {CONDITION_LABELS[listing.condition] || listing.condition}
            </Text>
          </View>
          {listing.city ? (
            <View style={styles.cityRow}>
              <Ionicons name="location-outline" size={ms(12)} color={colors.faint} />
              <Text style={[styles.city, { color: colors.faint }]} numberOfLines={1}>{listing.city}</Text>
            </View>
          ) : null}
        </View>
      </View>

      <Ionicons name="chevron-forward" size={ms(15)} color={colors.faint} style={styles.rowChevron} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressed: { opacity: 0.9, transform: [{ scale: 0.98 }] },

  gCard: {
    flex: 1,
    borderRadius: theme.radius.xl,
    overflow: 'hidden',
    borderWidth: 1,
    ...theme.shadow.sm,
  },
  gImgWrap: { width: '100%', aspectRatio: 1 },
  gImg: { width: '100%', height: '100%' },
  gImgEmpty: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  gImgGrad: { position: 'absolute', bottom: 0, left: 0, right: 0, height: '50%' },

  condTag: {
    position: 'absolute', top: s(8), left: s(8),
    backgroundColor: 'rgba(9,16,40,0.72)',
    paddingHorizontal: s(8), paddingVertical: s(3), borderRadius: 999,
  },
  condTagText: { color: '#fff', fontSize: ms(10), fontWeight: '800', letterSpacing: 0.3 },

  deliveryTag: {
    position: 'absolute', top: s(8), right: s(8),
    width: s(22), height: s(22), borderRadius: s(11),
    alignItems: 'center', justifyContent: 'center', borderWidth: 1,
  },

  gInfo: { padding: s(10), gap: s(4) },
  gPrice: { fontSize: ms(15.5), fontWeight: '900', fontVariant: ['tabular-nums'], letterSpacing: -0.3 },
  gTitle: { fontSize: ms(12.5), fontWeight: '500', lineHeight: ms(17), minHeight: s(34) },
  gFoot: { flexDirection: 'row', alignItems: 'center', gap: s(3), marginTop: s(2) },
  gMeta: { fontSize: ms(10.5), fontWeight: '500', flexShrink: 1 },
  dot: { width: s(3), height: s(3), borderRadius: 2 },

  card: {
    flexDirection: 'row', alignItems: 'center', gap: theme.space.md,
    borderRadius: theme.radius.xl, padding: s(10), borderWidth: 1, ...theme.shadow.sm,
  },
  imgWrap: { width: s(86), height: s(86), borderRadius: theme.radius.lg, overflow: 'hidden' },
  img: { width: '100%', height: '100%' },
  imgFallback: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  deliveryBadge: {
    position: 'absolute', top: s(4), right: s(4),
    width: s(18), height: s(18), borderRadius: s(9),
    alignItems: 'center', justifyContent: 'center',
  },

  info: { flex: 1, justifyContent: 'space-between', paddingVertical: s(2), gap: s(5) },
  title: { fontSize: ms(14.5), fontWeight: '600', lineHeight: ms(19) },
  price: { fontSize: ms(16.5), fontWeight: '900', fontVariant: ['tabular-nums'], letterSpacing: -0.3 },
  meta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: s(8) },
  condChip: { paddingHorizontal: s(9), paddingVertical: s(3), borderRadius: 999 },
  condChipText: { fontSize: ms(11), fontWeight: '800' },
  cityRow: { flexDirection: 'row', alignItems: 'center', gap: s(2), flex: 1, justifyContent: 'flex-end' },
  city: { fontSize: ms(11.5), fontWeight: '500' },
  rowChevron: { marginLeft: s(2) },
});
