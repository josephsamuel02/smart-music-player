import React from 'react';
import { Platform, StyleSheet, View, ViewProps, ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
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

  // Liquid-glass specular strength scales gently with how "solid" the surface
  // is, so glossier highlights appear on stronger surfaces without washing out
  // very transparent ones.
  const sheenTop = variant === 'strong' ? 0.5 : variant === 'subtle' ? 0.28 : 0.4;
  const sheenMid = variant === 'strong' ? 0.1 : 0.06;

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

      {/* Liquid glass: glossy top-down specular sheen. */}
      <LinearGradient
        colors={[
          `rgba(255, 255, 255, ${sheenTop.toFixed(3)})`,
          `rgba(255, 255, 255, ${sheenMid.toFixed(3)})`,
          'rgba(255, 255, 255, 0)',
        ]}
        locations={[0, 0.45, 1]}
        style={[StyleSheet.absoluteFill, { borderRadius: radius }]}
        pointerEvents="none"
      />

      {/* Liquid glass: diagonal light streak for a wet, fluid reflection. */}
      <LinearGradient
        colors={[
          'rgba(255, 255, 255, 0.22)',
          'rgba(255, 255, 255, 0)',
          'rgba(255, 255, 255, 0)',
          'rgba(255, 255, 255, 0.10)',
        ]}
        locations={[0, 0.35, 0.7, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[StyleSheet.absoluteFill, { borderRadius: radius }]}
        pointerEvents="none"
      />

      {/* Liquid glass: soft depth shading toward the bottom edge. */}
      <LinearGradient
        colors={['rgba(0, 0, 0, 0)', 'rgba(0, 0, 0, 0.12)']}
        locations={[0.6, 1]}
        style={[StyleSheet.absoluteFill, { borderRadius: radius }]}
        pointerEvents="none"
      />

      {/* Liquid glass: bright crisp highlight hugging the top rim. */}
      <View
        style={[
          styles.topRim,
          { borderRadius: radius, borderColor: 'rgba(255, 255, 255, 0.5)' },
        ]}
        pointerEvents="none"
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
  topRim: {
    ...StyleSheet.absoluteFillObject,
    borderTopWidth: 1,
    borderColor: 'transparent',
  },
  content: {
    position: 'relative',
    zIndex: 1,
  },
});
