import { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable, TextInput,
  StatusBar, Alert, Switch, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useQueryClient } from '@tanstack/react-query';
import { api, errMessage } from '../src/lib/api';
import { useColors } from '../src/theme/useColors';
import { theme, s, ms } from '../src/theme';
import { Button } from '../src/components/Button';
import { PickerSheet } from '../src/components/PickerSheet';

const CONDITIONS = [
  { value: 'new', label: 'Yangi' },
  { value: 'used_excellent', label: 'Ishlatilgan — A' },
  { value: 'used_good', label: 'Ishlatilgan — B' },
  { value: 'used_fair', label: 'Ishlatilgan — C' },
  { value: 'refurbished', label: 'Qayta ishlab chiqilgan' },
];

const CURRENCIES = [
  { value: 'UZS', label: "So'm (UZS)" },
  { value: 'USD', label: 'Dollar (USD)' },
];

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
  const qc = useQueryClient();

  const [photos, setPhotos] = useState<string[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [currency, setCurrency] = useState('UZS');
  const [condition, setCondition] = useState('used_good');
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [year, setYear] = useState('');
  const [oemNumber, setOemNumber] = useState('');
  const [delivery, setDelivery] = useState(false);
  const [busy, setBusy] = useState(false);

  const canSubmit = title.trim().length >= 3 && price.trim().length > 0 && photos.length > 0;

  const pickPhotos = useCallback(async () => {
    if (photos.length >= 10) { Alert.alert("10 tadan ko'p rasm qo'shib bo'lmaydi"); return; }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'] as const,
      allowsMultipleSelection: true,
      quality: 0.85,
      selectionLimit: 10 - photos.length,
    });
    if (!result.canceled) {
      setPhotos((prev) => [...prev, ...result.assets.map((a) => a.uri)].slice(0, 10));
    }
  }, [photos.length]);

  const removePhoto = (idx: number) => setPhotos((p) => p.filter((_, i) => i !== idx));

  const submit = async () => {
    if (!canSubmit) return;
    setBusy(true);
    try {
      const formData = new FormData();
      formData.append('title', title.trim());
      formData.append('description', description.trim());
      formData.append('price[amount]', price.replace(/\s/g, ''));
      formData.append('price[currency]', currency);
      formData.append('condition', condition);
      if (brand.trim()) formData.append('brand', brand.trim());
      if (model.trim()) formData.append('model', model.trim());
      if (year.trim()) formData.append('year', year.trim());
      if (oemNumber.trim()) formData.append('oemNumber', oemNumber.trim());
      formData.append('delivery', String(delivery));
      photos.forEach((uri, i) => {
        const ext = uri.split('.').pop() ?? 'jpg';
        formData.append('photos', { uri, name: `photo_${i}.${ext}`, type: `image/${ext}` } as any);
      });
      await api.createListing(formData);
      qc.invalidateQueries({ queryKey: ['my-listings'] });
      qc.invalidateQueries({ queryKey: ['listings'] });
      Alert.alert("E'lon joylandi!", "E'loningiz tekshiruvdan o'tgach nashr etiladi.", [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (e) {
      Alert.alert('Xatolik', errMessage(e));
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
            <Text style={styles.headerTitle}>E'lon berish</Text>
            <View style={{ width: s(36) }} />
          </View>
        </SafeAreaView>
      </LinearGradient>

      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <SectionCard title="Rasmlar *">
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.photoRow}>
            <Pressable
              style={({ pressed }) => [styles.photoAdd, { backgroundColor: colors.surface, borderColor: colors.border }, pressed && { opacity: 0.7 }]}
              onPress={pickPhotos}
            >
              <Ionicons name="camera-outline" size={ms(26)} color={colors.ink} />
              <Text style={[styles.photoAddText, { color: colors.muted }]}>{photos.length}/10</Text>
            </Pressable>
            {photos.map((uri, i) => (
              <View key={uri + i} style={styles.photoThumb}>
                <Image source={{ uri }} style={styles.photoImg} contentFit="cover" />
                {i === 0 && (
                  <View style={[styles.mainBadge, { backgroundColor: colors.primary }]}>
                    <Text style={styles.mainBadgeText}>Asosiy</Text>
                  </View>
                )}
                <Pressable style={styles.photoRemove} onPress={() => removePhoto(i)} hitSlop={4}>
                  <Ionicons name="close-circle" size={ms(22)} color="#fff" />
                </Pressable>
              </View>
            ))}
          </ScrollView>
        </SectionCard>

        <SectionCard title="Asosiy ma'lumotlar *">
          <View style={styles.fields}>
            <View>
              <Text style={[styles.label, { color: colors.muted }]}>Sarlavha *</Text>
              <TextInput
                style={[styles.input, { borderColor: colors.border, backgroundColor: colors.bg, color: colors.text }]}
                placeholder="Masalan: Toyota Camry old bufer 2018"
                placeholderTextColor={colors.faint}
                value={title}
                onChangeText={setTitle}
                maxLength={120}
              />
            </View>
            <View>
              <Text style={[styles.label, { color: colors.muted }]}>Tavsif</Text>
              <TextInput
                style={[styles.input, styles.textarea, { borderColor: colors.border, backgroundColor: colors.bg, color: colors.text }]}
                placeholder="Mahsulot haqida batafsil ma'lumot..."
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

        <SectionCard title="Narx *">
          <View style={styles.fields}>
            <View>
              <Text style={[styles.label, { color: colors.muted }]}>Narx</Text>
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
              label="Valyuta"
              placeholder="Tanlang"
              value={currency}
              options={CURRENCIES}
              onChange={setCurrency}
            />
          </View>
        </SectionCard>

        <SectionCard title="Detal ma'lumotlari">
          <View style={styles.fields}>
            <PickerSheet
              label="Holat"
              placeholder="Tanlang"
              value={condition}
              options={CONDITIONS}
              onChange={setCondition}
            />
            <View style={styles.row2}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.label, { color: colors.muted }]}>Avtomobil markasi</Text>
                <TextInput
                  style={[styles.input, { borderColor: colors.border, backgroundColor: colors.bg, color: colors.text }]}
                  placeholder="Toyota"
                  placeholderTextColor={colors.faint}
                  value={brand}
                  onChangeText={setBrand}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.label, { color: colors.muted }]}>Model</Text>
                <TextInput
                  style={[styles.input, { borderColor: colors.border, backgroundColor: colors.bg, color: colors.text }]}
                  placeholder="Camry"
                  placeholderTextColor={colors.faint}
                  value={model}
                  onChangeText={setModel}
                />
              </View>
            </View>
            <View style={styles.row2}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.label, { color: colors.muted }]}>Yil</Text>
                <TextInput
                  style={[styles.input, { borderColor: colors.border, backgroundColor: colors.bg, color: colors.text }]}
                  placeholder="2020"
                  placeholderTextColor={colors.faint}
                  value={year}
                  onChangeText={setYear}
                  keyboardType="numeric"
                  maxLength={4}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.label, { color: colors.muted }]}>OEM raqam</Text>
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
          </View>
        </SectionCard>

        <SectionCard title="Yetkazib berish">
          <Pressable
            style={[styles.deliveryRow, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={() => setDelivery(!delivery)}
          >
            <View style={styles.deliveryInfo}>
              <Ionicons name="bicycle-outline" size={ms(22)} color={colors.ink} />
              <View>
                <Text style={[styles.deliveryTitle, { color: colors.text }]}>Yetkazib berish mavjud</Text>
                <Text style={[styles.deliverySub, { color: colors.muted }]}>Xaridor bilan kelishilgan holda</Text>
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
              {photos.length === 0 ? "Kamida 1 ta rasm qo'shing" : "Sarlavha va narxni to'ldiring"}
            </Text>
          )}
          <View style={{ position: 'relative' }}>
            <Button
              title={busy ? '' : "E'lon berish"}
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
  deliveryInfo: { flexDirection: 'row', alignItems: 'center', gap: s(12), flex: 1 },
  deliveryTitle: { fontSize: ms(14.5), fontWeight: '700' },
  deliverySub: { fontSize: ms(12), marginTop: s(2) },
  submitWrap: { gap: s(8) },
  hint: { fontSize: ms(13), textAlign: 'center' },
  busyOverlay: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center', borderRadius: theme.radius.lg },
});
