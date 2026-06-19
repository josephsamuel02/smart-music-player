import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import Animated, { FadeInDown, FadeOutDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { selectCurrentSong, useMusicStore } from '@/store/musicStore';
import { Colors } from '@/constants/colors';
import { FontSize, FontWeight, MINI_PLAYER_HEIGHT, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { Artwork } from './Artwork';
import { GlassCard } from './GlassCard';

/**
 * Persistent bottom mini player. Renders nothing when no song is active.
 * The component auto-respects the bottom safe area inset.
 */
export function MiniPlayer({ extraBottom = 0 }: { extraBottom?: number }) {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const current = useMusicStore(selectCurrentSong);
  const isPlaying = useMusicStore((s) => s.isPlaying);
  const positionSeconds = useMusicStore((s) => s.positionSeconds);
  const durationSeconds = useMusicStore((s) => s.durationSeconds);
  const setIsPlaying = useMusicStore((s) => s.setIsPlaying);
  const nextTrack = useMusicStore((s) => s.next);
  const prevTrack = useMusicStore((s) => s.previous);

  if (!current) return null;

  const progress =
    durationSeconds > 0 ? Math.min(1, Math.max(0, positionSeconds / durationSeconds)) : 0;

  const onToggle = () => {
    void Haptics.selectionAsync();
    setIsPlaying(!isPlaying);
  };
  const onNext = () => {
    void Haptics.selectionAsync();
    nextTrack();
  };
  const onPrev = () => {
    void Haptics.selectionAsync();
    prevTrack();
  };
  const openFull = () => {
    void Haptics.selectionAsync();
    router.push('/player');
  };

  return (
    <Animated.View
      entering={FadeInDown.duration(220)}
      exiting={FadeOutDown.duration(180)}
      style={[styles.wrapper, { bottom: extraBottom }]}
    >
      <GlassCard
        radius={Radius.lg}
        variant="strong"
        style={[styles.card, { paddingBottom: insets.bottom }]}
        noPadding
      >
        <View style={[styles.progressTrack]}>
          <View
            style={[
              styles.progressFill,
              { width: `${progress * 100}%`, backgroundColor: theme.accent },
            ]}
          />
        </View>
        <Pressable onPress={openFull} style={styles.row}>
          <Artwork uri={current.artwork} seed={current.id} size={44} radius={10} />
          <View style={styles.text}>
            <Text numberOfLines={1} style={styles.title}>
              {current.title}
            </Text>
            <Text numberOfLines={1} style={styles.artist}>
              {current.artist}
            </Text>
          </View>
          <View style={styles.controls}>
            <Pressable onPress={onPrev} hitSlop={8} style={styles.ctrlBtn}>
              <Ionicons name="play-skip-back" size={18} color={Colors.text} />
            </Pressable>
            <Pressable onPress={onToggle} hitSlop={8} style={[styles.ctrlBtn, styles.playBtn]}>
              <Ionicons name={isPlaying ? 'pause' : 'play'} size={20} color={Colors.text} />
            </Pressable>
            <Pressable onPress={onNext} hitSlop={8} style={styles.ctrlBtn}>
              <Ionicons name="play-skip-forward" size={18} color={Colors.text} />
            </Pressable>
          </View>
        </Pressable>
      </GlassCard>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
  },
  card: {
    overflow: 'hidden',
    borderTopLeftRadius: Radius.lg,
    borderTopRightRadius: Radius.lg,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  progressTrack: {
    height: 2,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  progressFill: {
    height: 2,
  },
  row: {
    height: MINI_PLAYER_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    gap: Spacing.md,
  },
  text: { flex: 1, minWidth: 0 },
  title: { color: Colors.text, fontWeight: FontWeight.semibold, fontSize: FontSize.md },
  artist: { color: Colors.textMuted, fontSize: FontSize.xs, marginTop: 1 },
  controls: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  ctrlBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
  },
  playBtn: {
    backgroundColor: 'rgba(255,255,255,0.10)',
  },
});
