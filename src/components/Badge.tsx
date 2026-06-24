import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme, s, ms } from '../theme';

type Tone = 'neutral' | 'primary' | 'success' | 'danger' | 'info';

const BG: Record<Tone, string> = {
  neutral: theme.colors.chip,
  primary: theme.colors.primarySoft,
  success: theme.colors.successSoft,
  danger: theme.colors.dangerSoft,
  info: theme.colors.infoSoft,
};
const FG: Record<Tone, string> = {
  neutral: theme.colors.muted,
  primary: theme.colors.primaryDark,
  success: theme.colors.success,
  danger: theme.colors.danger,
  info: theme.colors.info,
};
const DOT: Record<Tone, keyof typeof Ionicons.glyphMap> = {
  neutral: 'ellipse',
  primary: 'ellipse',
  success: 'ellipse',
  danger: 'ellipse',
  info: 'ellipse',
};

export function Badge({ label, tone = 'neutral' }: { label: string; tone?: Tone }) {
  return (
    <View style={[styles.badge, { backgroundColor: BG[tone] }]}>
      <Ionicons name={DOT[tone]} size={ms(6)} color={FG[tone]} />
      <Text style={[styles.text, { color: FG[tone] }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(4),
    paddingHorizontal: s(9),
    paddingVertical: s(4),
    borderRadius: theme.radius.pill,
    alignSelf: 'flex-start',
  },
  text: { fontSize: ms(11.5), fontWeight: '700' },
});
