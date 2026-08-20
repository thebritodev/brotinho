import React from 'react';
import { View } from 'react-native';
import Svg, { Path, G } from 'react-native-svg';

import { colors, palette } from '../../theme';

/**
 * ProgressStem — o progresso do onboarding como um caule que ganha folhas.
 *
 * Eram dez pontinhos iguais. Trocar por um broto que cresce faz a barra de
 * progresso contar a mesma história do app: você avança, ele cresce.
 */

const ALTURA = 22;
/** Folha desenhada na origem, apontando para a direita e para cima. */
const FOLHA = 'M0 0 C 3 -6 9 -8 13 -6 C 12 -1 7 2 0 0 Z';

type Props = {
  /** Passo atual, começando em zero. */
  step: number;
  total: number;
  width: number;
};

export function ProgressStem({ step, total, width }: Props) {
  // Margem nas pontas: a primeira e a última folha não encostam na borda.
  const margem = 8;
  // Largura negativa ou zero gera um SVG inválido. Quem chama já se protege,
  // mas um componente reutilizável não deveria depender disso.
  const largura = Math.max(1, width);
  const util = Math.max(1, largura - margem * 2);
  const passo = util / Math.max(1, total - 1);
  const y = ALTURA / 2;
  const feitoAte = margem + passo * step;

  return (
    <View style={{ width: largura, height: ALTURA }}>
      <Svg width={largura} height={ALTURA}>
        {/* Caule inteiro, apagado, e por cima o trecho já percorrido. */}
        <Path
          d={`M${margem} ${y} L${largura - margem} ${y}`}
          stroke={palette.brown200}
          strokeWidth={3}
          strokeLinecap="round"
        />
        <Path
          d={`M${margem} ${y} L${Math.max(margem, feitoAte)} ${y}`}
          stroke={colors.primary}
          strokeWidth={3}
          strokeLinecap="round"
        />

        {Array.from({ length: total }).map((_, i) => {
          const x = margem + passo * i;
          const feita = i <= step;
          // Alterna para cima e para baixo, como folhas num caule de verdade.
          const paraCima = i % 2 === 0;
          return (
            <G
              key={i}
              transform={`translate(${x} ${y}) scale(${paraCima ? 1 : 1} ${paraCima ? -1 : 1})`}
            >
              <Path
                d={FOLHA}
                fill={feita ? colors.primary : palette.brown200}
                opacity={feita ? 1 : 0.7}
              />
            </G>
          );
        })}
      </Svg>
    </View>
  );
}
