import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BackgroundGradient } from '@/components/BackgroundGradient';
import { GlassCard } from '@/components/GlassCard';
import { Colors } from '@/constants/colors';
import { DEFAULT_SETTINGS } from '@/constants/audio';
import { FontSize, FontWeight, HitSlop, Spacing } from '@/constants/theme';
import { useSettingsStore } from '@/store/settingsStore';
import { useTheme } from '@/hooks/useTheme';

export default function GlassmorphismScreen() {
  const glass = useSettingsStore((s) => s.glass);
  const updateGlass = useSettingsStore((s) => s.updateGlass);
  const theme = useTheme();

  return (
    <BackgroundGradient>
      <SafeAreaView style={{ flex: 1 }} edges={['top', 'left', 'right', 'bottom']}>
        <View style={styles.headerRow}>
          <Pressable hitSlop={HitSlop} onPress={() => router.back()} style={styles.iconBtn}>
            <Ionicons name="chevron-back" size={22} color={Colors.text} />
          </Pressable>
          <Text style={styles.headerTitle}>Glassmorphism</Text>
          <View style={styles.iconBtnSpacer} />
        </View>

        <ScrollView contentContainerStyle={styles.scroll}>
          <Text style={styles.intro}>
            Fine-tune the frosted-glass surfaces used throughout the app. Changes apply live.
          </Text>

          <GlassCard style={styles.card}>
            <SliderRow
              label="Transparency"
              value={glass.transparency}
              min={0}
              max={1}
              suffix={`${Math.round(glass.transparency * 100)}%`}
              accent={theme.accent}
              onChange={(v) => updateGlass({ transparency: v })}
            />
            <SliderRow
              label="Blur intensity"
              value={glass.blurIntensity}
              min={0}
              max={100}
              suffix={`${Math.round(glass.blurIntensity)}`}
              accent={theme.accent}
              onChange={(v) => updateGlass({ blurIntensity: v })}
            />
            <SliderRow
              label="Background opacity"
              value={glass.backgroundOpacity}
              min={0}
              max={1}
              suffix={`${Math.round(glass.backgroundOpacity * 100)}%`}
              accent={theme.accent}
              onChange={(v) => updateGlass({ backgroundOpacity: v })}
            />
          </GlassCard>

          <Pressable
            onPress={() =>
              updateGlass({
                transparency: DEFAULT_SETTINGS.glass.transparency,
                blurIntensity: DEFAULT_SETTINGS.glass.blurIntensity,
                backgroundOpacity: DEFAULT_SETTINGS.glass.backgroundOpacity,
              })
            }
            style={styles.resetRow}
          >
            <Ionicons name="refresh" size={14} color={theme.accent} />
            <Text style={[styles.resetText, { color: theme.accent }]}>Reset glass to defaults</Text>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    </BackgroundGradient>
  );
}

function SliderRow({
  label,
  value,
  min,
  max,
  suffix,
  accent,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  suffix: string;
  accent: string;
  onChange: (v: number) => void;
}) {
  return (
    <View style={styles.sliderItem}>
      <View style={styles.sliderHeader}>
        <Text style={styles.sliderLabel}>{label}</Text>
        <Text style={styles.sliderValue}>{suffix}</Text>
      </View>
      <Slider
        minimumValue={min}
        maximumValue={max}
        value={value}
        step={(max - min) / 100}
        minimumTrackTintColor={accent}
        maximumTrackTintColor="rgba(255,255,255,0.18)"
        thumbTintColor={accent}
        onSlidingComplete={onChange}
        onValueChange={onChange}
      />
    </View>
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
  iconBtnSpacer: { width: 40, height: 40 },
  headerTitle: {
    flex: 1,
    color: Colors.text,
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
  },

  scroll: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.md, paddingBottom: 60 },
  intro: {
    color: Colors.textMuted,
    fontSize: FontSize.sm,
    marginBottom: Spacing.md,
  },
  card: { padding: 0, overflow: 'hidden' },

  sliderItem: { paddingHorizontal: Spacing.lg, paddingTop: 14, paddingBottom: 6 },
  sliderHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sliderLabel: { color: Colors.text, fontSize: FontSize.md, fontWeight: FontWeight.semibold },
  sliderValue: { color: Colors.textMuted, fontSize: FontSize.sm, fontVariant: ['tabular-nums'] },

  resetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    paddingVertical: 12,
    marginTop: Spacing.sm,
  },
  resetText: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold },
});
