import { ActivityIndicator, View, Text, StyleSheet } from 'react-native';
import { theme } from '../theme';

export function Loading({ text }: { text?: string }) {
  return (
    <View style={styles.wrap}>
      <ActivityIndicator color={theme.colors.primary} size="large" />
      {text ? <Text style={styles.text}>{text}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40, gap: 12 },
  text: { fontSize: 14, color: theme.colors.muted, fontWeight: '500' },
});
