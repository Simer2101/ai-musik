import { type PressableProps, type StyleProp, type ViewStyle, Pressable } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const SPRING_IN = { damping: 16, stiffness: 420, mass: 0.35 };
const SPRING_OUT = { damping: 14, stiffness: 260, mass: 0.4 };

export function PressableScale({
  children,
  style,
  disabled,
  scaleTo = 0.96,
  onPressIn,
  onPressOut,
  ...props
}: PressableProps & { scaleTo?: number }) {
  const scale = useSharedValue(1);
  const animated = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedPressable
      {...props}
      disabled={disabled}
      onPressIn={(event) => {
        if (!disabled) scale.value = withSpring(scaleTo, SPRING_IN);
        onPressIn?.(event);
      }}
      onPressOut={(event) => {
        scale.value = withSpring(1, SPRING_OUT);
        onPressOut?.(event);
      }}
      style={[animated, { cursor: disabled ? 'default' : 'pointer' }, style as StyleProp<ViewStyle>]}>
      {children}
    </AnimatedPressable>
  );
}
