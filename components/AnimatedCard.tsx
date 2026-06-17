import React, { useRef } from 'react';
import { Animated, TouchableWithoutFeedback, ViewProps } from 'react-native';

interface AnimatedCardProps extends ViewProps {
  children: React.ReactNode;
  onPress?: () => void;
}

export function AnimatedCard({ children, onPress, ...props }: AnimatedCardProps) {
  const scale = useRef(new Animated.Value(1)).current;

  const onPressIn = () => {
    Animated.spring(scale, {
      toValue: 0.98,
      useNativeDriver: true,
      speed: 20,
      bounciness: 5,
    }).start();
  };

  const onPressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 20,
      bounciness: 5,
    }).start();
  };

  return (
    <TouchableWithoutFeedback
      onPress={onPress}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
    >
      <Animated.View
        {...props}
        style={[props.style, { transform: [{ scale }] }]}
      >
        {children}
      </Animated.View>
    </TouchableWithoutFeedback>
  );
}
