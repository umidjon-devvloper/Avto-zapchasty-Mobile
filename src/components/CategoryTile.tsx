import { Pressable, Text, View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useColors, useScheme } from '../theme/useColors';
import { theme, s, ms } from '../theme';
import { categoryIcon } from '../lib/category-icons';
import type { PartCategory } from '../lib/types';

interface CategoryTileProps {
  category: PartCategory;
  width?: number;
  variant?: 'horizontal' | 'grid';
}

export function CategoryTile({ category, width, variant = 'horizontal' }: CategoryTileProps) {
  const isGrid = variant === 'grid';
  const colors = useColors();
  const scheme = useScheme();
  const iconGrad = scheme === 'dark'
    ? ['rgba(120,150,255,0.18)', 'rgba(80,110,220,0.08)'] as const
    : [colors.brandSoft, colors.brandSoftAlt] as const;
  const iconColor = scheme === 'dark' ? colors.ink : colors.brand;
  return (
    <Pressable
      onPress={() =>
        router.push({ pathname: '/category/[id]', params: { id: category._id, name: category.name.ru } })
      }
      style={({ pressed }) => [
        isGrid
          ? [styles.gridTile, { backgroundColor: colors.card, borderColor: colors.border }]
          : styles.tile,
        !isGrid && width ? { width, flex: 0 } : null,
        pressed && { opacity: 0.82, transform: [{ scale: 0.94 }] },
      ]}
    >
      <View style={[styles.iconShadow, isGrid && styles.iconShadowGrid]}>
        <LinearGradient
          colors={iconGrad}
          style={[styles.iconWrap, { borderColor: colors.border }, isGrid && styles.iconWrapGrid]}
        >
          <Ionicons
            name={categoryIcon(category.slug)}
            size={isGrid ? ms(32) : ms(26)}
            color={iconColor}
          />
        </LinearGradient>
      </View>
      <Text numberOfLines={2} style={[
        styles.label,
        { color: colors.inkSoft },
        isGrid && [styles.labelGrid, { color: colors.text }],
      ]}>
        {category.name.uz || category.name.ru}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tile: { flex: 1, alignItems: 'center', gap: s(8), paddingVertical: theme.space.xs },
  gridTile: {
    width: '48%',
    alignItems: 'center',
    gap: s(10),
    borderRadius: theme.radius.xl,
    paddingVertical: s(18),
    paddingHorizontal: s(8),
    borderWidth: 1,
    ...theme.shadow.sm,
  },
  iconShadow: { borderRadius: theme.radius.lg, ...theme.shadow.sm },
  iconShadowGrid: { borderRadius: theme.radius.xl },
  iconWrap: {
    width: s(64),
    height: s(64),
    borderRadius: theme.radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  iconWrapGrid: { width: s(72), height: s(72), borderRadius: theme.radius.xl },
  label: {
    fontSize: ms(11.5),
    textAlign: 'center',
    lineHeight: ms(15),
    fontWeight: '600',
    maxWidth: s(68),
  },
  labelGrid: { fontSize: ms(13), fontWeight: '700', maxWidth: s(120), lineHeight: ms(17) },
});
