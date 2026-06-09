import { useMemo } from 'react';
import { useSettingsStore } from '@/store/settingsStore';
import { getTheme, type ThemePreset } from '@/constants/themes';

/**
 * Returns the active theme preset (the one the user picked in Settings →
 * Themes). Falls back to the default theme if hydration hasn't completed.
 */
export function useTheme(): ThemePreset {
  const themeId = useSettingsStore((s) => s.theme.themeId);
  return useMemo(() => getTheme(themeId), [themeId]);
}
