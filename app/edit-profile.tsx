import { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable, TextInput,
  Alert, ActivityIndicator, KeyboardAvoidingView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useQuery } from '@tanstack/react-query';
import { api, errMessage } from '../src/lib/api';
import { useAuth } from '../src/lib/auth';
import { useT, useLocalize } from '../src/lib/i18n';
import { useColors } from '../src/theme/useColors';
import { theme, s, ms } from '../src/theme';
import { Button } from '../src/components/Button';
import { PickerSheet } from '../src/components/PickerSheet';
import { resolveImage } from '../src/lib/image';

const MAX_SIZE = 30 * 1024 * 1024; // 30MB

export default function EditProfile() {
  const colors = useColors();
  const t = useT();
  const lz = useLocalize();
  const user = useAuth((st) => st.user);
  const setUser = useAuth((st) => st.setUser);

  const [name, setName] = useState(user?.name ?? '');
  const [shopName, setShopName] = useState(user?.sellerProfile?.shopName ?? '');
  const [city, setCity] = useState(user?.sellerProfile?.city ?? '');
  const [avatar, setAvatar] = useState(user?.sellerProfile?.avatar ?? '');
  const [uploading, setUploading] = useState(false);
  const [busy, setBusy] = useState(false);

  const { data: cities = [] } = useQuery({ queryKey: ['cities'], queryFn: api.cities });

  const pickPhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'] as const,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.9,
    });
    if (result.canceled || !result.assets.length) return;
    const a = result.assets[0];
    if (a.fileSize && a.fileSize > MAX_SIZE) {
      Alert.alert(t.common.error, t.profile.photoTooBig);
      return;
    }
    setUploading(true);
    try {
      const [url] = await api.uploadImages([{
        uri: a.uri,
        name: a.fileName ?? `avatar_${Date.now()}.jpg`,
        type: a.mimeType ?? 'image/jpeg',
      }]);
      setAvatar(url);
    } catch (e) {
      Alert.alert(t.common.error, errMessage(e));
    } finally {
      setUploading(false);
    }
  };

  const save = async () => {
    setBusy(true);
    try {
      const u = await api.updateProfile({ name: name.trim(), shopName: shopName.trim(), city, avatar });
      setUser(u);
      Alert.alert(t.profile.saved);
      router.back();
    } catch (e) {
      Alert.alert(t.common.error, errMessage(e));
    } finally {
      setBusy(false);
    }
  };

  const initial = (name || user?.phone || '?').trim().charAt(0).toUpperCase();

  return (
    <View style={[styles.root, { backgroundColor: colors.bg }]}>
      <LinearGradient colors={theme.gradients.brand} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.header}>
        <SafeAreaView edges={['top']}>
          <View style={styles.headerRow}>
            <Pressable style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.7 }]} onPress={() => router.back()} hitSlop={10}>
              <Ionicons name="arrow-back" size={ms(20)} color="#fff" />
            </Pressable>
            <Text style={styles.headerTitle}>{t.profile.editProfile}</Text>
            <View style={{ width: s(36) }} />
          </View>
        </SafeAreaView>
      </LinearGradient>

      {/* SDK 54: Android'da edge-to-edge majburiy, adjustResize ishlamaydi — klaviatura uchun "padding" */}
      <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding">
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        {/* Rasm / logo */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.cardTitle, { color: colors.ink }]}>{t.profile.photo}</Text>
          <View style={styles.photoRow}>
            <Pressable onPress={pickPhoto} disabled={uploading} style={[styles.avatarBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              {avatar ? (
                <Image source={{ uri: resolveImage(avatar) }} style={styles.avatarImg} contentFit="cover" />
              ) : (
                <Text style={[styles.avatarInitial, { color: colors.muted }]}>{initial}</Text>
              )}
              {uploading && (
                <View style={styles.avatarOverlay}>
                  <ActivityIndicator color="#fff" size="small" />
                </View>
              )}
              <View style={[styles.cameraBadge, { backgroundColor: colors.brand, borderColor: colors.card }]}>
                <Ionicons name="camera" size={ms(13)} color="#fff" />
              </View>
            </Pressable>
            <View style={styles.photoActions}>
              <Pressable
                style={({ pressed }) => [styles.photoBtn, { backgroundColor: colors.brandSoft }, pressed && { opacity: 0.8 }]}
                onPress={pickPhoto}
                disabled={uploading}
              >
                <Ionicons name="image-outline" size={ms(16)} color={colors.ink} />
                <Text style={[styles.photoBtnText, { color: colors.ink }]}>
                  {avatar ? t.profile.photoChange : t.profile.photoPick}
                </Text>
              </Pressable>
              {avatar ? (
                <Pressable
                  style={({ pressed }) => [styles.photoBtn, { backgroundColor: colors.dangerSoft }, pressed && { opacity: 0.8 }]}
                  onPress={() => setAvatar('')}
                  disabled={uploading}
                >
                  <Ionicons name="trash-outline" size={ms(16)} color={colors.danger} />
                  <Text style={[styles.photoBtnText, { color: colors.danger }]}>{t.profile.photoRemove}</Text>
                </Pressable>
              ) : null}
              <Text style={[styles.photoHint, { color: colors.faint }]}>{t.profile.photoHint}</Text>
            </View>
          </View>
        </View>

        {/* Ma'lumotlar */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View>
            <Text style={[styles.label, { color: colors.muted }]}>{t.profile.editName}</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
              value={name}
              onChangeText={setName}
              placeholder={t.profile.editNamePlaceholder}
              placeholderTextColor={colors.faint}
              maxLength={120}
            />
          </View>
          <View>
            <Text style={[styles.label, { color: colors.muted }]}>{t.profile.editShopName}</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
              value={shopName}
              onChangeText={setShopName}
              placeholder={t.profile.editShopPlaceholder}
              placeholderTextColor={colors.faint}
              maxLength={120}
            />
          </View>
          <PickerSheet
            label={t.profile.editCity}
            placeholder={t.common.select}
            value={city}
            options={cities.map((c) => ({ value: lz(c.name), label: lz(c.name) }))}
            onChange={setCity}
          />
        </View>

        <View style={{ position: 'relative' }}>
          <Button title={busy ? '' : t.profile.save} onPress={save} disabled={busy || uploading} />
          {busy && (
            <View style={styles.busyOverlay}>
              <ActivityIndicator color="#fff" size="small" />
            </View>
          )}
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
  card: { borderRadius: theme.radius.xl, padding: s(16), borderWidth: 1, gap: s(14), ...theme.shadow.sm },
  cardTitle: { fontSize: ms(13), fontWeight: '800', letterSpacing: 0.4, textTransform: 'uppercase' },

  photoRow: { flexDirection: 'row', alignItems: 'center', gap: s(16) },
  avatarBox: {
    width: s(88), height: s(88), borderRadius: s(28), borderWidth: 1,
    alignItems: 'center', justifyContent: 'center', overflow: 'visible',
  },
  avatarImg: { width: '100%', height: '100%', borderRadius: s(28) },
  avatarInitial: { fontSize: ms(32), fontWeight: '900' },
  avatarOverlay: {
    ...StyleSheet.absoluteFillObject, borderRadius: s(28),
    backgroundColor: 'rgba(0,0,0,0.35)', alignItems: 'center', justifyContent: 'center',
  },
  cameraBadge: {
    position: 'absolute', right: s(-4), bottom: s(-4),
    width: s(26), height: s(26), borderRadius: s(13), borderWidth: 2,
    alignItems: 'center', justifyContent: 'center',
  },
  photoActions: { flex: 1, gap: s(8) },
  photoBtn: {
    flexDirection: 'row', alignItems: 'center', gap: s(6),
    paddingHorizontal: s(12), paddingVertical: s(9), borderRadius: theme.radius.md, alignSelf: 'flex-start',
  },
  photoBtnText: { fontSize: ms(13), fontWeight: '700' },
  photoHint: { fontSize: ms(11.5) },

  label: { fontSize: ms(12.5), fontWeight: '700', marginBottom: s(6), letterSpacing: 0.1 },
  input: { height: s(50), borderWidth: 1, borderRadius: theme.radius.lg, paddingHorizontal: s(14), fontSize: ms(15) },
  busyOverlay: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
});
