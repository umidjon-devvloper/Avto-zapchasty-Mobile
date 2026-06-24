import { Pressable, View, Text, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
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
  return (
    <Pressable
      onPress={() => router.push(`/listing/${listing._id}`)}
      style={({ pressed }) => [styles.gCard, pressed && styles.pressed]}
    >
      <View style={styles.gImgWrap}>
        {photo ? (
          <Image
            source={{ uri: resolveImage(photo) }}
            style={styles.gImg}
            contentFit="cover"
            transition={180}
          />
        ) : (
          <View style={styles.gImgEmpty}>
            <Ionicons name="image-outline" size={ms(28)} color={theme.colors.faint} />
          </View>
        )}

        {/* Bottom gradient overlay */}
        <LinearGradient
          colors={['transparent', 'rgba(9,16,40,0.55)']}
          style={styles.gImgGrad}
          pointerEvents="none"
        />

        {/* Condition tag */}
        <View style={styles.condTag}>
          <Text style={styles.condTagText}>
            {CONDITION_LABELS[listing.condition] || listing.condition}
          </Text>
        </View>

        {/* Delivery badge */}
        {listing.delivery && (
          <View style={styles.deliveryTag}>
            <Ionicons name="bicycle" size={ms(10)} color={theme.colors.success} />
          </View>
        )}
      </View>

      <View style={styles.gInfo}>
        <Text style={styles.gPrice}>
          {formatPrice(listing.price.amount, listing.price.currency)}
        </Text>
        <Text numberOfLines={2} style={styles.gTitle}>{listing.title}</Text>
        <View style={styles.gFoot}>
          <Ionicons name="location-outline" size={ms(11)} color={theme.colors.faint} />
          <Text numberOfLines={1} style={styles.gMeta}>
            {listing.city || "O'zbekiston"}
          </Text>
          <View style={styles.dot} />
          <Text style={styles.gMeta}>{timeAgo(listing.createdAt)}</Text>
        </View>
      </View>
    </Pressable>
  );
}

function RowCard({ listing }: { listing: Listing }) {
  const photo = listing.photos?.[0];
  return (
    <Pressable
      onPress={() => router.push(`/listing/${listing._id}`)}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <View style={styles.imgWrap}>
        {photo ? (
          <Image
            source={{ uri: resolveImage(photo) }}
            style={styles.img}
            contentFit="cover"
            transition={150}
          />
        ) : (
          <View style={styles.imgFallback}>
            <Ionicons name="image-outline" size={ms(24)} color={theme.colors.faint} />
          </View>
        )}
        {listing.delivery && (
          <View style={styles.deliveryBadge}>
            <Ionicons name="bicycle" size={ms(10)} color="#fff" />
          </View>
        )}
      </View>

      <View style={styles.info}>
        <Text numberOfLines={2} style={styles.title}>{listing.title}</Text>

        <Text style={styles.price}>
          {formatPrice(listing.price.amount, listing.price.currency)}
        </Text>

        <View style={styles.meta}>
          <View style={styles.condChip}>
            <Text style={styles.condChipText}>
              {CONDITION_LABELS[listing.condition] || listing.condition}
            </Text>
          </View>
          {listing.city ? (
            <View style={styles.cityRow}>
              <Ionicons name="location-outline" size={ms(12)} color={theme.colors.faint} />
              <Text style={styles.city} numberOfLines={1}>{listing.city}</Text>
            </View>
          ) : null}
        </View>
      </View>

      <Ionicons name="chevron-forward" size={ms(15)} color={theme.colors.faint} style={styles.rowChevron} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressed: { opacity: 0.9, transform: [{ scale: 0.98 }] },

  // ── Grid ──
  gCard: {
    flex: 1,
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadow.sm,
  },
  gImgWrap: { width: '100%', aspectRatio: 1, backgroundColor: theme.colors.surface },
  gImg: { width: '100%', height: '100%' },
  gImgEmpty: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  gImgGrad: { position: 'absolute', bottom: 0, left: 0, right: 0, height: '50%' },

  condTag: {
    position: 'absolute',
    top: s(8),
    left: s(8),
    backgroundColor: 'rgba(9,16,40,0.72)',
    paddingHorizontal: s(8),
    paddingVertical: s(3),
    borderRadius: theme.radius.pill,
  },
  condTagText: { color: '#fff', fontSize: ms(10), fontWeight: '800', letterSpacing: 0.3 },

  deliveryTag: {
    position: 'absolute',
    top: s(8),
    right: s(8),
    width: s(22),
    height: s(22),
    borderRadius: s(11),
    backgroundColor: theme.colors.successSoft,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.colors.success + '40',
  },

  gInfo: { padding: s(10), gap: s(4) },
  gPrice: {
    fontSize: ms(15.5),
    fontWeight: '900',
    color: theme.colors.text,
    fontVariant: ['tabular-nums'],
    letterSpacing: -0.3,
  },
  gTitle: { fontSize: ms(12.5), fontWeight: '500', color: theme.colors.inkSoft, lineHeight: ms(17), minHeight: s(34) },
  gFoot: { flexDirection: 'row', alignItems: 'center', gap: s(3), marginTop: s(2) },
  gMeta: { fontSize: ms(10.5), color: theme.colors.faint, fontWeight: '500', flexShrink: 1 },
  dot: { width: s(3), height: s(3), borderRadius: 2, backgroundColor: theme.colors.faint },

  // ── Row ──
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.space.md,
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.xl,
    padding: s(10),
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadow.sm,
  },
  imgWrap: {
    width: s(86),
    height: s(86),
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.surface,
    overflow: 'hidden',
  },
  img: { width: '100%', height: '100%' },
  imgFallback: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  deliveryBadge: {
    position: 'absolute',
    top: s(4),
    right: s(4),
    width: s(18),
    height: s(18),
    borderRadius: s(9),
    backgroundColor: theme.colors.success,
    alignItems: 'center',
    justifyContent: 'center',
  },

  info: { flex: 1, justifyContent: 'space-between', paddingVertical: s(2), gap: s(5) },
  title: { fontSize: ms(14.5), fontWeight: '600', color: theme.colors.text, lineHeight: ms(19) },
  price: {
    fontSize: ms(16.5),
    fontWeight: '900',
    color: theme.colors.ink,
    fontVariant: ['tabular-nums'],
    letterSpacing: -0.3,
  },
  meta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: s(8) },
  condChip: {
    backgroundColor: theme.colors.primarySoft,
    paddingHorizontal: s(9),
    paddingVertical: s(3),
    borderRadius: theme.radius.pill,
  },
  condChipText: { fontSize: ms(11), fontWeight: '800', color: theme.colors.primaryDark },
  cityRow: { flexDirection: 'row', alignItems: 'center', gap: s(2), flex: 1, justifyContent: 'flex-end' },
  city: { fontSize: ms(11.5), color: theme.colors.faint, fontWeight: '500' },
  rowChevron: { marginLeft: s(2) },
});
