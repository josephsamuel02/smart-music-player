import type { EqualizerSettings } from '@/types';

/** Center frequency (Hz) of each equalizer band, low → high. */
export const EQ_BANDS = [60, 230, 910, 3600, 14000] as const;

/** Short labels shown under each slider. */
export const EQ_BAND_LABELS = ['60', '230', '910', '3.6k', '14k'] as const;

/** Allowed gain range per band, in decibels. */
export const EQ_MIN_DB = -12;
export const EQ_MAX_DB = 12;

export type EqPreset = {
  id: string;
  label: string;
  /** Gain in dB per band, aligned to `EQ_BANDS`. */
  gains: number[];
};

/**
 * Built-in presets. `custom` is special-cased in the UI (it mirrors whatever
 * the user dialed in by hand) so it is intentionally left out of this list.
 */
export const EQ_PRESETS: readonly EqPreset[] = [
  { id: 'flat', label: 'Flat', gains: [0, 0, 0, 0, 0] },
  { id: 'bass', label: 'Bass boost', gains: [7, 4, 1, 0, -1] },
  { id: 'treble', label: 'Treble boost', gains: [-2, -1, 0, 3, 6] },
  { id: 'vocal', label: 'Vocal', gains: [-2, 0, 4, 3, -1] },
  { id: 'rock', label: 'Rock', gains: [5, 3, -1, 3, 4] },
  { id: 'pop', label: 'Pop', gains: [-1, 2, 4, 2, -1] },
  { id: 'jazz', label: 'Jazz', gains: [3, 2, -1, 2, 3] },
  { id: 'classical', label: 'Classical', gains: [4, 3, -1, 3, 4] },
  { id: 'electronic', label: 'Electronic', gains: [6, 3, 0, 2, 5] },
] as const;

export function getEqPreset(id: string): EqPreset | undefined {
  return EQ_PRESETS.find((p) => p.id === id);
}

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

/** Coerce stored/edited equalizer data into a safe, well-formed shape. */
export function sanitizeEqualizer(eq: Partial<EqualizerSettings> | undefined): EqualizerSettings {
  const preset = typeof eq?.preset === 'string' ? eq.preset : 'flat';
  const source = Array.isArray(eq?.gains) ? eq!.gains : getEqPreset(preset)?.gains ?? [];
  const gains = EQ_BANDS.map((_, i) => {
    const v = typeof source[i] === 'number' && Number.isFinite(source[i]) ? source[i] : 0;
    return clamp(Math.round(v), EQ_MIN_DB, EQ_MAX_DB);
  });
  return {
    enabled: Boolean(eq?.enabled),
    preset,
    gains,
  };
}
