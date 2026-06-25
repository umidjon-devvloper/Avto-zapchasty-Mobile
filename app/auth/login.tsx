import { useState } from 'react';
import {
  View, Text, StyleSheet, Alert, Pressable, KeyboardAvoidingView,
  Platform, ScrollView, StatusBar, TextInput, type KeyboardTypeOptions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { api, errMessage } from '../../src/lib/api';
import { useAuth } from '../../src/lib/auth';
import { useColors } from '../../src/theme/useColors';
import { theme, s, ms, isSmall } from '../../src/theme';
import { Button } from '../../src/components/Button';
import { LogoMark, Wordmark } from '../../src/components/Brand';

type Mode = 'login' | 'register';
type IconName = keyof typeof Ionicons.glyphMap;

function Field({
  icon, label, value, onChangeText, placeholder, keyboardType, secure, rightSlot,
}: {
  icon: IconName; label: string; value: string; onChangeText: (t: string) => void;
  placeholder: string; keyboardType?: KeyboardTypeOptions; secure?: boolean; rightSlot?: React.ReactNode;
}) {
  const [focused, setFocused] = useState(false);
  const colors = useColors();
  return (
    <View style={styles.fieldWrap}>
      <Text style={[styles.fieldLabel, { color: colors.muted }]}>{label}</Text>
      <View style={[
        styles.field,
        { borderColor: colors.border, backgroundColor: colors.bg },
        focused && { borderColor: colors.primary, backgroundColor: colors.card },
      ]}>
        <Ionicons name={icon} size={ms(19)} color={focused ? colors.primary : colors.faint} />
        <TextInput
          style={[styles.fieldInput, { color: colors.text }]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.faint}
          keyboardType={keyboardType}
          secureTextEntry={secure}
          autoCapitalize="none"
          autoCorrect={false}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        />
        {rightSlot}
      </View>
    </View>
  );
}

export default function Login() {
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const setSession = useAuth((st) => st.setSession);
  const params = useLocalSearchParams<{ mode?: string }>();
  const [mode, setMode] = useState<Mode>(params.mode === 'register' ? 'register' : 'login');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [busy, setBusy] = useState(false);

  const isRegister = mode === 'register';
  const canSubmit = phone.length >= 7 && password.length >= 4;

  const submit = async () => {
    setBusy(true);
    try {
      const r = isRegister
        ? await api.register(phone, password, name || undefined)
        : await api.login(phone, password);
      setSession(r.accessToken, r.refreshToken, r.user);
      if (router.canGoBack()) router.back();
      else router.replace('/(tabs)');
    } catch (e) {
      Alert.alert('Xatolik', errMessage(e));
    } finally {
      setBusy(false);
    }
  };

  const goBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/(tabs)');
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.bg }]}>
      <StatusBar barStyle="light-content" backgroundColor={colors.brandDark} />
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + s(28) }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          <LinearGradient
            colors={theme.gradients.brand}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.hero, { paddingTop: insets.top + s(8) }]}
          >
            <Pressable style={styles.backBtn} onPress={goBack} hitSlop={12}>
              <Ionicons name="chevron-back" size={ms(22)} color="#fff" />
            </Pressable>
            <View style={styles.heroContent}>
              <View style={styles.logoWrap}>
                <LogoMark size={isSmall ? 40 : 48} />
              </View>
              <Wordmark size={ms(24)} light style={{ marginTop: s(12) }} />
              <Text style={styles.heroSub}>Ehtiyot qismlar bozori</Text>
            </View>
          </LinearGradient>

          <View style={[styles.card, { backgroundColor: colors.card }]}>
            <View style={[styles.segment, { backgroundColor: colors.surface }]}>
              <Pressable
                style={[styles.segBtn, !isRegister && [styles.segBtnActive, { backgroundColor: colors.card }]]}
                onPress={() => setMode('login')}
              >
                <Text style={[styles.segText, { color: colors.muted }, !isRegister && { color: colors.ink, fontWeight: '800' }]} numberOfLines={1}>
                  Kirish
                </Text>
              </Pressable>
              <Pressable
                style={[styles.segBtn, isRegister && [styles.segBtnActive, { backgroundColor: colors.card }]]}
                onPress={() => setMode('register')}
              >
                <Text style={[styles.segText, { color: colors.muted }, isRegister && { color: colors.ink, fontWeight: '800' }]} numberOfLines={1}>
                  Ro'yxatdan o'tish
                </Text>
              </Pressable>
            </View>

            <Text style={[styles.greeting, { color: colors.text }]}>
              {isRegister ? 'Xush kelibsiz!' : 'Qaytganingizdan xursandmiz!'}
            </Text>
            <Text style={[styles.greetingSub, { color: colors.muted }]}>
              {isRegister ? "Ro'yxatdan o'tish uchun ma'lumotlaringizni kiriting" : 'Davom etish uchun hisobingizga kiring'}
            </Text>

            <View style={styles.fields}>
              {isRegister && (
                <Field icon="person-outline" label="Ismingiz" value={name} onChangeText={setName} placeholder="Ism (ixtiyoriy)" />
              )}
              <Field icon="call-outline" label="Telefon raqam" value={phone} onChangeText={setPhone} placeholder="+998 90 123 45 67" keyboardType="phone-pad" />
              <Field
                icon="lock-closed-outline" label="Parol" value={password} onChangeText={setPassword}
                placeholder="Kamida 4 ta belgi" secure={!showPass}
                rightSlot={
                  <Pressable onPress={() => setShowPass(!showPass)} hitSlop={10}>
                    <Ionicons name={showPass ? 'eye-outline' : 'eye-off-outline'} size={ms(20)} color={colors.faint} />
                  </Pressable>
                }
              />
            </View>

            <Button title={isRegister ? "Ro'yxatdan o'tish" : 'Kirish'} onPress={submit} loading={busy} disabled={!canSubmit} style={styles.submitBtn} />

            <View style={styles.divider}>
              <View style={[styles.dividerLine, { backgroundColor: colors.hairline }]} />
              <Text style={[styles.dividerText, { color: colors.faint }]}>yoki</Text>
              <View style={[styles.dividerLine, { backgroundColor: colors.hairline }]} />
            </View>

            <Pressable style={({ pressed }) => [styles.switchBtn, pressed && { opacity: 0.6 }]} onPress={() => setMode(isRegister ? 'login' : 'register')}>
              <Text style={[styles.switchText, { color: colors.muted }]}>
                {isRegister ? 'Hisobingiz bormi? ' : "Hisobingiz yo'qmi? "}
                <Text style={{ color: colors.ink, fontWeight: '800' }}>
                  {isRegister ? 'Kirish' : "Ro'yxatdan o'tish"}
                </Text>
              </Text>
            </Pressable>
          </View>

          <View style={styles.trust}>
            {[
              { icon: 'shield-checkmark-outline' as const, label: 'Xavfsiz' },
              { icon: 'lock-closed-outline' as const, label: 'Himoyalangan' },
              { icon: 'flash-outline' as const, label: 'Tez kirish' },
            ].map((b) => (
              <View key={b.label} style={styles.trustItem}>
                <Ionicons name={b.icon} size={ms(15)} color={colors.ink} />
                <Text style={[styles.trustText, { color: colors.muted }]}>{b.label}</Text>
              </View>
            ))}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  flex: { flex: 1 },
  scroll: { flexGrow: 1 },
  hero: { paddingHorizontal: s(20), paddingBottom: s(48), borderBottomLeftRadius: s(32), borderBottomRightRadius: s(32), ...theme.shadow.navy },
  backBtn: { width: s(38), height: s(38), borderRadius: s(19), backgroundColor: 'rgba(255,255,255,0.14)', alignItems: 'center', justifyContent: 'center' },
  heroContent: { alignItems: 'center', paddingTop: isSmall ? s(6) : s(14) },
  logoWrap: {
    width: s(isSmall ? 64 : 76), height: s(isSmall ? 64 : 76), borderRadius: s(22),
    backgroundColor: 'rgba(255,255,255,0.12)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
  },
  heroSub: { fontSize: ms(13), color: 'rgba(255,255,255,0.7)', marginTop: s(5), fontWeight: '500' },
  card: { marginHorizontal: s(16), marginTop: -s(28), borderRadius: s(24), padding: s(20), ...theme.shadow.lg },
  segment: { flexDirection: 'row', borderRadius: theme.radius.lg, padding: s(4), gap: s(4), marginBottom: s(20) },
  segBtn: { flex: 1, height: s(44), borderRadius: theme.radius.md, alignItems: 'center', justifyContent: 'center', paddingHorizontal: s(6) },
  segBtnActive: { ...theme.shadow.sm },
  segText: { fontSize: ms(13.5), fontWeight: '700' },
  greeting: { fontSize: ms(21), fontWeight: '800', letterSpacing: -0.3 },
  greetingSub: { fontSize: ms(13.5), marginTop: s(5), lineHeight: ms(19) },
  fields: { gap: s(14), marginTop: s(22) },
  fieldWrap: { gap: s(7) },
  fieldLabel: { fontSize: ms(12.5), fontWeight: '700', letterSpacing: 0.2, marginLeft: 2 },
  field: {
    flexDirection: 'row', alignItems: 'center', gap: s(10), height: s(54),
    borderRadius: theme.radius.lg, borderWidth: 1.5, paddingHorizontal: s(14),
  },
  fieldInput: { flex: 1, fontSize: ms(15.5), paddingVertical: 0, height: '100%' },
  submitBtn: { marginTop: s(24) },
  divider: { flexDirection: 'row', alignItems: 'center', gap: s(10), marginTop: s(18) },
  dividerLine: { flex: 1, height: 1 },
  dividerText: { fontSize: ms(12), fontWeight: '600' },
  switchBtn: { alignItems: 'center', paddingTop: s(16) },
  switchText: { fontSize: ms(14), textAlign: 'center' },
  trust: { flexDirection: 'row', justifyContent: 'center', gap: s(22), paddingTop: s(22) },
  trustItem: { flexDirection: 'row', alignItems: 'center', gap: s(5) },
  trustText: { fontSize: ms(12), fontWeight: '600' },
});
