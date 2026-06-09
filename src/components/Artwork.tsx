import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Radius } from '@/constants/theme';
import { Colors } from '@/constants/colors';

type Props = {
  uri?: string | null;
  size: number;
  radius?: number;
  /** Used to pick a stable gradient so each song has a unique placeholder. */
  seed?: string;
  style?: ViewStyle;
};

const GRADIENT_PAIRS: readonly (readonly [string, string])[] = [
  ['#7C3AED', '#EC4899'],
  ['#06B6D4', '#3B82F6'],
  ['#F59E0B', '#EF4444'],
  ['#10B981', '#06B6D4'],
  ['#F472B6', '#A78BFA'],
  ['#FB7185', '#FBBF24'],
  ['#8B5CF6', '#22D3EE'],
  ['#FB923C', '#F43F5E'],
];

function hashSeed(seed: string): number {
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = (h << 5) - h + seed.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

/**
 * Renders album artwork or a stable gradient fallback with a music glyph.
 */
export function Artwork({ uri, size, radius, seed = '', style }: Props) {
  const r = radius ?? Math.round(size * 0.18);
  const palette = GRADIENT_PAIRS[hashSeed(seed) % GRADIENT_PAIRS.length];

  return (
    <View
      style={[
        styles.wrapper,
        { width: size, height: size, borderRadius: r, borderColor: Colors.glassBorder },
        style,
      ]}
    >
      {uri ? (
        <Image
          source={{ uri }}
          style={[styles.image, { borderRadius: r }]}
          contentFit="cover"
          transition={150}
        />
      ) : (
        <>
          <LinearGradient
            colors={palette as unknown as readonly [string, string]}
            style={[StyleSheet.absoluteFill, { borderRadius: r }]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />
          <View style={styles.iconWrap}>
            <Ionicons name="musical-notes" size={Math.round(size * 0.42)} color="#ffffff" />
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    overflow: 'hidden',
    backgroundColor: '#1a1029',
    borderWidth: StyleSheet.hairlineWidth,
  },
  image: { width: '100%', height: '100%' },
  iconWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export const ArtworkRadius = Radius;
