import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import DraggableFlatList, {
  RenderItemParams,
  ScaleDecorator,
} from 'react-native-draggable-flatlist';
import { Colors } from '@/constants/colors';
import { FontSize, FontWeight, HitSlop, Radius, Spacing } from '@/constants/theme';
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
  const playQueueIndex = useMusicStore((s) => s.playQueueIndex);

  const items = queue
    .map((id, index) => ({ id, index, song: songsById[id] }))
    .filter((x) => !!x.song) as { id: string; index: number; song: Song }[];

  const renderItem = ({ item, drag, isActive }: RenderItemParams<(typeof items)[number]>) => {
    const playing = item.index === currentIndex;
    return (
      <ScaleDecorator activeScale={1.06}>
        <Pressable
          onPress={() => playQueueIndex(item.index)}
          onLongPress={drag}
          delayLongPress={180}
          style={[
            styles.row,
            playing && { backgroundColor: theme.accentSoft },
            isActive && styles.dragging,
          ]}
        >
          {/* The handle also starts the drag, so users can grab it directly. */}
          <Pressable onLongPress={drag} delayLongPress={180} hitSlop={HitSlop} style={styles.dragHandle}>
            <Ionicons name="reorder-three" size={26} color={Colors.textFaint} />
          </Pressable>
          <Artwork uri={item.song.artwork} seed={item.song.id} size={56} radius={10} />
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text
              numberOfLines={1}
              style={[
                styles.title,
                playing && { color: theme.accent, fontWeight: FontWeight.bold },
              ]}
            >
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
            <Ionicons name="close" size={20} color={Colors.textMuted} />
          </Pressable>
        </Pressable>
      </ScaleDecorator>
    );
  };

  return (
    // The player is a native modal, which renders outside the root
    // GestureHandlerRootView. Without a local root here the drag gesture never
    // fires (press-and-hold does nothing), so we wrap the list in its own.
    <GestureHandlerRootView style={[styles.container, height ? { height } : null]}>
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
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: Radius.md,
  },
  dragging: {
    backgroundColor: 'rgba(255,255,255,0.10)',
    shadowColor: '#000',
    shadowOpacity: 0.35,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  dragHandle: { width: 30, alignItems: 'center', justifyContent: 'center' },
  title: { color: Colors.text, fontSize: FontSize.lg, fontWeight: FontWeight.semibold },
  artist: { color: Colors.textMuted, fontSize: FontSize.sm, marginTop: 2 },
  duration: {
    color: Colors.textFaint,
    fontSize: FontSize.sm,
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
