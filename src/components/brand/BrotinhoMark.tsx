import React from 'react';
import Svg, { Circle, G, Path } from 'react-native-svg';

/**
 * BrotinhoMark — o símbolo do app: duas folhas e um caule dentro de um disco.
 *
 * As cores são fixas de propósito. Este mesmo desenho vira o ícone na tela
 * inicial do celular, e ícone de app não muda de cor junto com o tema — por
 * isso elas não saem de `theme/tokens`.
 */
export const MARK_PEACH = '#EFB183';
export const MARK_GREEN = '#8CB68B';

/**
 * O desenho vive num quadrado de 100×100, com o disco de raio 49.
 *
 * O caule é traço, não preenchimento: a ponta de baixo é arredondada e a de
 * cima precisa sumir por baixo da folha da direita. Por isso ele é desenhado
 * ANTES das folhas — trocar a ordem deixa o topo do traço à mostra.
 *
 * A ponta da folha da esquerda passa um pouco ALÉM do caule (64.6, não 63):
 * encostando exatamente nele sobrava um ponto de fundo preso entre as três
 * formas, que a 30px lê como sujeira.
 */
const LEAF = 'M 13.7 26.4 C 36.7 26.6 49.1 38.8 49.6 64.6 C 30.7 63.8 13.1 45.8 13.7 26.4 Z';
const STEM = 'M 47.9 88.5 C 47.9 79 48.2 69.5 49.3 63 C 50.2 57.5 52.1 54.4 54.6 52.6';
const STEM_WIDTH = 2.2;

/**
 * A folha da direita é a mesma da esquerda, espelhada e com a ponta levantada
 * 7°. Sem esse giro as duas ficam simétricas demais e o desenho perde o jeito
 * de planta — no original a da direita nasce um pouco mais acima.
 */
const RIGHT_LEAF_TRANSFORM = 'translate(100 0) scale(-1 1) rotate(-7 13.7 26.4)';

export function BrotinhoMark({ size = 32 }: { size?: number }) {
  return (
    <Svg viewBox="0 0 100 100" width={size} height={size}>
      <Circle cx={50} cy={50} r={49} fill={MARK_PEACH} />
      <Path
        d={STEM}
        fill="none"
        stroke={MARK_GREEN}
        strokeWidth={STEM_WIDTH}
        strokeLinecap="round"
      />
      <G fill={MARK_GREEN}>
        <Path d={LEAF} />
        <Path d={LEAF} transform={RIGHT_LEAF_TRANSFORM} />
      </G>
    </Svg>
  );
}
