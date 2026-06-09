import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useGlass } from '@/hooks/useGlass';
import { useTheme } from '@/hooks/useTheme';
import { useSettingsStore } from '@/store/settingsStore';

/**
 * App-wide moody backdrop. If the user has picked a custom background image,
 * we render that (dimmed by their slider) instead of the theme gradient. The
 * glass-tint overlay always sits on top so the surfaces above stay readable.
 */
export function BackgroundGradient({ children }: { children?: React.ReactNode }) {
  const glass = useGlass();
  const theme = useTheme();
  const customBgUri = useSettingsStore((s) => s.theme.customBackgroundUri);
  const customBgDim = useSettingsStore((s) => s.theme.customBackgroundDim);

  return (
    <View style={styles.root}>
      {customBgUri ? (
        <>
          <Image
            source={{ uri: customBgUri }}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
            cachePolicy="memory-disk"
            transition={200}
          />
          <View
            style={[
              StyleSheet.absoluteFill,
              { backgroundColor: `rgba(0, 0, 0, ${customBgDim.toFixed(3)})` },
            ]}
          />
        </>
      ) : (
        <LinearGradient
          colors={theme.bgGradient as unknown as readonly [string, string, string]}
          locations={[0, 0.55, 1]}
          style={StyleSheet.absoluteFill}
        />
      )}
      <View style={[StyleSheet.absoluteFill, { backgroundColor: glass.backgroundTint }]} />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000' },
});
