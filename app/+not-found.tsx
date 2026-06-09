import React from 'react';
import { StyleSheet, Text } from 'react-native';
import { Link, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BackgroundGradient } from '@/components/BackgroundGradient';
import { Colors } from '@/constants/colors';
import { FontSize, FontWeight, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';

export default function NotFoundScreen() {
  const theme = useTheme();
  return (
    <>
      <Stack.Screen options={{ title: 'Oops' }} />
      <BackgroundGradient>
        <SafeAreaView style={styles.wrap}>
          <Text style={styles.title}>This screen doesn't exist.</Text>
          <Link href="/(tabs)/songs" style={[styles.link, { backgroundColor: theme.accent }]}>
            <Text style={styles.linkText}>Back to Songs</Text>
          </Link>
        </SafeAreaView>
      </BackgroundGradient>
    </>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.lg, padding: Spacing.xl },
  title: { color: Colors.text, fontSize: FontSize.xl, fontWeight: FontWeight.semibold, textAlign: 'center' },
  link: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: 10,
    borderRadius: Radius.pill,
  },
  linkText: { color: '#0A0014', fontWeight: FontWeight.bold },
});
