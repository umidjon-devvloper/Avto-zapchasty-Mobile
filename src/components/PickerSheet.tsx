import { useState } from 'react';
import {
  Modal, View, Text, Pressable, FlatList, StyleSheet, TextInput,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { theme, s, ms } from '../theme';

export interface Option { value: string; label: string }

export function PickerSheet({
  label, placeholder, value, options, onChange, disabled, loading,
}: {
  label: string;
  placeholder: string;
  value: string;
  options: Option[];
  onChange: (v: string) => void;
  disabled?: boolean;
  loading?: boolean;
}) {
  const insets = useSafeAreaInsets();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const selected = options.find((o) => o.value === value);

  const filtered = search.trim()
    ? options.filter((o) => o.label.toLowerCase().includes(search.toLowerCase()))
    : options;

  const handleClose = () => { setOpen(false); setSearch(''); };

  return (
    <View>
      {label ? <Text style={styles.label}>{label}</Text> : null}

      <Pressable
        style={({ pressed }) => [
          styles.field,
          value && styles.fieldSelected,
          disabled && styles.fieldDisabled,
          pressed && !disabled && { opacity: 0.85 },
        ]}
        disabled={disabled}
        onPress={() => setOpen(true)}
      >
        <Text
          style={[styles.value, !selected && styles.placeholder]}
          numberOfLines={1}
        >
          {selected ? selected.label : loading ? 'Yuklanmoqda...' : placeholder}
        </Text>
        <Ionicons
          name={value ? 'checkmark-circle' : 'chevron-down'}
          size={ms(18)}
          color={value ? theme.colors.primary : theme.colors.muted}
        />
      </Pressable>

      <Modal
        visible={open}
        animationType="slide"
        transparent
        onRequestClose={handleClose}
      >
        <Pressable style={styles.backdrop} onPress={handleClose} />

        <View style={[styles.sheet, { paddingBottom: insets.bottom + s(16) }]}>
          {/* Handle */}
          <View style={styles.handle} />

          {/* Header */}
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>{label}</Text>
            <Pressable
              style={({ pressed }) => [styles.closeBtn, pressed && { opacity: 0.7 }]}
              onPress={handleClose}
              hitSlop={8}
            >
              <Ionicons name="close" size={ms(20)} color={theme.colors.text} />
            </Pressable>
          </View>

          {/* Search */}
          {options.length > 8 && (
            <View style={styles.searchWrap}>
              <Ionicons name="search" size={ms(16)} color={theme.colors.muted} />
              <TextInput
                style={styles.searchInput}
                placeholder="Qidirish..."
                placeholderTextColor={theme.colors.faint}
                value={search}
                onChangeText={setSearch}
                autoCorrect={false}
              />
              {search.length > 0 && (
                <Pressable onPress={() => setSearch('')} hitSlop={8}>
                  <Ionicons name="close-circle" size={ms(16)} color={theme.colors.faint} />
                </Pressable>
              )}
            </View>
          )}

          <FlatList
            data={filtered}
            keyExtractor={(o) => o.value}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => {
              const isSelected = item.value === value;
              return (
                <Pressable
                  style={({ pressed }) => [
                    styles.option,
                    isSelected && styles.optionSelected,
                    pressed && { backgroundColor: theme.colors.surface },
                  ]}
                  onPress={() => { onChange(item.value); handleClose(); }}
                >
                  <Text
                    style={[styles.optionText, isSelected && styles.optionTextSelected]}
                    numberOfLines={1}
                  >
                    {item.label}
                  </Text>
                  {isSelected && (
                    <LinearGradient
                      colors={theme.gradients.primary}
                      style={styles.checkWrap}
                    >
                      <Ionicons name="checkmark" size={ms(13)} color="#fff" />
                    </LinearGradient>
                  )}
                </Pressable>
              );
            }}
            ListEmptyComponent={
              <View style={styles.emptyWrap}>
                <Ionicons name="search-outline" size={ms(28)} color={theme.colors.faint} />
                <Text style={styles.emptyText}>Variant topilmadi</Text>
              </View>
            }
          />
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    fontSize: ms(12.5),
    color: theme.colors.muted,
    marginBottom: s(6),
    fontWeight: '700',
    letterSpacing: 0.1,
    marginLeft: s(2),
  },
  field: {
    height: s(50),
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.lg,
    paddingHorizontal: theme.space.md,
    backgroundColor: theme.colors.card,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: s(8),
  },
  fieldSelected: { borderColor: theme.colors.primary + '60' },
  fieldDisabled: { opacity: 0.45 },
  value: { fontSize: ms(15.5), color: theme.colors.text, flex: 1, fontWeight: '500' },
  placeholder: { color: theme.colors.faint, fontWeight: '400' },

  backdrop: { flex: 1, backgroundColor: 'rgba(9,16,40,0.55)' },

  sheet: {
    maxHeight: '72%',
    backgroundColor: theme.colors.card,
    borderTopLeftRadius: s(28),
    borderTopRightRadius: s(28),
    ...theme.shadow.lg,
  },
  handle: {
    width: s(44),
    height: s(4),
    borderRadius: 2,
    backgroundColor: theme.colors.border,
    alignSelf: 'center',
    marginTop: s(10),
    marginBottom: s(4),
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: s(20),
    paddingVertical: s(14),
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.hairline,
  },
  sheetTitle: { fontSize: ms(17), fontWeight: '800', color: theme.colors.text },
  closeBtn: {
    width: s(32),
    height: s(32),
    borderRadius: s(16),
    backgroundColor: theme.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },

  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(8),
    marginHorizontal: s(16),
    marginTop: s(12),
    marginBottom: s(4),
    backgroundColor: theme.colors.bg,
    borderRadius: theme.radius.lg,
    paddingHorizontal: s(12),
    height: s(42),
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  searchInput: { flex: 1, fontSize: ms(14.5), color: theme.colors.text },

  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: s(20),
    paddingVertical: s(15),
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.hairline,
    gap: s(12),
  },
  optionSelected: { backgroundColor: theme.colors.primarySoft + '50' },
  optionText: { fontSize: ms(15.5), color: theme.colors.text, flex: 1 },
  optionTextSelected: { color: theme.colors.primaryDark, fontWeight: '700' },
  checkWrap: {
    width: s(24),
    height: s(24),
    borderRadius: s(12),
    alignItems: 'center',
    justifyContent: 'center',
  },

  emptyWrap: { alignItems: 'center', paddingVertical: s(40), gap: s(10) },
  emptyText: { color: theme.colors.muted, fontSize: ms(14), fontWeight: '500' },
});
