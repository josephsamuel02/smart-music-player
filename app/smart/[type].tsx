import React, { useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BackgroundGradient } from '@/components/BackgroundGradient';
import { EmptyState } from '@/components/EmptyState';
import { MiniPlayer } from '@/components/MiniPlayer';
import { SongItem } from '@/components/SongItem';
import { SongActionSheet } from '@/components/SongActionSheet';
import { selectCurrentSong, useMusicStore } from '@/store/musicStore';
import { useLikedStore } from '@/store/likedStore';
import { useStatsStore } from '@/store/statsStore';
import type { Song } from '@/types';
import { Colors } from '@/constants/colors';
import { FontSize, FontWeight, HitSlop, MINI_PLAYER_HEIGHT, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { formatCount } from '@/utils/format';
import {
  computeSmartPlaylist,
  getSmartPlaylistMeta,
  type SmartPlaylistType,
} from '@/utils/smartPlaylists';

export default function SmartPlaylistScreen() {
  const theme = useTheme();
  const { type } = useLocalSearchParams<{ type: string }>();
  const meta = getSmartPlaylistMeta(type ?? '');

  const songs = useMusicStore((s) => s.songs);
  const stats = useStatsStore((s) => s.stats);
  const playFromList = useMusicStore((s) => s.playFromList);
  const current = useMusicStore(selectCurrentSong);
  const likedIds = useLikedStore((s) => s.likedIds);

  const [actionTarget, setActionTarget] = useState<Song | null>(null);

  const list = useMemo(() => {
    if (!meta) return [] as Song[];
    return computeSmartPlaylist(meta.type as SmartPlaylistType, songs, stats);
  }, [meta, songs, stats]);

  if (!meta) {
    return (
      <BackgroundGradient>
        <SafeAreaView style={styles.center}>
          <Text style={{ color: Colors.textMuted }}>Unknown playlist.</Text>
          <Pressable onPress={() => router.back()} style={styles.outlineBtn}>
            <Text style={styles.outlineBtnText}>Back</Text>
          </Pressable>
        </SafeAreaView>
      </BackgroundGradient>
    );
  }

  const onPlay = (song: Song) => {
    playFromList(list, song.id);
    router.push('/player');
  };

  return (
    <BackgroundGradient>
      <SafeAreaView style={{ flex: 1 }} edges={['top', 'left', 'right']}>
        <View style={styles.headerRow}>
          <Pressable hitSlop={HitSlop} onPress={() => router.back()} style={styles.iconBtn}>
            <Ionicons name="chevron-back" size={22} color={Colors.text} />
          </Pressable>
          <View style={styles.headerCover}>
            <LinearGradient
              colors={meta.gradient as unknown as readonly [string, string]}
              style={StyleSheet.absoluteFill}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            />
            <Ionicons name={meta.icon} size={22} color="#fff" />
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text numberOfLines={1} style={styles.title}>
              {meta.title}
            </Text>
            <Text style={styles.subtitle}>{formatCount(list.length, 'song')}</Text>
          </View>
        </View>

        {list.length === 0 ? (
          <EmptyState
            icon={meta.icon}
            title={meta.title}
            message={
              meta.type === 'newly-added'
                ? 'No songs in your library yet.'
                : 'Start playing songs and they will show up here.'
            }
          />
        ) : (
          <FlatList
            data={list}
            keyExtractor={(s) => s.id}
            ListHeaderComponent={
              <Pressable
                onPress={() => onPlay(list[0])}
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
    gap: Spacing.md,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCover: {
    width: 48,
    height: 48,
    borderRadius: Radius.md,
    overflow: 'hidden',
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
});
