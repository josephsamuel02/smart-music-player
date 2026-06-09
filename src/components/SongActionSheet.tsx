import React, { useState } from 'react';
import { Alert, Pressable, Share, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Sharing from 'expo-sharing';
import type { Song } from '@/types';
import { Colors } from '@/constants/colors';
import { FontSize, FontWeight, Spacing } from '@/constants/theme';
import { useLikedStore } from '@/store/likedStore';
import { useMusicStore } from '@/store/musicStore';
import { deleteSongAsset } from '@/services/AudioScanner';
import { Artwork } from './Artwork';
import { ActionSheet } from './ActionSheet';
import { AddToPlaylistSheet } from './AddToPlaylistSheet';

type Props = {
  song: Song | null;
  visible: boolean;
  onClose: () => void;
};

export function SongActionSheet({ song, visible, onClose }: Props) {
  const isLiked = useLikedStore((s) => (song ? s.likedIds.has(song.id) : false));
  const toggleLike = useLikedStore((s) => s.toggleLike);
  const playNext = useMusicStore((s) => s.playNext);
  const addToQueue = useMusicStore((s) => s.addToQueue);
  const allSongs = useMusicStore((s) => s.songs);
  const setSongs = useMusicStore((s) => s.setSongs);

  const [addToPlaylistOpen, setAddToPlaylistOpen] = useState(false);

  if (!song) return null;

  const handlePlayNext = () => {
    playNext(song.id);
    onClose();
  };

  const handleAddToQueue = () => {
    addToQueue(song.id);
    onClose();
  };

  const handleAddToPlaylist = () => {
    onClose();
    // Small timeout so the first sheet finishes animating out
    setTimeout(() => setAddToPlaylistOpen(true), 200);
  };

  const handleLike = () => {
    toggleLike(song.id);
    onClose();
  };

  const handleShare = async () => {
    onClose();
    try {
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(song.uri, { dialogTitle: `Share ${song.title}` });
      } else {
        await Share.share({ message: `${song.title} - ${song.artist}`, url: song.uri });
      }
    } catch {
      // user cancelled - ignore
    }
  };

  const handleDelete = () => {
    Alert.alert('Delete song', `Permanently delete "${song.title}" from your device?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          const ok = await deleteSongAsset(song.id);
          if (ok) {
            setSongs(allSongs.filter((s) => s.id !== song.id));
          } else {
            Alert.alert('Delete failed', 'The song could not be deleted from this device.');
          }
          onClose();
        },
      },
    ]);
  };

  return (
    <>
      <ActionSheet visible={visible} onClose={onClose}>
        <View style={styles.header}>
          <Artwork uri={song.artwork} seed={song.id} size={48} radius={10} />
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text numberOfLines={1} style={styles.title}>
              {song.title}
            </Text>
            <Text numberOfLines={1} style={styles.subtitle}>
              {song.artist}
            </Text>
          </View>
        </View>
        <View style={styles.divider} />
        <ActionRow icon="play-skip-forward" label="Play Next" onPress={handlePlayNext} />
        <ActionRow icon="list" label="Add to Queue" onPress={handleAddToQueue} />
        <ActionRow icon="add-circle-outline" label="Add to Playlist" onPress={handleAddToPlaylist} />
        <ActionRow
          icon={isLiked ? 'heart' : 'heart-outline'}
          label={isLiked ? 'Unlike Song' : 'Like Song'}
          iconColor={isLiked ? Colors.danger : undefined}
          onPress={handleLike}
        />
        <ActionRow icon="share-outline" label="Share" onPress={handleShare} />
        <ActionRow
          icon="trash-outline"
          label="Delete from Device"
          tone="danger"
          onPress={handleDelete}
        />
      </ActionSheet>
      <AddToPlaylistSheet
        song={song}
        visible={addToPlaylistOpen}
        onClose={() => setAddToPlaylistOpen(false)}
      />
    </>
  );
}

function ActionRow({
  icon,
  label,
  onPress,
  tone,
  iconColor,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  tone?: 'danger';
  iconColor?: string;
}) {
  const color = tone === 'danger' ? Colors.danger : Colors.text;
  return (
    <Pressable
      onPress={onPress}
      android_ripple={{ color: 'rgba(255,255,255,0.06)' }}
      style={({ pressed }) => [styles.row, pressed && { opacity: 0.7 }]}
    >
      <Ionicons name={icon} size={20} color={iconColor ?? color} />
      <Text style={[styles.rowLabel, { color }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  title: { color: Colors.text, fontSize: FontSize.md, fontWeight: FontWeight.semibold },
  subtitle: { color: Colors.textMuted, fontSize: FontSize.sm, marginTop: 2 },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: Colors.glassBorder },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: 14,
  },
  rowLabel: { color: Colors.text, fontSize: FontSize.md },
});
