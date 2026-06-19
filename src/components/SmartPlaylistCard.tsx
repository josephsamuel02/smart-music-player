import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '@/constants/colors';
import { FontSize, FontWeight, Radius, Spacing } from '@/constants/theme';
import { formatCount } from '@/utils/format';
import type { SmartPlaylistMeta } from '@/utils/smartPlaylists';
import { GlassCard } from './GlassCard';

type Props = {
  meta: SmartPlaylistMeta;
  count: number;
  onPress: () => void;
  /** Word used for the count subtitle (default "song"). */
  unit?: string;
};

export function SmartPlaylistCard({ meta, count, onPress, unit = 'song' }: Props) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => pressed && { opacity: 0.85 }}
    >
      <GlassCard radius={Radius.sm} style={styles.card}>
        <View style={styles.row}>
          <View style={styles.coverWrap}>
            <LinearGradient
              colors={meta.gradient as unknown as readonly [string, string]}
              style={StyleSheet.absoluteFill}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            />
            <Ionicons name={meta.icon} size={24} color="#fff" />
          </View>
          <View style={styles.text}>
            <Text numberOfLines={1} style={styles.title}>
              {meta.title}
            </Text>
            <Text numberOfLines={1} style={styles.subtitle}>
              {count > 0 ? formatCount(count, unit) : meta.description}
            </Text>
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
