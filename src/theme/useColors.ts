import { useColorScheme } from 'react-native';
import { lightColors, darkColors } from './index';
import { useThemeStore } from './themeStore';

export type { Colors } from './index';

export function useScheme(): 'light' | 'dark' {
  const system = useColorScheme() ?? 'light';
  const preference = useThemeStore((s) => s.preference);
  return preference === 'system' ? system : preference;
}

export function useColors() {
  const scheme = useScheme();
  return scheme === 'dark' ? darkColors : lightColors;
}
