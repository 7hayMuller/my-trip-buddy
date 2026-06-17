import React from 'react';
import Svg, { Path, Circle, Rect, Defs, LinearGradient, Stop } from 'react-native-svg';

interface IconHomeProps {
  size?: number;
}

export function IconHome({ size = 28 }: IconHomeProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64" fill="none">
      <Defs>
        <LinearGradient id="roofGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#FF5A5F" />
          <Stop offset="100%" stopColor="#FF7B85" />
        </LinearGradient>
        <LinearGradient id="wallGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <Stop offset="0%" stopColor="#FFE5E7" />
          <Stop offset="100%" stopColor="#FFF0F1" />
        </LinearGradient>
        <LinearGradient id="doorGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <Stop offset="0%" stopColor="#8B6F47" />
          <Stop offset="100%" stopColor="#A68B5B" />
        </LinearGradient>
      </Defs>

      {/* Parede principal */}
      <Path
        d="M14 32L14 50C14 52.2 15.8 54 18 54H46C48.2 54 50 52.2 50 50V32Z"
        fill="url(#wallGrad)"
      />

      {/* Telhado */}
      <Path
        d="M32 12L50 30L50 32L14 32L14 30L32 12Z"
        fill="url(#roofGrad)"
      />
      <Path
        d="M32 12L14 30"
        stroke="#FF4D52"
        strokeWidth="1.5"
        opacity="0.5"
      />

      {/* Sombra do telhado */}
      <Path
        d="M14 32L32 12L50 32"
        fill="rgba(255, 93, 95, 0.08)"
      />

      {/* Porta */}
      <Rect
        x="27"
        y="38"
        width="10"
        height="16"
        rx="2"
        fill="url(#doorGrad)"
      />
      <Circle cx="35.5" cy="46" r="1.5" fill="#D4AF37" />

      {/* Janela esquerda */}
      <Rect
        x="17"
        y="35"
        width="5"
        height="5"
        rx="1"
        fill="#87CEEB"
      />
      <Path
        d="M19.5 35V40M17 37.5H22"
        stroke="#4A90E2"
        strokeWidth="0.8"
      />

      {/* Janela direita */}
      <Rect
        x="42"
        y="35"
        width="5"
        height="5"
        rx="1"
        fill="#87CEEB"
      />
      <Path
        d="M44.5 35V40M42 37.5H47"
        stroke="#4A90E2"
        strokeWidth="0.8"
      />

      {/* Chaminé vermelha */}
      <Rect
        x="43"
        y="16"
        width="3"
        height="10"
        rx="1.5"
        fill="#E74C3C"
      />
      <Ellipse cx="44.5" cy="15" rx="2.5" ry="1.5" fill="#C0392B" />
    </Svg>
  );
}

interface EllipseProps {
  cx: number;
  cy: number;
  rx: number;
  ry: number;
  fill: string;
}

function Ellipse({ cx, cy, rx, ry, fill }: EllipseProps) {
  return <circle cx={cx} cy={cy} r={rx} fill={fill} />;
}
