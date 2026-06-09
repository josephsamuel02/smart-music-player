import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, withTiming } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import type { Href } from 'expo-router';
import { router, usePathname } from 'expo-router';
import { Colors } from '@/constants/colors';
import { FontSize, FontWeight, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { GlassCard } from './GlassCard';

type Tab = { label: string; href: Href };

const TABS: Tab[] = [
  { label: 'Songs', href: '/(tabs)/songs' as Href },
  { label: 'Liked', href: '/(tabs)/liked' as Href },
  { label: 'Playlists', href: '/(tabs)/playlists' as Href },
  { label: 'Folders', href: '/(tabs)/folders' as Href },
];

/**
 * Horizontally-scrolling glass tab bar. Sits above the mini player.
 */
export function TopTabBar() {
  const pathname = usePathname();

  const onPress = (href: Href) => {
    void Haptics.selectionAsync();
    router.replace(href);
  };

  return (
    <View style={styles.outer}>
      <GlassCard radius={Radius.pill} variant="subtle" style={styles.card} noPadding>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scroll}
        >
          {TABS.map((t) => {
            const active = pathname.endsWith(String(t.href).split('/').pop() ?? '');
            return (
              <TabButton
                key={String(t.href)}
                label={t.label}
                active={active}
                onPress={() => onPress(t.href)}
              />
            );
          })}
        </ScrollView>
      </GlassCard>
    </View>
  );
}

function TabButton({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  const theme = useTheme();
  const bgStyle = useAnimatedStyle(() => ({
    backgroundColor: withTiming(active ? theme.accent : 'rgba(255,255,255,0.00)', {
      duration: 200,
    }),
  }));

  return (
    <Pressable onPress={onPress} style={styles.tabPress}>
      <Animated.View style={[styles.tabBg, bgStyle]} />
      <Text style={[styles.tabText, active && styles.tabTextActive]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  outer: { paddingHorizontal: Spacing.lg, paddingTop: 4, paddingBottom: 6 },
  card: { overflow: 'hidden' },
  scroll: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 6,
    gap: 4,
  },
  tabPress: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: 8,
    borderRadius: Radius.pill,
    overflow: 'hidden',
    justifyContent: 'center',
  },
  tabBg: { ...StyleSheet.absoluteFillObject, borderRadius: Radius.pill },
  tabText: { color: Colors.textMuted, fontSize: FontSize.sm, fontWeight: FontWeight.semibold },
  tabTextActive: { color: '#ffffff', fontWeight: FontWeight.medium },
});
