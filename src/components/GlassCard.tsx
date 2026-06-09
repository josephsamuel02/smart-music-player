import React from 'react';
import { Platform, StyleSheet, View, ViewProps, ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';
import { Radius } from '@/constants/theme';
import { useGlass } from '@/hooks/useGlass';

type GlassCardProps = ViewProps & {
  /** Override the rounding (default: Radius.lg). */
  radius?: number;
  /** Override default blur tint. */
  tint?: 'light' | 'dark' | 'default';
  /** Optional fixed blur intensity (otherwise uses settings). */
  intensity?: number;
  /** Skip the inner padding (e.g. for full-bleed images). */
  noPadding?: boolean;
  /** Provide a softer / more solid backdrop. */
  variant?: 'default' | 'subtle' | 'strong';
  style?: ViewStyle | ViewStyle[];
  children?: React.ReactNode;
};

/**
 * Frosted-glass surface used throughout the app. Honours the user's
 * transparency + blur settings via `useGlass`.
 *
 * On Android we fall back to a translucent View when blur is set very low,
 * since BlurView gets expensive there.
 */
export function GlassCard({
  radius = Radius.lg,
  tint = 'dark',
  intensity,
  noPadding,
  variant = 'default',
  style,
  children,
  ...rest
}: GlassCardProps) {
  const glass = useGlass();
  const blur = intensity ?? glass.blurIntensity;

  const variantAlpha =
    variant === 'subtle'
      ? glass.fillAlpha * 0.5
      : variant === 'strong'
        ? Math.min(0.28, glass.fillAlpha + 0.06)
        : glass.fillAlpha;
  const variantTint = `rgba(255, 255, 255, ${variantAlpha.toFixed(3)})`;

  const useNativeBlur = Platform.OS !== 'android' || blur >= 20;

  return (
    <View
      {...rest}
      style={[
        styles.base,
        { borderRadius: radius, borderColor: glass.glassBorder },
        !noPadding && styles.padded,
        style,
      ]}
    >
      {useNativeBlur ? (
        <BlurView
          tint={tint}
          intensity={Math.min(100, Math.max(0, blur))}
          style={[StyleSheet.absoluteFill, { borderRadius: radius }]}
        />
      ) : null}
      <View
        style={[
          StyleSheet.absoluteFill,
          { backgroundColor: variantTint, borderRadius: radius },
        ]}
      />
      <View style={styles.content}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
  },
  padded: {
    padding: 14,
  },
  content: {
    position: 'relative',
    zIndex: 1,
  },
});
