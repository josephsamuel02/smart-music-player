import React, { useCallback, useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BackgroundGradient } from '@/components/BackgroundGradient';
import { SearchBar } from '@/components/SearchBar';
import { SongItem } from '@/components/SongItem';
import { SongActionSheet } from '@/components/SongActionSheet';
import { useMusicStore } from '@/store/musicStore';
import { useLikedStore } from '@/store/likedStore';
import type { Song } from '@/types';
import { Colors } from '@/constants/colors';
import { FontSize, FontWeight, HitSlop, Spacing } from '@/constants/theme';
import { formatCount } from '@/utils/format';

function matches(song: Song, q: string) {
  const needle = q.toLowerCase();
  return (
    song.title.toLowerCase().includes(needle) ||
    song.artist.toLowerCase().includes(needle) ||
    song.album.toLowerCase().includes(needle)
  );
}

export default function SearchScreen() {
  const songs = useMusicStore((s) => s.songs);
  const playFromList = useMusicStore((s) => s.playFromList);
  const likedIds = useLikedStore((s) => s.likedIds);

  const [query, setQuery] = useState('');
  const [actionTarget, setActionTarget] = useState<Song | null>(null);

  const results = useMemo(() => {
    const q = query.trim();
    if (!q) return [] as Song[];
    return songs.filter((s) => matches(s, q)).slice(0, 200);
  }, [songs, query]);

  const onPlay = useCallback(
    (song: Song) => {
      playFromList(results.length ? results : [song], song.id);
      // Close the search modal then immediately open the full player on top of the tabs.
      router.back();
      setTimeout(() => router.push('/player'), 120);
    },
    [playFromList, results],
  );

  return (
    <BackgroundGradient>
      <SafeAreaView style={{ flex: 1 }} edges={['top', 'left', 'right']}>
        <View style={styles.header}>
          <Pressable hitSlop={HitSlop} onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={22} color={Colors.text} />
          </Pressable>
          <View style={{ flex: 1 }}>
            <SearchBar value={query} onChange={setQuery} autoFocus />
          </View>
        </View>
        {query.trim() === '' ? (
          <View style={styles.tipWrap}>
            <Text style={styles.tipTitle}>Find anything in your library</Text>
            <Text style={styles.tip}>Search by song title, artist, or album.</Text>
          </View>
        ) : results.length === 0 ? (
          <View style={styles.tipWrap}>
            <Ionicons name="search-outline" size={36} color={Colors.textMuted} />
            <Text style={styles.tipTitle}>No matches</Text>
            <Text style={styles.tip}>Try a different word or check your spelling.</Text>
          </View>
        ) : (
          <>
            <Text style={styles.count}>{formatCount(results.length, 'result')}</Text>
            <FlatList
              data={results}
              keyExtractor={(s) => s.id}
              renderItem={({ item }) => (
                <SongItem
                  song={item}
                  isLiked={likedIds.has(item.id)}
                  onPress={onPlay}
                  onLongPress={setActionTarget}
                  onMore={setActionTarget}
                />
              )}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="on-drag"
              contentContainerStyle={{ paddingBottom: 60 }}
            />
          </>
        )}
        <SongActionSheet
          song={actionTarget}
          visible={!!actionTarget}
          onClose={() => setActionTarget(null)}
        />
      </SafeAreaView>
    </BackgroundGradient>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  count: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
    paddingHorizontal: Spacing.lg,
    paddingBottom: 4,
    letterSpacing: 0.4,
  },
  tipWrap: { alignItems: 'center', justifyContent: 'center', flex: 1, gap: 8, paddingHorizontal: Spacing.xl },
  tipTitle: { color: Colors.text, fontSize: FontSize.lg, fontWeight: FontWeight.semibold, marginTop: 8 },
  tip: { color: Colors.textMuted, fontSize: FontSize.sm, textAlign: 'center' },
});
