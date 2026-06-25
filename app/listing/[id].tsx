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
import { useColors } from '../../src/theme/useColors';
import { theme, s, ms, CONDITION_LABELS, REPORT_REASONS } from '../../src/theme';
import { formatPrice, formatDate } from '../../src/lib/format';
import { resolveImage } from '../../src/lib/image';
import { Loading } from '../../src/components/Loading';

type IconName = keyof typeof Ionicons.glyphMap;

export default function ListingDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const colors = useColors();
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

  const toggle = useMutation({ mutationFn: () => api.toggleFavorite(id), onSuccess: (r) => setFav(r.isFavorite) });

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

  const onFavorite = () => { if (!token) { router.push('/auth/login'); return; } toggle.mutate(); };
  const onCall = async () => {
    if (!phone) { Alert.alert('Telefon raqami ko\'rsatilmagan'); return; }
    const url = `tel:${phone}`;
    if (await Linking.canOpenURL(url)) await Linking.openURL(url);
    else Alert.alert('Qo\'ng\'iroq qilib bo\'lmadi', `Raqam: ${phone}`);
  };
  const onWrite = async () => {
    if (!token) { router.push('/auth/login'); return; }
    if (l.sellerId && myId && l.sellerId._id === myId) { Alert.alert("Bu sizning e'loningiz"); return; }
    setStarting(true);
    try { const cid = await api.startConversation(l._id); router.push(`/chat/${cid}`); }
    catch (e) { Alert.alert('Xatolik', errMessage(e)); }
    finally { setStarting(false); }
  };
  const openReport = () => { if (!token) { router.push('/auth/login'); return; } setReportReason(''); setReportComment(''); setReportOpen(true); };
  const submitReport = async () => {
    if (!reportReason) return;
    setReportSending(true);
    try { await api.report(l._id, reportReason, reportComment); setReportOpen(false); Alert.alert('Rahmat', "Shikoyatingiz yuborildi. Administratorlar ko'rib chiqadi."); }
    catch (e) { Alert.alert('Xatolik', errMessage(e)); }
    finally { setReportSending(false); }
  };
  const onPhotoScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const i = Math.round(e.nativeEvent.contentOffset.x / width);
    if (i !== photoIdx) setPhotoIdx(i);
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <StatusBar style="light" />

      <ScrollView contentContainerStyle={{ paddingBottom: s(28) }} showsVerticalScrollIndicator={false}>
        <View style={{ height: heroH, backgroundColor: colors.brandDark }}>
          {photos.length > 0 ? (
            <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false} onMomentumScrollEnd={onPhotoScroll} scrollEventThrottle={16}>
              {photos.map((p: string, i: number) => (
                <Image key={i} source={{ uri: resolveImage(p) }} style={{ width, height: heroH }} contentFit="cover" transition={160} />
              ))}
            </ScrollView>
          ) : (
            <View style={[styles.noImg, { width, height: heroH }]}>
              <Ionicons name="image-outline" size={ms(56)} color={colors.faint} />
            </View>
          )}
          <LinearGradient colors={['rgba(9,16,40,0.5)', 'transparent']} style={[styles.topScrim, { height: insets.top + s(70) }]} pointerEvents="none" />
          {photos.length > 1 && (
            <View style={styles.counter}>
              <Ionicons name="images-outline" size={ms(13)} color="#fff" />
              <Text style={styles.counterText}>{photoIdx + 1}/{photos.length}</Text>
            </View>
          )}
          {photos.length > 1 && (
            <View style={styles.dots}>
              {photos.map((_: string, i: number) => (
                <View key={i} style={[styles.dot, i === photoIdx && styles.dotActive]} />
              ))}
            </View>
          )}
        </View>

        <View style={[styles.sheet, { backgroundColor: colors.bg }]}>
          <Text style={[styles.price, { color: colors.text }]}>{formatPrice(l.price.amount, l.price.currency)}</Text>
          <Text style={[styles.title, { color: colors.inkSoft }]}>{l.title}</Text>

          <View style={styles.badgeRow}>
            <View style={[styles.condPill, { backgroundColor: colors.primarySoft }]}>
              <Ionicons name="pricetag" size={ms(12)} color={colors.primaryDark} />
              <Text style={[styles.condPillText, { color: colors.primaryDark }]}>{CONDITION_LABELS[l.condition] || l.condition}</Text>
            </View>
            {l.delivery ? (
              <View style={[styles.tagPill, { backgroundColor: colors.successSoft }]}>
                <Ionicons name="cube-outline" size={ms(12)} color={colors.success} />
                <Text style={[styles.tagPillText, { color: colors.success }]}>Yetkazib berish</Text>
              </View>
            ) : null}
          </View>

          <View style={[styles.statsRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Stat icon="eye-outline" label="Ko'rishlar" value={String(l.views)} colors={colors} />
            <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
            <Stat icon="location-outline" label="Shahar" value={l.city || '—'} colors={colors} />
            <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
            <Stat icon="time-outline" label="Sana" value={formatDate(l.createdAt)} colors={colors} />
          </View>

          {l.oemNumbers && l.oemNumbers.length > 0 && (
            <View style={[styles.oemBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.oemHead}>
                <Ionicons name="barcode-outline" size={ms(15)} color={colors.primaryDark} />
                <Text style={[styles.oemLabel, { color: colors.muted }]}>OEM / Artikul</Text>
              </View>
              <View style={styles.oemChips}>
                {l.oemNumbers.map((n: string, i: number) => (
                  <View key={i} style={[styles.oemChip, { backgroundColor: colors.surface }]}>
                    <Text style={[styles.oemChipText, { color: colors.ink }]}>{n}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {(fitment || l.manufacturer || l.partTypeId?.name) && (
            <View style={[styles.specCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Tafsilotlar</Text>
              {l.partTypeId?.name ? <SpecRow icon="construct-outline" label="Detal turi" value={l.partTypeId.name} colors={colors} /> : null}
              {l.manufacturer ? <SpecRow icon="business-outline" label="Ishlab chiqaruvchi" value={l.manufacturer} colors={colors} /> : null}
              {fitment ? <SpecRow icon="car-sport-outline" label="Moslik" value={fitment} last colors={colors} /> : null}
            </View>
          )}

          {l.description ? (
            <View style={styles.descCard}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Tavsif</Text>
              <Text style={[styles.desc, { color: colors.inkSoft }]}>{l.description}</Text>
            </View>
          ) : null}

          <Text style={[styles.sectionTitle, { marginTop: 18, marginBottom: 8, color: colors.text }]}>Sotuvchi</Text>
          <View style={[styles.seller, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={[styles.sellerAvatar, { backgroundColor: colors.brandSoft }]}>
              <Ionicons name="storefront-outline" size={ms(22)} color={colors.ink} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.sellerName, { color: colors.text }]} numberOfLines={1}>
                {l.sellerId?.sellerProfile?.shopName || l.sellerId?.name || 'Sotuvchi'}
              </Text>
              <Text style={[styles.sellerPhone, { color: colors.muted }]}>{phone || 'Raqam ko\'rsatilmagan'}</Text>
            </View>
            <View style={[styles.verifiedBadge, { backgroundColor: colors.brandSoft }]}>
              <Ionicons name="shield-checkmark" size={ms(14)} color={colors.ink} />
            </View>
          </View>

          <Pressable style={({ pressed }) => [styles.reportLink, pressed && { opacity: 0.6 }]} onPress={openReport}>
            <Ionicons name="flag-outline" size={ms(15)} color={colors.muted} />
            <Text style={[styles.reportText, { color: colors.muted }]}>Shikoyat qilish</Text>
          </Pressable>
        </View>
      </ScrollView>

      <View style={[styles.topBar, { top: insets.top + s(6) }]} pointerEvents="box-none">
        <Pressable style={({ pressed }) => [styles.circleBtn, pressed && styles.circlePressed]} onPress={() => router.back()} hitSlop={6}>
          <Ionicons name="chevron-back" size={ms(22)} color={colors.text} />
        </Pressable>
        <Pressable style={({ pressed }) => [styles.circleBtn, pressed && styles.circlePressed]} onPress={onFavorite} hitSlop={6}>
          <Ionicons name={isFav ? 'heart' : 'heart-outline'} size={ms(21)} color={isFav ? colors.danger : colors.text} />
        </Pressable>
      </View>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, s(12)) + s(8), borderTopColor: colors.border, backgroundColor: colors.card }]}>
        <Pressable style={({ pressed }) => [styles.writeBtn, { borderColor: colors.border, backgroundColor: colors.card }, pressed && { opacity: 0.85 }]} onPress={onWrite} disabled={starting}>
          <Ionicons name="chatbubble-ellipses-outline" size={ms(20)} color={colors.ink} />
          <Text style={[styles.writeText, { color: colors.ink }]}>Yozish</Text>
        </Pressable>
        <Pressable style={({ pressed }) => [styles.callBtn, pressed && { opacity: 0.92, transform: [{ scale: 0.99 }] }]} onPress={onCall}>
          <LinearGradient colors={theme.gradients.primary} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.callFill}>
            <Ionicons name="call" size={ms(19)} color="#fff" />
            <Text style={styles.callText}>Qo'ng'iroq</Text>
          </LinearGradient>
        </Pressable>
      </View>

      <Modal visible={reportOpen} animationType="slide" transparent onRequestClose={() => setReportOpen(false)}>
        <Pressable style={[styles.reportBackdrop, { backgroundColor: colors.overlay }]} onPress={() => setReportOpen(false)} />
        <View style={[styles.reportSheet, { backgroundColor: colors.bg }]}>
          <View style={[styles.sheetHandle, { backgroundColor: colors.border }]} />
          <Text style={[styles.reportTitle, { color: colors.text }]}>Shikoyat sababi</Text>
          <View style={styles.reasonWrap}>
            {REPORT_REASONS.map((r) => (
              <Pressable
                key={r.value}
                onPress={() => setReportReason(r.value)}
                style={[
                  styles.reasonChip,
                  { borderColor: colors.border, backgroundColor: colors.card },
                  reportReason === r.value && { backgroundColor: colors.primary, borderColor: colors.primary },
                ]}
              >
                <Text style={[styles.reasonText, { color: colors.text }, reportReason === r.value && { color: '#fff', fontWeight: '700' }]}>
                  {r.label}
                </Text>
              </Pressable>
            ))}
          </View>
          <TextInput
            style={[styles.reportInput, { borderColor: colors.border, color: colors.text, backgroundColor: colors.card }]}
            placeholder="Izoh (ixtiyoriy)"
            placeholderTextColor={colors.muted}
            value={reportComment}
            onChangeText={setReportComment}
            multiline
          />
          <Pressable
            style={[styles.reportSubmit, { backgroundColor: colors.primary }, (!reportReason || reportSending) && { opacity: 0.5 }]}
            onPress={submitReport}
            disabled={!reportReason || reportSending}
          >
            <Text style={styles.reportSubmitText}>Yuborish</Text>
          </Pressable>
        </View>
      </Modal>
    </View>
  );
}

function Stat({ icon, label, value, colors }: { icon: IconName; label: string; value: string; colors: ReturnType<typeof useColors> }) {
  return (
    <View style={styles.stat}>
      <Ionicons name={icon} size={ms(17)} color={colors.ink} />
      <Text style={[styles.statValue, { color: colors.text }]} numberOfLines={1}>{value}</Text>
      <Text style={[styles.statLabel, { color: colors.faint }]}>{label}</Text>
    </View>
  );
}

function SpecRow({ icon, label, value, last, colors }: { icon: IconName; label: string; value: string; last?: boolean; colors: ReturnType<typeof useColors> }) {
  return (
    <View style={[styles.specRow, { borderBottomColor: colors.hairline }, last && { borderBottomWidth: 0 }]}>
      <Ionicons name={icon} size={ms(17)} color={colors.muted} />
      <Text style={[styles.specLabel, { color: colors.muted }]}>{label}</Text>
      <Text style={[styles.specValue, { color: colors.text }]} numberOfLines={2}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  noImg: { alignItems: 'center', justifyContent: 'center' },
  topScrim: { position: 'absolute', top: 0, left: 0, right: 0 },
  counter: {
    position: 'absolute', bottom: s(28), right: s(14), flexDirection: 'row', alignItems: 'center', gap: s(4),
    backgroundColor: 'rgba(9,16,40,0.6)', paddingHorizontal: s(10), paddingVertical: s(5), borderRadius: 999,
  },
  counterText: { color: '#fff', fontSize: ms(12), fontWeight: '700', fontVariant: ['tabular-nums'] },
  dots: { position: 'absolute', bottom: s(30), left: 0, right: 0, flexDirection: 'row', justifyContent: 'center', gap: s(5) },
  dot: { width: s(6), height: s(6), borderRadius: s(3), backgroundColor: 'rgba(255,255,255,0.45)' },
  dotActive: { width: s(18), backgroundColor: '#fff' },
  topBar: { position: 'absolute', left: theme.space.lg, right: theme.space.lg, flexDirection: 'row', justifyContent: 'space-between' },
  circleBtn: { width: s(42), height: s(42), borderRadius: s(21), backgroundColor: 'rgba(255,255,255,0.92)', alignItems: 'center', justifyContent: 'center', ...theme.shadow.md },
  circlePressed: { backgroundColor: '#fff', transform: [{ scale: 0.94 }] },
  sheet: { marginTop: s(-22), borderTopLeftRadius: s(26), borderTopRightRadius: s(26), paddingHorizontal: theme.space.lg, paddingTop: s(20) },
  price: { fontSize: ms(28), fontWeight: '900', fontVariant: ['tabular-nums'], letterSpacing: -0.5 },
  title: { fontSize: ms(18), fontWeight: '600', lineHeight: ms(25), marginTop: s(4) },
  badgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: s(8), marginTop: s(12) },
  condPill: { flexDirection: 'row', alignItems: 'center', gap: s(5), paddingHorizontal: s(11), paddingVertical: s(6), borderRadius: 999 },
  condPillText: { fontSize: ms(12.5), fontWeight: '700' },
  tagPill: { flexDirection: 'row', alignItems: 'center', gap: s(5), paddingHorizontal: s(11), paddingVertical: s(6), borderRadius: 999 },
  tagPillText: { fontSize: ms(12.5), fontWeight: '700' },
  statsRow: { flexDirection: 'row', alignItems: 'center', borderRadius: theme.radius.lg, borderWidth: 1, paddingVertical: s(14), marginTop: s(16), ...theme.shadow.sm },
  stat: { flex: 1, alignItems: 'center', gap: s(3), paddingHorizontal: s(4) },
  statValue: { fontSize: ms(14), fontWeight: '800', marginTop: s(2) },
  statLabel: { fontSize: ms(11), fontWeight: '500' },
  statDivider: { width: 1, height: s(34) },
  oemBox: { borderRadius: theme.radius.lg, borderWidth: 1, padding: s(14), marginTop: s(16), ...theme.shadow.sm },
  oemHead: { flexDirection: 'row', alignItems: 'center', gap: s(6), marginBottom: s(10) },
  oemLabel: { fontSize: ms(12), fontWeight: '700', letterSpacing: 0.3, textTransform: 'uppercase' },
  oemChips: { flexDirection: 'row', flexWrap: 'wrap', gap: s(8) },
  oemChip: { paddingHorizontal: s(12), paddingVertical: s(7), borderRadius: theme.radius.sm },
  oemChipText: { fontSize: ms(14), fontWeight: '700', fontVariant: ['tabular-nums'] },
  sectionTitle: { fontSize: ms(16), fontWeight: '800', letterSpacing: -0.2 },
  specCard: { borderRadius: theme.radius.lg, borderWidth: 1, paddingHorizontal: s(14), paddingTop: s(14), paddingBottom: s(2), marginTop: s(16), ...theme.shadow.sm },
  specRow: { flexDirection: 'row', alignItems: 'center', gap: s(10), paddingVertical: s(13), borderBottomWidth: 1 },
  specLabel: { fontSize: ms(14) },
  specValue: { fontSize: ms(14), fontWeight: '700', flex: 1, textAlign: 'right' },
  descCard: { marginTop: s(18) },
  desc: { fontSize: ms(15), lineHeight: ms(23), marginTop: s(8) },
  seller: { flexDirection: 'row', alignItems: 'center', gap: s(12), padding: s(14), borderRadius: theme.radius.lg, borderWidth: 1, ...theme.shadow.sm },
  sellerAvatar: { width: s(48), height: s(48), borderRadius: s(24), alignItems: 'center', justifyContent: 'center' },
  sellerName: { fontSize: ms(15.5), fontWeight: '800' },
  sellerPhone: { fontSize: ms(13), fontVariant: ['tabular-nums'], marginTop: s(2) },
  verifiedBadge: { width: s(30), height: s(30), borderRadius: s(15), alignItems: 'center', justifyContent: 'center' },
  reportLink: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: s(6), paddingVertical: s(16), marginTop: s(6) },
  reportText: { fontSize: ms(13), textDecorationLine: 'underline' },
  footer: { flexDirection: 'row', gap: s(12), paddingHorizontal: theme.space.lg, paddingTop: s(12), borderTopWidth: 1 },
  writeBtn: { flexDirection: 'row', gap: s(7), alignItems: 'center', justifyContent: 'center', height: s(54), paddingHorizontal: s(20), borderWidth: 1.5, borderRadius: theme.radius.lg },
  writeText: { fontWeight: '800', fontSize: ms(15) },
  callBtn: { flex: 1, height: s(54), borderRadius: theme.radius.lg, overflow: 'hidden', ...theme.shadow.brand },
  callFill: { flex: 1, flexDirection: 'row', gap: s(8), alignItems: 'center', justifyContent: 'center' },
  callText: { color: '#fff', fontWeight: '800', fontSize: ms(16) },
  reportBackdrop: { flex: 1 },
  reportSheet: { borderTopLeftRadius: s(24), borderTopRightRadius: s(24), padding: theme.space.lg, paddingBottom: s(32), gap: s(14) },
  sheetHandle: { width: s(40), height: s(4), borderRadius: 2, alignSelf: 'center', marginBottom: s(2) },
  reportTitle: { fontSize: ms(17), fontWeight: '800' },
  reasonWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: s(8) },
  reasonChip: { paddingHorizontal: s(14), paddingVertical: s(9), borderRadius: 999, borderWidth: 1 },
  reasonText: { fontSize: ms(13) },
  reportInput: { minHeight: s(80), borderWidth: 1, borderRadius: theme.radius.md, padding: s(12), fontSize: ms(15), textAlignVertical: 'top' },
  reportSubmit: { height: s(52), borderRadius: theme.radius.lg, alignItems: 'center', justifyContent: 'center', ...theme.shadow.brand },
  reportSubmitText: { color: '#fff', fontWeight: '800', fontSize: ms(16) },
});
