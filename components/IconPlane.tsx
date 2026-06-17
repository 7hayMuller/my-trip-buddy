import React from 'react';
import Svg, { Path, Defs, LinearGradient, Stop } from 'react-native-svg';

interface IconPlaneProps {
  size?: number;
  color?: string;
}

export function IconPlane({ size = 28, color }: IconPlaneProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64" fill="none">
      <Defs>
        <LinearGradient id="planeFuse" x1="0%" y1="0%" x2="0%" y2="100%">
          <Stop offset="0%" stopColor="#667EEA" />
          <Stop offset="100%" stopColor="#5A67D8" />
        </LinearGradient>
      </Defs>

      {/* ASAS - Principais (rosa/vermelho) */}
      {/* Asa esquerda */}
      <Path
        d="M8 32L32 28L32 36L8 32Z"
        fill="#FF6B9D"
      />

      {/* Asa direita */}
      <Path
        d="M56 32L32 28L32 36L56 32Z"
        fill="#FF6B9D"
      />

      {/* FUSELAGEM - Corpo principal (roxo/azul) */}
      <Path
        d="M32 12L38 28L38 48C38 50 35.5 52 32 52C28.5 52 26 50 26 48L26 28L32 12Z"
        fill="url(#planeFuse)"
      />

      {/* Nariz pontudo */}
      <Path
        d="M32 12L35 20L32 22L29 20L32 12Z"
        fill="#4C51BF"
      />

      {/* Cockpit - janela dourada */}
      <Path
        d="M30 18L34 18L34 22L30 22Z"
        fill="#FFD700"
      />

      {/* CAUDA - Estabilizador vertical (azul) */}
      <Path
        d="M30 48L28 56L32 54L36 56L34 48Z"
        fill="#4FACFE"
      />

      {/* Ailerons/Spoilers nas asas */}
      <Path
        d="M20 32L24 32"
        stroke="#FF5E78"
        strokeWidth="1.5"
        opacity="0.7"
      />
      <Path
        d="M44 32L40 32"
        stroke="#FF5E78"
        strokeWidth="1.5"
        opacity="0.7"
      />

      {/* Luz de navegação esquerda */}
      <Path
        d="M10 30L12 30"
        stroke="#FF3333"
        strokeWidth="1.5"
      />

      {/* Luz de navegação direita */}
      <Path
        d="M54 30L52 30"
        stroke="#33FF33"
        strokeWidth="1.5"
      />
    </Svg>
  );
}
