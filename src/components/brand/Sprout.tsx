import React from 'react';
import Svg, { Circle, Ellipse, G, Path, Rect } from 'react-native-svg';

import { tracos, type Mood, useTema } from '../../theme';
import {
  BULB_R,
  CX,
  type Decoration,
  ehEnfeite,
  LEAVES_BY_STAGE,
  POT_TOP_Y,
  type SproutStage,
  STEM_TOP_Y,
  TRACO_DA_FOLHA,
  caixaDaPlanta,
  caixaDoMascote,
  comoViewBox,
  medidasDoMascote,
} from './geometriaDoBroto';

export { ehEnfeite };
export type { Decoration, SproutStage };

type FaceSpec = {
  eye: string | 'circle';
  r?: number;
  mouth: string;
};

const FACES: Record<Mood, FaceSpec> = {
  feliz: { eye: 'M -8 -2 Q -8 -8 -3 -8', mouth: 'M -10 6 Q 0 16 10 6' },
  leve: { eye: 'circle', r: 2.6, mouth: 'M -8 6 Q 0 11 8 6' },
  ansioso: { eye: 'circle', r: 3.2, mouth: 'M -6 8 Q -3 5 0 8 Q 3 11 6 8' },
  triste: { eye: 'circle', r: 2.6, mouth: 'M -9 9 Q 0 2 9 9' },
  cansado: { eye: 'M -9 -1 L -2 -1', mouth: 'M -7 7 L 7 7' },
  neutro: { eye: 'circle', r: 2.4, mouth: 'M -7 7 L 7 7' },
};

function Face({ mood, cx, cy }: { mood: Mood; cx: number; cy: number }) {
  const { palette } = useTema();
  const f = FACES[mood] ?? FACES.neutro;

  // "feliz" usa olhos arqueados próprios, desenhados de forma simétrica.
  if (mood === 'feliz') {
    const eye = (x: number) => (
      <Path
        d="M -6 0 Q 0 -7 6 0"
        transform={`translate(${cx + x} ${cy})`}
        stroke={tracos.contorno}
        strokeWidth={2.8}
        strokeLinecap="round"
        fill="none"
      />
    );
    return (
      <G>
        {eye(-9)}
        {eye(9)}
        <Path
          d={f.mouth}
          transform={`translate(${cx} ${cy})`}
          stroke={tracos.contorno}
          strokeWidth={2.5}
          strokeLinecap="round"
          fill="none"
        />
      </G>
    );
  }

  const eye = (x: number) =>
    f.eye === 'circle' ? (
      <Circle cx={cx + x} cy={cy} r={f.r} fill={tracos.contorno} />
    ) : (
      <Path
        d={f.eye}
        transform={`translate(${cx + x} ${cy})${x < 0 ? '' : ' scale(-1,1)'}`}
        stroke={tracos.contorno}
        strokeWidth={2.5}
        strokeLinecap="round"
        fill="none"
      />
    );

  return (
    <G>
      {eye(-9)}
      {eye(9)}
      <Path
        d={f.mouth}
        transform={`translate(${cx} ${cy})`}
        stroke={tracos.contorno}
        strokeWidth={2.5}
        strokeLinecap="round"
        fill="none"
      />
    </G>
  );
}

function Leaf({
  x,
  y,
  rotate,
  scale = 1,
  color,
}: {
  x: number;
  y: number;
  rotate: number;
  scale?: number;
  color?: string;
}) {
  const { palette } = useTema();
  // O padrão saiu da assinatura: valor de parâmetro é avaliado antes do corpo,
  // e ali o gancho ainda não rodou.
  const preenchimento = color ?? tracos.folha;
  return (
    <G transform={`translate(${x} ${y}) rotate(${rotate}) scale(${scale})`}>
      <Path
        d="M0 0 C -6 -14 -18 -26 -32 -24 C -42 -22 -44 -6 -34 4 C -22 16 -8 12 0 0 Z"
        fill={preenchimento}
        stroke={tracos.contornoFolha}
        strokeWidth={TRACO_DA_FOLHA}
        strokeLinejoin="round"
      />
      <Path
        d="M -2 -2 C -10 -8 -18 -14 -26 -18"
        stroke={tracos.contornoFolha}
        strokeWidth={1.6}
        strokeLinecap="round"
        fill="none"
        opacity={0.5}
      />
    </G>
  );
}

function Decorations({ list, cx, cy }: { list: Decoration[]; cx: number; cy: number }) {
  const { palette } = useTema();
  return (
    <G>
      {list.includes('criatividade') && (
        <Path
          d={`M ${cx - 34} ${cy - 46} l 3 7 l 7 1 l -5 5 l 1 7 l -6 -3 l -6 3 l 1 -7 l -5 -5 l 7 -1 z`}
          fill={tracos.vaso}
        />
      )}
      {list.includes('curiosidade') && (
        <G fill={palette.amber400}>
          <Path d={`M ${cx + 40} ${cy - 30} l 2 5 l 5 2 l -5 2 l -2 5 l -2 -5 l -5 -2 l 5 -2 z`} />
          <Circle cx={cx + 30} cy={cy - 44} r={2.4} />
        </G>
      )}
      {list.includes('autocuidado') && (
        <G fill={palette.yellow300} opacity={0.9}>
          <Circle cx={cx - 46} cy={cy + 6} r={4} />
          <Circle cx={cx + 44} cy={cy + 16} r={3} />
        </G>
      )}
      {list.includes('conexao') && (
        <G transform={`translate(${cx + 46} ${cy + 30}) scale(0.42)`}>
          <Ellipse
            cx={0}
            cy={10}
            rx={30}
            ry={34}
            fill={tracos.folhaClara}
            stroke={tracos.contornoFolha}
            strokeWidth={4}
          />
          <Leaf x={-4} y={-22} rotate={-25} scale={0.9} color={tracos.folhaClara} />
        </G>
      )}
    </G>
  );
}

type Props = {
  mood?: Mood;
  stage?: SproutStage;
  decorations?: Decoration[];
  size?: number;
  showPot?: boolean;
};

/**
 * Sprout — o mascote Brotinho.
 * `mood` define rosto + cor de fundo; `stage` define o tamanho do crescimento.
 */
export function Sprout({
  mood = 'neutro',
  stage = 2,
  decorations = [],
  size = 160,
  showPot = true,
}: Props) {
  const { palette } = useTema();
  const stemTopY = STEM_TOP_Y[stage];
  const bulbR = BULB_R[stage];
  const midY = (POT_TOP_Y + stemTopY) / 2;

  /*
    Sem vaso, a viewBox se fecha em volta da planta.

    A caixa `0 0 200 224` inclui o vaso, que vai de 164 a 220. Escondendo o
    vaso, um terço da caixa fica vazio — e o desenho, que continua sendo
    encaixado nela, aparece com metade do tamanho, flutuando com um buraco
    embaixo. Era isso, e não o valor de `size`, que fazia o broto dos cartões
    parecer pequeno: aumentar o número aumentava a caixa junto com o vazio.

    O primeiro recorte eu escrevi à mão, e ele cortava as folhas: elas caem bem
    abaixo da boca do vaso, e eu tinha fechado a caixa doze unidades depois
    dela. Agora a caixa é calculada das mesmas tabelas que desenham — ver
    `geometriaDoBroto`.
  */
  /*
    Três enquadramentos, e o que decide é o que está desenhado atrás.

    Com halo, a caixa é a de sempre — ela foi feita em volta do disco, e
    reserva uns 53 de altura acima da planta que é exatamente o que o disco
    ocupa. Sem halo, aquele espaço reservado vira um vazio no topo da tela, e o
    broto parece pequeno e caído no meio dela.

    Por isso o tema escuro, que não tem halo desde a correção do fundo, passa a
    usar a caixa fechada em volta de planta e vaso. Mesmo espaço na tela, cerca
    de um terço a mais de desenho.
  */
  const temEnfeite = decorations.length > 0;
  const caixa = showPot
    ? caixaDoMascote(stage, temEnfeite)
    : caixaDaPlanta(stage, temEnfeite);

  /*
    Duas regras de quadro, porque são dois trabalhos diferentes.

    **O mascote** — com vaso — mantém a escala fixa de `size / 200`: o mesmo
    desenho, do mesmo tamanho, em qualquer tema. Sem halo o quadro encolhe e
    abraça o desenho, e é isso que sobe o broto sem aumentá-lo. Ver
    `medidasDoMascote`.

    **O broto dos cartões** — sem vaso — faz o contrário: preenche o espaço que
    lhe deram. Ali `size` é o tamanho pedido pelo cartão, não a escala do
    desenho, e encolher o quadro seria devolver o defeito do broto pequeno.
  */
  const { largura, altura } = showPot
    ? medidasDoMascote(caixa, size)
    : { altura: size * 1.12, largura: size * 1.12 * (caixa.largura / caixa.altura) };

  return (
    <Svg viewBox={comoViewBox(caixa)} width={largura} height={altura}>
      {/*
        Não há fundo de humor atrás do broto, e isso é decisão, não falta.

        Havia um disco da cor do humor aqui. Ele passou por seis versões — tom
        escurecido, tom médio saturado, tom escuro próprio, gradiente
        dissolvido, luz de trás, e enfim ausência no tema escuro — e nenhuma
        parou de pé. O que resolveu foi olhar o conjunto das reclamações em vez
        de cada uma: todas eram sobre a cor do fundo, e nenhuma sobre a falta
        dela.

        Numa tela onde o humor já é dito pela carinha do próprio broto, pela
        carinha marcada e pela palavra escolhida, o fundo era o quarto a dizer a
        mesma coisa — o único que dava trabalho, e o único que ninguém pediu.

        `moodColorsFundo` continua existindo, para o disco pequeno do jardim e
        da colheita: ali ele é uma pastilha sobre cartão, do tamanho de um
        ícone, e nunca foi o problema.
      */}

      {showPot && (
        <G>
          <Path
            d="M 62 170 C 62 166 66 164 70 164 L 130 164 C 134 164 138 166 138 170 L 128 210 C 127 216 121 220 113 220 L 87 220 C 79 220 73 216 72 210 Z"
            fill={tracos.vaso}
            stroke={tracos.contorno}
            strokeWidth={3.5}
            strokeLinejoin="round"
          />
          <Path
            d="M 74 178 L 126 178"
            stroke={tracos.contorno}
            strokeWidth={1.6}
            opacity={0.35}
            strokeLinecap="round"
          />
          <Path
            d="M 78 192 L 122 192"
            stroke={tracos.contorno}
            strokeWidth={1.6}
            opacity={0.25}
            strokeLinecap="round"
          />
          <Rect
            x={58}
            y={156}
            width={84}
            height={15}
            rx={7.5}
            fill={tracos.vaso}
            stroke={tracos.contorno}
            strokeWidth={3.5}
          />
          <Ellipse cx={100} cy={163.5} rx={34} ry={4.5} fill={tracos.contorno} opacity={0.15} />
        </G>
      )}

      <Path
        d={`M ${CX} ${POT_TOP_Y} C ${CX - 6} ${midY} ${CX + 6} ${midY - 10} ${CX} ${stemTopY}`}
        stroke={tracos.contornoFolha}
        strokeWidth={6}
        strokeLinecap="round"
        fill="none"
      />

      {LEAVES_BY_STAGE[stage].map((l, i) => (
        <Leaf key={i} {...l} />
      ))}

      <Circle
        cx={CX}
        cy={stemTopY - 4}
        r={bulbR}
        fill={tracos.folhaClara}
        stroke={tracos.contornoFolha}
        strokeWidth={3.5}
      />

      <Face mood={mood} cx={CX} cy={stemTopY - 4} />
      <Decorations list={decorations} cx={CX} cy={stemTopY - 4} />
    </Svg>
  );
}
