import { useState } from 'react';
import {
  ScrollView, View, Text, StyleSheet, Pressable, Switch, Alert,
  KeyboardAvoidingView, Platform, StatusBar,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { api, errMessage } from '../src/lib/api';
import { useAuth } from '../src/lib/auth';
import { theme, CONDITION_LABELS, s, ms } from '../src/theme';
import { resolveImage } from '../src/lib/image';
import { Input } from '../src/components/Input';
import { Button } from '../src/components/Button';
import { PickerSheet } from '../src/components/PickerSheet';
import { AuthPrompt } from '../src/components/AuthPrompt';
import type { Brand, CarModel, City, Condition, PartCategory, PartType } from '../src/lib/types';

const CONDITIONS: Condition[] = ['new', 'used', 'contract', 'original', 'duplicate'];

function SectionCard({ icon, title, children }: { icon: keyof typeof Ionicons.glyphMap; title: string; children: React.ReactNode }) {
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.cardIconWrap}>
          <Ionicons name={icon} size={ms(16)} color={theme.colors.primary} />
        </View>
        <Text style={styles.cardTitle}>{title}</Text>
      </View>
      <View style={styles.cardBody}>{children}</View>
    </View>
  );
}

export default function CreateListing() {
  const qc = useQueryClient();
  const token = useAuth((s) => s.accessToken);
  const user = useAuth((s) => s.user);
  const insets = useSafeAreaInsets();

  const [categoryId, setCategoryId] = useState('');
  const [partTypeId, setPartTypeId] = useState('');
  const [title, setTitle] = useState('');
  const [manufacturer, setManufacturer] = useState('');
  const [oem, setOem] = useState('');
  const [condition, setCondition] = useState<Condition>('used');
  const [price, setPrice] = useState('');
  const [brandId, setBrandId] = useState('');
  const [modelId, setModelId] = useState('');
  const [city, setCity] = useState('');
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [description, setDescription] = useState('');
  const [delivery, setDelivery] = useState(false);
  const [photos, setPhotos] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);

  const { data: categories } = useQuery({ queryKey: ['categories'], queryFn: api.categories });
  const { data: partTypes, isFetching: ptLoading } = useQuery({
    queryKey: ['partTypes', categoryId], queryFn: () => api.categoryPartTypes(categoryId), enabled: !!categoryId,
  });
  const { data: brands } = useQuery({ queryKey: ['brands'], queryFn: () => api.brands() });
  const { data: models, isFetching: mLoading } = useQuery({
    queryKey: ['models', brandId], queryFn: () => api.brandModels(brandId), enabled: !!brandId,
  });
  const { data: cities } = useQuery({ queryKey: ['cities'], queryFn: api.cities });

  const create = useMutation({
    mutationFn: () =>
      api.createListing({
        partTypeId,
        title: title.trim(),
        description: description.trim(),
        oemNumbers: oem.split(',').map((x) => x.trim()).filter(Boolean),
        condition,
        manufacturer: manufacturer.trim(),
        price: { amount: Number(price), currency: 'UZS' },
        fitment: { brandId: brandId || undefined, modelId: modelId || undefined },
        city,
        phone: phone.trim(),
        delivery,
        photos,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-listings'] });
      Alert.alert("E'lon yuborildi", "E'loningiz moderatsiyadan o'tgach faol bo'ladi.", [
        { text: 'OK', onPress: () => router.back() },
      ]);
    },
    onError: (e) => Alert.alert('Xatolik', errMessage(e)),
  });

  if (!token) return <AuthPrompt text="E'lon berish uchun tizimga kiring" />;

  const pick = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      selectionLimit: 8,
      quality: 0.7,
    });
    if (res.canceled) return;
    setUploading(true);
    try {
      const files = res.assets.map((a, i) => ({
        uri: a.uri,
        name: a.fileName ?? `photo_${i}.jpg`,
        type: a.mimeType ?? 'image/jpeg',
      }));
      const urls = await api.uploadImages(files);
      setPhotos((p) => [...p, ...urls]);
    } catch (e) {
      Alert.alert('Yuklash xatosi', errMessage(e));
    } finally {
      setUploading(false);
    }
  };

  const valid = categoryId && partTypeId && title.trim() && Number(price) > 0;
  const photoCount = photos.length;

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.brand} />

      {/* Header */}
      <LinearGradient
        colors={theme.gradients.brand}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <Pressable style={styles.backBtn} onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="arrow-back" size={ms(22)} color="#fff" />
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Yangi e'lon</Text>
          <Text style={styles.headerSub}>Mahsulotingizni joylashtiring</Text>
        </View>
        <View style={styles.headerBadge}>
          <Ionicons name="add-circle" size={ms(28)} color={theme.colors.primary} />
        </View>
      </LinearGradient>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scroll,
            { paddingBottom: insets.bottom + 32 },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Rasmlar */}
          <SectionCard icon="images-outline" title="Rasmlar">
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.photoRow}
            >
              <Pressable
                style={[styles.addPhoto, uploading && styles.addPhotoLoading]}
                onPress={pick}
                disabled={uploading || photoCount >= 8}
              >
                <LinearGradient
                  colors={uploading ? ['#e8edf6', '#dce3f0'] : [theme.colors.primarySoft, '#fff1e2']}
                  style={styles.addPhotoGrad}
                >
                  <Ionicons
                    name={uploading ? 'cloud-upload-outline' : 'camera-outline'}
                    size={ms(26)}
                    color={uploading ? theme.colors.muted : theme.colors.primary}
                  />
                  <Text style={[styles.addPhotoText, uploading && { color: theme.colors.muted }]}>
                    {uploading ? 'Yuklanmoqda...' : `Rasm qo'sh\n(${photoCount}/8)`}
                  </Text>
                </LinearGradient>
              </Pressable>
              {photos.map((p, i) => (
                <View key={i} style={styles.thumb}>
                  <Image
                    source={{ uri: resolveImage(p) }}
                    style={styles.thumbImg}
                    contentFit="cover"
                  />
                  {i === 0 && (
                    <View style={styles.thumbMainBadge}>
                      <Text style={styles.thumbMainText}>Asosiy</Text>
                    </View>
                  )}
                  <Pressable
                    style={styles.removePhoto}
                    onPress={() => setPhotos((ph) => ph.filter((_, k) => k !== i))}
                    hitSlop={6}
                  >
                    <Ionicons name="close" size={ms(12)} color="#fff" />
                  </Pressable>
                </View>
              ))}
            </ScrollView>
            <Text style={styles.photoHint}>Birinchi rasm asosiy sifatida ko'rsatiladi</Text>
          </SectionCard>

          {/* Kategoriya */}
          <SectionCard icon="grid-outline" title="Kategoriya">
            <PickerSheet
              label="Kategoriya"
              placeholder="Kategoriyani tanlang"
              value={categoryId}
              options={(categories ?? []).map((c: PartCategory) => ({ value: c._id, label: c.name.ru }))}
              onChange={(v) => { setCategoryId(v); setPartTypeId(''); }}
            />
            <View style={styles.gap10} />
            <PickerSheet
              label="Detal turi"
              placeholder="Detalni tanlang"
              value={partTypeId}
              disabled={!categoryId}
              loading={ptLoading}
              options={(partTypes ?? []).map((p: PartType) => ({ value: p._id, label: p.name }))}
              onChange={setPartTypeId}
            />
          </SectionCard>

          {/* Asosiy ma'lumot */}
          <SectionCard icon="document-text-outline" title="Asosiy ma'lumot">
            <Input
              label="Sarlavha"
              placeholder="Masalan: Cobalt old kolodka original"
              value={title}
              onChangeText={setTitle}
            />
            <View style={styles.gap10} />
            <View style={styles.priceRow}>
              <View style={styles.priceInput}>
                <Input
                  label="Narx (so'm)"
                  placeholder="350 000"
                  keyboardType="number-pad"
                  value={price}
                  onChangeText={(t) => setPrice(t.replace(/\D/g, ''))}
                />
              </View>
              <View style={styles.currencyBadge}>
                <Text style={styles.currencyText}>UZS</Text>
              </View>
            </View>
          </SectionCard>

          {/* Holat */}
          <SectionCard icon="star-outline" title="Holati">
            <View style={styles.chips}>
              {CONDITIONS.map((c) => (
                <Pressable
                  key={c}
                  onPress={() => setCondition(c)}
                  style={[styles.chip, condition === c && styles.chipActive]}
                >
                  {condition === c ? (
                    <LinearGradient
                      colors={theme.gradients.primary}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.chipGrad}
                    >
                      <Text style={[styles.chipText, styles.chipTextActive]}>
                        {CONDITION_LABELS[c]}
                      </Text>
                    </LinearGradient>
                  ) : (
                    <Text style={styles.chipText}>{CONDITION_LABELS[c]}</Text>
                  )}
                </Pressable>
              ))}
            </View>
          </SectionCard>

          {/* Texnik ma'lumot */}
          <SectionCard icon="barcode-outline" title="Texnik ma'lumot">
            <Input
              label="OEM / artikul (vergul bilan)"
              placeholder="04465-33471, 0446533471"
              value={oem}
              onChangeText={setOem}
              autoCapitalize="characters"
            />
            <View style={styles.gap10} />
            <Input
              label="Ishlab chiqaruvchi"
              placeholder="Advics, Bosch, Toyota..."
              value={manufacturer}
              onChangeText={setManufacturer}
            />
          </SectionCard>

          {/* Mashina moslanishi */}
          <SectionCard icon="car-outline" title="Mashina moslanishi (ixtiyoriy)">
            <PickerSheet
              label="Mashina brendi"
              placeholder="Brendni tanlang"
              value={brandId}
              options={(brands ?? []).map((b: Brand) => ({ value: b._id, label: b.name }))}
              onChange={(v) => { setBrandId(v); setModelId(''); }}
            />
            <View style={styles.gap10} />
            <PickerSheet
              label="Model"
              placeholder="Modelni tanlang"
              value={modelId}
              disabled={!brandId}
              loading={mLoading}
              options={(models ?? []).map((m: CarModel) => ({ value: m._id, label: m.name }))}
              onChange={setModelId}
            />
          </SectionCard>

          {/* Aloqa */}
          <SectionCard icon="call-outline" title="Aloqa va joylashuv">
            <PickerSheet
              label="Shahar"
              placeholder="Shaharni tanlang"
              value={city}
              options={(cities ?? []).map((c: City) => ({ value: c.name.uz ?? c.name.ru, label: c.name.uz ?? c.name.ru }))}
              onChange={setCity}
            />
            <View style={styles.gap10} />
            <Input
              label="Telefon raqam"
              placeholder="+998 90 000 00 00"
              keyboardType="phone-pad"
              value={phone}
              onChangeText={setPhone}
            />
          </SectionCard>

          {/* Tavsif */}
          <SectionCard icon="chatbubble-outline" title="Tavsif">
            <Input
              label="Qo'shimcha ma'lumot"
              placeholder="Mahsulot haqida batafsil yozing..."
              value={description}
              onChangeText={setDescription}
              multiline
              style={styles.descInput}
            />
          </SectionCard>

          {/* Yetkazib berish */}
          <View style={styles.deliveryCard}>
            <View style={styles.deliveryLeft}>
              <View style={styles.deliveryIconWrap}>
                <Ionicons name="bicycle-outline" size={ms(20)} color={delivery ? theme.colors.primary : theme.colors.muted} />
              </View>
              <View>
                <Text style={styles.deliveryTitle}>Yetkazib berish</Text>
                <Text style={styles.deliverySub}>Buyurtmachiga yetkazish imkoniyati</Text>
              </View>
            </View>
            <Switch
              value={delivery}
              onValueChange={setDelivery}
              trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
              thumbColor={Platform.OS === 'android' ? (delivery ? '#fff' : '#f4f3f4') : undefined}
              ios_backgroundColor={theme.colors.border}
            />
          </View>

          {/* Submit */}
          <View style={styles.submitWrap}>
            {!valid && (
              <View style={styles.hintRow}>
                <Ionicons name="information-circle-outline" size={ms(15)} color={theme.colors.muted} />
                <Text style={styles.hint}>Kategoriya, detal, sarlavha va narx majburiy</Text>
              </View>
            )}
            <Button
              title="E'lonni joylashtirish"
              onPress={() => create.mutate()}
              loading={create.isPending}
              disabled={!valid}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.colors.bg },
  flex: { flex: 1 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: s(16),
    paddingVertical: s(14),
    gap: s(12),
  },
  backBtn: {
    width: s(36),
    height: s(36),
    borderRadius: s(18),
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: { flex: 1 },
  headerTitle: { fontSize: ms(18), fontWeight: '700', color: '#fff', letterSpacing: 0.2 },
  headerSub: { fontSize: ms(12), color: 'rgba(255,255,255,0.65)', marginTop: s(1) },
  headerBadge: { width: s(36), alignItems: 'center' },

  scroll: { padding: s(16), gap: s(12) },

  card: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.lg,
    overflow: 'hidden',
    ...theme.shadow.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(8),
    paddingHorizontal: s(16),
    paddingTop: s(14),
    paddingBottom: s(10),
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.hairline,
  },
  cardIconWrap: {
    width: s(28),
    height: s(28),
    borderRadius: s(8),
    backgroundColor: theme.colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: { fontSize: ms(14), fontWeight: '700', color: theme.colors.text, letterSpacing: 0.1 },
  cardBody: { padding: s(16) },

  gap10: { height: s(10) },

  photoRow: { gap: s(10) },
  addPhoto: { borderRadius: theme.radius.md, overflow: 'hidden' },
  addPhotoLoading: { opacity: 0.7 },
  addPhotoGrad: {
    width: s(100),
    height: s(100),
    alignItems: 'center',
    justifyContent: 'center',
    gap: s(6),
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: theme.colors.primary,
    borderRadius: theme.radius.md,
  },
  addPhotoText: { fontSize: ms(10), color: theme.colors.primary, fontWeight: '600', textAlign: 'center', lineHeight: ms(14) },
  thumb: { width: s(100), height: s(100), borderRadius: theme.radius.md, overflow: 'hidden', backgroundColor: theme.colors.surface },
  thumbImg: { width: '100%', height: '100%' },
  thumbMainBadge: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(244,122,31,0.85)',
    paddingVertical: s(3),
    alignItems: 'center',
  },
  thumbMainText: { fontSize: ms(9), fontWeight: '700', color: '#fff', letterSpacing: 0.5 },
  removePhoto: {
    position: 'absolute',
    top: s(5),
    right: s(5),
    width: s(20),
    height: s(20),
    borderRadius: s(10),
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoHint: { fontSize: ms(11), color: theme.colors.faint, marginTop: s(10), textAlign: 'center' },

  priceRow: { flexDirection: 'row', alignItems: 'flex-end', gap: s(10) },
  priceInput: { flex: 1 },
  currencyBadge: {
    height: s(50),
    paddingHorizontal: s(14),
    backgroundColor: theme.colors.brandSoft,
    borderRadius: theme.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  currencyText: { fontSize: ms(14), fontWeight: '700', color: theme.colors.brand },

  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: s(8) },
  chip: {
    borderRadius: theme.radius.pill,
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    overflow: 'hidden',
    backgroundColor: theme.colors.bg,
  },
  chipActive: { borderColor: 'transparent' },
  chipGrad: { paddingHorizontal: s(16), paddingVertical: s(9) },
  chipText: { fontSize: ms(13), color: theme.colors.text, fontWeight: '600', paddingHorizontal: s(16), paddingVertical: s(9) },
  chipTextActive: { color: '#fff', paddingHorizontal: 0, paddingVertical: 0 },

  descInput: { height: s(110), paddingTop: s(12), textAlignVertical: 'top' },

  deliveryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.lg,
    padding: s(16),
    ...theme.shadow.sm,
  },
  deliveryLeft: { flexDirection: 'row', alignItems: 'center', gap: s(12), flex: 1 },
  deliveryIconWrap: {
    width: s(40),
    height: s(40),
    borderRadius: s(12),
    backgroundColor: theme.colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deliveryTitle: { fontSize: ms(15), fontWeight: '700', color: theme.colors.text },
  deliverySub: { fontSize: ms(12), color: theme.colors.muted, marginTop: s(1) },

  submitWrap: { gap: s(10), marginTop: s(4) },
  hintRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: s(5) },
  hint: { fontSize: ms(12), color: theme.colors.muted, textAlign: 'center' },
});
