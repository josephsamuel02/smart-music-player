import React, { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import type { Song } from '@/types';
import { Colors } from '@/constants/colors';
import { FontSize, FontWeight, HitSlop, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { formatDuration } from '@/utils/format';
import { AnimatedHeart } from './AnimatedHeart';
import { Artwork } from './Artwork';

type Props = {
  song: Song;
  isActive?: boolean;
  isLiked?: boolean;
  onPress: (song: Song) => void;
  onLongPress: (song: Song) => void;
  onMore: (song: Song) => void;
};

function SongItemImpl({ song, isActive, isLiked, onPress, onLongPress, onMore }: Props) {
  const theme = useTheme();
  const handlePress = () => {
    void Haptics.selectionAsync();
    onPress(song);
  };
  const handleLongPress = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onLongPress(song);
  };
  const handleMore = () => {
    void Haptics.selectionAsync();
    onMore(song);
  };

  return (
    <Pressable
      onPress={handlePress}
      onLongPress={handleLongPress}
      delayLongPress={350}
      android_ripple={{ color: 'rgba(255,255,255,0.06)' }}
      style={({ pressed }) => [
        styles.row,
        isActive && { backgroundColor: theme.accentSoft },
        pressed && styles.pressed,
      ]}
    >
      <Artwork uri={song.artwork} seed={song.id} size={48} radius={10} />
      <View style={styles.text}>
        <Text
          numberOfLines={1}
          style={[
            styles.title,
            isActive && { color: theme.accent, fontWeight: FontWeight.bold },
          ]}
        >
          {song.title}
        </Text>
        <Text numberOfLines={1} style={styles.subtitle}>
          {song.artist}
          {song.album && song.album !== 'Unknown Album' ? `  •  ${song.album}` : ''}
        </Text>
      </View>
      <View style={styles.meta}>
        {isLiked ? <AnimatedHeart liked size={20} style={styles.heart} /> : null}
        <Text style={styles.duration}>{formatDuration(song.duration)}</Text>
      </View>
      <Pressable hitSlop={HitSlop} onPress={handleMore} style={styles.more}>
        <Ionicons name="ellipsis-vertical" size={18} color={Colors.textMuted} />
      </Pressable>
    </Pressable>
  );
}

export const SongItem = memo(SongItemImpl, (prev, next) => {
  return (
    prev.song.id === next.song.id &&
    prev.song.title === next.song.title &&
    prev.song.artwork === next.song.artwork &&
    prev.isActive === next.isActive &&
    prev.isLiked === next.isLiked
  );
});

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: Spacing.lg,
    gap: Spacing.md,
  },
  pressed: { opacity: 0.7 },
  text: { flex: 1, minWidth: 0 },
  title: {
    color: Colors.text,
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
  },
  subtitle: {
    color: Colors.textMuted,
    fontSize: FontSize.sm,
    marginTop: 2,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  heart: { opacity: 0.95 },
  duration: {
    color: Colors.textFaint,
    fontSize: FontSize.xs,
    fontVariant: ['tabular-nums'],
  },
  more: {
    padding: 6,
    marginLeft: 4,
  },
});
