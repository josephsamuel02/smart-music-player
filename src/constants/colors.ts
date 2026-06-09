export const Colors = {
  /** App-wide deep gradient background (top -> bottom) */
  bgGradient: ['#1A0033', '#0A0014', '#000000'] as const,
  /** Subtle accent gradient for "now playing" surfaces */
  accentGradient: ['#7C3AED', '#EC4899'] as const,

  text: '#FFFFFF',
  textMuted: 'rgba(255, 255, 255, 0.65)',
  textFaint: 'rgba(255, 255, 255, 0.45)',

  glassFill: 'rgba(255, 255, 255, 0.06)',
  glassBorder: 'rgba(255, 255, 255, 0.12)',

  accent: '#A78BFA',
  accentSoft: 'rgba(167, 139, 250, 0.18)',
  danger: '#F87171',
  success: '#34D399',

  overlay: 'rgba(0, 0, 0, 0.55)',
};

export type AppColors = typeof Colors;
