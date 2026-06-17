import React from 'react';
import Svg, { Path, Circle, Rect } from 'react-native-svg';

interface IconHomeProps {
  color?: string;
  size?: number;
}

export function IconHome({ color = '#E8A8C8', size = 28 }: IconHomeProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64" fill="none">
      {/* Sombra base */}
      <Path
        d="M12 54C12 54 12 56 14 56H50C52 56 52 54 52 54H12Z"
        fill={`${color}08`}
      />

      {/* Telhado principal */}
      <Path
        d="M32 10L54 32V52C54 53.1 53.1 54 52 54H12C10.9 54 10 53.1 10 52V32L32 10Z"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill={`${color}12`}
      />

      {/* Telhado triangular */}
      <Path
        d="M32 10L54 32M32 10L10 32"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Porta principal */}
      <Rect
        x="28"
        y="38"
        width="8"
        height="16"
        rx="1.5"
        stroke={color}
        strokeWidth="2"
        fill={`${color}08`}
      />
      <Circle cx="35" cy="46" r="1.2" fill={color} opacity="0.7" />

      {/* Janela esquerda */}
      <Rect
        x="16"
        y="34"
        width="6"
        height="6"
        rx="1"
        stroke={color}
        strokeWidth="1.8"
        fill={`${color}05`}
      />
      <Path
        d="M19 34V40M16 37H22"
        stroke={color}
        strokeWidth="1"
        strokeLinecap="round"
      />

      {/* Janela direita */}
      <Rect
        x="42"
        y="34"
        width="6"
        height="6"
        rx="1"
        stroke={color}
        strokeWidth="1.8"
        fill={`${color}05`}
      />
      <Path
        d="M45 34V40M42 37H48"
        stroke={color}
        strokeWidth="1"
        strokeLinecap="round"
      />

      {/* Pequena chaminé decorativa */}
      <Rect
        x="44"
        y="18"
        width="2.5"
        height="8"
        rx="1"
        fill={color}
        opacity="0.5"
      />
    </Svg>
  );
}
