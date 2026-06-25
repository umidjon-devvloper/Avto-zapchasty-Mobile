import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useColors } from '../theme/useColors';
import { theme, s, ms } from '../theme';
import { Button } from './Button';
import { LogoMark, Wordmark } from './Brand';

export function AuthPrompt({ text }: { text: string }) {
  const colors = useColors();
  return (
    <View style={styles.root}>
      <LinearGradient
        colors={theme.gradients.brand}
        start={{ x: 0, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={styles.bg}
      />
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={styles.content}>
          <View style={styles.logoCard}>
            <LogoMark size={ms(56)} />
          </View>
          <Wordmark size={ms(24)} light style={{ marginTop: s(12) }} />

          <View style={styles.divider} />

          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={[styles.iconRing, { backgroundColor: colors.brandSoft, borderColor: colors.border }]}>
              <Ionicons name="lock-closed-outline" size={ms(28)} color={colors.ink} />
            </View>
            <Text style={[styles.title, { color: colors.text }]}>Kirish talab etiladi</Text>
            <Text style={[styles.sub, { color: colors.muted }]}>{text}</Text>

            <Button
              title="Tizimga kirish"
              onPress={() => router.push('/auth/login')}
              style={styles.btn}
            />
            <Button
              title="Ro'yxatdan o'tish"
              variant="outline"
              onPress={() => router.push('/auth/login?mode=register')}
              style={styles.btn}
            />
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  bg: { ...StyleSheet.absoluteFillObject },
  safe: { flex: 1 },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: s(24), gap: 0 },
  logoCard: {
    width: s(88),
    height: s(88),
    borderRadius: s(28),
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  divider: { height: s(32) },
  card: {
    borderRadius: s(28),
    borderWidth: 1,
    padding: s(28),
    alignItems: 'center',
    gap: s(12),
    width: '100%',
    maxWidth: s(340),
    ...theme.shadow.lg,
  },
  iconRing: {
    width: s(64),
    height: s(64),
    borderRadius: s(22),
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: s(4),
    borderWidth: 1,
  },
  title: { fontSize: ms(20), fontWeight: '800', letterSpacing: -0.3 },
  sub: { fontSize: ms(14), textAlign: 'center', lineHeight: ms(21), marginBottom: s(4) },
  btn: { width: '100%' },
});
