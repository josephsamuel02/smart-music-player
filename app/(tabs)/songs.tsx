import React, { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { EmptyState } from '@/components/EmptyState';
import { SongItem } from '@/components/SongItem';
import { SongActionSheet } from '@/components/SongActionSheet';
import { selectCurrentSong, useMusicStore } from '@/store/musicStore';
import { useLikedStore } from '@/store/likedStore';
import { useLibraryLoader } from '@/hooks/useLibraryLoader';
import type { Song } from '@/types';
import { Colors } from '@/constants/colors';
import { FontSize, MINI_PLAYER_HEIGHT, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { formatCount } from '@/utils/format';
import { ensureMediaPermission } from '@/utils/permissions';
import { Linking } from 'react-native';

export default function SongsScreen() {
  const theme = useTheme();
  const songs = useMusicStore((s) => s.songs);
  const loadState = useMusicStore((s) => s.loadState);
  const errorMessage = useMusicStore((s) => s.errorMessage);
  const playFromList = useMusicStore((s) => s.playFromList);
  const current = useMusicStore(selectCurrentSong);
  const likedIds = useLikedStore((s) => s.likedIds);
  const { scanNow } = useLibraryLoader();

  const [refreshing, setRefreshing] = useState(false);
  const [actionTarget, setActionTarget] = useState<Song | null>(null);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await scanNow();
    setRefreshing(false);
  }, [scanNow]);

  const onPlay = useCallback(
    (song: Song) => {
      playFromList(songs, song.id);
      router.push('/player');
    },
    [playFromList, songs],
  );

  const onLongPress = useCallback((song: Song) => setActionTarget(song), []);
  const onMore = useCallback((song: Song) => setActionTarget(song), []);

  const keyExtractor = useCallback((s: Song) => s.id, []);
  const renderItem = useCallback(
    ({ item }: { item: Song }) => (
      <SongItem
        song={item}
        isActive={current?.id === item.id}
        isLiked={likedIds.has(item.id)}
        onPress={onPlay}
        onLongPress={onLongPress}
        onMore={onMore}
      />
    ),
    [current?.id, likedIds, onPlay, onLongPress, onMore],
  );

  const subtitle = useMemo(() => formatCount(songs.length, 'song'), [songs.length]);

  if (loadState === 'permission-denied') {
    return (
      <EmptyState
        icon="lock-closed-outline"
        title="Permission needed"
        message={errorMessage ?? 'Grant access to your music library to start playing.'}
        actionLabel="Grant Access"
        onAction={async () => {
          const res = await ensureMediaPermission();
          if (!res.granted && !res.canAskAgain) {
            Linking.openSettings();
          } else if (res.granted) {
            await scanNow();
          }
        }}
      />
    );
  }

  if (loadState === 'scanning' && songs.length === 0) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={theme.accent} size="large" />
        <Text style={styles.scanning}>Scanning your music library…</Text>
      </View>
    );
  }

  if (loadState === 'ready' && songs.length === 0) {
    return (
      <EmptyState
        icon="musical-notes-outline"
        title="No songs found"
        message="We couldn't find any audio files on this device. Try adding music to your downloads or sync from a cable."
        actionLabel="Rescan"
        onAction={scanNow}
      />
    );
  }

  if (loadState === 'error' && songs.length === 0) {
    return (
      <EmptyState
        icon="alert-circle-outline"
        title="Couldn't scan library"
        message={errorMessage ?? 'Something went wrong while scanning your music library.'}
        actionLabel="Try again"
        onAction={scanNow}
      />
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.countRow}>
        <Ionicons name="albums-outline" size={14} color={Colors.textMuted} />
        <Text style={styles.count}>{subtitle}</Text>
      </View>
      <FlatList
        data={songs}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        windowSize={9}
        initialNumToRender={18}
        maxToRenderPerBatch={20}
        removeClippedSubviews
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.accent} />
        }
      />
      <SongActionSheet
        song={actionTarget}
        visible={!!actionTarget}
        onClose={() => setActionTarget(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  scanning: { color: Colors.textMuted, fontSize: FontSize.sm },
  countRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: Spacing.lg,
    paddingTop: 6,
    paddingBottom: 4,
  },
  count: { color: Colors.textMuted, fontSize: FontSize.xs, letterSpacing: 0.4 },
  listContent: { paddingBottom: MINI_PLAYER_HEIGHT + 80 },
});
