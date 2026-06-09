import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { FontSize, FontWeight, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';

type Props = {
  icon?: keyof typeof Ionicons.glyphMap;
  title: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
};

export function EmptyState({ icon = 'musical-notes', title, message, actionLabel, onAction }: Props) {
  const theme = useTheme();
  return (
    <View style={styles.wrap}>
      <View style={[styles.iconBubble, { backgroundColor: theme.accentSoft }]}>
        <Ionicons name={icon} size={36} color={theme.accent} />
      </View>
      <Text style={styles.title}>{title}</Text>
      {message ? <Text style={styles.message}>{message}</Text> : null}
      {actionLabel && onAction ? (
        <Pressable
          onPress={onAction}
          style={({ pressed }) => [
            styles.button,
            { backgroundColor: theme.accent },
            pressed && { opacity: 0.85 },
          ]}
        >
          <Text style={styles.buttonText}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.xxl,
  },
  iconBubble: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  title: { color: Colors.text, fontSize: FontSize.lg, fontWeight: FontWeight.semibold, textAlign: 'center' },
  message: {
    color: Colors.textMuted,
    fontSize: FontSize.sm,
    textAlign: 'center',
    marginTop: 8,
    maxWidth: 280,
    lineHeight: 20,
  },
  button: {
    marginTop: 20,
    paddingHorizontal: Spacing.xl,
    paddingVertical: 12,
    borderRadius: Radius.pill,
  },
  buttonText: { color: '#0A0014', fontWeight: FontWeight.bold, fontSize: FontSize.md },
});
