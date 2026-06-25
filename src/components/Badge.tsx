import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '../theme/useColors';
import { s, ms } from '../theme';

type Tone = 'neutral' | 'primary' | 'success' | 'danger' | 'info';

export function Badge({ label, tone = 'neutral' }: { label: string; tone?: Tone }) {
  const colors = useColors();

  const BG: Record<Tone, string> = {
    neutral: colors.chip,
    primary: colors.primarySoft,
    success: colors.successSoft,
    danger: colors.dangerSoft,
    info: colors.infoSoft,
  };
  const FG: Record<Tone, string> = {
    neutral: colors.muted,
    primary: colors.primaryDark,
    success: colors.success,
    danger: colors.danger,
    info: colors.info,
  };

  return (
    <View style={[styles.badge, { backgroundColor: BG[tone] }]}>
      <Ionicons name="ellipse" size={ms(6)} color={FG[tone]} />
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
    borderRadius: 999,
    alignSelf: 'flex-start',
  },
  text: { fontSize: ms(11.5), fontWeight: '700' },
});
