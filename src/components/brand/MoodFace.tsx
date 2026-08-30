import React from 'react';
import Svg, { Circle, G, Path } from 'react-native-svg';

import { tracos, type Mood, useTema } from '../../theme';

/**
 * A carinha de um humor, com a mesma expressao que o broto faz.
 *
 * As formas sao as mesmas de Sprout.tsx: quem escolhe "ansioso" ve aqui o
 * rosto que o broto vai ter depois de escolher.
 */

type FaceSpec = { eye: string | 'circle'; r?: number; mouth: string };

const FACES: Record<Mood, FaceSpec> = {
  feliz: { eye: 'M -6 0 Q 0 -7 6 0', mouth: 'M -10 6 Q 0 16 10 6' },
  leve: { eye: 'circle', r: 2.6, mouth: 'M -8 6 Q 0 11 8 6' },
  ansioso: { eye: 'circle', r: 3.2, mouth: 'M -6 8 Q -3 5 0 8 Q 3 11 6 8' },
  triste: { eye: 'circle', r: 2.6, mouth: 'M -9 9 Q 0 2 9 9' },
  cansado: { eye: 'M -9 -1 L -2 -1', mouth: 'M -7 7 L 7 7' },
  neutro: { eye: 'circle', r: 2.4, mouth: 'M -7 7 L 7 7' },
};

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
  const f = FACES[mood] ?? FACES.neutro;

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
