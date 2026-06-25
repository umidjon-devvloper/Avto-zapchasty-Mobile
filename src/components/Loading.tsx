import { ActivityIndicator, View, Text, StyleSheet } from 'react-native';
import { useColors } from '../theme/useColors';

export function Loading({ text }: { text?: string }) {
  const colors = useColors();
  return (
    <View style={styles.wrap}>
      <ActivityIndicator color={colors.primary} size="large" />
      {text ? <Text style={[styles.text, { color: colors.muted }]}>{text}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40, gap: 12 },
  text: { fontSize: 14, fontWeight: '500' },
});
