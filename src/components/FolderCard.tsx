import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import type { FolderGroup } from '@/types';
import { Colors } from '@/constants/colors';
import { FontSize, FontWeight, Radius, Spacing } from '@/constants/theme';
import { formatCount } from '@/utils/format';
import { GlassCard } from './GlassCard';

type Props = {
  folder: FolderGroup;
  onPress: () => void;
};

export function FolderCard({ folder, onPress }: Props) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => pressed && { opacity: 0.85 }}>
      <GlassCard style={styles.card}>
        <View style={styles.row}>
          <View style={styles.coverWrap}>
            <LinearGradient
              colors={['rgba(167,139,250,0.55)', 'rgba(236,72,153,0.55)']}
              style={StyleSheet.absoluteFill}
            />
            <Ionicons name="folder" size={22} color="#fff" />
          </View>
          <View style={styles.text}>
            <Text numberOfLines={1} style={styles.title}>
              {folder.name}
            </Text>
            <Text style={styles.subtitle}>{formatCount(folder.songCount, 'song')}</Text>
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
    width: 52,
    height: 52,
    borderRadius: Radius.md,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: { flex: 1, minWidth: 0 },
  title: { color: Colors.text, fontSize: FontSize.md, fontWeight: FontWeight.semibold },
  subtitle: { color: Colors.textMuted, fontSize: FontSize.sm, marginTop: 2 },
});
