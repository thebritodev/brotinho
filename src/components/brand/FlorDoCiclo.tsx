import React from 'react';
import Svg, { Circle, Ellipse, G, Path } from 'react-native-svg';

import { ESPECIES, type EspecieKey } from '../../data/especies';
import { useEspecieDoBroto } from './especieDoBroto';

/**
 * A flor que a espécie abre no fim do ciclo.
 *
 * ## Por que ela existe, e por que não é a flor da Composta
 *
 * A régua do ciclo desenhava uma margarida na marca do dia 21 — e a margarida
 * é da Composta, onde cada frase compostada vira uma flor num canteiro. Era
 * exatamente a repetição que o Pedro apontou: duas ferramentas diferentes
 * terminando no mesmo desenho.
 *
 * Esta é outra coisa. É **uma forma só, pintada com as cores da espécie**: a
 * lavanda abre lilás, o girassol abre amarelo de miolo escuro, a cerejeira
 * abre rosa. Quem está no meio de um ciclo de lavanda vê, na ponta da régua,
 * a flor que a sua lavanda vai abrir — e no ciclo seguinte vê outra, porque
 * escolheu outra espécie.
 *
 * ## Por que uma forma só, e não cinco
 *
 * Porque cinco desenhos de flor seriam cinco oportunidades de uma delas ficar
 * pior que as outras, e porque o que separa as espécies neste app é a cor: é
 * assim no broto, que é o mesmo desenho em doze tons diferentes, e manter a
 * mesma regra aqui faz a flor ler como **daquele broto** em vez de um ícone
 * emprestado.
 *
 * A pétala de cima é desenhada por último, por cima do miolo — é o que dá o
 * meio-giro que impede as cinco de parecerem um carimbo.
 */

/** A origem é o pé; a flor cresce para o `y` negativo, como as da Composta. */
const PETALAS = [0, 72, 144, 216, 288];

export function FlorDoCiclo({
  tamanho,
  especie,
}: {
  tamanho: number;
  /** A espécie, quando não é a de agora — ver `especieDoBroto`. */
  especie?: EspecieKey;
}) {
  const deAgora = useEspecieDoBroto();
  const { tinta, flor } = ESPECIES[especie ?? deAgora];

  return (
    <Svg width={tamanho} height={tamanho} viewBox="-26 -62 52 70">
      {/* O caule, da terra até o miolo. */}
      <Path
        d="M 0 4 C -3 -8 3 -20 0 -30"
        stroke={tinta.haste}
        strokeWidth={3}
        strokeLinecap="round"
        fill="none"
      />
      {/* Duas folhas na altura do meio, uma de cada lado. */}
      <Ellipse
        cx={-7}
        cy={-12}
        rx={7}
        ry={3.6}
        fill={tinta.folhaLuz}
        stroke={tinta.contornoFolha}
        strokeWidth={1.6}
        transform="rotate(-18 -7 -12)"
      />
      <Ellipse
        cx={7}
        cy={-19}
        rx={6}
        ry={3.2}
        fill={tinta.folhaSombra}
        stroke={tinta.contornoFolha}
        strokeWidth={1.6}
        transform="rotate(16 7 -19)"
      />

      <G transform="translate(0 -38)">
        {PETALAS.map((giro) => (
          <Ellipse
            key={giro}
            cx={0}
            cy={-11}
            rx={6.4}
            ry={10}
            fill={flor.petala}
            stroke={tinta.contornoFolha}
            strokeWidth={1.8}
            transform={`rotate(${giro} 0 0)`}
          />
        ))}
        <Circle
          cx={0}
          cy={0}
          r={6}
          fill={flor.miolo}
          stroke={tinta.contornoFolha}
          strokeWidth={1.8}
        />
        {/* O brilho do miolo, do lado em que a luz bate no broto inteiro. */}
        <Circle cx={-2} cy={-2} r={1.8} fill={flor.petala} opacity={0.55} />
      </G>
    </Svg>
  );
}
