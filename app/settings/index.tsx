import React from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BackgroundGradient } from '@/components/BackgroundGradient';
import { GlassCard } from '@/components/GlassCard';
import { Colors } from '@/constants/colors';
import { FontSize, FontWeight, HitSlop, Radius, Spacing } from '@/constants/theme';
import { useSettingsStore } from '@/store/settingsStore';
import { getTheme } from '@/constants/themes';

type MenuItem = {
  id: string;
  title: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
  href: '/settings/glassmorphism' | '/settings/themes' | '/settings/playback';
};

const MENU: readonly MenuItem[] = [
  {
    id: 'glass',
    title: 'Glassmorphism',
    subtitle: 'Transparency, blur intensity, background opacity.',
    icon: 'cube-outline',
    href: '/settings/glassmorphism',
  },
  {
    id: 'themes',
    title: 'Themes',
    subtitle: 'Switch the colour palette and gradient.',
    icon: 'color-palette-outline',
    href: '/settings/themes',
  },
  {
    id: 'play',
    title: 'Play settings',
    subtitle: 'Crossfade, resume on launch, library scan.',
    icon: 'play-circle-outline',
    href: '/settings/playback',
  },
] as const;

export default function SettingsMenuScreen() {
  const reset = useSettingsStore((s) => s.reset);
  const themeId = useSettingsStore((s) => s.theme.themeId);
  const activeTheme = getTheme(themeId);

  return (
    <BackgroundGradient>
      <SafeAreaView style={{ flex: 1 }} edges={['top', 'left', 'right', 'bottom']}>
        <View style={styles.headerRow}>
          <Pressable hitSlop={HitSlop} onPress={() => router.back()} style={styles.iconBtn}>
            <Ionicons name="chevron-back" size={22} color={Colors.text} />
          </Pressable>
          <Text style={styles.headerTitle}>Settings</Text>
          <Pressable
            hitSlop={HitSlop}
            onPress={() =>
              Alert.alert('Reset settings', 'Restore all settings to their defaults?', [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Reset', style: 'destructive', onPress: reset },
              ])
            }
            style={styles.resetBtn}
          >
            <Text style={styles.resetBtnText}>Reset</Text>
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.scroll}>
          <GlassCard style={styles.menuCard}>
            {MENU.map((item, idx) => (
              <Pressable
                key={item.id}
                onPress={() => router.push(item.href)}
                style={({ pressed }) => [
                  styles.menuRow,
                  idx > 0 && styles.menuRowDivider,
                  pressed && { opacity: 0.85 },
                ]}
              >
                <View style={[styles.menuIconWrap, { backgroundColor: activeTheme.accentSoft }]}>
                  <Ionicons name={item.icon} size={20} color={activeTheme.accent} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.menuTitle}>{item.title}</Text>
                  <Text style={styles.menuSubtitle}>{item.subtitle}</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={Colors.textFaint} />
              </Pressable>
            ))}
          </GlassCard>

          <Text style={styles.footer}>Smart Music Player · Offline-first · Local only</Text>
        </ScrollView>
      </SafeAreaView>
    </BackgroundGradient>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    color: Colors.text,
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
  },
  resetBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.pill,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  resetBtnText: {
    color: Colors.textMuted,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
  },

  scroll: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: 60,
  },
  menuCard: { padding: 0, overflow: 'hidden' },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: 14,
  },
  menuRowDivider: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255,255,255,0.08)',
  },
  menuIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuTitle: {
    color: Colors.text,
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
  },
  menuSubtitle: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
    marginTop: 2,
  },

  footer: {
    color: Colors.textFaint,
    textAlign: 'center',
    marginTop: Spacing.xl,
    fontSize: FontSize.xs,
  },
});
