import React, { useCallback, useMemo, useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { EmptyState } from '@/components/EmptyState';
import { SongItem } from '@/components/SongItem';
import { SongActionSheet } from '@/components/SongActionSheet';
import { selectCurrentSong, useMusicStore } from '@/store/musicStore';
import { useLikedStore } from '@/store/likedStore';
import { MINI_PLAYER_HEIGHT } from '@/constants/theme';
import { sortSongsByTitle } from '@/utils/sort';
import type { Song } from '@/types';

export default function LikedScreen() {
  const songs = useMusicStore((s) => s.songs);
  const playFromList = useMusicStore((s) => s.playFromList);
  const current = useMusicStore(selectCurrentSong);
  const likedIds = useLikedStore((s) => s.likedIds);

  const [actionTarget, setActionTarget] = useState<Song | null>(null);

  const liked = useMemo(() => {
    const list = songs.filter((s) => likedIds.has(s.id));
    return sortSongsByTitle(list);
  }, [songs, likedIds]);

  const onPlay = useCallback(
    (song: Song) => {
      playFromList(liked, song.id);
      router.push('/player');
    },
    [playFromList, liked],
  );

  if (liked.length === 0) {
    return (
      <EmptyState
        icon="heart-outline"
        title="No liked songs yet"
        message="Tap the heart on any song or use the menu to add it to your favourites."
      />
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={liked}
        keyExtractor={(s) => s.id}
        renderItem={({ item }) => (
          <SongItem
            song={item}
            isActive={current?.id === item.id}
            isLiked
            onPress={onPlay}
            onLongPress={setActionTarget}
            onMore={setActionTarget}
          />
        )}
        windowSize={7}
        initialNumToRender={16}
        contentContainerStyle={styles.listContent}
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
  listContent: { paddingBottom: MINI_PLAYER_HEIGHT + 80, paddingTop: 6 },
});
