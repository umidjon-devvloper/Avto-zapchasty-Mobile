import { useQuery, useMutation } from '@tanstack/react-query';
import {
  View, Text, ScrollView, StyleSheet, useWindowDimensions, Linking, Pressable, Alert, Modal, TextInput,
  type NativeSyntheticEvent, type NativeScrollEvent,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, router } from 'expo-router';
import { useState } from 'react';
import { api, errMessage } from '../../src/lib/api';
import { useAuth } from '../../src/lib/auth';
import { theme, s, ms, CONDITION_LABELS, REPORT_REASONS } from '../../src/theme';
import { formatPrice, formatDate } from '../../src/lib/format';
import { resolveImage } from '../../src/lib/image';
import { Loading } from '../../src/components/Loading';

type IconName = keyof typeof Ionicons.glyphMap;

export default function ListingDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const token = useAuth((s) => s.accessToken);
  const { data, isLoading } = useQuery({ queryKey: ['listing', id], queryFn: () => api.getListing(id) });
  const [fav, setFav] = useState<boolean | null>(null);
  const [starting, setStarting] = useState(false);
  const [photoIdx, setPhotoIdx] = useState(0);
  const myId = useAuth((s) => s.user?._id ?? s.user?.id);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reportComment, setReportComment] = useState('');
  const [reportSending, setReportSending] = useState(false);

  const toggle = useMutation({
    mutationFn: () => api.toggleFavorite(id),
    onSuccess: (r) => setFav(r.isFavorite),
  });

  if (isLoading || !data) return <Loading />;
  const l = data.listing;
  const isFav = fav ?? data.isFavorite;
  const phone = l.phone || l.sellerId?.phone;
  const photos = l.photos ?? [];
  const heroH = Math.round(width * 0.92);

  const fitment = [
    typeof l.fitment?.brandId === 'object' ? l.fitment?.brandId?.name : undefined,
    typeof l.fitment?.modelId === 'object' ? l.fitment?.modelId?.name : undefined,
  ].filter(Boolean).join(' · ');

  const onFavorite = () => {
    if (!token) { router.push('/auth/login'); return; }
    toggle.mutate();
  };
  const onCall = async () => {
    if (!phone) { Alert.alert('Telefon raqami ko\'rsatilmagan'); return; }
    const url = `tel:${phone}`;
    const supported = await Linking.canOpenURL(url);
    if (supported) {
      await Linking.openURL(url);
    } else {
      Alert.alert('Qo\'ng\'iroq qilib bo\'lmadi', `Raqam: ${phone}`);
    }
  };
  const onWrite = async () => {
    if (!token) { router.push('/auth/login'); return; }
    if (l.sellerId && myId && l.sellerId._id === myId) { Alert.alert("Bu sizning e'loningiz"); return; }
    setStarting(true);
    try {
      const cid = await api.startConversation(l._id);
      router.push(`/chat/${cid}`);
    } catch (e) { Alert.alert('Xatolik', errMessage(e)); }
    finally { setStarting(false); }
  };
  const openReport = () => {
    if (!token) { router.push('/auth/login'); return; }
    setReportReason(''); setReportComment(''); setReportOpen(true);
  };
  const submitReport = async () => {
    if (!reportReason) return;
    setReportSending(true);
    try {
      await api.report(l._id, reportReason, reportComment);
      setReportOpen(false);
      Alert.alert('Rahmat', "Shikoyatingiz yuborildi. Administratorlar ko'rib chiqadi.");
    } catch (e) { Alert.alert('Xatolik', errMessage(e)); }
    finally { setReportSending(false); }
  };
  const onPhotoScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const i = Math.round(e.nativeEvent.contentOffset.x / width);
    if (i !== photoIdx) setPhotoIdx(i);
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.bg }}>
      <StatusBar style="light" />

      <ScrollView contentContainerStyle={{ paddingBottom: s(28) }} showsVerticalScrollIndicator={false}>
        {/* ── Galereya ── */}
        <View style={{ height: heroH, backgroundColor: theme.colors.brandDark }}>
          {photos.length > 0 ? (
            <ScrollView
              horizontal pagingEnabled showsHorizontalScrollIndicator={false}
              onMomentumScrollEnd={onPhotoScroll} scrollEventThrottle={16}
            >
              {photos.map((p: string, i: number) => (
                <Image key={i} source={{ uri: resolveImage(p) }} style={{ width, height: heroH }} contentFit="cover" transition={160} />
              ))}
            </ScrollView>
          ) : (
            <View style={[styles.noImg, { width, height: heroH }]}>
              <Ionicons name="image-outline" size={ms(56)} color={theme.colors.faint} />
            </View>
          )}

          {/* Tepa gradient — tugmalar o'qiladigan bo'lishi uchun */}
          <LinearGradient
            colors={['rgba(9,16,40,0.5)', 'transparent']}
            style={[styles.topScrim, { height: insets.top + s(70) }]}
            pointerEvents="none"
          />

          {/* Rasm hisoblagichi */}
          {photos.length > 1 && (
            <View style={styles.counter}>
              <Ionicons name="images-outline" size={ms(13)} color="#fff" />
              <Text style={styles.counterText}>{photoIdx + 1}/{photos.length}</Text>
            </View>
          )}

          {/* Nuqtalar */}
          {photos.length > 1 && (
            <View style={styles.dots}>
              {photos.map((_: string, i: number) => (
                <View key={i} style={[styles.dot, i === photoIdx && styles.dotActive]} />
              ))}
            </View>
          )}
        </View>

        {/* ── Kontent (galereya ustiga chiqadi) ── */}
        <View style={styles.sheet}>
          <Text style={styles.price}>{formatPrice(l.price.amount, l.price.currency)}</Text>
          <Text style={styles.title}>{l.title}</Text>

          <View style={styles.badgeRow}>
            <View style={styles.condPill}>
              <Ionicons name="pricetag" size={ms(12)} color={theme.colors.primaryDark} />
              <Text style={styles.condPillText}>{CONDITION_LABELS[l.condition] || l.condition}</Text>
            </View>
            {l.delivery ? (
              <View style={[styles.tagPill, { backgroundColor: theme.colors.successSoft }]}>
                <Ionicons name="cube-outline" size={ms(12)} color={theme.colors.success} />
                <Text style={[styles.tagPillText, { color: theme.colors.success }]}>Yetkazib berish</Text>
              </View>
            ) : null}
          </View>

          {/* Statistika */}
          <View style={styles.statsRow}>
            <Stat icon="eye-outline" label="Ko'rishlar" value={String(l.views)} />
            <View style={styles.statDivider} />
            <Stat icon="location-outline" label="Shahar" value={l.city || '—'} />
            <View style={styles.statDivider} />
            <Stat icon="time-outline" label="Sana" value={formatDate(l.createdAt)} />
          </View>

          {/* OEM */}
          {l.oemNumbers && l.oemNumbers.length > 0 && (
            <View style={styles.oemBox}>
              <View style={styles.oemHead}>
                <Ionicons name="barcode-outline" size={ms(15)} color={theme.colors.primaryDark} />
                <Text style={styles.oemLabel}>OEM / Artikul</Text>
              </View>
              <View style={styles.oemChips}>
                {l.oemNumbers.map((n: string, i: number) => (
                  <View key={i} style={styles.oemChip}><Text style={styles.oemChipText}>{n}</Text></View>
                ))}
              </View>
            </View>
          )}

          {/* Tafsilotlar */}
          {(fitment || l.manufacturer || l.partTypeId?.name) && (
            <View style={styles.specCard}>
              <Text style={styles.sectionTitle}>Tafsilotlar</Text>
              {l.partTypeId?.name ? <SpecRow icon="construct-outline" label="Detal turi" value={l.partTypeId.name} /> : null}
              {l.manufacturer ? <SpecRow icon="business-outline" label="Ishlab chiqaruvchi" value={l.manufacturer} /> : null}
              {fitment ? <SpecRow icon="car-sport-outline" label="Moslik" value={fitment} last /> : null}
            </View>
          )}

          {/* Tavsif */}
          {l.description ? (
            <View style={styles.descCard}>
              <Text style={styles.sectionTitle}>Tavsif</Text>
              <Text style={styles.desc}>{l.description}</Text>
            </View>
          ) : null}

          {/* Sotuvchi */}
          <Text style={[styles.sectionTitle, { marginTop: 18, marginBottom: 8 }]}>Sotuvchi</Text>
          <View style={styles.seller}>
            <View style={styles.sellerAvatar}><Ionicons name="storefront-outline" size={ms(22)} color={theme.colors.brand} /></View>
            <View style={{ flex: 1 }}>
              <Text style={styles.sellerName} numberOfLines={1}>{l.sellerId?.sellerProfile?.shopName || l.sellerId?.name || 'Sotuvchi'}</Text>
              <Text style={styles.sellerPhone}>{phone || 'Raqam ko\'rsatilmagan'}</Text>
            </View>
            <View style={styles.verifiedBadge}>
              <Ionicons name="shield-checkmark" size={ms(14)} color={theme.colors.brand} />
            </View>
          </View>

          <Pressable style={({ pressed }) => [styles.reportLink, pressed && { opacity: 0.6 }]} onPress={openReport}>
            <Ionicons name="flag-outline" size={ms(15)} color={theme.colors.muted} />
            <Text style={styles.reportText}>Shikoyat qilish</Text>
          </Pressable>
        </View>
      </ScrollView>

      {/* ── Suzuvchi tepa tugmalar ── */}
      <View style={[styles.topBar, { top: insets.top + s(6) }]} pointerEvents="box-none">
        <Pressable style={({ pressed }) => [styles.circleBtn, pressed && styles.circlePressed]} onPress={() => router.back()} hitSlop={6}>
          <Ionicons name="chevron-back" size={ms(22)} color={theme.colors.text} />
        </Pressable>
        <Pressable style={({ pressed }) => [styles.circleBtn, pressed && styles.circlePressed]} onPress={onFavorite} hitSlop={6}>
          <Ionicons name={isFav ? 'heart' : 'heart-outline'} size={ms(21)} color={isFav ? theme.colors.danger : theme.colors.text} />
        </Pressable>
      </View>

      {/* ── Pastki amal paneli ── */}
      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, s(12)) + s(8) }]}>
        <Pressable style={({ pressed }) => [styles.writeBtn, pressed && { opacity: 0.85 }]} onPress={onWrite} disabled={starting}>
          <Ionicons name="chatbubble-ellipses-outline" size={ms(20)} color={theme.colors.brand} />
          <Text style={styles.writeText}>Yozish</Text>
        </Pressable>
        <Pressable style={({ pressed }) => [styles.callBtn, pressed && { opacity: 0.92, transform: [{ scale: 0.99 }] }]} onPress={onCall}>
          <LinearGradient colors={theme.gradients.primary} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.callFill}>
            <Ionicons name="call" size={ms(19)} color={theme.colors.onPrimary} />
            <Text style={styles.callText}>Qo'ng'iroq</Text>
          </LinearGradient>
        </Pressable>
      </View>

      <Modal visible={reportOpen} animationType="slide" transparent onRequestClose={() => setReportOpen(false)}>
        <Pressable style={styles.reportBackdrop} onPress={() => setReportOpen(false)} />
        <View style={styles.reportSheet}>
          <View style={styles.sheetHandle} />
          <Text style={styles.reportTitle}>Shikoyat sababi</Text>
          <View style={styles.reasonWrap}>
            {REPORT_REASONS.map((r) => (
              <Pressable key={r.value} onPress={() => setReportReason(r.value)}
                style={[styles.reasonChip, reportReason === r.value && styles.reasonChipActive]}>
                <Text style={[styles.reasonText, reportReason === r.value && styles.reasonTextActive]}>{r.label}</Text>
              </Pressable>
            ))}
          </View>
          <TextInput style={styles.reportInput} placeholder="Izoh (ixtiyoriy)" placeholderTextColor={theme.colors.muted}
            value={reportComment} onChangeText={setReportComment} multiline />
          <Pressable style={[styles.reportSubmit, (!reportReason || reportSending) && { opacity: 0.5 }]}
            onPress={submitReport} disabled={!reportReason || reportSending}>
            <Text style={styles.reportSubmitText}>Yuborish</Text>
          </Pressable>
        </View>
      </Modal>
    </View>
  );
}

function Stat({ icon, label, value }: { icon: IconName; label: string; value: string }) {
  return (
    <View style={styles.stat}>
      <Ionicons name={icon} size={ms(17)} color={theme.colors.brand} />
      <Text style={styles.statValue} numberOfLines={1}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function SpecRow({ icon, label, value, last }: { icon: IconName; label: string; value: string; last?: boolean }) {
  return (
    <View style={[styles.specRow, last && { borderBottomWidth: 0 }]}>
      <Ionicons name={icon} size={ms(17)} color={theme.colors.muted} />
      <Text style={styles.specLabel}>{label}</Text>
      <Text style={styles.specValue} numberOfLines={2}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  noImg: { alignItems: 'center', justifyContent: 'center' },
  topScrim: { position: 'absolute', top: 0, left: 0, right: 0 },

  counter: {
    position: 'absolute', bottom: s(28), right: s(14), flexDirection: 'row', alignItems: 'center', gap: s(4),
    backgroundColor: 'rgba(9,16,40,0.6)', paddingHorizontal: s(10), paddingVertical: s(5), borderRadius: theme.radius.pill,
  },
  counterText: { color: '#fff', fontSize: ms(12), fontWeight: '700', fontVariant: ['tabular-nums'] },
  dots: { position: 'absolute', bottom: s(30), left: 0, right: 0, flexDirection: 'row', justifyContent: 'center', gap: s(5) },
  dot: { width: s(6), height: s(6), borderRadius: s(3), backgroundColor: 'rgba(255,255,255,0.45)' },
  dotActive: { width: s(18), backgroundColor: '#fff' },

  // Tepa suzuvchi tugmalar
  topBar: { position: 'absolute', left: theme.space.lg, right: theme.space.lg, flexDirection: 'row', justifyContent: 'space-between' },
  circleBtn: {
    width: s(42), height: s(42), borderRadius: s(21), backgroundColor: 'rgba(255,255,255,0.92)',
    alignItems: 'center', justifyContent: 'center', ...theme.shadow.md,
  },
  circlePressed: { backgroundColor: '#fff', transform: [{ scale: 0.94 }] },

  // Ustiga chiqadigan kontent karta
  sheet: {
    marginTop: s(-22), backgroundColor: theme.colors.bg,
    borderTopLeftRadius: s(26), borderTopRightRadius: s(26),
    paddingHorizontal: theme.space.lg, paddingTop: s(20),
  },
  price: { fontSize: ms(28), fontWeight: '900', color: theme.colors.text, fontVariant: ['tabular-nums'], letterSpacing: -0.5 },
  title: { fontSize: ms(18), fontWeight: '600', color: theme.colors.inkSoft, lineHeight: ms(25), marginTop: s(4) },
  badgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: s(8), marginTop: s(12) },
  condPill: { flexDirection: 'row', alignItems: 'center', gap: s(5), backgroundColor: theme.colors.primarySoft, paddingHorizontal: s(11), paddingVertical: s(6), borderRadius: theme.radius.pill },
  condPillText: { fontSize: ms(12.5), fontWeight: '700', color: theme.colors.primaryDark },
  tagPill: { flexDirection: 'row', alignItems: 'center', gap: s(5), paddingHorizontal: s(11), paddingVertical: s(6), borderRadius: theme.radius.pill },
  tagPillText: { fontSize: ms(12.5), fontWeight: '700' },

  statsRow: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: theme.colors.card, borderRadius: theme.radius.lg,
    borderWidth: 1, borderColor: theme.colors.border, paddingVertical: s(14), marginTop: s(16), ...theme.shadow.sm,
  },
  stat: { flex: 1, alignItems: 'center', gap: s(3), paddingHorizontal: s(4) },
  statValue: { fontSize: ms(14), fontWeight: '800', color: theme.colors.text, marginTop: s(2) },
  statLabel: { fontSize: ms(11), color: theme.colors.faint, fontWeight: '500' },
  statDivider: { width: 1, height: s(34), backgroundColor: theme.colors.border },

  oemBox: { backgroundColor: theme.colors.card, borderRadius: theme.radius.lg, borderWidth: 1, borderColor: theme.colors.border, padding: s(14), marginTop: s(16), ...theme.shadow.sm },
  oemHead: { flexDirection: 'row', alignItems: 'center', gap: s(6), marginBottom: s(10) },
  oemLabel: { fontSize: ms(12), color: theme.colors.muted, fontWeight: '700', letterSpacing: 0.3, textTransform: 'uppercase' },
  oemChips: { flexDirection: 'row', flexWrap: 'wrap', gap: s(8) },
  oemChip: { backgroundColor: theme.colors.surface, paddingHorizontal: s(12), paddingVertical: s(7), borderRadius: theme.radius.sm },
  oemChipText: { fontSize: ms(14), fontWeight: '700', color: theme.colors.ink, fontVariant: ['tabular-nums'] },

  sectionTitle: { fontSize: ms(16), fontWeight: '800', color: theme.colors.text, letterSpacing: -0.2 },
  specCard: { backgroundColor: theme.colors.card, borderRadius: theme.radius.lg, borderWidth: 1, borderColor: theme.colors.border, paddingHorizontal: s(14), paddingTop: s(14), paddingBottom: s(2), marginTop: s(16), ...theme.shadow.sm },
  specRow: { flexDirection: 'row', alignItems: 'center', gap: s(10), paddingVertical: s(13), borderBottomWidth: 1, borderBottomColor: theme.colors.hairline },
  specLabel: { fontSize: ms(14), color: theme.colors.muted },
  specValue: { fontSize: ms(14), fontWeight: '700', color: theme.colors.text, flex: 1, textAlign: 'right' },

  descCard: { marginTop: s(18) },
  desc: { fontSize: ms(15), color: theme.colors.inkSoft, lineHeight: ms(23), marginTop: s(8) },

  seller: {
    flexDirection: 'row', alignItems: 'center', gap: s(12), padding: s(14),
    backgroundColor: theme.colors.card, borderRadius: theme.radius.lg, borderWidth: 1, borderColor: theme.colors.border, ...theme.shadow.sm,
  },
  sellerAvatar: { width: s(48), height: s(48), borderRadius: s(24), backgroundColor: theme.colors.brandSoft, alignItems: 'center', justifyContent: 'center' },
  sellerName: { fontSize: ms(15.5), fontWeight: '800', color: theme.colors.text },
  sellerPhone: { fontSize: ms(13), color: theme.colors.muted, fontVariant: ['tabular-nums'], marginTop: s(2) },
  verifiedBadge: { width: s(30), height: s(30), borderRadius: s(15), backgroundColor: theme.colors.brandSoft, alignItems: 'center', justifyContent: 'center' },

  reportLink: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: s(6), paddingVertical: s(16), marginTop: s(6) },
  reportText: { fontSize: ms(13), color: theme.colors.muted, textDecorationLine: 'underline' },

  // Pastki panel
  footer: {
    flexDirection: 'row', gap: s(12), paddingHorizontal: theme.space.lg, paddingTop: s(12),
    borderTopWidth: 1, borderTopColor: theme.colors.border, backgroundColor: theme.colors.card,
  },
  writeBtn: {
    flexDirection: 'row', gap: s(7), alignItems: 'center', justifyContent: 'center', height: s(54), paddingHorizontal: s(20),
    borderWidth: 1.5, borderColor: theme.colors.border, borderRadius: theme.radius.lg, backgroundColor: theme.colors.card,
  },
  writeText: { color: theme.colors.brand, fontWeight: '800', fontSize: ms(15) },
  callBtn: { flex: 1, height: s(54), borderRadius: theme.radius.lg, overflow: 'hidden', ...theme.shadow.brand },
  callFill: { flex: 1, flexDirection: 'row', gap: s(8), alignItems: 'center', justifyContent: 'center' },
  callText: { color: theme.colors.onPrimary, fontWeight: '800', fontSize: ms(16) },

  // Shikoyat oynasi
  reportBackdrop: { flex: 1, backgroundColor: theme.colors.overlay },
  reportSheet: { backgroundColor: theme.colors.bg, borderTopLeftRadius: s(24), borderTopRightRadius: s(24), padding: theme.space.lg, paddingBottom: s(32), gap: s(14) },
  sheetHandle: { width: s(40), height: s(4), borderRadius: 2, backgroundColor: theme.colors.border, alignSelf: 'center', marginBottom: s(2) },
  reportTitle: { fontSize: ms(17), fontWeight: '800', color: theme.colors.text },
  reasonWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: s(8) },
  reasonChip: { paddingHorizontal: s(14), paddingVertical: s(9), borderRadius: theme.radius.pill, borderWidth: 1, borderColor: theme.colors.border, backgroundColor: theme.colors.card },
  reasonChipActive: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
  reasonText: { fontSize: ms(13), color: theme.colors.text },
  reasonTextActive: { color: theme.colors.onPrimary, fontWeight: '700' },
  reportInput: { minHeight: s(80), borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.radius.md, padding: s(12), fontSize: ms(15), color: theme.colors.text, backgroundColor: theme.colors.card, textAlignVertical: 'top' },
  reportSubmit: { height: s(52), borderRadius: theme.radius.lg, backgroundColor: theme.colors.primary, alignItems: 'center', justifyContent: 'center', ...theme.shadow.brand },
  reportSubmitText: { color: theme.colors.onPrimary, fontWeight: '800', fontSize: ms(16) },
});
