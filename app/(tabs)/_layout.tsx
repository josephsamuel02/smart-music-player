import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Slot } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BackgroundGradient } from '@/components/BackgroundGradient';
import { TopHeader } from '@/components/TopHeader';
import { TopTabBar } from '@/components/TabBar';
import { MiniPlayer } from '@/components/MiniPlayer';

/**
 * The four "top tab" screens share this chrome: gradient + glass header +
 * scrollable tab bar + persistent mini player.
 */
export default function TabsLayout() {
  return (
    <BackgroundGradient>
      <SafeAreaView style={styles.flex} edges={['top', 'left', 'right']}>
        <TopHeader />
        <TopTabBar />
        <View style={styles.flex}>
          <Slot />
        </View>
      </SafeAreaView>
      <MiniPlayer />
    </BackgroundGradient>
  );
}

const styles = StyleSheet.create({ flex: { flex: 1 } });
