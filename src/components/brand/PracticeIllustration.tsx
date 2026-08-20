import React from 'react';
import Svg, { Circle, Ellipse, G, Line, Path, Rect } from 'react-native-svg';

import { palette } from '../../theme';

/**
 * Ilustrações das práticas.
 *
 * Mesmo vocabulário visual do mascote: contorno verde-escuro grosso, cantos
 * arredondados, preenchimentos chapados da paleta. Todas em viewBox 120x100
 * para trocarem de lugar sem reajuste.
 */

const OUTLINE = palette.green900;
const W = 3.2;

const stroke = {
  stroke: OUTLINE,
  strokeWidth: W,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
} as const;

/** Folha do broto, reaproveitada como assinatura em várias cenas. */
function Leaf({ x, y, rotate = 0, scale = 1, color = palette.green500 }: {
  x: number; y: number; rotate?: number; scale?: number; color?: string;
}) {
  return (
    <G transform={`translate(${x} ${y}) rotate(${rotate}) scale(${scale})`}>
      <Path
        d="M0 0 C -2.5 -6 -7.5 -11 -13.5 -10 C -17.5 -9 -18.5 -2.5 -14 1.5 C -9 7 -3.5 5 0 0 Z"
        fill={color}
        {...stroke}
        strokeWidth={2.4}
      />
    </G>
  );
}

const ILLUSTRATIONS = {
  /** Respiração: círculos concêntricos como o ar entrando e saindo. */
  breathing: (
    <G>
      <Circle cx={60} cy={50} r={34} fill={palette.green100} />
      <Circle cx={60} cy={50} r={34} fill="none" {...stroke} />
      <Circle cx={60} cy={50} r={22} fill="none" {...stroke} strokeWidth={2.2} opacity={0.55} />
      <Circle cx={60} cy={50} r={11} fill={palette.green300} {...stroke} strokeWidth={2.2} />
      <Leaf x={60} y={16} rotate={-90} scale={1.1} />
      <Path d="M 92 50 q 8 -6 16 0" fill="none" {...stroke} strokeWidth={2.4} opacity={0.7} />
      <Path d="M 12 50 q 8 6 16 0" fill="none" {...stroke} strokeWidth={2.4} opacity={0.7} />
    </G>
  ),

  /** Aterramento: uma mão aberta, os cinco sentidos. */
  senses: (
    <G>
      <Path
        d="M 44 88 C 34 78 32 66 32 58 L 32 44 a 4.5 4.5 0 0 1 9 0 l 0 10 l 0 -22 a 4.5 4.5 0 0 1 9 0 l 0 22 l 0 -26 a 4.5 4.5 0 0 1 9 0 l 0 26 l 0 -20 a 4.5 4.5 0 0 1 9 0 l 0 20 l 0 -12 a 4.5 4.5 0 0 1 9 0 l 0 26 c 0 12 -6 22 -16 24 Z"
        fill={palette.cream300}
        {...stroke}
      />
      <Circle cx={88} cy={30} r={5} fill={palette.amber400} {...stroke} strokeWidth={2.2} />
      <Leaf x={26} y={30} rotate={200} scale={0.9} />
    </G>
  ),

  /** Carta: envelope com uma folha saindo. */
  letter: (
    <G>
      <Rect x={26} y={34} width={68} height={46} rx={6} fill={palette.cream100} {...stroke} />
      <Path d="M 26 40 L 60 62 L 94 40" fill="none" {...stroke} strokeWidth={2.6} />
      <Leaf x={90} y={32} rotate={-40} scale={1.2} />
      <Circle cx={34} cy={26} r={3} fill={palette.terracotta400} />
    </G>
  ),

  /** Relaxamento: corpo deitado, com marcas onde a tensão sai. */
  bodyscan: (
    <G>
      <Rect x={16} y={58} width={88} height={26} rx={8} fill={palette.lavender100} {...stroke} />
      <Circle cx={34} cy={48} r={11} fill={palette.cream300} {...stroke} />
      <Path d="M 45 58 L 92 58" fill="none" {...stroke} strokeWidth={2.6} />
      <Path d="M 58 44 l 0 -8 M 72 42 l 0 -10 M 86 44 l 0 -8" fill="none" {...stroke} strokeWidth={2.4} opacity={0.6} />
      <Leaf x={100} y={40} rotate={-60} scale={0.9} />
    </G>
  ),

  /** Varredura: silhueta com a linha de atenção subindo. */
  scan: (
    <G>
      <Circle cx={60} cy={24} r={10} fill={palette.cream300} {...stroke} />
      <Path d="M 60 34 L 60 62 M 60 40 L 42 54 M 60 40 L 78 54 M 60 62 L 48 86 M 60 62 L 72 86" fill="none" {...stroke} />
      <Rect x={22} y={54} width={76} height={9} rx={4.5} fill={palette.green300} opacity={0.75} {...stroke} strokeWidth={2.2} />
      <Leaf x={104} y={30} rotate={-50} scale={0.85} />
    </G>
  ),

  /** Diário da noite: caderno com lua. */
  nightjournal: (
    <G>
      <Rect x={28} y={30} width={62} height={52} rx={6} fill={palette.cream100} {...stroke} />
      <Path d="M 42 30 L 42 82" fill="none" {...stroke} strokeWidth={2.4} opacity={0.5} />
      <Path d="M 52 46 L 80 46 M 52 56 L 80 56 M 52 66 L 70 66" fill="none" {...stroke} strokeWidth={2.2} opacity={0.5} />
      <Path
        d="M 98 22 a 11 11 0 1 0 -10.5 14 a 8.5 8.5 0 0 1 10.5 -14 z"
        fill={palette.yellow300}
        {...stroke}
        strokeWidth={2.4}
      />
      <Circle cx={22} cy={26} r={2.6} fill={palette.amber400} />
    </G>
  ),

  /** Pausa de 3 minutos: ampulheta. */
  pause: (
    <G>
      <Path d="M 40 20 L 80 20 L 80 30 L 62 50 L 80 70 L 80 80 L 40 80 L 40 70 L 58 50 L 40 30 Z" fill={palette.blue100} {...stroke} />
      <Path d="M 46 26 L 74 26" fill="none" {...stroke} strokeWidth={2.4} opacity={0.6} />
      <Path d="M 52 74 q 8 -12 16 0 z" fill={palette.green300} {...stroke} strokeWidth={2.2} />
      <Leaf x={96} y={40} rotate={-45} scale={0.9} />
    </G>
  ),

  /** Alongamento: figura com os braços esticados para cima. */
  stretch: (
    <G>
      <Circle cx={60} cy={26} r={10} fill={palette.cream300} {...stroke} />
      <Path d="M 60 36 L 60 64 M 60 42 L 40 22 M 60 42 L 80 22 M 60 64 L 48 88 M 60 64 L 72 88" fill="none" {...stroke} />
      <Path d="M 34 16 q 6 -6 12 0" fill="none" {...stroke} strokeWidth={2.4} opacity={0.6} />
      <Path d="M 74 16 q 6 -6 12 0" fill="none" {...stroke} strokeWidth={2.4} opacity={0.6} />
      <Leaf x={100} y={62} rotate={-30} scale={0.9} />
    </G>
  ),

  /** Ombros: pescoço e ombros com os arcos de alívio. */
  shoulders: (
    <G>
      <Circle cx={60} cy={30} r={13} fill={palette.cream300} {...stroke} />
      <Path d="M 60 43 L 60 54" fill="none" {...stroke} />
      <Path d="M 24 82 C 24 62 40 54 60 54 C 80 54 96 62 96 82 Z" fill={palette.terracotta100} {...stroke} />
      <Path d="M 32 62 q -6 -8 -2 -16" fill="none" {...stroke} strokeWidth={2.4} opacity={0.65} />
      <Path d="M 88 62 q 6 -8 2 -16" fill="none" {...stroke} strokeWidth={2.4} opacity={0.65} />
    </G>
  ),

  /** Autocompaixão: mãos segurando um coração. */
  kindness: (
    <G>
      <Path
        d="M 60 76 C 46 64 34 54 34 42 C 34 32 42 28 48 30 C 53 32 57 37 60 42 C 63 37 67 32 72 30 C 78 28 86 32 86 42 C 86 54 74 64 60 76 Z"
        fill={palette.terracotta100}
        {...stroke}
      />
      <Path d="M 24 82 q 12 -14 24 -8 M 96 82 q -12 -14 -24 -8" fill="none" {...stroke} strokeWidth={2.6} />
      <Leaf x={94} y={30} rotate={-50} scale={0.85} />
    </G>
  ),

  /** Conquistas: três degraus subindo. */
  achievements: (
    <G>
      <Rect x={22} y={62} width={26} height={22} rx={4} fill={palette.green100} {...stroke} />
      <Rect x={48} y={48} width={26} height={36} rx={4} fill={palette.green300} {...stroke} />
      <Rect x={74} y={34} width={26} height={50} rx={4} fill={palette.green500} {...stroke} />
      <Path d="M 87 22 l 2.6 5.4 l 5.4 0.8 l -4 3.8 l 1 5.4 l -5 -2.6 l -5 2.6 l 1 -5.4 l -4 -3.8 l 5.4 -0.8 z" fill={palette.amber400} />
    </G>
  ),

  /** Gratidão: coração com raios. */
  gratitude: (
    <G>
      <Path
        d="M 60 74 C 47 63 36 54 36 43 C 36 34 43 30 49 32 C 54 34 57 38 60 43 C 63 38 66 34 71 32 C 77 30 84 34 84 43 C 84 54 73 63 60 74 Z"
        fill={palette.yellow100}
        {...stroke}
      />
      <G stroke={palette.amber400} strokeWidth={2.8} strokeLinecap="round">
        <Line x1={60} y1={20} x2={60} y2={12} />
        <Line x1={30} y1={30} x2={24} y2={24} />
        <Line x1={90} y1={30} x2={96} y2={24} />
        <Line x1={22} y1={54} x2={14} y2={54} />
        <Line x1={98} y1={54} x2={106} y2={54} />
      </G>
    </G>
  ),

  /** Foco: alvo com uma folha no centro. */
  focus: (
    <G>
      <Circle cx={60} cy={50} r={34} fill={palette.green50} {...stroke} />
      <Circle cx={60} cy={50} r={21} fill="none" {...stroke} strokeWidth={2.4} />
      <Circle cx={60} cy={50} r={8} fill={palette.green500} {...stroke} strokeWidth={2.2} />
      <Leaf x={98} y={20} rotate={-45} scale={1} />
    </G>
  ),

  /** Blocos de atenção: um bloco cheio, os outros esperando. */
  blocks: (
    <G>
      <Rect x={20} y={40} width={34} height={34} rx={6} fill={palette.green300} {...stroke} />
      <Path d="M 28 57 l 6 6 l 12 -13" fill="none" stroke={OUTLINE} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
      <Rect x={60} y={40} width={20} height={34} rx={5} fill={palette.cream300} {...stroke} strokeWidth={2.6} />
      <Rect x={86} y={40} width={20} height={34} rx={5} fill={palette.cream300} {...stroke} strokeWidth={2.6} opacity={0.6} />
      <Ellipse cx={62} cy={86} rx={44} ry={4} fill={palette.brown900} opacity={0.1} />
    </G>
  ),
} as const;

export type IllustrationName = keyof typeof ILLUSTRATIONS;

export function PracticeIllustration({
  name,
  size = 200,
}: {
  name: IllustrationName;
  size?: number;
}) {
  const art = ILLUSTRATIONS[name];
  if (!art) return null;
  return (
    <Svg viewBox="0 0 120 100" width={size} height={size * (100 / 120)}>
      {art}
    </Svg>
  );
}
