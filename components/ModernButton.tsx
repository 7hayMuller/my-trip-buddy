import React, { useRef } from 'react';
import {
  Animated,
  TouchableWithoutFeedback,
  View,
  ViewStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface ModernButtonProps {
  children: React.ReactNode;
  onPress?: () => void;
  colors: [string, string];
  style?: ViewStyle;
  shadowColor?: string;
  disabled?: boolean;
}

export function ModernButton({
  children,
  onPress,
  colors: gradientColors,
  style,
  shadowColor = '#000000',
  disabled = false,
}: ModernButtonProps) {
  const scale = useRef(new Animated.Value(1)).current;

  const onPressIn = () => {
    if (disabled) return;
    Animated.spring(scale, {
      toValue: 0.95,
      useNativeDriver: true,
      speed: 20,
      bounciness: 8,
    }).start();
  };

  const onPressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 20,
      bounciness: 8,
    }).start();
  };

  return (
    <TouchableWithoutFeedback
      onPress={onPress}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      disabled={disabled}
    >
      <Animated.View
        style={[
          style,
          {
            transform: [{ scale }],
            opacity: disabled ? 0.5 : 1,
          },
        ]}
      >
        <LinearGradient
          colors={gradientColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            ...StyleSheet.create({
              button: {
                shadowColor,
                shadowOffset: { width: 0, height: 8 },
                shadowOpacity: 0.3,
                shadowRadius: 12,
                elevation: 8,
              },
            }).button,
            borderRadius: 16,
            overflow: 'hidden',
          }}
        >
          {children}
        </LinearGradient>
      </Animated.View>
    </TouchableWithoutFeedback>
  );
}

import { StyleSheet } from 'react-native';
