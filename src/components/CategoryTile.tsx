import { Pressable, Text, View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
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
  return (
    <Pressable
      onPress={() =>
        router.push({ pathname: '/category/[id]', params: { id: category._id, name: category.name.ru } })
      }
      style={({ pressed }) => [
        isGrid ? styles.gridTile : styles.tile,
        !isGrid && width ? { width, flex: 0 } : null,
        pressed && { opacity: 0.82, transform: [{ scale: 0.94 }] },
      ]}
    >
      <View style={[styles.iconShadow, isGrid && styles.iconShadowGrid]}>
        <LinearGradient
          colors={[theme.colors.brandSoft, '#dce5f8']}
          style={[styles.iconWrap, isGrid && styles.iconWrapGrid]}
        >
          <Ionicons
            name={categoryIcon(category.slug)}
            size={isGrid ? ms(32) : ms(26)}
            color={theme.colors.brand}
          />
        </LinearGradient>
      </View>
      <Text numberOfLines={2} style={[styles.label, isGrid && styles.labelGrid]}>
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
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.xl,
    paddingVertical: s(18),
    paddingHorizontal: s(8),
    borderWidth: 1,
    borderColor: theme.colors.border,
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
    borderColor: theme.colors.border,
  },
  iconWrapGrid: {
    width: s(72),
    height: s(72),
    borderRadius: theme.radius.xl,
  },
  label: {
    fontSize: ms(11.5),
    color: theme.colors.inkSoft,
    textAlign: 'center',
    lineHeight: ms(15),
    fontWeight: '600',
    maxWidth: s(68),
  },
  labelGrid: {
    fontSize: ms(13),
    color: theme.colors.text,
    fontWeight: '700',
    maxWidth: s(120),
    lineHeight: ms(17),
  },
});
