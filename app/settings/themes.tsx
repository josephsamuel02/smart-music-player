import React, { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Slider from '@react-native-community/slider';
import { BackgroundGradient } from '@/components/BackgroundGradient';
import { GlassCard } from '@/components/GlassCard';
import { Colors } from '@/constants/colors';
import { FontSize, FontWeight, HitSlop, Radius, Spacing } from '@/constants/theme';
import { useSettingsStore } from '@/store/settingsStore';
import { THEMES, type ThemePreset } from '@/constants/themes';
import { useTheme } from '@/hooks/useTheme';

export default function ThemesScreen() {
  const themeId = useSettingsStore((s) => s.theme.themeId);
  const customBgUri = useSettingsStore((s) => s.theme.customBackgroundUri);
  const customBgDim = useSettingsStore((s) => s.theme.customBackgroundDim);
  const updateTheme = useSettingsStore((s) => s.updateTheme);
  const setCustomBackground = useSettingsStore((s) => s.setCustomBackground);
  const activeTheme = useTheme();

  const [picking, setPicking] = useState(false);

  const handlePickImage = async () => {
    if (picking) return;
    try {
      setPicking(true);
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        Alert.alert(
          'Photos permission needed',
          'Allow access to your photos so Glass Music can use one as the background.',
        );
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: false,
        quality: 1,
        selectionLimit: 1,
      });
      if (result.canceled || result.assets.length === 0) return;
      await setCustomBackground(result.assets[0].uri);
    } catch (err) {
      Alert.alert('Could not set background', err instanceof Error ? err.message : String(err));
    } finally {
      setPicking(false);
    }
  };

  const handleRemoveImage = () => {
    Alert.alert('Remove custom background?', 'Your selected theme gradient will be used again.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => void setCustomBackground(null) },
    ]);
  };

  return (
    <BackgroundGradient>
      <SafeAreaView style={{ flex: 1 }} edges={['top', 'left', 'right', 'bottom']}>
        <View style={styles.headerRow}>
          <Pressable hitSlop={HitSlop} onPress={() => router.back()} style={styles.iconBtn}>
            <Ionicons name="chevron-back" size={22} color={Colors.text} />
          </Pressable>
          <Text style={styles.headerTitle}>Themes</Text>
          <View style={styles.iconBtnSpacer} />
        </View>

        <ScrollView contentContainerStyle={styles.scroll}>
          {/* Section 1: preset background themes */}
          <Text style={styles.sectionTitle}>Background themes</Text>
          <Text style={styles.sectionCaption}>
            Pick a colour palette. The change applies instantly across every screen.
          </Text>

          <View style={styles.grid}>
            {THEMES.map((theme) => (
              <ThemeCard
                key={theme.id}
                theme={theme}
                active={!customBgUri && theme.id === themeId}
                onPress={() => updateTheme({ themeId: theme.id })}
              />
            ))}
          </View>

          {/* Section 2: custom background */}
          <Text style={[styles.sectionTitle, { marginTop: Spacing.xl }]}>Custom background</Text>
          <Text style={styles.sectionCaption}>
            Use one of your own photos as the app backdrop. Adjust the dim level so the UI stays
            readable.
          </Text>

          <GlassCard
            style={[
              styles.customCard,
              customBgUri ? { borderColor: activeTheme.accent, borderWidth: 1.5 } : {},
            ]}
          >
            {customBgUri ? (
              <View style={styles.customPreviewWrap}>
                <Image
                  source={{ uri: customBgUri }}
                  style={StyleSheet.absoluteFill}
                  contentFit="cover"
                  cachePolicy="memory-disk"
                />
                <View
                  style={[
                    StyleSheet.absoluteFill,
                    { backgroundColor: `rgba(0, 0, 0, ${customBgDim.toFixed(3)})` },
                  ]}
                />
                <View style={[styles.activeBadgeWrap, { backgroundColor: activeTheme.accent }]}>
                  <Ionicons name="checkmark" size={14} color="#0A0A0F" />
                </View>
              </View>
            ) : (
              <View style={[styles.customPreviewWrap, styles.customPreviewEmpty]}>
                <Ionicons name="image-outline" size={32} color={Colors.textFaint} />
                <Text style={styles.customPreviewEmptyText}>No custom background</Text>
              </View>
            )}

            <View style={styles.customBody}>
              {customBgUri ? (
                <View style={{ marginBottom: Spacing.md }}>
                  <View style={styles.sliderHeader}>
                    <Text style={styles.sliderLabel}>Dim</Text>
                    <Text style={styles.sliderValue}>{Math.round(customBgDim * 100)}%</Text>
                  </View>
                  <Slider
                    minimumValue={0}
                    maximumValue={0.85}
                    value={customBgDim}
                    step={0.01}
                    minimumTrackTintColor={activeTheme.accent}
                    maximumTrackTintColor="rgba(255,255,255,0.18)"
                    thumbTintColor={activeTheme.accent}
                    onSlidingComplete={(v) => updateTheme({ customBackgroundDim: v })}
                    onValueChange={(v) => updateTheme({ customBackgroundDim: v })}
                  />
                </View>
              ) : null}

              <View style={styles.customActions}>
                <Pressable
                  disabled={picking}
                  onPress={handlePickImage}
                  style={({ pressed }) => [
                    styles.customBtn,
                    { backgroundColor: activeTheme.accent },
                    (pressed || picking) && { opacity: 0.85 },
                  ]}
                >
                  {picking ? (
                    <ActivityIndicator size="small" color="#0A0A0F" />
                  ) : (
                    <>
                      <Ionicons
                        name={customBgUri ? 'swap-horizontal' : 'image-outline'}
                        size={16}
                        color="#0A0A0F"
                      />
                      <Text style={styles.customBtnText}>
                        {customBgUri ? 'Replace photo' : 'Choose photo'}
                      </Text>
                    </>
                  )}
                </Pressable>

                {customBgUri ? (
                  <Pressable
                    onPress={handleRemoveImage}
                    style={({ pressed }) => [
                      styles.customBtnGhost,
                      pressed && { opacity: 0.85 },
                    ]}
                  >
                    <Ionicons name="trash-outline" size={16} color={Colors.danger} />
                    <Text style={[styles.customBtnText, { color: Colors.danger }]}>Remove</Text>
                  </Pressable>
                ) : null}
              </View>
            </View>
          </GlassCard>
        </ScrollView>
      </SafeAreaView>
    </BackgroundGradient>
  );
}

function ThemeCard({
  theme,
  active,
  onPress,
}: {
  theme: ThemePreset;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.cardWrap, pressed && { opacity: 0.85 }]}>
      <GlassCard
        style={[styles.card, active && { borderColor: theme.accent, borderWidth: 1.5 }]}
      >
        <View style={styles.previewWrap}>
          <LinearGradient
            colors={theme.bgGradient as unknown as readonly [string, string, string]}
            locations={[0, 0.55, 1]}
            style={styles.preview}
          />
          <View style={styles.previewAccentRow}>
            <LinearGradient
              colors={theme.accentGradient as unknown as readonly [string, string]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.previewAccentBar}
            />
            <View style={[styles.previewDot, { backgroundColor: theme.accent }]} />
          </View>
          {active ? (
            <View style={[styles.checkBadge, { backgroundColor: theme.accent }]}>
              <Ionicons name="checkmark" size={14} color="#0A0A0F" />
            </View>
          ) : null}
        </View>

        <View style={styles.cardBody}>
          <View style={styles.cardTitleRow}>
            <Text style={styles.cardTitle}>{theme.name}</Text>
            {active ? (
              <View style={[styles.activeBadge, { backgroundColor: theme.accent + '33' }]}>
                <Text style={[styles.activeBadgeText, { color: theme.accent }]}>Active</Text>
              </View>
            ) : null}
          </View>
          <Text style={styles.cardDescription}>{theme.description}</Text>
        </View>
      </GlassCard>
    </Pressable>
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
  sectionTitle: { color: Colors.text, fontSize: FontSize.lg, fontWeight: FontWeight.semibold },
  sectionCaption: {
    color: Colors.textMuted,
    fontSize: FontSize.sm,
    marginTop: 4,
    marginBottom: Spacing.md,
  },

  grid: { gap: Spacing.md },
  cardWrap: { width: '100%' },
  card: { padding: 0, overflow: 'hidden' },

  previewWrap: { height: 110, width: '100%', position: 'relative' },
  preview: { ...StyleSheet.absoluteFillObject },
  previewAccentRow: {
    position: 'absolute',
    bottom: 12,
    left: 14,
    right: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  previewAccentBar: { flex: 1, height: 6, borderRadius: 3 },
  previewDot: { width: 18, height: 18, borderRadius: 9 },

  checkBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },

  cardBody: { padding: Spacing.md },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  cardTitle: { color: Colors.text, fontSize: FontSize.lg, fontWeight: FontWeight.semibold },
  cardDescription: { color: Colors.textMuted, fontSize: FontSize.sm, marginTop: 4 },

  activeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: Radius.pill,
  },
  activeBadgeText: { fontSize: FontSize.xs, fontWeight: FontWeight.semibold },

  customCard: { padding: 0, overflow: 'hidden' },
  customPreviewWrap: {
    width: '100%',
    height: 160,
    backgroundColor: 'rgba(255,255,255,0.04)',
    position: 'relative',
    overflow: 'hidden',
  },
  customPreviewEmpty: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  customPreviewEmptyText: {
    color: Colors.textFaint,
    fontSize: FontSize.sm,
  },

  activeBadgeWrap: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },

  customBody: { padding: Spacing.md },
  sliderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  sliderLabel: { color: Colors.text, fontSize: FontSize.md, fontWeight: FontWeight.semibold },
  sliderValue: { color: Colors.textMuted, fontSize: FontSize.sm, fontVariant: ['tabular-nums'] },

  customActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
    flexWrap: 'wrap',
  },
  customBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: Radius.pill,
  },
  customBtnGhost: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: Radius.pill,
    backgroundColor: 'rgba(248, 113, 113, 0.15)',
  },
  customBtnText: {
    color: '#0A0A0F',
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
  },
});
