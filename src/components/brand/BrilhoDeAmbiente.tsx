import React, { useId } from 'react';
import { View } from 'react-native';
import Svg, { Defs, Ellipse, RadialGradient, Stop } from 'react-native-svg';

import { useTema } from '../../theme';

/**
 * A luz do cômodo — a camada mais larga e mais fraca das três.
 *
 * ## Por que ela existe
 *
 * O documento tem **três** camadas atrás do broto na tela inicial, e eu tinha
 * feito uma:
 *
 * 1. este brilho, de 470 por 470, sangrando para fora da tela;
 * 2. o halo do broto, de 300, que pulsa (`LuzDeEstufa`);
 * 3. a sombra do chão, em duas elipses (`Sprout`).
 *
 * Sem esta, o halo vira um disco isolado sobre papel liso: dá para ver onde
 * ele começa e onde acaba, e o que devia ser luz vira uma forma desenhada. Foi
 * exatamente a reclamação que apareceu no aparelho, e a tentativa de resolver
 * mexendo no tamanho do halo não resolvia porque o problema não era o halo.
 *
 * Uma luz precisa de duas escalas: a mancha perto do objeto e o campo largo em
 * volta. Com as duas, nenhuma das duas tem borda visível.
 *
 * ## As medidas
 *
 * Do documento, em fração da largura da tela dele (390): tamanho 1,205,
 * deslocada 0,103 para a esquerda e 0,282 para cima. Ela sangra pelos quatro
 * lados de propósito — luz de ambiente não tem começo dentro da tela.
 *
 * É estática. O que pulsa é o halo, e duas coisas pulsando em ritmos próximos
 * lêem como tremor.
 */

/** Do documento, seção 3: o brilho claro e o âmbar do tema escuro. */
const AMBIENTE = {
  claro: ['rgba(252,239,199,0.95)', 'rgba(252,239,199,0.32)', 'rgba(251,246,236,0)'],
  escuro: ['rgba(122,104,54,0.5)', 'rgba(122,104,54,0.15)', 'rgba(33,30,26,0)'],
} as const;

/** Frações da largura da tela — 470, −40 e −110 sobre os 390 do documento. */
const TAMANHO = 1.205;
const ESQUERDA = -0.103;
const TOPO = -0.282;

export function BrilhoDeAmbiente({ larguraDaTela }: { larguraDaTela: number }) {
  const { tema } = useTema();
  const id = useId().replace(/[^a-zA-Z0-9]/g, '');
  const cores = AMBIENTE[tema];
  const lado = larguraDaTela * TAMANHO;

  return (
    <View
      pointerEvents="none"
      style={{
        position: 'absolute',
        left: larguraDaTela * ESQUERDA,
        top: larguraDaTela * TOPO,
        width: lado,
        height: lado,
      }}
    >
      <Svg width={lado} height={lado}>
        <Defs>
          <RadialGradient id={`ambiente-${id}`} cx="50%" cy="50%" r="50%">
            <Stop offset="0" stopColor={cores[0]} />
            <Stop offset="0.46" stopColor={cores[1]} />
            <Stop offset="0.72" stopColor={cores[2]} />
          </RadialGradient>
        </Defs>
        <Ellipse
          cx={lado / 2}
          cy={lado / 2}
          rx={lado / 2}
          ry={lado / 2}
          fill={`url(#ambiente-${id})`}
        />
      </Svg>
    </View>
  );
}
