import { useState } from 'react';
import { TextInput, View, Text, StyleSheet, type TextInputProps } from 'react-native';
import { theme, s, ms } from '../theme';

export function Input({ label, style, ...props }: TextInputProps & { label?: string }) {
  const [focused, setFocused] = useState(false);
  return (
    <View>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <TextInput
        placeholderTextColor={theme.colors.faint}
        style={[styles.input, focused && styles.inputFocused, style]}
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
    color: theme.colors.muted,
    marginBottom: 6,
    fontWeight: '700',
    letterSpacing: 0.1,
    marginLeft: 2,
  },
  input: {
    height: s(50),
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.lg,
    paddingHorizontal: theme.space.md,
    fontSize: ms(15.5),
    color: theme.colors.text,
    backgroundColor: theme.colors.card,
  },
  inputFocused: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.card,
  },
});
