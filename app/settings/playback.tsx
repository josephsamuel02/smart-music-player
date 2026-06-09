import React from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BackgroundGradient } from '@/components/BackgroundGradient';
import { GlassCard } from '@/components/GlassCard';
import { Colors } from '@/constants/colors';
import { FontSize, FontWeight, HitSlop, Spacing } from '@/constants/theme';
import { useSettingsStore } from '@/store/settingsStore';
import { useLibraryLoader } from '@/hooks/useLibraryLoader';
import { useMusicStore } from '@/store/musicStore';
import { useTheme } from '@/hooks/useTheme';

export default function PlaybackSettingsScreen() {
  const playback = useSettingsStore((s) => s.playback);
  const library = useSettingsStore((s) => s.library);
  const updatePlayback = useSettingsStore((s) => s.updatePlayback);
  const updateLibrary = useSettingsStore((s) => s.updateLibrary);
  const theme = useTheme();

  const { scanNow } = useLibraryLoader();
  const songCount = useMusicStore((s) => s.songs.length);

  return (
    <BackgroundGradient>
      <SafeAreaView style={{ flex: 1 }} edges={['top', 'left', 'right', 'bottom']}>
        <View style={styles.headerRow}>
          <Pressable hitSlop={HitSlop} onPress={() => router.back()} style={styles.iconBtn}>
            <Ionicons name="chevron-back" size={22} color={Colors.text} />
          </Pressable>
          <Text style={styles.headerTitle}>Play settings</Text>
          <View style={styles.iconBtnSpacer} />
        </View>

        <ScrollView contentContainerStyle={styles.scroll}>
          <Section title="Playback">
            <GlassCard style={styles.card}>
              <ToggleRow
                icon="swap-horizontal"
                label="Crossfade"
                hint="Blend tracks at the boundary for smooth transitions."
                value={playback.crossfade}
                accent={theme.accent}
                accentSoft={theme.accentSoft}
                onValueChange={(v) => updatePlayback({ crossfade: v })}
              />
              <ToggleRow
                icon="bookmark-outline"
                label="Resume last played song"
                hint="Open the app where you left off."
                value={playback.resumeLastPlayed}
                accent={theme.accent}
                accentSoft={theme.accentSoft}
                onValueChange={(v) => updatePlayback({ resumeLastPlayed: v })}
              />
              <ToggleRow
                icon="play-circle-outline"
                label="Auto play on launch"
                hint="Immediately start the last queue when the app opens."
                value={playback.autoPlayOnLaunch}
                accent={theme.accent}
                accentSoft={theme.accentSoft}
                onValueChange={(v) => updatePlayback({ autoPlayOnLaunch: v })}
              />
            </GlassCard>
          </Section>

          <Section title="Library" caption={`${songCount} songs indexed.`}>
            <GlassCard style={styles.card}>
              <ToggleRow
                icon="eye-outline"
                label="Show hidden audio files"
                hint="Include files whose name begins with a dot."
                value={library.showHiddenAudio}
                accent={theme.accent}
                accentSoft={theme.accentSoft}
                onValueChange={(v) => updateLibrary({ showHiddenAudio: v })}
              />
              <Pressable
                onPress={() => {
                  void scanNow();
                  Alert.alert('Rescan started', 'Your library will refresh in a moment.');
                }}
                style={({ pressed }) => [styles.actionRow, pressed && { opacity: 0.85 }]}
              >
                <Ionicons name="refresh-circle-outline" size={22} color={theme.accent} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.actionTitle}>Rescan music library</Text>
                  <Text style={styles.actionHint}>Force a fresh scan of all audio files.</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={Colors.textFaint} />
              </Pressable>
            </GlassCard>
          </Section>
        </ScrollView>
      </SafeAreaView>
    </BackgroundGradient>
  );
}

function Section({
  title,
  caption,
  children,
}: {
  title: string;
  caption?: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {caption ? <Text style={styles.sectionCaption}>{caption}</Text> : null}
      <View style={{ marginTop: 10 }}>{children}</View>
    </View>
  );
}

function ToggleRow({
  icon,
  label,
  hint,
  value,
  accent,
  accentSoft,
  onValueChange,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  hint?: string;
  value: boolean;
  accent: string;
  accentSoft: string;
  onValueChange: (v: boolean) => void;
}) {
  return (
    <View style={styles.toggleRow}>
      <Ionicons name={icon} size={20} color={Colors.text} />
      <View style={{ flex: 1 }}>
        <Text style={styles.toggleLabel}>{label}</Text>
        {hint ? <Text style={styles.toggleHint}>{hint}</Text> : null}
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: 'rgba(255,255,255,0.15)', true: accentSoft }}
        thumbColor={value ? accent : '#f4f4f5'}
        ios_backgroundColor="rgba(255,255,255,0.15)"
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

  scroll: { paddingBottom: 60 },
  section: { paddingHorizontal: Spacing.lg, marginTop: Spacing.lg },
  sectionTitle: { color: Colors.text, fontSize: FontSize.lg, fontWeight: FontWeight.semibold },
  sectionCaption: { color: Colors.textMuted, fontSize: FontSize.sm, marginTop: 4 },
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

  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: 14,
  },
  actionTitle: { color: Colors.text, fontSize: FontSize.md, fontWeight: FontWeight.semibold },
  actionHint: { color: Colors.textMuted, fontSize: FontSize.xs, marginTop: 2 },
});
