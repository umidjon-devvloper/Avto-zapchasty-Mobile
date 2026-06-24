import { ActivityIndicator, Pressable, Text, StyleSheet, View, type ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { theme, s, ms } from '../theme';

type Variant = 'primary' | 'outline' | 'ghost';

export function Button({
  title, onPress, variant = 'primary', loading, disabled, style,
}: {
  title: string;
  onPress?: () => void;
  variant?: Variant;
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
}) {
  const isDisabled = disabled || loading;

  const inner = loading ? (
    <ActivityIndicator color={variant === 'primary' ? theme.colors.onPrimary : theme.colors.primary} />
  ) : (
    <Text style={[styles.text, variant === 'primary' ? styles.textPrimary : styles.textOther]}>{title}</Text>
  );

  if (variant === 'primary') {
    return (
      <Pressable
        onPress={onPress}
        disabled={isDisabled}
        style={({ pressed }) => [styles.shadow, isDisabled && { opacity: 0.5 }, pressed && { opacity: 0.92, transform: [{ scale: 0.99 }] }, style]}
      >
        <LinearGradient
          colors={theme.gradients.primary}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.base, styles.fill]}
        >
          {inner}
        </LinearGradient>
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        variant === 'outline' && styles.outline,
        variant === 'ghost' && styles.ghost,
        isDisabled && { opacity: 0.5 },
        pressed && { opacity: 0.85 },
        style,
      ]}
    >
      {inner}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: { height: s(52), borderRadius: theme.radius.lg, alignItems: 'center', justifyContent: 'center', paddingHorizontal: theme.space.lg },
  fill: { width: '100%' },
  shadow: { borderRadius: theme.radius.lg, overflow: 'hidden', ...theme.shadow.brand },
  outline: { borderWidth: 1, borderColor: theme.colors.border, backgroundColor: theme.colors.card },
  ghost: { backgroundColor: 'transparent' },
  text: { fontSize: ms(16), fontWeight: '700' },
  textPrimary: { color: theme.colors.onPrimary },
  textOther: { color: theme.colors.text },
});
