import { useState, useCallback, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable, TextInput,
  StatusBar, Alert, Switch, ActivityIndicator, KeyboardAvoidingView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api, errMessage } from '../src/lib/api';
import { useAuth } from '../src/lib/auth';
import { useT, useLocalize, useLocalizePart } from '../src/lib/i18n';
import { useColors } from '../src/theme/useColors';
import { theme, s, ms } from '../src/theme';
import { Button } from '../src/components/Button';
import { PickerSheet } from '../src/components/PickerSheet';
import { useLocationStore, requestLocation } from '../src/lib/location';
import { resolveImage } from '../src/lib/image';

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  const colors = useColors();
  return (
    <View style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Text style={[styles.sectionTitle, { color: colors.ink }]}>{title}</Text>
      {children}
    </View>
  );
}

export default function CreateListing() {
  const colors = useColors();
  const t = useT();
  const lz = useLocalize();
  const lzp = useLocalizePart();
  const qc = useQueryClient();
  const user = useAuth((st) => st.user);
  const { editId } = useLocalSearchParams<{ editId?: string }>();
  const isEdit = !!editId;

  // Backend enum: new | used | contract | original | duplicate
  const CONDITIONS = [
    { value: 'new', label: t.conditionsFull.new },
    { value: 'used', label: t.conditionsFull.used },
    { value: 'contract', label: t.conditionsFull.contract },
    { value: 'original', label: t.conditionsFull.original },
    { value: 'duplicate', label: t.conditionsFull.duplicate },
  ];
  const CURRENCIES = [
    { value: 'UZS', label: t.create.uzs },
    { value: 'USD', label: t.create.usd },
  ];

  const [photos, setPhotos] = useState<string[]>([]); // yuklangan URL lar
  const [uploading, setUploading] = useState(false);
  const [categoryId, setCategoryId] = useState('');
  const [partTypeId, setPartTypeId] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [currency, setCurrency] = useState('UZS');
  const [condition, setCondition] = useState('used');
  const [negotiable, setNegotiable] = useState(false);
  const [manufacturer, setManufacturer] = useState('');
  const [brandId, setBrandId] = useState('');
  const [modelId, setModelId] = useState('');
  const [city, setCity] = useState('');
  const [oemNumber, setOemNumber] = useState('');
  const [delivery, setDelivery] = useState(false);
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [busy, setBusy] = useState(false);

  // Tahrirlash rejimi — mavjud e'lonni yuklab, formani to'ldirish
  const { data: editData } = useQuery({
    queryKey: ['edit-listing', editId],
    queryFn: () => api.getListing(editId!),
    enabled: isEdit,
  });
  useEffect(() => {
    if (!editData?.listing) return;
    const l = editData.listing;
    setPhotos(l.photos ?? []);
    setCategoryId(l.categoryId?._id ?? '');
    setPartTypeId(l.partTypeId?._id ?? '');
    setTitle(l.title ?? '');
    setDescription(l.description ?? '');
    setPrice(l.price?.amount != null ? String(l.price.amount) : '');
    setCurrency(l.price?.currency ?? 'UZS');
    setCondition(l.condition ?? 'used');
    setNegotiable(!!l.negotiable);
    setManufacturer(l.manufacturer ?? '');
    const b = l.fitment?.brandId;
    const m = l.fitment?.modelId;
    setBrandId(typeof b === 'object' ? b?._id ?? '' : (b ?? ''));
    setModelId(typeof m === 'object' ? m?._id ?? '' : (m ?? ''));
    setCity(l.city ?? '');
    setOemNumber((l.oemNumbers ?? []).join(', '));
    setDelivery(!!l.delivery);
    if (l.phone) setPhone(l.phone);
  }, [editData]);

  // Katalog ma'lumotlari
  const { data: categories = [], isLoading: catLoading } = useQuery({
    queryKey: ['categories'], queryFn: api.categories,
  });
  const { data: partTypes = [], isLoading: ptLoading } = useQuery({
    queryKey: ['part-types', categoryId],
    queryFn: () => api.categoryPartTypes(categoryId),
    enabled: !!categoryId,
  });
  const { data: brands = [], isLoading: brandsLoading } = useQuery({
    queryKey: ['brands'], queryFn: () => api.brands(),
  });
  const { data: models = [], isLoading: modelsLoading } = useQuery({
    queryKey: ['models', brandId],
    queryFn: () => api.brandModels(brandId),
    enabled: !!brandId,
  });
  const { data: cities = [] } = useQuery({ queryKey: ['cities'], queryFn: api.cities });

  // Rasm ixtiyoriy — rasmsiz ham e'lon joylash mumkin
  const canSubmit =
    !!partTypeId && title.trim().length >= 3 && Number(price.replace(/\s/g, '')) > 0 &&
    !uploading;

  const pickPhotos = useCallback(async () => {
    if (photos.length >= 8) { Alert.alert(t.create.maxPhotos); return; }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'] as const,
      allowsMultipleSelection: true,
      quality: 0.85,
      selectionLimit: 8 - photos.length,
    });
    if (result.canceled || !result.assets.length) return;

    setUploading(true);
    try {
      const files = result.assets.map((a, i) => ({
        uri: a.uri,
        name: a.fileName ?? `photo_${Date.now()}_${i}.jpg`,
        type: a.mimeType ?? 'image/jpeg',
      }));
      const urls = await api.uploadImages(files);
      setPhotos((prev) => [...prev, ...urls].slice(0, 8));
    } catch (e) {
      Alert.alert(t.create.uploadError, errMessage(e));
    } finally {
      setUploading(false);
    }
  }, [photos.length, t]);

  const removePhoto = (idx: number) => setPhotos((p) => p.filter((_, i) => i !== idx));

  const submit = async () => {
    if (!canSubmit) return;
    setBusy(true);
    try {
      const body: Record<string, unknown> = {
        partTypeId,
        title: title.trim(),
        description: description.trim(),
        oemNumbers: oemNumber.split(',').map((x) => x.trim()).filter(Boolean),
        condition,
        manufacturer: manufacturer.trim(),
        price: { amount: Number(price.replace(/\s/g, '')), currency },
        negotiable,
        fitment: { brandId: brandId || undefined, modelId: modelId || undefined },
        photos,
        city,
        delivery,
        phone: phone.trim(),
      };

      if (isEdit) {
        await api.updateListing(editId!, body);
        qc.invalidateQueries({ queryKey: ['my-listings'] });
        qc.invalidateQueries({ queryKey: ['listing', editId] });
        qc.invalidateQueries({ queryKey: ['latest-listings'] });
        qc.invalidateQueries({ queryKey: ['nearby-listings'] });
        qc.invalidateQueries({ queryKey: ['search'] });
        Alert.alert(t.myListings.updated, undefined, [{ text: t.common.ok, onPress: () => router.back() }]);
      } else {
        // Joylashuv: store'da bo'lmasa, oxirgi imkoniyat sifatida so'rab ko'ramiz
        const coords = useLocationStore.getState().coords ?? (await requestLocation());
        if (coords) { body.lat = coords.lat; body.lng = coords.lng; }
        await api.createListing(body);
        qc.invalidateQueries({ queryKey: ['my-listings'] });
        qc.invalidateQueries({ queryKey: ['latest-listings'] });
        qc.invalidateQueries({ queryKey: ['nearby-listings'] });
        Alert.alert(t.create.postedTitle, t.create.postedText, [
          { text: t.common.ok, onPress: () => router.back() },
        ]);
      }
    } catch (e) {
      Alert.alert(t.common.error, errMessage(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.bg }]}>
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.brand} />

      <LinearGradient colors={theme.gradients.brand} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.header}>
        <SafeAreaView edges={['top']}>
          <View style={styles.headerRow}>
            <Pressable style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.7 }]} onPress={() => router.back()} hitSlop={10}>
              <Ionicons name="arrow-back" size={ms(20)} color="#fff" />
            </Pressable>
            <Text style={styles.headerTitle}>{isEdit ? t.myListings.editTitle : t.create.title}</Text>
            <View style={{ width: s(36) }} />
          </View>
        </SafeAreaView>
      </LinearGradient>

      {/* SDK 54: Android'da edge-to-edge majburiy, adjustResize ishlamaydi — klaviatura uchun "padding" */}
      <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding">
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <SectionCard title={t.create.photos}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.photoRow}>
            <Pressable
              style={({ pressed }) => [styles.photoAdd, { backgroundColor: colors.surface, borderColor: colors.border }, pressed && { opacity: 0.7 }]}
              onPress={pickPhotos}
              disabled={uploading}
            >
              {uploading ? (
                <ActivityIndicator color={colors.primary} size="small" />
              ) : (
                <Ionicons name="camera-outline" size={ms(26)} color={colors.ink} />
              )}
              <Text style={[styles.photoAddText, { color: colors.muted }]}>{photos.length}/8</Text>
            </Pressable>
            {photos.map((uri, i) => (
              <View key={uri + i} style={styles.photoThumb}>
                <Image source={{ uri: resolveImage(uri) }} style={styles.photoImg} contentFit="cover" />
                {i === 0 && (
                  <View style={[styles.mainBadge, { backgroundColor: colors.primary }]}>
                    <Text style={styles.mainBadgeText}>{t.create.main}</Text>
                  </View>
                )}
                <Pressable style={styles.photoRemove} onPress={() => removePhoto(i)} hitSlop={4}>
                  <Ionicons name="close-circle" size={ms(22)} color="#fff" />
                </Pressable>
              </View>
            ))}
          </ScrollView>
        </SectionCard>

        <SectionCard title={t.create.categorySection}>
          <View style={styles.fields}>
            <PickerSheet
              label={t.create.category}
              placeholder={t.common.select}
              value={categoryId}
              options={categories.map((c) => ({ value: c._id, label: lz(c.name) })).sort((a, b) => a.label.localeCompare(b.label))}
              onChange={(v) => { setCategoryId(v); setPartTypeId(''); }}
              loading={catLoading}
            />
            <PickerSheet
              label={t.create.partType}
              placeholder={categoryId ? t.common.select : t.create.selectCategoryFirst}
              value={partTypeId}
              options={partTypes.map((p) => ({ value: p._id, label: lzp(p) }))}
              onChange={setPartTypeId}
              disabled={!categoryId}
              loading={ptLoading}
            />
          </View>
        </SectionCard>

        <SectionCard title={t.create.basicInfo}>
          <View style={styles.fields}>
            <View>
              <Text style={[styles.label, { color: colors.muted }]}>{t.create.titleLabel}</Text>
              <TextInput
                style={[styles.input, { borderColor: colors.border, backgroundColor: colors.bg, color: colors.text }]}
                placeholder={t.create.titlePlaceholder}
                placeholderTextColor={colors.faint}
                value={title}
                onChangeText={setTitle}
                maxLength={120}
              />
            </View>
            <View>
              <Text style={[styles.label, { color: colors.muted }]}>{t.create.descLabel}</Text>
              <TextInput
                style={[styles.input, styles.textarea, { borderColor: colors.border, backgroundColor: colors.bg, color: colors.text }]}
                placeholder={t.create.descPlaceholder}
                placeholderTextColor={colors.faint}
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={4}
                maxLength={2000}
                textAlignVertical="top"
              />
            </View>
          </View>
        </SectionCard>

        <SectionCard title={t.create.priceSection}>
          <View style={styles.fields}>
            <View>
              <Text style={[styles.label, { color: colors.muted }]}>{t.create.price}</Text>
              <TextInput
                style={[styles.input, { borderColor: colors.border, backgroundColor: colors.bg, color: colors.text }]}
                placeholder="0"
                placeholderTextColor={colors.faint}
                value={price}
                onChangeText={setPrice}
                keyboardType="numeric"
              />
            </View>
            <PickerSheet
              label={t.create.currency}
              placeholder={t.common.select}
              value={currency}
              options={CURRENCIES}
              onChange={setCurrency}
            />
            <Pressable style={styles.switchRow} onPress={() => setNegotiable(!negotiable)}>
              <Text style={[styles.deliveryTitle, { color: colors.text }]}>{t.create.negotiable}</Text>
              <Switch
                value={negotiable}
                onValueChange={setNegotiable}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor="#fff"
              />
            </Pressable>
          </View>
        </SectionCard>

        <SectionCard title={t.create.detailsSection}>
          <View style={styles.fields}>
            <PickerSheet
              label={t.create.condition}
              placeholder={t.common.select}
              value={condition}
              options={CONDITIONS}
              onChange={setCondition}
            />
            <PickerSheet
              label={t.create.brand}
              placeholder={t.common.select}
              value={brandId}
              options={brands.map((b) => ({ value: b._id, label: b.name })).sort((a, b) => a.label.localeCompare(b.label))}
              onChange={(v) => { setBrandId(v); setModelId(''); }}
              loading={brandsLoading}
            />
            <PickerSheet
              label={t.create.model}
              placeholder={brandId ? t.common.select : t.create.selectBrandFirst}
              value={modelId}
              options={models.map((m) => ({ value: m._id, label: m.name }))}
              onChange={setModelId}
              disabled={!brandId}
              loading={modelsLoading}
            />
            <PickerSheet
              label={t.create.city}
              placeholder={t.common.select}
              value={city}
              options={cities.map((c) => ({ value: c.name.uz ?? "", label: lz(c.name) })).sort((a, b) => a.label.localeCompare(b.label))}
              onChange={setCity}
            />
            <View>
              <Text style={[styles.label, { color: colors.muted }]}>{t.create.manufacturer}</Text>
              <TextInput
                style={[styles.input, { borderColor: colors.border, backgroundColor: colors.bg, color: colors.text }]}
                placeholder="Bosch, Advics..."
                placeholderTextColor={colors.faint}
                value={manufacturer}
                onChangeText={setManufacturer}
              />
            </View>
            <View>
              <Text style={[styles.label, { color: colors.muted }]}>{t.create.oemLabel}</Text>
              <TextInput
                style={[styles.input, { borderColor: colors.border, backgroundColor: colors.bg, color: colors.text }]}
                placeholder="12345-67890"
                placeholderTextColor={colors.faint}
                value={oemNumber}
                onChangeText={setOemNumber}
                autoCapitalize="characters"
              />
            </View>
          </View>
        </SectionCard>

        <SectionCard title={t.create.contactSection}>
          <View style={styles.fields}>
            <View>
              <Text style={[styles.label, { color: colors.muted }]}>{t.create.phone}</Text>
              <TextInput
                style={[styles.input, { borderColor: colors.border, backgroundColor: colors.bg, color: colors.text }]}
                placeholder="+998..."
                placeholderTextColor={colors.faint}
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                maxLength={20}
              />
            </View>
          </View>
          <Pressable
            style={[styles.deliveryRow, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={() => setDelivery(!delivery)}
          >
            <View style={styles.deliveryInfo}>
              <Ionicons name="bicycle-outline" size={ms(22)} color={colors.ink} />
              <View>
                <Text style={[styles.deliveryTitle, { color: colors.text }]}>{t.create.deliveryTitle}</Text>
                <Text style={[styles.deliverySub, { color: colors.muted }]}>{t.create.deliverySub}</Text>
              </View>
            </View>
            <Switch
              value={delivery}
              onValueChange={setDelivery}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor="#fff"
            />
          </Pressable>
        </SectionCard>

        <View style={styles.submitWrap}>
          {!canSubmit && (
            <Text style={[styles.hint, { color: colors.muted }]}>
              {!partTypeId
                ? t.create.hintCategory
                : t.create.hintTitlePrice}
            </Text>
          )}
          <View style={{ position: 'relative' }}>
            <Button
              title={busy ? '' : isEdit ? t.myListings.saveEdit : t.create.submit}
              onPress={submit}
              disabled={!canSubmit || busy}
            />
            {busy && (
              <View style={styles.busyOverlay}>
                <ActivityIndicator color="#fff" size="small" />
              </View>
            )}
          </View>
        </View>
      </ScrollView>
      </KeyboardAvoidingView>

    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { paddingHorizontal: s(16), paddingBottom: s(14), borderBottomLeftRadius: s(22), borderBottomRightRadius: s(22), ...theme.shadow.navy },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: s(6) },
  backBtn: { width: s(36), height: s(36), borderRadius: s(18), backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: ms(17), fontWeight: '800', color: '#fff' },
  scroll: { padding: s(16), gap: s(12), paddingBottom: s(40) },
  sectionCard: { borderRadius: theme.radius.xl, padding: s(16), borderWidth: 1, gap: s(12), ...theme.shadow.sm },
  sectionTitle: { fontSize: ms(13), fontWeight: '800', letterSpacing: 0.4, textTransform: 'uppercase' },
  fields: { gap: s(14) },
  label: { fontSize: ms(12.5), fontWeight: '700', marginBottom: s(6), letterSpacing: 0.1 },
  input: { height: s(50), borderWidth: 1, borderRadius: theme.radius.lg, paddingHorizontal: s(14), fontSize: ms(15) },
  textarea: { height: s(100), paddingTop: s(14), paddingBottom: s(14) },
  row2: { flexDirection: 'row', gap: s(10) },
  photoRow: { gap: s(10), paddingVertical: s(4) },
  photoAdd: { width: s(80), height: s(80), borderRadius: theme.radius.lg, borderWidth: 1.5, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', gap: s(4) },
  photoAddText: { fontSize: ms(11), fontWeight: '600' },
  photoThumb: { width: s(80), height: s(80), borderRadius: theme.radius.lg, overflow: 'hidden' },
  photoImg: { width: '100%', height: '100%' },
  mainBadge: { position: 'absolute', bottom: 0, left: 0, right: 0, paddingVertical: s(3), alignItems: 'center' },
  mainBadgeText: { fontSize: ms(10), fontWeight: '800', color: '#fff' },
  photoRemove: { position: 'absolute', top: s(2), right: s(2) },
  deliveryRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderRadius: theme.radius.lg, borderWidth: 1, padding: s(14) },
  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  deliveryInfo: { flexDirection: 'row', alignItems: 'center', gap: s(12), flex: 1 },
  deliveryTitle: { fontSize: ms(14.5), fontWeight: '700' },
  deliverySub: { fontSize: ms(12), marginTop: s(2) },
  submitWrap: { gap: s(8) },
  hint: { fontSize: ms(13), textAlign: 'center' },
  busyOverlay: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center', borderRadius: theme.radius.lg },
});
