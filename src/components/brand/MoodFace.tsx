import React from 'react';
import Svg, { Circle, Ellipse, G, Path } from 'react-native-svg';

import { tracos, type Mood, useTema } from '../../theme';
import {
  BOCHECHAS_DO_HUMOR,
  OLHOS_DO_HUMOR,
  ROSTOS_DO_HUMOR,
  ZETA_DO_CANSADO,
} from './geometriaDoBroto';

/**
 * A carinha de um humor: o símbolo do sentimento, numa pastilha.
 *
 * Ela **não** é a cara do broto, e a nota de `ROSTOS_DO_HUMOR` conta por quê —
 * em resumo: o broto é um personagem visto de longe e precisa de pouco; isto é
 * um botão que a pessoa olha de perto para escolher, e precisa que ansiedade e
 * tristeza se distingam sem ler o rótulo. É a sobrancelha, a gota e o zê que
 * fazem isso, e nenhum deles caberia no bulbo do broto.
 *
 * A geometria mora em `geometriaDoBroto`, junto com a do personagem. Já houve
 * duas cópias do rosto em dois arquivos, e elas divergiram na primeira vez que
 * alguém mexeu numa.
 */

type Props = {
  mood: Mood;
  size?: number;
  /** Contorno mais forte quando o humor esta escolhido. */
  selected?: boolean;
  /**
   * Desenha so a expressao, sem o circulo colorido embaixo.
   *
   * Serve para quando a cor do humor ja esta na peca que recebe o rosto — a
   * casa do calendario do mes, por exemplo. Ali o circulo seria da mesma cor
   * do fundo e so acrescentaria um anel de contorno dentro de um quadrado
   * arredondado, que e ruido.
   */
  semFundo?: boolean;
};

/** A caixa do documento. O rosto inteiro é escrito nela. */
const CAIXA = 56;

export function MoodFace({ mood, size = 44, selected = false, semFundo = false }: Props) {
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
  const r = ROSTOS_DO_HUMOR[mood] ?? ROSTOS_DO_HUMOR.neutro;

  const comum = {
    stroke: traco,
    strokeWidth: 2.6,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    fill: 'none',
  };

  return (
    <Svg viewBox={`0 0 ${CAIXA} ${CAIXA}`} width={size} height={size}>
      {!semFundo && (
        <Circle
          cx={CAIXA / 2}
          cy={CAIXA / 2}
          r={CAIXA / 2 - 2}
          fill={moodColors[mood]}
          stroke={selected ? tracos.folha : palette.brown200}
          strokeWidth={selected ? 3 : 2}
        />
      )}

      {/* A bochecha vai embaixo de tudo: é cor na pele, não traço no rosto. */}
      {r.bochecha
        && BOCHECHAS_DO_HUMOR.map((b) => (
          <Ellipse
            key={b.cx}
            cx={b.cx}
            cy={b.cy}
            rx={3.5}
            ry={2.2}
            fill={palette.terracotta400}
            opacity={0.35}
          />
        ))}

      <G>
        {r.olhos.tipo === 'circulo' ? (
          <>
            <Circle
              cx={OLHOS_DO_HUMOR.esquerdo}
              cy={r.olhos.y}
              r={r.olhos.r}
              fill={traco}
            />
            <Circle
              cx={OLHOS_DO_HUMOR.direito}
              cy={r.olhos.y}
              r={r.olhos.r}
              fill={traco}
            />
          </>
        ) : (
          <Path d={r.olhos.d} {...comum} />
        )}

        {!!r.sobrancelhas && <Path d={r.sobrancelhas} {...comum} />}

        <Path
          d={r.boca}
          {...comum}
          fill={r.bocaCheia ? traco : 'none'}
          strokeWidth={r.bocaCheia ? 2.2 : 2.6}
        />

        {!!r.gota && (
          <Path
            d={r.gota.d}
            fill={palette.blue300}
            stroke={traco}
            strokeWidth={r.gota.traco}
            strokeLinejoin="round"
          />
        )}

        {r.zeta && (
          <Path
            d={ZETA_DO_CANSADO}
            stroke={traco}
            strokeWidth={2.2}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        )}
      </G>
    </Svg>
  );
}
