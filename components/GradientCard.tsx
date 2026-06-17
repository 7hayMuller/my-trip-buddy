import React from 'react';
import { View, ViewProps } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../theme';

interface GradientCardProps extends ViewProps {
  children: React.ReactNode;
  variant?: 'default' | 'teal' | 'purple' | 'sage' | 'blush';
  intensity?: 'light' | 'medium' | 'strong';
}

const gradients = {
  default: [colors.navy, colors.navy2],
  teal: [colors.teal, colors.teal2],
  purple: [colors.purple, colors.purple],
  sage: [colors.sage, colors.green],
  blush: [colors.blush, colors.accent],
};

const intensities = {
  light: { opacity: 0.03 },
  medium: { opacity: 0.06 },
  strong: { opacity: 0.12 },
};

export function GradientCard({
  children,
  variant = 'default',
  intensity = 'light',
  ...props
}: GradientCardProps) {
  const gradientColors = gradients[variant];
  const intensityOpacity = intensities[intensity].opacity;

  return (
    <View {...props}>
      <LinearGradient
        colors={[
          `${gradientColors[0]}${Math.round(intensityOpacity * 255).toString(16).padStart(2, '0')}`,
          `${gradientColors[1]}${Math.round(intensityOpacity * 255).toString(16).padStart(2, '0')}`,
        ]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ borderRadius: 20, overflow: 'hidden' }}
      >
        {children}
      </LinearGradient>
    </View>
  );
}
