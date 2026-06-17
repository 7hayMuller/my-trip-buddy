import React from 'react';
import Svg, { Path, Circle, Rect, Defs, LinearGradient, Stop } from 'react-native-svg';

interface IconPlaneProps {
  size?: number;
}

export function IconPlane({ size = 28 }: IconPlaneProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64" fill="none">
      <Defs>
        <LinearGradient id="fuseGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <Stop offset="0%" stopColor="#667EEA" />
          <Stop offset="100%" stopColor="#764BA2" />
        </LinearGradient>
        <LinearGradient id="wingGrad" x1="0%" y1="0%" x2="100%" y2="50%">
          <Stop offset="0%" stopColor="#F093FB" />
          <Stop offset="100%" stopColor="#F5576C" />
        </LinearGradient>
        <LinearGradient id="tailGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <Stop offset="0%" stopColor="#4FACFE" />
          <Stop offset="100%" stopColor="#00F2FE" />
        </LinearGradient>
      </Defs>

      {/* Fuselagem principal */}
      <Path
        d="M32 10C32 10 38 18 38 26L38 45C38 48 35.3 50 32 50C28.7 50 26 48 26 45L26 26C26 18 32 10 32 10Z"
        fill="url(#fuseGrad)"
      />

      {/* Asa esquerda */}
      <Path
        d="M26 30C26 30 8 33 6 36C5 37 6 38 8 37C12 36 26 32 26 32Z"
        fill="url(#wingGrad)"
      />

      {/* Asa direita */}
      <Path
        d="M38 30C38 30 56 33 58 36C59 37 58 38 56 37C52 36 38 32 38 32Z"
        fill="url(#wingGrad)"
      />

      {/* Leme vertical esquerdo */}
      <Path
        d="M28 46L24 54C24 55 25 56 26 55L28 48Z"
        fill="url(#tailGrad)"
      />

      {/* Leme vertical direito */}
      <Path
        d="M36 46L40 54C40 55 39 56 38 55L36 48Z"
        fill="url(#tailGrad)"
      />

      {/* Cockpit window - grande */}
      <Circle
        cx="32"
        cy="16"
        r="2.5"
        fill="#FFD700"
      />

      {/* Pequena sombra/detalhe da fuselagem */}
      <Path
        d="M26 26L26 40"
        stroke="rgba(0,0,0,0.1)"
        strokeWidth="1"
      />

      {/* Detalhes de porta da cabine */}
      <Rect
        x="30"
        y="28"
        width="4"
        height="6"
        rx="1"
        fill="rgba(255,255,255,0.3)"
      />

      {/* Luzes de navegação */}
      <Circle cx="22" cy="30" r="1" fill="#FF4444" opacity="0.8" />
      <Circle cx="42" cy="30" r="1" fill="#44FF44" opacity="0.8" />
    </Svg>
  );
}
