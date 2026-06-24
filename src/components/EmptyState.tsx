import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { theme, s, ms } from '../theme';

export function EmptyState({
  icon = 'file-tray-outline',
  text,
  sub,
}: {
  icon?: keyof typeof Ionicons.glyphMap;
  text: string;
  sub?: string;
}) {
  return (
    <View style={styles.wrap}>
      <LinearGradient
        colors={[theme.colors.brandSoft, '#dce5f8']}
        style={styles.iconWrap}
      >
        <Ionicons name={icon} size={ms(36)} color={theme.colors.brand} />
      </LinearGradient>
      <Text style={styles.text}>{text}</Text>
      {sub ? <Text style={styles.sub}>{sub}</Text> : null}
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
    borderColor: theme.colors.border,
  },
  text: { fontSize: ms(16), fontWeight: '700', color: theme.colors.text, textAlign: 'center' },
  sub: { fontSize: ms(13.5), color: theme.colors.muted, textAlign: 'center', lineHeight: ms(20) },
});
