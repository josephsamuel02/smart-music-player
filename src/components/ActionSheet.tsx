import React from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeOut, SlideInDown, SlideOutDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '@/constants/colors';
import { Spacing } from '@/constants/theme';
import { GlassCard } from './GlassCard';

type Props = {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
};

/**
 * Bottom-anchored glass action sheet. We use the built-in Modal so it floats
 * above tabs and the mini player without any portal gymnastics.
 */
export function ActionSheet({ visible, onClose, children }: Props) {
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose} statusBarTranslucent>
      <View style={StyleSheet.absoluteFill}>
        <Animated.View
          entering={FadeIn.duration(180)}
          exiting={FadeOut.duration(160)}
          style={StyleSheet.absoluteFill}
        >
          <Pressable style={styles.overlay} onPress={onClose} />
        </Animated.View>
        <Animated.View
          entering={SlideInDown.duration(220)}
          exiting={SlideOutDown.duration(180)}
          style={[styles.sheetWrap, { paddingBottom: Math.max(insets.bottom, Spacing.md) }]}
        >
          <GlassCard variant="strong" style={styles.sheet} noPadding>
            <View style={styles.handle} />
            {children}
          </GlassCard>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: Colors.overlay },
  sheetWrap: {
    position: 'absolute',
    left: Spacing.md,
    right: Spacing.md,
    bottom: 0,
  },
  sheet: { paddingBottom: Spacing.sm },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.25)',
    marginTop: 10,
    marginBottom: 4,
  },
});
