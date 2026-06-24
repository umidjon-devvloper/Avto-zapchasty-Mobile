import { View, Text, StyleSheet, type ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../theme';

/**
 * Zapchasty so'z belgisi — "Zapchast" navy, "y" to'q-sariq urg'u (logoga mos).
 * `light` — to'q fon uchun (matn oq, "y" baribir to'q-sariq).
 */
export function Wordmark({
  size = 22,
  light = false,
  style,
}: {
  size?: number;
  light?: boolean;
  style?: ViewStyle;
}) {
  const base = light ? '#ffffff' : theme.colors.brand;
  return (
    <Text
      style={[
        styles.word,
        { fontSize: size, color: base, letterSpacing: -size * 0.03 },
        style as any,
      ]}
      allowFontScaling={false}
    >
      Zapchast<Text style={{ color: theme.colors.primary }}>y</Text>
    </Text>
  );
}

/** Brend belgisi — navy gradient kvadrat + oq "Z" va to'q-sariq urg'u nuqtasi. */
export function LogoMark({ size = 40, radius }: { size?: number; radius?: number }) {
  const r = radius ?? Math.round(size * 0.3);
  return (
    <LinearGradient
      colors={theme.gradients.brand}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.mark, { width: size, height: size, borderRadius: r }]}
    >
      <Text style={[styles.markZ, { fontSize: size * 0.52 }]} allowFontScaling={false}>Z</Text>
      <View
        style={[
          styles.markDot,
          { width: size * 0.16, height: size * 0.16, borderRadius: size * 0.08, right: size * 0.16, top: size * 0.18 },
        ]}
      />
    </LinearGradient>
  );
}

/** Belgi + so'z belgisi + ixtiyoriy tagline. Sarlavhalarda ishlatiladi. */
export function BrandLockup({
  tagline = 'Ehtiyot qismlar bozori',
  markSize = 40,
  wordSize = 21,
  light = false,
}: {
  tagline?: string | null;
  markSize?: number;
  wordSize?: number;
  light?: boolean;
}) {
  return (
    <View style={styles.lockup}>
      <LogoMark size={markSize} />
      <View>
        <Wordmark size={wordSize} light={light} />
        {tagline ? (
          <Text style={[styles.tagline, light && { color: 'rgba(255,255,255,0.7)' }]}>{tagline}</Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  word: { fontWeight: '800' },
  mark: { alignItems: 'center', justifyContent: 'center', ...theme.shadow.navy },
  markZ: { color: '#ffffff', fontWeight: '900', letterSpacing: -1 },
  markDot: { position: 'absolute', backgroundColor: theme.colors.primary },
  lockup: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  tagline: { fontSize: 12, color: theme.colors.muted, marginTop: 2, fontWeight: '500' },
});
