import React, { useMemo, useState } from 'react';
import { Dimensions, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { BackgroundGradient } from '@/components/BackgroundGradient';
import { GlassCard } from '@/components/GlassCard';
import { Artwork } from '@/components/Artwork';
import { QueueList } from '@/components/QueueList';
import { seekToSecondsGlobal } from '@/hooks/useAudioEngine';
import { selectCurrentSong, useMusicStore } from '@/store/musicStore';
import { useLikedStore } from '@/store/likedStore';
import { Colors } from '@/constants/colors';
import { FontSize, FontWeight, HitSlop, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { formatDuration } from '@/utils/format';

const { width: SCREEN_W } = Dimensions.get('window');

/**
 * Full-screen player. The actual audio engine lives in the root layout
 * (see `useAudioEngine`); we just dispatch state updates and use the global
 * `seekToSecondsGlobal` helper to scrub the active player.
 */
export default function PlayerScreen() {
  const theme = useTheme();
  const current = useMusicStore(selectCurrentSong);
  const isPlaying = useMusicStore((s) => s.isPlaying);
  const positionSeconds = useMusicStore((s) => s.positionSeconds);
  const durationSeconds = useMusicStore((s) => s.durationSeconds);
  const shuffle = useMusicStore((s) => s.shuffle);
  const repeat = useMusicStore((s) => s.repeat);

  const setIsPlaying = useMusicStore((s) => s.setIsPlaying);
  const nextTrack = useMusicStore((s) => s.next);
  const prevTrack = useMusicStore((s) => s.previous);
  const toggleShuffle = useMusicStore((s) => s.toggleShuffle);
  const cycleRepeat = useMusicStore((s) => s.cycleRepeat);
  const clearQueue = useMusicStore((s) => s.clearQueue);
  const setPosition = useMusicStore((s) => s.setPosition);

  const liked = useLikedStore((s) => (current ? s.likedIds.has(current.id) : false));
  const toggleLike = useLikedStore((s) => s.toggleLike);

  const [showQueue, setShowQueue] = useState(false);
  const [scrubValue, setScrubValue] = useState<number | null>(null);

  const artSize = useMemo(() => Math.min(SCREEN_W - Spacing.xl * 4, 240), []);

  if (!current) {
    return (
      <BackgroundGradient>
        <SafeAreaView style={styles.center}>
          <Text style={styles.muted}>Nothing is playing.</Text>
          <Pressable onPress={() => router.back()} style={styles.outlineBtn}>
            <Text style={styles.outlineBtnText}>Close</Text>
          </Pressable>
        </SafeAreaView>
      </BackgroundGradient>
    );
  }

  const onToggle = () => {
    void Haptics.selectionAsync();
    setIsPlaying(!isPlaying);
  };

  const renderRepeatIcon = () => {
    if (repeat === 'one') return <Ionicons name="repeat" size={20} color={theme.accent} />;
    if (repeat === 'all') return <Ionicons name="repeat" size={20} color={theme.accent} />;
    return <Ionicons name="repeat" size={20} color={Colors.textMuted} />;
  };

  const displayPosition = scrubValue ?? positionSeconds;

  return (
    <BackgroundGradient>
      <SafeAreaView style={styles.flex} edges={['top', 'left', 'right', 'bottom']}>
        <View style={styles.headerRow}>
          <Pressable hitSlop={HitSlop} onPress={() => router.back()} style={styles.iconBtn}>
            <Ionicons name="chevron-down" size={22} color={Colors.text} />
          </Pressable>
          <View style={{ flex: 1, alignItems: 'center' }}>
            <Text style={styles.headerEyebrow}>Now Playing</Text>
            <Text style={styles.headerTitle} numberOfLines={1}>
              {current.album}
            </Text>
          </View>
          <Pressable
            hitSlop={HitSlop}
            onPress={() => {
              void Haptics.selectionAsync();
              setShowQueue((v) => !v);
            }}
            style={styles.iconBtn}
          >
            <Ionicons name={showQueue ? 'musical-notes' : 'list'} size={20} color={Colors.text} />
          </Pressable>
        </View>

        {showQueue ? (
          <Animated.View entering={FadeIn.duration(180)} style={styles.flex}>
            <View style={styles.queueHeader}>
              <Text style={styles.queueTitle}>Up next</Text>
              <Pressable onPress={clearQueue} hitSlop={HitSlop}>
                <Text style={[styles.queueClear, { color: theme.accent }]}>Clear</Text>
              </Pressable>
            </View>
            <QueueList />
          </Animated.View>
        ) : (
          <View style={styles.flex}>
            <View style={styles.artworkWrap}>
              <Animated.View entering={FadeIn.duration(220)}>
                <Artwork
                  uri={current.artwork}
                  seed={current.id}
                  size={artSize}
                  radius={Radius.xl}
                  style={styles.artShadow}
                />
              </Animated.View>
            </View>

            <Animated.View entering={FadeInDown.duration(220)} style={styles.titles}>
              <Text style={styles.songTitle} numberOfLines={1}>
                {current.title}
              </Text>
              <Text style={styles.songArtist} numberOfLines={1}>
                {current.artist}
              </Text>
            </Animated.View>

            <GlassCard style={styles.controlCard}>
              <View style={styles.sliderRow}>
                <Slider
                  style={{ flex: 1 }}
                  minimumValue={0}
                  maximumValue={Math.max(durationSeconds, 1)}
                  value={displayPosition}
                  minimumTrackTintColor={theme.accent}
                  maximumTrackTintColor="rgba(255,255,255,0.18)"
                  thumbTintColor={theme.accent}
                  onSlidingStart={() => setScrubValue(positionSeconds)}
                  onValueChange={(v) => setScrubValue(v)}
                  onSlidingComplete={(v) => {
                    seekToSecondsGlobal(v);
                    setPosition(v);
                    setScrubValue(null);
                  }}
                />
              </View>
              <View style={styles.timeRow}>
                <Text style={styles.timeText}>{formatDuration(displayPosition)}</Text>
                <Text style={styles.timeText}>{formatDuration(durationSeconds)}</Text>
              </View>

              <View style={styles.controlsRow}>
                <Pressable
                  hitSlop={HitSlop}
                  onPress={() => {
                    void Haptics.selectionAsync();
                    toggleShuffle();
                  }}
                  style={styles.controlBtn}
                >
                  <Ionicons
                    name="shuffle"
                    size={22}
                    color={shuffle ? theme.accent : Colors.textMuted}
                  />
                </Pressable>
                <Pressable
                  hitSlop={HitSlop}
                  onPress={() => {
                    void Haptics.selectionAsync();
                    prevTrack();
                  }}
                  style={styles.controlBtn}
                >
                  <Ionicons name="play-skip-back" size={28} color={Colors.text} />
                </Pressable>
                <Pressable onPress={onToggle} style={styles.playBtn}>
                  <Ionicons
                    name={isPlaying ? 'pause' : 'play'}
                    size={32}
                    color="#0A0014"
                    style={{ marginLeft: isPlaying ? 0 : 2 }}
                  />
                </Pressable>
                <Pressable
                  hitSlop={HitSlop}
                  onPress={() => {
                    void Haptics.selectionAsync();
                    nextTrack();
                  }}
                  style={styles.controlBtn}
                >
                  <Ionicons name="play-skip-forward" size={28} color={Colors.text} />
                </Pressable>
                <Pressable
                  hitSlop={HitSlop}
                  onPress={() => {
                    void Haptics.selectionAsync();
                    cycleRepeat();
                  }}
                  style={styles.controlBtn}
                >
                  {renderRepeatIcon()}
                  {repeat === 'one' ? (
                    <Text style={[styles.repeatBadge, { color: theme.accent }]}>1</Text>
                  ) : null}
                </Pressable>
              </View>

              <View style={styles.bottomRow}>
                <Pressable
                  hitSlop={HitSlop}
                  onPress={() => {
                    void Haptics.selectionAsync();
                    if (current) toggleLike(current.id);
                  }}
                  style={styles.miniBtn}
                >
                  <Ionicons
                    name={liked ? 'heart' : 'heart-outline'}
                    size={22}
                    color={liked ? Colors.danger : Colors.text}
                  />
                </Pressable>
                <Pressable
                  hitSlop={HitSlop}
                  onPress={() => {
                    void Haptics.selectionAsync();
                    router.push('/lyrics');
                  }}
                  style={styles.lyricsBtn}
                >
                  <Ionicons name="text" size={18} color={Colors.text} />
                  <Text style={styles.lyricsBtnText}>Lyrics</Text>
                </Pressable>
                <Pressable
                  hitSlop={HitSlop}
                  onPress={() => {
                    void Haptics.selectionAsync();
                    setShowQueue(true);
                  }}
                  style={styles.miniBtn}
                >
                  <Ionicons name="list" size={22} color={Colors.text} />
                </Pressable>
              </View>
            </GlassCard>
          </View>
        )}
      </SafeAreaView>
    </BackgroundGradient>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 },
  muted: { color: Colors.textMuted },
  outlineBtn: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: 10,
    borderRadius: Radius.pill,
    borderColor: Colors.glassBorder,
    borderWidth: StyleSheet.hairlineWidth,
  },
  outlineBtnText: { color: Colors.text, fontWeight: FontWeight.semibold },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.sm,
    gap: Spacing.sm,
  },
  headerEyebrow: { color: Colors.textFaint, fontSize: FontSize.xs, letterSpacing: 1 },
  headerTitle: { color: Colors.text, fontSize: FontSize.sm, fontWeight: FontWeight.semibold, maxWidth: 220 },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  artworkWrap: { alignItems: 'center', justifyContent: 'center', paddingVertical: Spacing.lg, flexGrow: 1 },
  artShadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.6,
    shadowRadius: 24,
    elevation: 14,
  },
  titles: { paddingHorizontal: Spacing.xl, alignItems: 'center', marginBottom: Spacing.md },
  songTitle: { color: Colors.text, fontSize: FontSize.xl, fontWeight: FontWeight.bold, textAlign: 'center' },
  songArtist: { color: Colors.textMuted, fontSize: FontSize.md, marginTop: 4 },

  controlCard: { marginHorizontal: Spacing.lg, marginBottom: Spacing.md, padding: Spacing.lg },
  sliderRow: { flexDirection: 'row', alignItems: 'center', height: 30 },
  timeRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 2 },
  timeText: { color: Colors.textFaint, fontSize: FontSize.xs, fontVariant: ['tabular-nums'] },

  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Spacing.lg,
    paddingHorizontal: Spacing.sm,
  },
  controlBtn: { padding: 8, alignItems: 'center', justifyContent: 'center' },
  playBtn: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.text,
    alignItems: 'center',
    justifyContent: 'center',
  },
  repeatBadge: {
    fontSize: 9,
    fontWeight: '700',
    position: 'absolute',
    bottom: 4,
    right: 4,
  },

  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    paddingTop: Spacing.md,
  },
  miniBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  lyricsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 40,
    paddingHorizontal: Spacing.lg,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  lyricsBtnText: { color: Colors.text, fontSize: FontSize.sm, fontWeight: FontWeight.semibold },

  queueHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingTop: 8,
    paddingBottom: 4,
  },
  queueTitle: { flex: 1, color: Colors.text, fontSize: FontSize.lg, fontWeight: FontWeight.semibold },
  queueClear: { fontWeight: FontWeight.semibold, fontSize: FontSize.sm },
});
