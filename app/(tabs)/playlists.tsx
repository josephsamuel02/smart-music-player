import React, { useState } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { ActionSheet } from '@/components/ActionSheet';
import { EmptyState } from '@/components/EmptyState';
import { PlaylistCard } from '@/components/PlaylistCard';
import { usePlaylistStore } from '@/store/playlistStore';
import { Colors } from '@/constants/colors';
import { FontSize, FontWeight, MINI_PLAYER_HEIGHT, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';

export default function PlaylistsScreen() {
  const theme = useTheme();
  const playlists = usePlaylistStore((s) => s.playlists);
  const createPlaylist = usePlaylistStore((s) => s.createPlaylist);
  const renamePlaylist = usePlaylistStore((s) => s.renamePlaylist);
  const deletePlaylist = usePlaylistStore((s) => s.deletePlaylist);

  const [createOpen, setCreateOpen] = useState(false);
  const [name, setName] = useState('');
  const [contextId, setContextId] = useState<string | null>(null);
  const [renameId, setRenameId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');

  const handleCreate = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    const pl = createPlaylist(trimmed);
    setName('');
    setCreateOpen(false);
    router.push(`/playlist/${pl.id}` as never);
  };

  const startRename = (id: string, currentName: string) => {
    setContextId(null);
    setRenameId(id);
    setRenameValue(currentName);
  };

  const confirmDelete = (id: string, label: string) => {
    setContextId(null);
    Alert.alert('Delete playlist', `Delete "${label}"? This can't be undone.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deletePlaylist(id) },
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.header}>Your playlists</Text>
        <Pressable
          onPress={() => setCreateOpen(true)}
          style={({ pressed }) => [
            styles.newBtn,
            { backgroundColor: theme.accent },
            pressed && { opacity: 0.85 },
          ]}
        >
          <Ionicons name="add" size={16} color="#0A0014" />
          <Text style={styles.newBtnText}>New</Text>
        </Pressable>
      </View>

      {playlists.length === 0 ? (
        <EmptyState
          icon="list-outline"
          title="No playlists yet"
          message="Create your first playlist to organise your music."
          actionLabel="Create Playlist"
          onAction={() => setCreateOpen(true)}
        />
      ) : (
        <FlatList
          data={playlists}
          keyExtractor={(p) => p.id}
          renderItem={({ item }) => (
            <PlaylistCard
              playlist={item}
              onPress={() => router.push(`/playlist/${item.id}` as never)}
              onLongPress={() => setContextId(item.id)}
            />
          )}
          contentContainerStyle={styles.listContent}
        />
      )}

      <ActionSheet visible={createOpen} onClose={() => setCreateOpen(false)}>
        <View style={styles.sheetBody}>
          <Text style={styles.sheetTitle}>New playlist</Text>
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
          <View style={styles.sheetActions}>
            <Pressable onPress={() => setCreateOpen(false)} style={styles.btnGhost}>
              <Text style={styles.btnGhostText}>Cancel</Text>
            </Pressable>
            <Pressable
              onPress={handleCreate}
              style={[styles.btnPrimary, { backgroundColor: theme.accent }]}
            >
              <Text style={styles.btnPrimaryText}>Create</Text>
            </Pressable>
          </View>
        </View>
      </ActionSheet>

      <ActionSheet visible={!!contextId} onClose={() => setContextId(null)}>
        <View style={styles.sheetBody}>
          {contextId
            ? (() => {
                const pl = playlists.find((p) => p.id === contextId);
                if (!pl) return null;
                return (
                  <>
                    <Text style={styles.sheetTitle} numberOfLines={1}>
                      {pl.name}
                    </Text>
                    <Pressable onPress={() => startRename(pl.id, pl.name)} style={styles.sheetRow}>
                      <Ionicons name="create-outline" size={20} color={Colors.text} />
                      <Text style={styles.sheetRowLabel}>Rename</Text>
                    </Pressable>
                    <Pressable onPress={() => confirmDelete(pl.id, pl.name)} style={styles.sheetRow}>
                      <Ionicons name="trash-outline" size={20} color={Colors.danger} />
                      <Text style={[styles.sheetRowLabel, { color: Colors.danger }]}>Delete</Text>
                    </Pressable>
                  </>
                );
              })()
            : null}
        </View>
      </ActionSheet>

      <ActionSheet visible={!!renameId} onClose={() => setRenameId(null)}>
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
              if (renameId && renameValue.trim()) renamePlaylist(renameId, renameValue.trim());
              setRenameId(null);
            }}
          />
          <View style={styles.sheetActions}>
            <Pressable onPress={() => setRenameId(null)} style={styles.btnGhost}>
              <Text style={styles.btnGhostText}>Cancel</Text>
            </Pressable>
            <Pressable
              onPress={() => {
                if (renameId && renameValue.trim()) renamePlaylist(renameId, renameValue.trim());
                setRenameId(null);
              }}
              style={[styles.btnPrimary, { backgroundColor: theme.accent }]}
            >
              <Text style={styles.btnPrimaryText}>Save</Text>
            </Pressable>
          </View>
        </View>
      </ActionSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingTop: 8,
    paddingBottom: 6,
  },
  header: { flex: 1, color: Colors.textMuted, fontSize: FontSize.sm, letterSpacing: 0.4 },
  newBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.pill,
  },
  newBtnText: { color: '#0A0014', fontWeight: FontWeight.bold, fontSize: FontSize.sm },
  listContent: { paddingBottom: MINI_PLAYER_HEIGHT + 80, paddingTop: 4 },
  sheetBody: { paddingHorizontal: Spacing.lg, paddingTop: 6, paddingBottom: Spacing.md },
  sheetTitle: { color: Colors.text, fontSize: FontSize.lg, fontWeight: FontWeight.semibold, marginBottom: 12 },
  sheetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: 12,
  },
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
});
