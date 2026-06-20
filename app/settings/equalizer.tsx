import React from 'react';
import { Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BackgroundGradient } from '@/components/BackgroundGradient';
import { GlassCard } from '@/components/GlassCard';
import { Colors } from '@/constants/colors';
import {
  EQ_BAND_LABELS,
  EQ_BANDS,
  EQ_MAX_DB,
  EQ_MIN_DB,
  EQ_PRESETS,
} from '@/constants/equalizer';
import { FontSize, FontWeight, HitSlop, Radius, Spacing } from '@/constants/theme';
import { useSettingsStore } from '@/store/settingsStore';
import { useTheme } from '@/hooks/useTheme';

export default function EqualizerScreen() {
  const equalizer = useSettingsStore((s) => s.equalizer);
  const updateEqualizer = useSettingsStore((s) => s.updateEqualizer);
  const theme = useTheme();

  const { enabled, preset, gains } = equalizer;

  const onSelectPreset = (id: string) => {
    const found = EQ_PRESETS.find((p) => p.id === id);
    if (!found) return;
    updateEqualizer({ preset: id, gains: found.gains });
  };

  const onBandChange = (index: number, value: number) => {
    const nextGains = gains.map((g, i) => (i === index ? Math.round(value) : g));
    updateEqualizer({ preset: 'custom', gains: nextGains });
  };

  return (
    <BackgroundGradient>
      <SafeAreaView style={{ flex: 1 }} edges={['top', 'left', 'right', 'bottom']}>
        <View style={styles.headerRow}>
          <Pressable hitSlop={HitSlop} onPress={() => router.back()} style={styles.iconBtn}>
            <Ionicons name="chevron-back" size={22} color={Colors.text} />
          </Pressable>
          <Text style={styles.headerTitle}>Equalizer</Text>
          <View style={styles.iconBtnSpacer} />
        </View>

        <ScrollView contentContainerStyle={styles.scroll}>
          <GlassCard style={styles.card}>
            <View style={styles.toggleRow}>
              <Ionicons name="options-outline" size={20} color={Colors.text} />
              <View style={{ flex: 1 }}>
                <Text style={styles.toggleLabel}>Enable equalizer</Text>
                <Text style={styles.toggleHint}>Shape the tone with presets or custom bands.</Text>
              </View>
              <Switch
                value={enabled}
                onValueChange={(v) => updateEqualizer({ enabled: v })}
                trackColor={{ false: 'rgba(255,255,255,0.15)', true: theme.accentSoft }}
                thumbColor={enabled ? theme.accent : '#f4f4f5'}
                ios_backgroundColor="rgba(255,255,255,0.15)"
              />
            </View>
          </GlassCard>

          <Text style={styles.sectionTitle}>Presets</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chips}
          >
            {EQ_PRESETS.map((p) => {
              const active = preset === p.id;
              return (
                <Pressable
                  key={p.id}
                  disabled={!enabled}
                  onPress={() => onSelectPreset(p.id)}
                  style={[
                    styles.chip,
                    active && { backgroundColor: theme.accentSoft, borderColor: theme.accent },
                    !enabled && styles.disabled,
                  ]}
                >
                  <Text style={[styles.chipText, active && { color: theme.accent }]}>{p.label}</Text>
                </Pressable>
              );
            })}
            {preset === 'custom' ? (
              <View style={[styles.chip, { backgroundColor: theme.accentSoft, borderColor: theme.accent }]}>
                <Text style={[styles.chipText, { color: theme.accent }]}>Custom</Text>
              </View>
            ) : null}
          </ScrollView>

          <Text style={styles.sectionTitle}>Bands</Text>
          <GlassCard style={styles.card}>
            {EQ_BANDS.map((_, i) => (
              <View key={EQ_BAND_LABELS[i]} style={styles.bandRow}>
                <View style={styles.bandHeader}>
                  <Text style={styles.bandFreq}>{EQ_BAND_LABELS[i]} Hz</Text>
                  <Text style={styles.bandValue}>
                    {gains[i] > 0 ? `+${gains[i]}` : gains[i]} dB
                  </Text>
                </View>
                <Slider
                  disabled={!enabled}
                  minimumValue={EQ_MIN_DB}
                  maximumValue={EQ_MAX_DB}
                  step={1}
                  value={gains[i]}
                  minimumTrackTintColor={enabled ? theme.accent : 'rgba(255,255,255,0.18)'}
                  maximumTrackTintColor="rgba(255,255,255,0.18)"
                  thumbTintColor={enabled ? theme.accent : 'rgba(255,255,255,0.4)'}
                  onValueChange={(v) => onBandChange(i, v)}
                />
              </View>
            ))}
          </GlassCard>

          <Pressable
            disabled={!enabled}
            onPress={() => onSelectPreset('flat')}
            style={[styles.resetRow, !enabled && styles.disabled]}
          >
            <Ionicons name="refresh" size={14} color={theme.accent} />
            <Text style={[styles.resetText, { color: theme.accent }]}>Reset bands to flat</Text>
          </Pressable>
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
  iconBtnSpacer: { width: 40, height: 40 },
  headerTitle: {
    flex: 1,
    color: Colors.text,
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
  },

  scroll: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.md, paddingBottom: 60 },
  card: { padding: 0, overflow: 'hidden' },

  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: 12,
  },
  toggleLabel: { color: Colors.text, fontSize: FontSize.md, fontWeight: FontWeight.semibold },
  toggleHint: { color: Colors.textMuted, fontSize: FontSize.xs, marginTop: 2 },

  sectionTitle: {
    color: Colors.text,
    fontSize: FontSize.lg,
    fontWeight: FontWeight.semibold,
    marginTop: Spacing.lg,
    marginBottom: 10,
  },
  chips: { gap: 8, paddingRight: Spacing.lg },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: Radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.14)',
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  chipText: { color: Colors.text, fontSize: FontSize.sm, fontWeight: FontWeight.semibold },

  bandRow: { paddingHorizontal: Spacing.lg, paddingTop: 12, paddingBottom: 4 },
  bandHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  bandFreq: { color: Colors.text, fontSize: FontSize.md, fontWeight: FontWeight.semibold },
  bandValue: { color: Colors.textMuted, fontSize: FontSize.sm, fontVariant: ['tabular-nums'] },

  disabled: { opacity: 0.4 },

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
