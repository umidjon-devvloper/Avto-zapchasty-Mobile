import { ActivityIndicator, Pressable, Text, StyleSheet, type ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useColors } from '../theme/useColors';
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
  const colors = useColors();
  const isDisabled = disabled || loading;

  const inner = loading ? (
    <ActivityIndicator color={variant === 'primary' ? colors.onPrimary : colors.primary} />
  ) : (
    <Text style={[styles.text, variant === 'primary' ? styles.textPrimary : { color: colors.text }]}>{title}</Text>
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
        variant === 'outline' && { borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card },
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
  ghost: { backgroundColor: 'transparent' },
  text: { fontSize: ms(16), fontWeight: '700' },
  textPrimary: { color: '#ffffff' },
});
