import { useState } from 'react';
import { Modal, View, Text, Pressable, FlatList, StyleSheet, TextInput } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '../theme/useColors';
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
  const colors = useColors();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const selected = options.find((o) => o.value === value);

  const filtered = search.trim()
    ? options.filter((o) => o.label.toLowerCase().includes(search.toLowerCase()))
    : options;

  const handleClose = () => { setOpen(false); setSearch(''); };

  return (
    <View>
      {label ? <Text style={[styles.label, { color: colors.muted }]}>{label}</Text> : null}

      <Pressable
        style={({ pressed }) => [
          styles.field,
          { borderColor: colors.border, backgroundColor: colors.card },
          value && { borderColor: colors.primary + '60' },
          disabled && styles.fieldDisabled,
          pressed && !disabled && { opacity: 0.85 },
        ]}
        disabled={disabled}
        onPress={() => setOpen(true)}
      >
        <Text style={[styles.value, { color: colors.text }, !selected && { color: colors.faint, fontWeight: '400' }]} numberOfLines={1}>
          {selected ? selected.label : loading ? 'Yuklanmoqda...' : placeholder}
        </Text>
        <Ionicons
          name={value ? 'checkmark-circle' : 'chevron-down'}
          size={ms(18)}
          color={value ? colors.primary : colors.muted}
        />
      </Pressable>

      <Modal visible={open} animationType="slide" transparent onRequestClose={handleClose}>
        <Pressable style={[styles.backdrop, { backgroundColor: colors.overlay }]} onPress={handleClose} />

        <View style={[styles.sheet, { backgroundColor: colors.card, paddingBottom: insets.bottom + s(16) }]}>
          <View style={[styles.handle, { backgroundColor: colors.border }]} />

          <View style={[styles.sheetHeader, { borderBottomColor: colors.hairline }]}>
            <Text style={[styles.sheetTitle, { color: colors.text }]}>{label}</Text>
            <Pressable
              style={({ pressed }) => [styles.closeBtn, { backgroundColor: colors.surface }, pressed && { opacity: 0.7 }]}
              onPress={handleClose}
              hitSlop={8}
            >
              <Ionicons name="close" size={ms(20)} color={colors.text} />
            </Pressable>
          </View>

          {options.length > 8 && (
            <View style={[styles.searchWrap, { backgroundColor: colors.bg, borderColor: colors.border }]}>
              <Ionicons name="search" size={ms(16)} color={colors.muted} />
              <TextInput
                style={[styles.searchInput, { color: colors.text }]}
                placeholder="Qidirish..."
                placeholderTextColor={colors.faint}
                value={search}
                onChangeText={setSearch}
                autoCorrect={false}
              />
              {search.length > 0 && (
                <Pressable onPress={() => setSearch('')} hitSlop={8}>
                  <Ionicons name="close-circle" size={ms(16)} color={colors.faint} />
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
                    { borderBottomColor: colors.hairline },
                    isSelected && { backgroundColor: colors.primarySoft + '50' },
                    pressed && { backgroundColor: colors.surface },
                  ]}
                  onPress={() => { onChange(item.value); handleClose(); }}
                >
                  <Text style={[styles.optionText, { color: colors.text }, isSelected && { color: colors.primaryDark, fontWeight: '700' }]} numberOfLines={1}>
                    {item.label}
                  </Text>
                  {isSelected && (
                    <LinearGradient colors={theme.gradients.primary} style={styles.checkWrap}>
                      <Ionicons name="checkmark" size={ms(13)} color="#fff" />
                    </LinearGradient>
                  )}
                </Pressable>
              );
            }}
            ListEmptyComponent={
              <View style={styles.emptyWrap}>
                <Ionicons name="search-outline" size={ms(28)} color={colors.faint} />
                <Text style={[styles.emptyText, { color: colors.muted }]}>Variant topilmadi</Text>
              </View>
            }
          />
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  label: { fontSize: ms(12.5), marginBottom: s(6), fontWeight: '700', letterSpacing: 0.1, marginLeft: s(2) },
  field: {
    height: s(50), borderWidth: 1.5, borderRadius: theme.radius.lg,
    paddingHorizontal: theme.space.md, flexDirection: 'row',
    alignItems: 'center', justifyContent: 'space-between', gap: s(8),
  },
  fieldDisabled: { opacity: 0.45 },
  value: { fontSize: ms(15.5), flex: 1, fontWeight: '500' },

  backdrop: { flex: 1 },

  sheet: { maxHeight: '72%', borderTopLeftRadius: s(28), borderTopRightRadius: s(28), ...theme.shadow.lg },
  handle: { width: s(44), height: s(4), borderRadius: 2, alignSelf: 'center', marginTop: s(10), marginBottom: s(4) },
  sheetHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: s(20), paddingVertical: s(14), borderBottomWidth: 1,
  },
  sheetTitle: { fontSize: ms(17), fontWeight: '800' },
  closeBtn: { width: s(32), height: s(32), borderRadius: s(16), alignItems: 'center', justifyContent: 'center' },

  searchWrap: {
    flexDirection: 'row', alignItems: 'center', gap: s(8),
    marginHorizontal: s(16), marginTop: s(12), marginBottom: s(4),
    borderRadius: theme.radius.lg, paddingHorizontal: s(12), height: s(42), borderWidth: 1,
  },
  searchInput: { flex: 1, fontSize: ms(14.5) },

  option: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: s(20), paddingVertical: s(15), borderBottomWidth: 1, gap: s(12),
  },
  optionText: { fontSize: ms(15.5), flex: 1 },
  checkWrap: { width: s(24), height: s(24), borderRadius: s(12), alignItems: 'center', justifyContent: 'center' },

  emptyWrap: { alignItems: 'center', paddingVertical: s(40), gap: s(10) },
  emptyText: { fontSize: ms(14), fontWeight: '500' },
});
