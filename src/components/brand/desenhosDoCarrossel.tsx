import React, { useId } from 'react';
import Svg, { Defs, Ellipse, G, LinearGradient, Path, RadialGradient, Rect, Stop } from 'react-native-svg';

import { palette, tracos } from '../../theme/tokens';
import { BRASA, TERRA, TERRA_CLARA, TERRA_FUNDA, TERRA_SOMBRA } from './terraDoCanteiro';

/**
 * Os desenhinhos dos cartões do carrossel — Diário e Composta.
 *
 * ## Por que eles existem
 *
 * O cartão da Frase do dia tem o canteiro desenhado: terra com volume, uma
 * saliência, torrões soltos, um calor escapando por baixo. Os vizinhos tinham
 * um ícone de traço dentro de um disco. Lado a lado no carrossel, um parecia
 * ilustração e os outros dois, botão — e o que decide qual cartão a pessoa
 * olha primeiro é isso, não o texto.
 *
 * Então os três passam a ser cena, na mesma linguagem: quadrado de 60, terra
 * com gradiente, sombra de chão por baixo, contorno fino e um detalhe de luz.
 * O que muda é o assunto.
 *
 * ## O que cada um conta
 *
 * - **Diário** — uma folha pautada, com o canto virado. É papel, não tela: a
 *   promessa do diário é que aquilo não sai do aparelho, e caderno é o objeto
 *   que diz isso sem escrever. Teve uma folhinha verde de marcador espiando
 *   por trás, e ela saiu: verde num desenho de papel puxava o olho para o
 *   canto de cima, longe de onde está o assunto.
 * - **Composta** — a terra de novo, com um balão de fala caindo nela e um
 *   broto saindo do outro lado. É literalmente o que a Composta faz: a frase
 *   dita em voz alta vira adubo, e do adubo sai crescimento.
 *
 * Nada aqui usa cor do tema: são desenhos, e desenho não muda quando alguém
 * acerta o verde de um botão. Os ids de gradiente são gerados por instância —
 * `url(#id)` não tem escopo por componente, e dois cartões na mesma tela
 * disputariam o mesmo nome.
 */

/** O lado do quadrado dos dois desenhos. */
const LADO_DO_DESENHO = 60;

/** A sombra de chão, igual à do canteiro: sem ela o objeto flutua. */
function Chao({ id, cy = 50, rx = 26 }: { id: string; cy?: number; rx?: number }) {
  return <Ellipse cx={30} cy={cy} rx={rx} ry={5.5} fill={`url(#chao-${id})`} />;
}

export function DesenhoDoDiario() {
  const id = useId().replace(/[^a-zA-Z0-9]/g, '');

  return (
    <Svg viewBox="0 0 60 60" width={LADO_DO_DESENHO} height={LADO_DO_DESENHO}>
      <Defs>
        <RadialGradient id={`chao-${id}`} cx="50%" cy="50%" r="50%">
          <Stop offset="0" stopColor={TERRA_SOMBRA} stopOpacity={0.24} />
          <Stop offset="1" stopColor={TERRA_SOMBRA} stopOpacity={0} />
        </RadialGradient>
        {/* O papel também tem volume: mais claro em cima, onde a luz bate. */}
        <LinearGradient id={`papel-${id}`} x1="0" y1="0" x2="0.3" y2="1">
          <Stop offset="0" stopColor="#FFFFFF" />
          <Stop offset="0.55" stopColor={palette.cream100} />
          <Stop offset="1" stopColor={palette.cream300} />
        </LinearGradient>
      </Defs>

      <Chao id={id} cy={52} rx={24} />

      {/* A folha de trás, só aparecendo pela beirada: um caderno, não uma folha solta. */}
      <Rect
        x={14}
        y={9}
        width={33}
        height={41}
        rx={4}
        fill={palette.cream300}
        stroke={tracos.contorno}
        strokeWidth={1.4}
        opacity={0.55}
        transform="rotate(4 30 30)"
      />

      <G transform="rotate(-3 30 30)">
        <Path
          /* A folha da frente, com o canto de baixo virado. */
          d="M12 8 C12 6.3 13.3 5 15 5 L43 5 C44.7 5 46 6.3 46 8 L46 42 L38 50 L15 50 C13.3 50 12 48.7 12 47 Z"
          fill={`url(#papel-${id})`}
          stroke={tracos.contorno}
          strokeWidth={1.6}
          strokeLinejoin="round"
        />
        {/* A dobra do canto: a mesma aresta, virada para dentro. */}
        <Path
          d="M46 42 L38 42 L38 50 Z"
          fill={palette.cream300}
          stroke={tracos.contorno}
          strokeWidth={1.4}
          strokeLinejoin="round"
        />

        {/* As pautas. A última é mais curta: é onde a escrita parou. */}
        {[
          [18, 40],
          [26, 40],
          [34, 31],
        ].map(([y, fim]) => (
          <Path
            key={y}
            d={`M18 ${y} L${fim} ${y}`}
            stroke={palette.brown200}
            strokeWidth={1.8}
            strokeLinecap="round"
          />
        ))}
      </G>

    </Svg>
  );
}

export function DesenhoDaComposta() {
  const id = useId().replace(/[^a-zA-Z0-9]/g, '');

  return (
    <Svg viewBox="0 0 60 60" width={LADO_DO_DESENHO} height={LADO_DO_DESENHO}>
      <Defs>
        <RadialGradient id={`chao-${id}`} cx="50%" cy="50%" r="50%">
          <Stop offset="0" stopColor={TERRA_SOMBRA} stopOpacity={0.26} />
          <Stop offset="1" stopColor={TERRA_SOMBRA} stopOpacity={0} />
        </RadialGradient>
        <LinearGradient id={`terra-${id}`} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={TERRA_CLARA} />
          <Stop offset="0.5" stopColor={TERRA} />
          <Stop offset="1" stopColor={TERRA_SOMBRA} />
        </LinearGradient>
        {/* O calor de dentro do monte, o mesmo do canteiro da frase. */}
        <RadialGradient id={`brasa-${id}`} cx="50%" cy="50%" r="50%">
          <Stop offset="0" stopColor={BRASA} stopOpacity={0.45} />
          <Stop offset="1" stopColor={BRASA} stopOpacity={0} />
        </RadialGradient>
      </Defs>

      {/* O balão de fala, caindo na terra. É o pensamento dito em voz alta. */}
      <G transform="rotate(-12 22 18)">
        <Path
          d="M9 10 C9 8.3 10.3 7 12 7 L33 7 C34.7 7 36 8.3 36 10 L36 20 C36 21.7 34.7 23 33 23 L18 23 L13 27 L13.6 23 L12 23 C10.3 23 9 21.7 9 20 Z"
          fill={palette.cream100}
          stroke={tracos.contorno}
          strokeWidth={1.6}
          strokeLinejoin="round"
        />
        {/* Duas linhas: palavras, sem dizer quais. */}
        <Path d="M14 13 L31 13" stroke={palette.brown200} strokeWidth={2} strokeLinecap="round" />
        <Path d="M14 18 L25 18" stroke={palette.brown200} strokeWidth={2} strokeLinecap="round" />
      </G>

      <Ellipse cx={30} cy={44} rx={15} ry={9} fill={`url(#brasa-${id})`} />
      <Chao id={id} cy={53} rx={25} />

      {/* O monte de terra. */}
      <Path
        d="M8 48 C8 40 16 34 30 34 C44 34 52 40 52 48 Z"
        fill={`url(#terra-${id})`}
      />
      <Ellipse cx={30} cy={48} rx={22} ry={4.5} fill={`url(#terra-${id})`} />
      {/* A crista pega a luz; embaixo, a sombra da própria terra. */}
      <Path
        d="M13 44 Q30 35 47 44"
        stroke={TERRA_CLARA}
        strokeWidth={1.6}
        strokeLinecap="round"
        fill="none"
        opacity={0.65}
      />
      {[
        { x: 16, y: 46, r: 1.4 },
        { x: 26, y: 49, r: 1.1 },
        { x: 40, y: 45, r: 1.3 },
        { x: 45, y: 49, r: 1 },
      ].map((g) => (
        <Ellipse
          key={`${g.x}:${g.y}`}
          cx={g.x}
          cy={g.y}
          rx={g.r}
          ry={g.r * 0.8}
          fill={TERRA_FUNDA}
          opacity={0.5}
        />
      ))}

      {/*
        O broto que sai do adubo: o fim da história, em três traços.

        A haste começa **dentro** do monte, e não na crista dele: nascendo na
        superfície, o broto ficava pousado ali como um objeto largado. As folhas
        são pequenas e apontam para cima pelo mesmo motivo — no tamanho de
        antes elas liam como duas pedras verdes ao lado da terra.
      */}
      <G transform="translate(42 40)">
        <Path
          d="M0 0 L0 -12"
          stroke={tracos.haste}
          strokeWidth={2.4}
          strokeLinecap="round"
          fill="none"
        />
        <Path
          d="M0 0 C -6 -14 -18 -26 -32 -24 C -42 -22 -44 -6 -34 4 C -22 16 -8 12 0 0 Z"
          fill={tracos.folha}
          stroke={tracos.contornoFolha}
          strokeWidth={2.6}
          transform="translate(0 -12) rotate(-52) scale(0.24)"
        />
        <Path
          d="M0 0 C -6 -14 -18 -26 -32 -24 C -42 -22 -44 -6 -34 4 C -22 16 -8 12 0 0 Z"
          fill={tracos.folhaClara}
          stroke={tracos.contornoFolha}
          strokeWidth={2.6}
          transform="translate(0 -12) rotate(232) scale(0.2)"
        />
      </G>
    </Svg>
  );
}
