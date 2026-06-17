import React from 'react';
import Svg, { Path, Circle } from 'react-native-svg';

interface IconPlaneProps {
  color?: string;
  size?: number;
}

export function IconPlane({ color = '#E8A8C8', size = 28 }: IconPlaneProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64" fill="none">
      {/* Sombra base */}
      <Path
        d="M20 54C20 54 20 56 22 56H42C44 56 44 54 44 54Z"
        fill={`${color}08`}
      />

      {/* Fuselagem principal */}
      <Path
        d="M32 8L48 26V44C48 47.3 45.3 50 42 50H22C18.7 50 16 47.3 16 44V26L32 8Z"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill={`${color}12`}
      />

      {/* Asa esquerda - com mais detalhes */}
      <Path
        d="M32 28L10 34L32 38V28Z"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill={`${color}08`}
      />

      {/* Asa direita - com mais detalhes */}
      <Path
        d="M32 28L54 34L32 38V28Z"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill={`${color}08`}
      />

      {/* Leme vertical */}
      <Path
        d="M26 46V54M38 46V54"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
      />

      {/* Janela do cockpit - maior */}
      <Circle
        cx="32"
        cy="18"
        r="2.2"
        fill={color}
        opacity="0.8"
      />

      {/* Pequenas janelas da cabine */}
      <Circle cx="28" cy="28" r="1" fill={color} opacity="0.5" />
      <Circle cx="36" cy="28" r="1" fill={color} opacity="0.5" />

      {/* Detalhe de movimento - linhas de velocidade */}
      <Path
        d="M8 33L12 33M8 35L12 35"
        stroke={color}
        strokeWidth="1"
        strokeLinecap="round"
        opacity="0.4"
      />
      <Path
        d="M52 33L56 33M52 35L56 35"
        stroke={color}
        strokeWidth="1"
        strokeLinecap="round"
        opacity="0.4"
      />
    </Svg>
  );
}
