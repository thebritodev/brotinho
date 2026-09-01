import React from 'react';
import Svg, { Circle, G, Path } from 'react-native-svg';

import { tracos, type Mood, useTema } from '../../theme';
import { CARAS } from './geometriaDoBroto';

/**
 * A carinha de um humor, com a mesma expressao que o broto faz.
 *
 * As formas sao as mesmas de Sprout.tsx: quem escolhe "ansioso" ve aqui o
 * rosto que o broto vai ter depois de escolher.
 */

type Props = {
  mood: Mood;
  size?: number;
  /** Contorno mais forte quando o humor esta escolhido. */
  selected?: boolean;
};

export function MoodFace({ mood, size = 44, selected = false }: Props) {
  const { moodColors, palette } = useTema();
  /*
    A carinha usa a tinta escura nos dois temas.

    Houve uma versão em que ela seguia `textPrimary`, porque as cores de humor
    escuras eram escuras de verdade e o traço marrom sumia nelas. Isso durou o
    tempo daquelas cores. Hoje as pastilhas de humor são claras nos dois temas
    — ver `moodColorsEscuros` —, e a carinha é a mesma dos dois lados: tinta
    escura sobre a cor do humor, como um rostinho desenhado a lápis.
  */
  const traco = tracos.contorno;
  const f = CARAS[mood] ?? CARAS.neutro;

  const olho = (x: number) =>
    f.eye === 'circle' ? (
      <Circle cx={x} cy={-2} r={f.r} fill={traco} />
    ) : (
      <Path
        d={f.eye}
        // O olho da direita e o mesmo desenho espelhado.
        transform={`translate(${x} -2)${x < 0 ? '' : ' scale(-1,1)'}`}
        stroke={traco}
        strokeWidth={2.6}
        strokeLinecap="round"
        fill="none"
      />
    );

  return (
    // viewBox centrada em 0,0 para as coordenadas do rosto valerem direto.
    <Svg viewBox="-26 -26 52 52" width={size} height={size}>
      <Circle
        cx={0}
        cy={0}
        r={23}
        fill={moodColors[mood]}
        stroke={selected ? tracos.folha : palette.brown200}
        strokeWidth={selected ? 3 : 2}
      />
      <G>
        {olho(-8)}
        {olho(8)}
        <Path
          d={f.mouth}
          transform="translate(0 -2)"
          stroke={traco}
          strokeWidth={2.4}
          strokeLinecap="round"
          fill="none"
        />
      </G>
    </Svg>
  );
}
