import React, { useMemo } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Artwork } from '@/components/Artwork';
import { BackgroundGradient } from '@/components/BackgroundGradient';
import { EmptyState } from '@/components/EmptyState';
import { MiniPlayer } from '@/components/MiniPlayer';
import { useMusicStore } from '@/store/musicStore';
import { Colors } from '@/constants/colors';
import { FontSize, FontWeight, HitSlop, MINI_PLAYER_HEIGHT, Spacing } from '@/constants/theme';
import { formatCount } from '@/utils/format';

type ArtistGroup = { name: string; count: number; artwork?: string };

export default function ArtistsScreen() {
  const songs = useMusicStore((s) => s.songs);

  const artists = useMemo<ArtistGroup[]>(() => {
    const map = new Map<string, ArtistGroup>();
    for (const song of songs) {
      const name = song.artist?.trim() || 'Unknown Artist';
      const existing = map.get(name);
      if (existing) {
        existing.count += 1;
        if (!existing.artwork && song.artwork) existing.artwork = song.artwork;
      } else {
        map.set(name, { name, count: 1, artwork: song.artwork });
      }
    }
    return Array.from(map.values()).sort((a, b) =>
      a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }),
    );
  }, [songs]);

  return (
    <BackgroundGradient>
      <SafeAreaView style={{ flex: 1 }} edges={['top', 'left', 'right']}>
        <View style={styles.headerRow}>
          <Pressable hitSlop={HitSlop} onPress={() => router.back()} style={styles.iconBtn}>
            <Ionicons name="chevron-back" size={22} color={Colors.text} />
          </Pressable>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text numberOfLines={1} style={styles.title}>
              Artists
            </Text>
            <Text style={styles.subtitle}>{formatCount(artists.length, 'artist')}</Text>
          </View>
        </View>

        {artists.length === 0 ? (
          <EmptyState
            icon="people-outline"
            title="No artists yet"
            message="Songs you add will be grouped by artist here."
          />
        ) : (
          <FlatList
            data={artists}
            keyExtractor={(a) => a.name}
            renderItem={({ item }) => (
              <Pressable
                onPress={() => router.push(`/artist/${encodeURIComponent(item.name)}` as never)}
                android_ripple={{ color: 'rgba(255,255,255,0.06)' }}
                style={({ pressed }) => [styles.row, pressed && { opacity: 0.7 }]}
              >
                <Artwork uri={item.artwork} seed={item.name} size={48} radius={24} />
                <View style={styles.text}>
                  <Text numberOfLines={1} style={styles.rowTitle}>
                    {item.name}
                  </Text>
                  <Text numberOfLines={1} style={styles.rowSubtitle}>
                    {formatCount(item.count, 'song')}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={Colors.textFaint} />
              </Pressable>
            )}
            contentContainerStyle={{ paddingBottom: MINI_PLAYER_HEIGHT + 80 }}
          />
        )}
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
  title: { color: Colors.text, fontSize: FontSize.xl, fontWeight: FontWeight.bold },
  subtitle: { color: Colors.textMuted, fontSize: FontSize.sm, marginTop: 2 },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: Spacing.lg,
    gap: Spacing.md,
  },
  text: { flex: 1, minWidth: 0 },
  rowTitle: { color: Colors.text, fontSize: FontSize.md, fontWeight: FontWeight.semibold },
  rowSubtitle: { color: Colors.textMuted, fontSize: FontSize.sm, marginTop: 2 },
});
