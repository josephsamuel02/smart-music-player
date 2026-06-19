import React, { useEffect } from 'react';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  cancelAnimation,
  Easing,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { Colors } from '@/constants/colors';

const AnimatedIonicons = Animated.createAnimatedComponent(Ionicons);

/** Color cycle for the liked state: purple -> blue -> red -> green -> (loop). */
const CYCLE = ['#A78BFA', '#3B82F6', '#F87171', '#34D399', '#A78BFA'];
const STOPS = [0, 0.25, 0.5, 0.75, 1];

type Props = {
  liked: boolean;
  size?: number;
  /** Color shown when not liked (outline heart). */
  inactiveColor?: string;
  /** Seconds for one full color loop. */
  durationMs?: number;
  style?: object;
};

/**
 * Heart icon that, while liked, smoothly cycles its color through
 * purple → blue → red → green on a loop. When not liked it shows a static
 * outline heart.
 */
export function AnimatedHeart({
  liked,
  size = 22,
  inactiveColor = Colors.text,
  durationMs = 4000,
  style,
}: Props) {
  const progress = useSharedValue(0);

  useEffect(() => {
    if (liked) {
      progress.value = 0;
      progress.value = withRepeat(
        withTiming(1, { duration: durationMs, easing: Easing.linear }),
        -1,
        false,
      );
    } else {
      cancelAnimation(progress);
      progress.value = 0;
    }
    return () => cancelAnimation(progress);
  }, [liked, durationMs, progress]);

  const animatedStyle = useAnimatedStyle(() => ({
    color: interpolateColor(progress.value, STOPS, CYCLE),
  }));

  if (!liked) {
    return <Ionicons name="heart-outline" size={size} color={inactiveColor} style={style} />;
  }

  return (
    <AnimatedIonicons name="heart" size={size} style={[style, animatedStyle]} />
  );
}
