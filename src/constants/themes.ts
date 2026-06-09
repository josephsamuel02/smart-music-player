export type ThemePreset = {
  id: string;
  name: string;
  description: string;
  /** Background gradient (top -> bottom). */
  bgGradient: readonly [string, string, string];
  /** Accent gradient used by "now playing" surfaces. */
  accentGradient: readonly [string, string];
  /** Solid accent (sliders, active states). */
  accent: string;
  /** Soft / faded accent (track fill, chips). */
  accentSoft: string;
  /** RGB triple used as the tint behind the glass (alpha comes from the user's
   *  background-opacity slider). */
  backgroundTintRgb: readonly [number, number, number];
};

export const THEMES: readonly ThemePreset[] = [
  {
    id: 'aurora',
    name: 'Aurora',
    description: 'Violet & magenta — the original Smart Music Player look.',
    bgGradient: ['#1A0033', '#0A0014', '#000000'],
    accentGradient: ['#7C3AED', '#EC4899'],
    accent: '#A78BFA',
    accentSoft: 'rgba(167, 139, 250, 0.18)',
    backgroundTintRgb: [10, 0, 20],
  },
  {
    id: 'midnight',
    name: 'Midnight',
    description: 'Deep blue with cyan highlights.',
    bgGradient: ['#001433', '#000814', '#000000'],
    accentGradient: ['#3B82F6', '#06B6D4'],
    accent: '#60A5FA',
    accentSoft: 'rgba(96, 165, 250, 0.18)',
    backgroundTintRgb: [0, 8, 20],
  },
  {
    id: 'sunset',
    name: 'Sunset',
    description: 'Warm amber fading into red.',
    bgGradient: ['#330808', '#1A0408', '#000000'],
    accentGradient: ['#F97316', '#EF4444'],
    accent: '#FB923C',
    accentSoft: 'rgba(251, 146, 60, 0.18)',
    backgroundTintRgb: [20, 4, 8],
  },
  {
    id: 'forest',
    name: 'Forest',
    description: 'Emerald & teal — calm and natural.',
    bgGradient: ['#001A14', '#000A08', '#000000'],
    accentGradient: ['#10B981', '#06B6D4'],
    accent: '#34D399',
    accentSoft: 'rgba(52, 211, 153, 0.18)',
    backgroundTintRgb: [0, 10, 8],
  },
  {
    id: 'mono',
    name: 'Monochrome',
    description: 'Pure graphite with crisp white accents.',
    bgGradient: ['#1F1F23', '#0A0A0C', '#000000'],
    accentGradient: ['#D1D5DB', '#9CA3AF'],
    accent: '#E5E7EB',
    accentSoft: 'rgba(229, 231, 235, 0.18)',
    backgroundTintRgb: [10, 10, 12],
  },
] as const;

export const DEFAULT_THEME_ID = 'aurora';

export function getTheme(themeId: string | undefined): ThemePreset {
  return THEMES.find((t) => t.id === themeId) ?? THEMES[0];
}
