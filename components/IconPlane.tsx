import React from 'react';
import Svg, { Path, Circle, Defs, LinearGradient, Stop, Ellipse } from 'react-native-svg';

interface IconPlaneProps {
  size?: number;
}

export function IconPlane({ size = 28 }: IconPlaneProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64" fill="none">
      <Defs>
        <LinearGradient id="planeBody" x1="0%" y1="0%" x2="0%" y2="100%">
          <Stop offset="0%" stopColor="#667EEA" />
          <Stop offset="100%" stopColor="#5A67D8" />
        </LinearGradient>
        <LinearGradient id="planeWings" x1="0%" y1="50%" x2="100%" y2="50%">
          <Stop offset="0%" stopColor="#F093FB" />
          <Stop offset="100%" stopColor="#F5576C" />
        </LinearGradient>
      </Defs>

      {/* Fuselagem (corpo do avião) */}
      <Path
        d="M32 12L40 28L40 42C40 45.3 36.3 48 32 48C27.7 48 24 45.3 24 42L24 28L32 12Z"
        fill="url(#planeBody)"
      />

      {/* Ponta do nariz */}
      <Circle cx="32" cy="11" r="2" fill="#4C51BF" />

      {/* Cockpit window */}
      <Circle cx="32" cy="18" r="2" fill="#FFD700" />

      {/* Asa esquerda - grande */}
      <Path
        d="M24 30C24 30 6 34 4 37C3 38 3 39 5 38.5C10 37 24 32 24 32Z"
        fill="url(#planeWings)"
      />

      {/* Asa direita - grande */}
      <Path
        d="M40 30C40 30 58 34 60 37C61 38 61 39 59 38.5C54 37 40 32 40 32Z"
        fill="url(#planeWings)"
      />

      {/* Estabilizador horizontal esquerdo (pequeno) */}
      <Path
        d="M26 42C26 42 14 44 12 45C11 45 11 46 13 45.5C17 44.5 26 43 26 43Z"
        fill="#FF6B9D"
        opacity="0.8"
      />

      {/* Estabilizador horizontal direito (pequeno) */}
      <Path
        d="M38 42C38 42 50 44 52 45C53 45 53 46 51 45.5C47 44.5 38 43 38 43Z"
        fill="#FF6B9D"
        opacity="0.8"
      />

      {/* Estabilizador vertical (cauda) */}
      <Path
        d="M32 46L28 54C28 55 29 56 30 55L32 48Z"
        fill="#4FACFE"
      />
      <Path
        d="M32 46L36 54C36 55 35 56 34 55L32 48Z"
        fill="#4FACFE"
      />

      {/* Luz vermelha esquerda */}
      <Circle cx="18" cy="32" r="1" fill="#FF4444" opacity="0.9" />

      {/* Luz verde direita */}
      <Circle cx="46" cy="32" r="1" fill="#44FF44" opacity="0.9" />

      {/* Detalhe da porta de carga */}
      <Path
        d="M30 34H34"
        stroke="#FFFFFF"
        strokeWidth="0.8"
        opacity="0.5"
      />
    </Svg>
  );
}
