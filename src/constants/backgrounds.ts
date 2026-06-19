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
 * Bundled photo backgrounds. The first option is the app default
 * (`default_bg.jpg`); the rest are the photos in the `assets` folder.
 */
export const IMAGE_BACKGROUNDS: readonly BackgroundPreset[] = [
  {
    id: 'default',
    name: 'Default',
    type: 'image',
    source: require('../../assets/default_bg.jpg'),
  },
  {
    id: 'photo-nightfall',
    name: 'Nightfall',
    type: 'image',
    source: require('../../assets/billy-huynh-W8KTS-mhFUE-unsplash.jpg'),
  },
  {
    id: 'photo-drift',
    name: 'Drift',
    type: 'image',
    source: require('../../assets/juho-luomala-K2AWz4lXrAM-unsplash.jpg'),
  },
  {
    id: 'photo-slate',
    name: 'Slate',
    type: 'image',
    source: require('../../assets/keith-misner-h0Vxgz5tyXA-unsplash.jpg'),
  },
  {
    id: 'photo-ember',
    name: 'Ember Sky',
    type: 'image',
    source: require('../../assets/kenny-cinders-7qRM11Kmnh4-unsplash.jpg'),
  },
  {
    id: 'photo-horizon',
    name: 'Horizon',
    type: 'image',
    source: require('../../assets/lucas-k-wQLAGv4_OYs-unsplash.jpg'),
  },
  {
    id: 'photo-bloom',
    name: 'Bloom',
    type: 'image',
    source: require('../../assets/malena-gonzalez-serena-I8JL2ztNmp0-unsplash.jpg'),
  },
  {
    id: 'photo-paper',
    name: 'Paper',
    type: 'image',
    source: require('../../assets/patrick-tomasso-QMDap1TAu0g-unsplash.jpg'),
  },
] as const;

/** Transitioned-colour gradient backgrounds for different moods. */
export const GRADIENT_BACKGROUNDS: readonly BackgroundPreset[] = [
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

/** Every selectable background (used for lookups). */
export const BACKGROUNDS: readonly BackgroundPreset[] = [
  ...IMAGE_BACKGROUNDS,
  ...GRADIENT_BACKGROUNDS,
];

export const DEFAULT_BACKGROUND_ID = 'default';

export function getBackground(backgroundId: string | undefined): BackgroundPreset {
  return BACKGROUNDS.find((b) => b.id === backgroundId) ?? BACKGROUNDS[0];
}
