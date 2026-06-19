import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import type { Playlist } from '@/types';
import { Colors } from '@/constants/colors';
import { FontSize, FontWeight, Radius, Spacing } from '@/constants/theme';
import { formatCount } from '@/utils/format';
import { GlassCard } from './GlassCard';

type Props = {
  playlist: Playlist;
  onPress: () => void;
  onLongPress?: () => void;
};

const PALETTES: readonly (readonly [string, string])[] = [
  ['#7C3AED', '#06B6D4'],
  ['#EC4899', '#F59E0B'],
  ['#3B82F6', '#A78BFA'],
  ['#10B981', '#06B6D4'],
];

function pickPalette(id: string) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0;
  return PALETTES[Math.abs(h) % PALETTES.length];
}

export function PlaylistCard({ playlist, onPress, onLongPress }: Props) {
  const palette = pickPalette(playlist.id);
  return (
    <Pressable onPress={onPress} onLongPress={onLongPress} style={({ pressed }) => pressed && { opacity: 0.85 }}>
      <GlassCard radius={Radius.sm} style={styles.card}>
        <View style={styles.row}>
          <View style={styles.coverWrap}>
            <LinearGradient
              colors={palette as unknown as readonly [string, string]}
              style={StyleSheet.absoluteFill}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            />
            <Ionicons name="musical-notes" size={24} color="#fff" />
          </View>
          <View style={styles.text}>
            <Text numberOfLines={1} style={styles.title}>
              {playlist.name}
            </Text>
            <Text style={styles.subtitle}>{formatCount(playlist.songIds.length, 'song')}</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={Colors.textFaint} />
        </View>
      </GlassCard>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { marginHorizontal: Spacing.lg, marginVertical: 6 },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  coverWrap: {
    width: 56,
    height: 56,
    borderRadius: Radius.sm,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: { flex: 1, minWidth: 0 },
  title: { color: Colors.text, fontSize: FontSize.md, fontWeight: FontWeight.semibold },
  subtitle: { color: Colors.textMuted, fontSize: FontSize.sm, marginTop: 2 },
});
