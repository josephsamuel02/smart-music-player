import React, { useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BackgroundGradient } from '@/components/BackgroundGradient';
import { EmptyState } from '@/components/EmptyState';
import { MiniPlayer } from '@/components/MiniPlayer';
import { SongItem } from '@/components/SongItem';
import { SongActionSheet } from '@/components/SongActionSheet';
import { selectCurrentSong, useMusicStore } from '@/store/musicStore';
import { useLikedStore } from '@/store/likedStore';
import type { Song } from '@/types';
import { Colors } from '@/constants/colors';
import { FontSize, FontWeight, HitSlop, MINI_PLAYER_HEIGHT, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { formatCount } from '@/utils/format';
import { sortSongsByTitle } from '@/utils/sort';

export default function FolderDetailScreen() {
  const theme = useTheme();
  const params = useLocalSearchParams<{ id: string; name?: string }>();
  const decodedPath = useMemo(() => {
    try {
      return decodeURIComponent(params.id ?? '');
    } catch {
      return params.id ?? '';
    }
  }, [params.id]);

  const allSongs = useMusicStore((s) => s.songs);
  const playFromList = useMusicStore((s) => s.playFromList);
  const current = useMusicStore(selectCurrentSong);
  const likedIds = useLikedStore((s) => s.likedIds);

  const [actionTarget, setActionTarget] = useState<Song | null>(null);

  const folderSongs = useMemo(() => {
    const list = allSongs.filter(
      (s) => (s.folderPath === decodedPath) || (s.folder === decodedPath),
    );
    return sortSongsByTitle(list);
  }, [allSongs, decodedPath]);

  const folderName = params.name || folderSongs[0]?.folder || 'Folder';

  const onPlay = (song: Song) => {
    playFromList(folderSongs, song.id);
    router.push('/player');
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
              {folderName}
            </Text>
            <Text style={styles.subtitle}>{formatCount(folderSongs.length, 'song')}</Text>
          </View>
          {folderSongs.length > 0 ? (
            <Pressable
              onPress={() => onPlay(folderSongs[0])}
              style={({ pressed }) => [
                styles.playAll,
                { backgroundColor: theme.accent },
                pressed && { opacity: 0.85 },
              ]}
            >
              <Ionicons name="play" size={14} color="#0A0014" />
              <Text style={styles.playAllText}>Play all</Text>
            </Pressable>
          ) : null}
        </View>

        {folderSongs.length === 0 ? (
          <EmptyState
            icon="folder-open-outline"
            title="Empty folder"
            message="No supported audio files were found here."
          />
        ) : (
          <FlatList
            data={folderSongs}
            keyExtractor={(s) => s.id}
            renderItem={({ item }) => (
              <SongItem
                song={item}
                isActive={current?.id === item.id}
                isLiked={likedIds.has(item.id)}
                onPress={onPlay}
                onLongPress={setActionTarget}
                onMore={setActionTarget}
              />
            )}
            contentContainerStyle={{ paddingBottom: MINI_PLAYER_HEIGHT + 80 }}
          />
        )}
        <SongActionSheet
          song={actionTarget}
          visible={!!actionTarget}
          onClose={() => setActionTarget(null)}
        />
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
  playAll: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
  },
  playAllText: { color: '#0A0014', fontWeight: FontWeight.bold, fontSize: FontSize.sm },
});
