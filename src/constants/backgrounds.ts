import type { ImageSourcePropType } from 'react-native';

export type BackgroundPreset =
  | {
      id: string;
      name: string;
      type: 'image';
      /** Bundled image used as the app backdrop. */
      source: ImageSourcePropType;
    }
  | {
      id: string;
      name: string;
      type: 'gradient';
      /** Transitioned mood colours (top -> middle -> bottom). */
      colors: readonly [string, string, string];
    };

/**
 * The six background choices shown in Settings → Themes. The first option is
 * the bundled `default_bg.jpg` photo (the app default); the rest are
 * transitioned-colour gradients for different moods.
 */
export const BACKGROUNDS: readonly BackgroundPreset[] = [
  {
    id: 'default',
    name: 'Default',
    type: 'image',
    source: require('../../assets/default_bg.jpg'),
  },
  {
    id: 'nebula',
    name: 'Nebula',
    type: 'gradient',
    colors: ['#2A0845', '#170129', '#000000'],
  },
  {
    id: 'twilight',
    name: 'Twilight',
    type: 'gradient',
    colors: ['#1B2845', '#0B1026', '#000000'],
  },
  {
    id: 'ocean',
    name: 'Ocean',
    type: 'gradient',
    colors: ['#06303B', '#031A22', '#000000'],
  },
  {
    id: 'ember',
    name: 'Ember',
    type: 'gradient',
    colors: ['#3A0A12', '#1C0508', '#000000'],
  },
  {
    id: 'meadow',
    name: 'Meadow',
    type: 'gradient',
    colors: ['#10331F', '#07180F', '#000000'],
  },
] as const;

export const DEFAULT_BACKGROUND_ID = 'default';

export function getBackground(backgroundId: string | undefined): BackgroundPreset {
  return BACKGROUNDS.find((b) => b.id === backgroundId) ?? BACKGROUNDS[0];
}
