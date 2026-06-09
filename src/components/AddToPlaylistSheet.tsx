import React, { useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { Song } from '@/types';
import { Colors } from '@/constants/colors';
import { FontSize, FontWeight, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { usePlaylistStore } from '@/store/playlistStore';
import { ActionSheet } from './ActionSheet';

type Props = {
  song: Song | null;
  visible: boolean;
  onClose: () => void;
};

export function AddToPlaylistSheet({ song, visible, onClose }: Props) {
  const theme = useTheme();
  const playlists = usePlaylistStore((s) => s.playlists);
  const addSongs = usePlaylistStore((s) => s.addSongs);
  const createPlaylist = usePlaylistStore((s) => s.createPlaylist);

  const [creating, setCreating] = useState(false);
  const [name, setName] = useState('');

  if (!song) return null;

  const handlePick = (playlistId: string) => {
    addSongs(playlistId, [song.id]);
    onClose();
  };

  const handleCreate = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    const pl = createPlaylist(trimmed);
    addSongs(pl.id, [song.id]);
    setName('');
    setCreating(false);
    onClose();
  };

  return (
    <ActionSheet visible={visible} onClose={onClose}>
      <View style={styles.header}>
        <Text style={styles.title}>Add to playlist</Text>
        <Pressable onPress={() => setCreating((c) => !c)} hitSlop={8} style={styles.headerBtn}>
          <Ionicons name={creating ? 'close' : 'add'} size={20} color={theme.accent} />
        </Pressable>
      </View>

      {creating ? (
        <View style={styles.createRow}>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Playlist name"
            placeholderTextColor={Colors.textFaint}
            autoFocus
            style={styles.input}
            returnKeyType="done"
            onSubmitEditing={handleCreate}
          />
          <Pressable
            onPress={handleCreate}
            style={[styles.createBtn, { backgroundColor: theme.accent }]}
          >
            <Text style={styles.createBtnText}>Create</Text>
          </Pressable>
        </View>
      ) : null}

      <FlatList
        data={playlists}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={
          !creating ? (
            <Text style={styles.empty}>
              You don't have any playlists yet. Tap + to create one.
            </Text>
          ) : null
        }
        contentContainerStyle={{ paddingBottom: Spacing.sm }}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => handlePick(item.id)}
            android_ripple={{ color: 'rgba(255,255,255,0.06)' }}
            style={({ pressed }) => [styles.row, pressed && { opacity: 0.7 }]}
          >
            <Ionicons name="musical-notes-outline" size={20} color={Colors.text} />
            <View style={{ flex: 1 }}>
              <Text style={styles.rowLabel} numberOfLines={1}>
                {item.name}
              </Text>
              <Text style={styles.rowSub}>{item.songIds.length} songs</Text>
            </View>
            <Ionicons name="add" size={20} color={theme.accent} />
          </Pressable>
        )}
      />
    </ActionSheet>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: 12,
  },
  title: { flex: 1, color: Colors.text, fontSize: FontSize.lg, fontWeight: FontWeight.semibold },
  headerBtn: { padding: 4 },
  createRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  input: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.08)',
    color: Colors.text,
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    borderRadius: Radius.md,
    fontSize: FontSize.md,
  },
  createBtn: {
    paddingHorizontal: Spacing.lg,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  createBtnText: { color: '#0A0014', fontWeight: FontWeight.bold },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: 12,
  },
  rowLabel: { color: Colors.text, fontSize: FontSize.md },
  rowSub: { color: Colors.textMuted, fontSize: FontSize.xs, marginTop: 2 },
  empty: {
    color: Colors.textMuted,
    textAlign: 'center',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg,
  },
});
