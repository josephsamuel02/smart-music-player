import React from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { FontSize, HitSlop, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { GlassCard } from './GlassCard';

type Props = {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  autoFocus?: boolean;
  onSubmit?: () => void;
};

export function SearchBar({ value, onChange, placeholder, autoFocus, onSubmit }: Props) {
  const theme = useTheme();
  return (
    <GlassCard radius={Radius.pill} style={styles.card} noPadding>
      <View style={styles.row}>
        <Ionicons name="search" size={18} color={Colors.textMuted} />
        <TextInput
          value={value}
          onChangeText={onChange}
          autoFocus={autoFocus}
          placeholder={placeholder ?? 'Search songs, artists, albums'}
          placeholderTextColor={Colors.textFaint}
          style={styles.input}
          returnKeyType="search"
          onSubmitEditing={onSubmit}
          underlineColorAndroid="transparent"
          selectionColor={theme.accent}
        />
        {value.length > 0 ? (
          <Pressable hitSlop={HitSlop} onPress={() => onChange('')} style={styles.clear}>
            <Ionicons name="close-circle" size={18} color={Colors.textMuted} />
          </Pressable>
        ) : null}
      </View>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  card: {
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    gap: 10,
    minHeight: 46,
  },
  input: {
    flex: 1,
    color: Colors.text,
    fontSize: FontSize.md,
    paddingVertical: 0,
  },
  clear: { padding: 2 },
});
