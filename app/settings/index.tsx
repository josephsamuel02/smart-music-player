import React from 'react';
import { Alert, Platform, Pressable, ScrollView, StyleSheet, Text, ToastAndroid, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BackgroundGradient } from '@/components/BackgroundGradient';
import { GlassCard } from '@/components/GlassCard';
import { Colors } from '@/constants/colors';
import { FontSize, FontWeight, HitSlop, Radius, Spacing } from '@/constants/theme';
import { AD_FREE_DURATION_MS, REWARDED_REMOVE_ADS_UNIT_ID } from '@/constants/ads';
import { useSettingsStore } from '@/store/settingsStore';
import { useRewardedUnlock } from '@/hooks/useRewardedUnlock';
import { getTheme } from '@/constants/themes';

type MenuItem = {
  id: string;
  title: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
  href:
    | '/settings/glassmorphism'
    | '/settings/themes'
    | '/settings/playback'
    | '/settings/equalizer';
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
    subtitle: 'Crossfade, resume on launch, pause on unplug, library scan.',
    icon: 'play-circle-outline',
    href: '/settings/playback',
  },
  {
    id: 'equalizer',
    title: 'Equalizer',
    subtitle: 'Presets and per-band tuning for your sound.',
    icon: 'options-outline',
    href: '/settings/equalizer',
  },
] as const;

export default function SettingsMenuScreen() {
  const reset = useSettingsStore((s) => s.reset);
  const themeId = useSettingsStore((s) => s.theme.themeId);
  const adFreeUntil = useSettingsStore((s) => s.adFreeUntil);
  const grantAdFree = useSettingsStore((s) => s.grantAdFree);
  const activeTheme = getTheme(themeId);

  // Each completed rewarded view is an independent reward: it stacks another
  // 24h onto any remaining ad-free time, so the user can watch back-to-back to
  // bank multiple days. We confirm the new total after every grant.
  const { isLoaded: removeAdsReady, present: presentRemoveAdsAd } = useRewardedUnlock(
    REWARDED_REMOVE_ADS_UNIT_ID,
    () => {
      grantAdFree(AD_FREE_DURATION_MS);
      const until = useSettingsStore.getState().adFreeUntil;
      const hours = Math.max(1, Math.round((until - Date.now()) / (60 * 60 * 1000)));
      if (Platform.OS === 'android') {
        ToastAndroid.show(`Ads off for about ${hours} hours`, ToastAndroid.SHORT);
      }
    },
  );

  const adFree = adFreeUntil > Date.now();
  const adFreeHoursLeft = adFree ? Math.ceil((adFreeUntil - Date.now()) / (60 * 60 * 1000)) : 0;

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

          <GlassCard style={styles.adFreeCard}>
            <View style={[styles.menuIconWrap, { backgroundColor: activeTheme.accentSoft }]}>
              <Ionicons
                name={adFree ? 'shield-checkmark' : 'play-circle-outline'}
                size={20}
                color={activeTheme.accent}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.menuTitle}>Remove ads for a day</Text>
              <Text style={styles.menuSubtitle}>
                {adFree
                  ? `No ads for about ${adFreeHoursLeft} more hour${
                      adFreeHoursLeft === 1 ? '' : 's'
                    }. Watch again to add another day.`
                  : 'Watch a short video and go ad-free for 24 hours.'}
              </Text>
            </View>
            <Pressable
              disabled={!removeAdsReady}
              onPress={presentRemoveAdsAd}
              style={({ pressed }) => [
                styles.adFreeBtn,
                { backgroundColor: activeTheme.accent },
                (pressed || !removeAdsReady) && { opacity: 0.5 },
              ]}
            >
              <Ionicons name="play" size={14} color="#0A0A0F" />
              <Text style={styles.adFreeBtnText}>
                {removeAdsReady ? (adFree ? 'Add day' : 'Watch') : '…'}
              </Text>
            </Pressable>
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

  adFreeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: 14,
    marginTop: Spacing.md,
  },
  adFreeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: Radius.pill,
  },
  adFreeBtnText: {
    color: '#0A0A0F',
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
  },

  footer: {
    color: Colors.textFaint,
    textAlign: 'center',
    marginTop: Spacing.xl,
    fontSize: FontSize.xs,
  },
});
