import { useMemo } from 'react';
import { useSettingsStore } from '@/store/settingsStore';
import { useTheme } from '@/hooks/useTheme';

/**
 * Derive concrete style values from the user-controlled glassmorphism settings
 * combined with the active theme. Centralising this means every glass surface
 * in the app reacts to the sliders in Settings (and to theme changes) instantly
 * and consistently.
 */
export function useGlass() {
  const glass = useSettingsStore((s) => s.glass);
  const theme = useTheme();
  return useMemo(() => {
    const fillAlpha = 0.04 + (1 - glass.transparency) * 0.18;
    const borderAlpha = 0.08 + (1 - glass.transparency) * 0.18;
    const [r, g, b] = theme.backgroundTintRgb;
    return {
      blurIntensity: Math.round(glass.blurIntensity),
      fillAlpha,
      borderAlpha,
      glassFill: `rgba(255, 255, 255, ${fillAlpha.toFixed(3)})`,
      glassBorder: `rgba(255, 255, 255, ${borderAlpha.toFixed(3)})`,
      backgroundTint: `rgba(${r}, ${g}, ${b}, ${glass.backgroundOpacity.toFixed(3)})`,
      transparency: glass.transparency,
      backgroundOpacity: glass.backgroundOpacity,
    };
  }, [glass, theme]);
}
