import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '../theme/useColors';
import { s, ms } from '../theme';

export function EmptyState({
  icon = 'file-tray-outline',
  text,
  sub,
}: {
  icon?: keyof typeof Ionicons.glyphMap;
  text: string;
  sub?: string;
}) {
  const colors = useColors();
  return (
    <View style={styles.wrap}>
      <LinearGradient
        colors={[colors.brandSoft, colors.brandSoftAlt]}
        style={[styles.iconWrap, { borderColor: colors.border }]}
      >
        <Ionicons name={icon} size={ms(36)} color={colors.ink} />
      </LinearGradient>
      <Text style={[styles.text, { color: colors.text }]}>{text}</Text>
      {sub ? <Text style={[styles.sub, { color: colors.muted }]}>{sub}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: s(48), gap: s(14) },
  iconWrap: {
    width: s(84),
    height: s(84),
    borderRadius: s(28),
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  text: { fontSize: ms(16), fontWeight: '700', textAlign: 'center' },
  sub: { fontSize: ms(13.5), textAlign: 'center', lineHeight: ms(20) },
});
