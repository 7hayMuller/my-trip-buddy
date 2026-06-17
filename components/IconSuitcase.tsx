import React from 'react';
import Svg, { Path, Rect, Defs, LinearGradient, Stop } from 'react-native-svg';

interface IconSuitcaseProps {
  size?: number;
  color?: string;
}

export function IconSuitcase({ size = 28, color }: IconSuitcaseProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64" fill="none">
      <Defs>
        <LinearGradient id="suitcaseGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <Stop offset="0%" stopColor="#F093FB" />
          <Stop offset="100%" stopColor="#F5576C" />
        </LinearGradient>
        <LinearGradient id="handleGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <Stop offset="0%" stopColor="#FFD700" />
          <Stop offset="100%" stopColor="#FFA500" />
        </LinearGradient>
      </Defs>

      {/* Asa/Handle da mala */}
      <Path
        d="M24 14C24 10 28 8 32 8C36 8 40 10 40 14"
        stroke="url(#handleGrad)"
        strokeWidth="2.5"
        fill="none"
        strokeLinecap="round"
      />

      {/* Corpo principal da mala */}
      <Rect
        x="16"
        y="16"
        width="32"
        height="32"
        rx="3"
        fill="url(#suitcaseGrad)"
      />

      {/* Traços/divisão na mala */}
      <Path
        d="M16 28H48"
        stroke="rgba(255,255,255,0.4)"
        strokeWidth="1.5"
      />

      {/* Puxador/fechadura no topo */}
      <Rect
        x="30"
        y="18"
        width="4"
        height="4"
        rx="1"
        fill="#FFD700"
      />

      {/* Rodinha esquerda */}
      <Circle cx="22" cy="50" r="2" fill="#333333" />

      {/* Rodinha direita */}
      <Circle cx="42" cy="50" r="2" fill="#333333" />

      {/* Padrão/textura na mala - estilo viagem */}
      <Rect
        x="20"
        y="22"
        width="6"
        height="6"
        rx="1"
        fill="rgba(255,255,255,0.2)"
      />
      <Rect
        x="38"
        y="22"
        width="6"
        height="6"
        rx="1"
        fill="rgba(255,255,255,0.2)"
      />
      <Rect
        x="20"
        y="36"
        width="6"
        height="6"
        rx="1"
        fill="rgba(255,255,255,0.2)"
      />
      <Rect
        x="38"
        y="36"
        width="6"
        height="6"
        rx="1"
        fill="rgba(255,255,255,0.2)"
      />
    </Svg>
  );
}

function Circle({ cx, cy, r, fill }: { cx: number; cy: number; r: number; fill: string }) {
  return <circle cx={cx} cy={cy} r={r} fill={fill} />;
}
