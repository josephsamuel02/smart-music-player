import React, { useMemo, useState } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BackgroundGradient } from '@/components/BackgroundGradient';
import { EmptyState } from '@/components/EmptyState';
import { MiniPlayer } from '@/components/MiniPlayer';
import { SongItem } from '@/components/SongItem';
import { SongActionSheet } from '@/components/SongActionSheet';
import { ActionSheet } from '@/components/ActionSheet';
import { selectCurrentSong, useMusicStore } from '@/store/musicStore';
import { useLikedStore } from '@/store/likedStore';
import { usePlaylistStore } from '@/store/playlistStore';
import type { Song } from '@/types';
import { Colors } from '@/constants/colors';
import { FontSize, FontWeight, HitSlop, MINI_PLAYER_HEIGHT, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { formatCount } from '@/utils/format';

export default function PlaylistDetailScreen() {
  const theme = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const playlist = usePlaylistStore((s) => s.playlists.find((p) => p.id === id));
  const renamePlaylist = usePlaylistStore((s) => s.renamePlaylist);
  const deletePlaylist = usePlaylistStore((s) => s.deletePlaylist);
  const removeSong = usePlaylistStore((s) => s.removeSong);
  const addSongs = usePlaylistStore((s) => s.addSongs);

  const songsById = useMusicStore((s) => s.songsById);
  const allSongs = useMusicStore((s) => s.songs);
  const playFromList = useMusicStore((s) => s.playFromList);
  const current = useMusicStore(selectCurrentSong);
  const likedIds = useLikedStore((s) => s.likedIds);

  const [actionTarget, setActionTarget] = useState<Song | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [renameOpen, setRenameOpen] = useState(false);
  const [renameValue, setRenameValue] = useState(playlist?.name ?? '');
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerQuery, setPickerQuery] = useState('');

  const playlistSongs = useMemo(() => {
    if (!playlist) return [] as Song[];
    return playlist.songIds.map((sid) => songsById[sid]).filter(Boolean) as Song[];
  }, [playlist, songsById]);

  if (!playlist) {
    return (
      <BackgroundGradient>
        <SafeAreaView style={styles.center}>
          <Text style={{ color: Colors.textMuted }}>This playlist no longer exists.</Text>
          <Pressable onPress={() => router.back()} style={styles.outlineBtn}>
            <Text style={styles.outlineBtnText}>Back</Text>
          </Pressable>
        </SafeAreaView>
      </BackgroundGradient>
    );
  }

  const onPlay = (song: Song) => {
    playFromList(playlistSongs, song.id);
    router.push('/player');
  };

  const filteredPicker = useMemo(() => {
    const ids = new Set(playlist.songIds);
    const candidate = allSongs.filter((s) => !ids.has(s.id));
    const q = pickerQuery.trim().toLowerCase();
    const matched = q
      ? candidate.filter(
          (s) =>
            s.title.toLowerCase().includes(q) ||
            s.artist.toLowerCase().includes(q) ||
            s.album.toLowerCase().includes(q),
        )
      : candidate;
    return matched.slice(0, 200);
  }, [allSongs, playlist.songIds, pickerQuery]);

  const handleDelete = () => {
    setMenuOpen(false);
    Alert.alert('Delete playlist', `Delete "${playlist.name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          deletePlaylist(playlist.id);
          router.back();
        },
      },
    ]);
  };

  return (
    <BackgroundGradient>
      <SafeAreaView style={{ flex: 1 }} edges={['top', 'left', 'right']}>
        <View style={styles.headerRow}>
          <Pressable hitSlop={HitSlop} onPress={() => router.back()} style={styles.iconBtn}>
            <Ionicons name="chevron-back" size={22} color={Colors.text} />
          </Pressable>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text numberOfLines={1} style={styles.title}>
              {playlist.name}
            </Text>
            <Text style={styles.subtitle}>{formatCount(playlistSongs.length, 'song')}</Text>
          </View>
          <Pressable
            hitSlop={HitSlop}
            onPress={() => setPickerOpen(true)}
            style={styles.iconBtn}
          >
            <Ionicons name="add" size={20} color={Colors.text} />
          </Pressable>
          <Pressable hitSlop={HitSlop} onPress={() => setMenuOpen(true)} style={styles.iconBtn}>
            <Ionicons name="ellipsis-vertical" size={18} color={Colors.text} />
          </Pressable>
        </View>

        {playlistSongs.length === 0 ? (
          <EmptyState
            icon="musical-notes-outline"
            title="Empty playlist"
            message="Add songs to this playlist to start listening."
            actionLabel="Add songs"
            onAction={() => setPickerOpen(true)}
          />
        ) : (
          <FlatList
            data={playlistSongs}
            keyExtractor={(s) => s.id}
            ListHeaderComponent={
              <Pressable
                onPress={() => onPlay(playlistSongs[0])}
                style={({ pressed }) => [
                  styles.playAllRow,
                  { backgroundColor: theme.accent },
                  pressed && { opacity: 0.85 },
                ]}
              >
                <Ionicons name="play" size={14} color="#0A0014" />
                <Text style={styles.playAllText}>Play all</Text>
              </Pressable>
            }
            renderItem={({ item }) => (
              <View style={{ position: 'relative' }}>
                <SongItem
                  song={item}
                  isActive={current?.id === item.id}
                  isLiked={likedIds.has(item.id)}
                  onPress={onPlay}
                  onLongPress={setActionTarget}
                  onMore={(s) =>
                    Alert.alert(s.title, undefined, [
                      { text: 'Remove from playlist', style: 'destructive', onPress: () => removeSong(playlist.id, s.id) },
                      { text: 'More actions', onPress: () => setActionTarget(s) },
                      { text: 'Cancel', style: 'cancel' },
                    ])
                  }
                />
              </View>
            )}
            contentContainerStyle={{ paddingBottom: MINI_PLAYER_HEIGHT + 80 }}
          />
        )}

        <SongActionSheet
          song={actionTarget}
          visible={!!actionTarget}
          onClose={() => setActionTarget(null)}
        />

        <ActionSheet visible={menuOpen} onClose={() => setMenuOpen(false)}>
          <View style={styles.sheetBody}>
            <Text style={styles.sheetTitle} numberOfLines={1}>
              {playlist.name}
            </Text>
            <Pressable
              onPress={() => {
                setMenuOpen(false);
                setRenameValue(playlist.name);
                setTimeout(() => setRenameOpen(true), 220);
              }}
              style={styles.sheetRow}
            >
              <Ionicons name="create-outline" size={20} color={Colors.text} />
              <Text style={styles.sheetRowLabel}>Rename</Text>
            </Pressable>
            <Pressable
              onPress={() => {
                setMenuOpen(false);
                setTimeout(() => setPickerOpen(true), 220);
              }}
              style={styles.sheetRow}
            >
              <Ionicons name="add" size={20} color={Colors.text} />
              <Text style={styles.sheetRowLabel}>Add songs</Text>
            </Pressable>
            <Pressable onPress={handleDelete} style={styles.sheetRow}>
              <Ionicons name="trash-outline" size={20} color={Colors.danger} />
              <Text style={[styles.sheetRowLabel, { color: Colors.danger }]}>Delete playlist</Text>
            </Pressable>
          </View>
        </ActionSheet>

        <ActionSheet visible={renameOpen} onClose={() => setRenameOpen(false)}>
          <View style={styles.sheetBody}>
            <Text style={styles.sheetTitle}>Rename playlist</Text>
            <TextInput
              value={renameValue}
              onChangeText={setRenameValue}
              autoFocus
              placeholder="Playlist name"
              placeholderTextColor={Colors.textFaint}
              style={styles.input}
              returnKeyType="done"
              onSubmitEditing={() => {
                if (renameValue.trim()) renamePlaylist(playlist.id, renameValue.trim());
                setRenameOpen(false);
              }}
            />
            <View style={styles.sheetActions}>
              <Pressable onPress={() => setRenameOpen(false)} style={styles.btnGhost}>
                <Text style={styles.btnGhostText}>Cancel</Text>
              </Pressable>
              <Pressable
                onPress={() => {
                  if (renameValue.trim()) renamePlaylist(playlist.id, renameValue.trim());
                  setRenameOpen(false);
                }}
                style={[styles.btnPrimary, { backgroundColor: theme.accent }]}
              >
                <Text style={styles.btnPrimaryText}>Save</Text>
              </Pressable>
            </View>
          </View>
        </ActionSheet>

        <ActionSheet visible={pickerOpen} onClose={() => setPickerOpen(false)}>
          <View style={[styles.sheetBody, { maxHeight: 480 }]}>
            <Text style={styles.sheetTitle}>Add songs</Text>
            <TextInput
              value={pickerQuery}
              onChangeText={setPickerQuery}
              placeholder="Search your library"
              placeholderTextColor={Colors.textFaint}
              style={styles.input}
            />
            <FlatList
              data={filteredPicker}
              keyExtractor={(s) => s.id}
              keyboardShouldPersistTaps="handled"
              style={{ marginTop: 8 }}
              renderItem={({ item }) => (
                <Pressable
                  onPress={() => {
                    addSongs(playlist.id, [item.id]);
                  }}
                  style={({ pressed }) => [styles.pickerRow, pressed && { opacity: 0.7 }]}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={styles.pickerTitle} numberOfLines={1}>
                      {item.title}
                    </Text>
                    <Text style={styles.pickerSub} numberOfLines={1}>
                      {item.artist}
                    </Text>
                  </View>
                  <Ionicons name="add" size={20} color={theme.accent} />
                </Pressable>
              )}
              ListEmptyComponent={
                <Text style={{ color: Colors.textMuted, paddingVertical: 12, textAlign: 'center' }}>
                  No songs to add
                </Text>
              }
            />
          </View>
        </ActionSheet>
      </SafeAreaView>
      <MiniPlayer />
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
  title: { color: Colors.text, fontSize: FontSize.xl, fontWeight: FontWeight.bold },
  subtitle: { color: Colors.textMuted, fontSize: FontSize.sm, marginTop: 2 },

  playAllRow: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    marginHorizontal: Spacing.lg,
    marginVertical: Spacing.sm,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
  },
  playAllText: { color: '#0A0014', fontWeight: FontWeight.bold, fontSize: FontSize.sm },

  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 },
  outlineBtn: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: 10,
    borderRadius: Radius.pill,
    borderColor: Colors.glassBorder,
    borderWidth: StyleSheet.hairlineWidth,
  },
  outlineBtnText: { color: Colors.text, fontWeight: FontWeight.semibold },

  sheetBody: { paddingHorizontal: Spacing.lg, paddingTop: 6, paddingBottom: Spacing.md },
  sheetTitle: { color: Colors.text, fontSize: FontSize.lg, fontWeight: FontWeight.semibold, marginBottom: 12 },
  sheetRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, paddingVertical: 12 },
  sheetRowLabel: { color: Colors.text, fontSize: FontSize.md },
  input: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    color: Colors.text,
    paddingHorizontal: Spacing.md,
    paddingVertical: 12,
    borderRadius: Radius.md,
    fontSize: FontSize.md,
  },
  sheetActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: Spacing.sm,
    marginTop: 16,
  },
  btnGhost: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: 10,
    borderRadius: Radius.pill,
  },
  btnGhostText: { color: Colors.textMuted, fontWeight: FontWeight.semibold },
  btnPrimary: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: 10,
    borderRadius: Radius.pill,
  },
  btnPrimaryText: { color: '#0A0014', fontWeight: FontWeight.bold },

  pickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    gap: Spacing.md,
  },
  pickerTitle: { color: Colors.text, fontSize: FontSize.md },
  pickerSub: { color: Colors.textMuted, fontSize: FontSize.xs, marginTop: 2 },
});
