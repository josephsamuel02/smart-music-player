import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DraggableFlatList, {
  RenderItemParams,
  ScaleDecorator,
} from 'react-native-draggable-flatlist';
import { Colors } from '@/constants/colors';
import { FontSize, FontWeight, HitSlop, Spacing } from '@/constants/theme';
import { useMusicStore } from '@/store/musicStore';
import { useTheme } from '@/hooks/useTheme';
import type { Song } from '@/types';
import { formatDuration } from '@/utils/format';
import { Artwork } from './Artwork';

type Props = {
  /** A height limit (used inside the full player). Optional. */
  height?: number;
};

/**
 * Drag-to-reorder queue list. Reorder and removal go directly to the music store.
 */
export function QueueList({ height }: Props) {
  const theme = useTheme();
  const queue = useMusicStore((s) => s.queue);
  const currentIndex = useMusicStore((s) => s.currentIndex);
  const songsById = useMusicStore((s) => s.songsById);
  const reorderQueue = useMusicStore((s) => s.reorderQueue);
  const removeFromQueueAt = useMusicStore((s) => s.removeFromQueueAt);

  const items = queue
    .map((id, index) => ({ id, index, song: songsById[id] }))
    .filter((x) => !!x.song) as { id: string; index: number; song: Song }[];

  const renderItem = ({ item, drag, isActive }: RenderItemParams<(typeof items)[number]>) => {
    const playing = item.index === currentIndex;
    return (
      <ScaleDecorator>
        <Pressable
          onLongPress={drag}
          delayLongPress={200}
          style={[
            styles.row,
            playing && { backgroundColor: theme.accentSoft },
            isActive && styles.dragging,
          ]}
        >
          <View style={styles.dragHandle}>
            <Ionicons name="reorder-three" size={20} color={Colors.textFaint} />
          </View>
          <Artwork uri={item.song.artwork} seed={item.song.id} size={40} radius={8} />
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text numberOfLines={1} style={[styles.title, playing && { color: theme.accent }]}>
              {item.song.title}
            </Text>
            <Text numberOfLines={1} style={styles.artist}>
              {item.song.artist}
            </Text>
          </View>
          <Text style={styles.duration}>{formatDuration(item.song.duration)}</Text>
          <Pressable
            hitSlop={HitSlop}
            onPress={() => removeFromQueueAt(item.index)}
            style={styles.remove}
          >
            <Ionicons name="close" size={18} color={Colors.textMuted} />
          </Pressable>
        </Pressable>
      </ScaleDecorator>
    );
  };

  return (
    <View style={[styles.container, height ? { height } : null]}>
      <DraggableFlatList
        data={items}
        keyExtractor={(it) => it.id}
        renderItem={renderItem}
        activationDistance={12}
        onDragEnd={({ from, to }) => reorderQueue(from, to)}
        ListEmptyComponent={
          <Text style={styles.empty}>Your queue is empty. Pick a song to start.</Text>
        }
        contentContainerStyle={{ paddingBottom: Spacing.lg }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    paddingVertical: 8,
  },
  dragging: { backgroundColor: 'rgba(255,255,255,0.06)' },
  dragHandle: { width: 22, alignItems: 'center' },
  title: { color: Colors.text, fontSize: FontSize.md, fontWeight: FontWeight.semibold },
  artist: { color: Colors.textMuted, fontSize: FontSize.xs, marginTop: 2 },
  duration: {
    color: Colors.textFaint,
    fontSize: FontSize.xs,
    fontVariant: ['tabular-nums'],
    paddingHorizontal: 4,
  },
  remove: { padding: 6 },
  empty: {
    textAlign: 'center',
    color: Colors.textMuted,
    paddingVertical: Spacing.xl,
    paddingHorizontal: Spacing.lg,
  },
});
