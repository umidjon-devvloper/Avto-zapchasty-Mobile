import { useState } from 'react';
import { TextInput, View, Text, StyleSheet, type TextInputProps } from 'react-native';
import { useColors } from '../theme/useColors';
import { theme, s, ms } from '../theme';

export function Input({ label, style, ...props }: TextInputProps & { label?: string }) {
  const [focused, setFocused] = useState(false);
  const colors = useColors();
  return (
    <View>
      {label ? <Text style={[styles.label, { color: colors.muted }]}>{label}</Text> : null}
      <TextInput
        placeholderTextColor={colors.faint}
        style={[
          styles.input,
          { borderColor: colors.border, color: colors.text, backgroundColor: colors.card },
          focused && { borderColor: colors.primary },
          style,
        ]}
        onFocus={(e) => { setFocused(true); props.onFocus?.(e); }}
        onBlur={(e) => { setFocused(false); props.onBlur?.(e); }}
        {...props}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    fontSize: ms(12.5),
    marginBottom: 6,
    fontWeight: '700',
    letterSpacing: 0.1,
    marginLeft: 2,
  },
  input: {
    height: s(50),
    borderWidth: 1.5,
    borderRadius: theme.radius.lg,
    paddingHorizontal: theme.space.md,
    fontSize: ms(15.5),
  },
});
