import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useGlass } from '@/hooks/useGlass';
import { useSettingsStore } from '@/store/settingsStore';
import { getBackground } from '@/constants/backgrounds';

/**
 * App-wide moody backdrop. Priority: a user-picked custom photo wins; otherwise
 * the selected background preset (the bundled `default_bg.jpg` image or one of
 * the mood gradients) is rendered. The glass-tint overlay always sits on top so
 * the surfaces above stay readable.
 */
export function BackgroundGradient({ children }: { children?: React.ReactNode }) {
  const glass = useGlass();
  const backgroundId = useSettingsStore((s) => s.theme.backgroundId);
  const customBgUri = useSettingsStore((s) => s.theme.customBackgroundUri);
  const customBgDim = useSettingsStore((s) => s.theme.customBackgroundDim);
  const background = getBackground(backgroundId);

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
      ) : background.type === 'image' ? (
        <Image
          source={background.source}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          cachePolicy="memory-disk"
          transition={200}
        />
      ) : (
        <LinearGradient
          colors={background.colors as unknown as readonly [string, string, string]}
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
