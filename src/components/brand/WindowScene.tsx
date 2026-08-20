import React from 'react';
import { View } from 'react-native';
import Svg, { Circle, Ellipse, G, Path, Rect } from 'react-native-svg';

import { palette } from '../../theme';
import { AnimatedSprout } from './AnimatedSprout';

/**
 * WindowScene — o broto num vaso, no parapeito de uma janela ensolarada.
 *
 * Fundo e mobília são desenhados aqui; o broto em si é o mascote de verdade,
 * montado por cima, para não existirem dois desenhos dele no projeto — e no
 * mesmo estágio 3 que ele tem no onboarding inteiro.
 */

/** A cena é desenhada num retângulo de 320×230 e escala com a largura. */
const W = 320;
const H = 230;

/** Onde o vaso do broto pousa, em fração da cena. */
const SPROUT_CENTER_X = 0.5;
const SILL_Y = 0.735;

export function WindowScene({ width }: { width: number }) {
  const k = width / W;
  const height = H * k;
  const sproutSize = 126 * k;

  return (
    <View style={{ width, height }}>
      <Svg width={width} height={height} viewBox={`0 0 ${W} ${H}`}>
        {/* Céu visto pela janela */}
        <Rect x={44} y={8} width={232} height={162} rx={16} fill={palette.blue100} />
        <Circle cx={100} cy={54} r={22} fill={palette.yellow100} />
        <Circle cx={100} cy={54} r={13} fill={palette.yellow300} />

        {/* Nuvens */}
        <G fill="#FFFFFF" opacity={0.85}>
          <Ellipse cx={196} cy={48} rx={26} ry={12} />
          <Ellipse cx={214} cy={42} rx={17} ry={11} />
          <Ellipse cx={150} cy={92} rx={20} ry={9} />
        </G>

        {/* Morros ao fundo, ficando mais claros com a distância */}
        <Path d="M44 170 C 84 118 116 122 148 152 C 176 178 210 172 232 152 L276 170 Z" fill={palette.green300} opacity={0.55} />
        <Path d="M44 170 C 78 138 106 142 132 164 C 158 184 200 180 226 164 L276 170 Z" fill={palette.green300} />

        {/* Caixilho: montante e travessa */}
        <G fill={palette.brown200}>
          <Rect x={155} y={8} width={10} height={162} />
          <Rect x={44} y={82} width={232} height={9} />
        </G>
        <Rect
          x={44}
          y={8}
          width={232}
          height={162}
          rx={16}
          fill="none"
          stroke={palette.brown400}
          strokeWidth={7}
        />

        {/* Parapeito */}
        <Rect x={20} y={168} width={280} height={14} rx={7} fill={palette.brown400} />

        {/* Luz caindo no parapeito */}
        <Path d="M62 168 L104 30 L150 30 L112 168 Z" fill={palette.yellow100} opacity={0.45} />

        {/* Vaso grande à esquerda: o broto já foi assim de pequeno */}
        <G>
          <Path d="M36 168 L44 132 L86 132 L94 168 Z" fill={palette.terracotta400} />
          <Rect x={40} y={124} width={50} height={11} rx={5} fill={palette.terracotta400} />
          <Path
            d="M65 124 C 65 96 50 88 38 84 C 40 104 50 118 65 124 Z"
            fill={palette.green500}
          />
          <Path
            d="M65 124 C 65 92 82 82 96 78 C 94 100 82 116 65 124 Z"
            fill={palette.green600}
          />
          <Path d="M65 126 L65 96" stroke={palette.green900} strokeWidth={2.5} strokeLinecap="round" />
        </G>

        {/* Xícara à direita, ainda fumegando */}
        <G>
          <Path d="M246 168 L242 146 L280 146 L276 168 Z" fill="#FFFFFF" />
          <Path
            d="M278 150 C 288 150 290 162 278 163"
            fill="none"
            stroke="#FFFFFF"
            strokeWidth={5}
            strokeLinecap="round"
          />
          <Rect x={240} y={142} width={42} height={6} rx={3} fill={palette.brown100} />
          <G stroke={palette.brown200} strokeWidth={2.5} strokeLinecap="round" fill="none" opacity={0.8}>
            <Path d="M254 136 C 250 130 258 126 254 120" />
            <Path d="M266 136 C 262 130 270 126 266 120" />
          </G>
        </G>

        {/* Chão abaixo do parapeito */}
        <Rect x={0} y={182} width={W} height={48} fill={palette.cream200} />
      </Svg>

      {/* O mascote de verdade, pousado no parapeito. */}
      <View
        style={{
          position: 'absolute',
          left: width * SPROUT_CENTER_X - sproutSize / 2,
          top: height * SILL_Y - sproutSize * 1.12,
        }}
      >
        <AnimatedSprout mood="feliz" stage={3} size={sproutSize} showBg={false} breathe />
      </View>
    </View>
  );
}
