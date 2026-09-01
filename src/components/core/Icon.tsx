import React from 'react';
import Svg, { Path } from 'react-native-svg';

import { useTema } from '../../theme';

/** Traços do mesmo peso do mascote — todos desenhados em uma viewBox 24x24. */
const PATHS = {
  back: 'M15 18l-6-6 6-6',
  settings:
    'M12 15a3 3 0 100-6 3 3 0 000 6zM19.4 13a1.7 1.7 0 00.34 1.87l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.7 1.7 0 00-1.87-.34 1.7 1.7 0 00-1 1.55V19a2 2 0 11-4 0v-.09a1.7 1.7 0 00-1-1.55 1.7 1.7 0 00-1.87.34l-.06.06a2 2 0 11-2.83-2.83l.06-.06A1.7 1.7 0 004.6 13a1.7 1.7 0 00-1.55-1H3a2 2 0 110-4h.09A1.7 1.7 0 004.6 7a1.7 1.7 0 00-.34-1.87l-.06-.06a2 2 0 112.83-2.83l.06.06A1.7 1.7 0 008.96 2.6a1.7 1.7 0 001-1.55V1a2 2 0 114 0v.09a1.7 1.7 0 001 1.55 1.7 1.7 0 001.87-.34l.06-.06a2 2 0 112.83 2.83l-.06.06A1.7 1.7 0 0019.4 7a1.7 1.7 0 001.55 1H21a2 2 0 110 4h-.09a1.7 1.7 0 00-1.55 1z',
  bell: 'M9 17a3 3 0 006 0M5 8a7 7 0 0114 0c0 4 1.5 5.5 1.5 5.5H3.5S5 12 5 8z',
  pencil: 'M4 20l4-1 11-11-3-3L5 16l-1 4zM14 6l3 3',
  /*
    Três pontos, e cada um é um traço de comprimento zero.

    O conjunto inteiro é desenhado como `stroke` com ponta redonda, e um `M x y
    l 0 0` vira um ponto perfeitamente redondo do tamanho da espessura. Assim
    ele acompanha `strokeWidth` e `color` como os outros, em vez de precisar de
    três `<Circle>` com regra própria.
  */
  more: 'M6 12l0 0M12 12l0 0M18 12l0 0',
  heart: 'M12 20s-7-4.6-9.5-9C1 8 2 4 6 4c2.2 0 3.7 1.4 6 3.8C14.3 5.4 15.8 4 18 4c4 0 5 4 3.5 7-2.5 4.4-9.5 9-9.5 9z',
  moon: 'M20 14.5A8.5 8.5 0 119.5 4a7 7 0 0010.5 10.5z',
  droplet: 'M12 3s6 6.5 6 10.5a6 6 0 11-12 0C6 9.5 12 3 12 3z',
  /*
    Os quatro desenhos dos temas de prática, e por que existem.

    Antes deles, "Raiva" era `footprints` — que a 26 pontos vira dois rabiscos
    que ninguém identifica —, e três temas usavam o ícone de outro destino do
    app: "Luto" o `book` da aba Diário, "Estresse" o `droplet` da Composta,
    "Foco" o `leaf` das Práticas. Numa lista de treze linhas iguais, o ícone é
    metade do que diferencia uma da outra; repetir o de outro lugar não é só
    inexpressivo, ensina a coisa errada.

    `footprints` saiu junto: era o único uso dele no app.
  */
  /*
    Raiva: chama.

    O que separa fogo de gota não é a língua interna — desenhada pequena, ela
    some aos 26 pontos e sobra um pingo com um cachinho dentro, que foi a
    primeira tentativa. O que separa é a **ponta**: torta, deslocada do eixo, e
    com um degrau de um lado. Gota é simétrica e lisa; chama não é. Comparada
    lado a lado com `droplet` a 26 pontos antes de entrar.
  */
  chama:
    'M13.5 2c-.5 3 .8 4.4 2 5.9 1.3 1.6 2.5 3 2.5 5.3a6 6 0 01-12 0c0-2 .7-3.3 1.8-4.4.1 1.5.9 2.4 2 2.7C8.5 8 10.5 4.6 13.5 2z',
  /*
    Luto: ampulheta.

    O galho sem folha era a escolha bonita — planta, e o que fica quando o que
    era seu não é mais —, mas aos 26 pontos vira uma runa: hastes de cinco
    pontos que ninguém identifica. A nuvem de chuva se lê de longe e diz
    "tristeza", que é o tema logo acima na lista. O coração aberto se lê e é o
    ícone da Autoestima com um corte, que é a colisão que estamos desfazendo.

    A ampulheta se lê aos 26 pontos, não é de mais ninguém, e é a que o próprio
    texto do tema pede: "luto não é só morte, e não tem prazo".
  */
  ampulheta: 'M7 3h10M7 21h10M8 3c0 4 4 5.5 4 9s-4 5-4 9M16 3c0 4-4 5.5-4 9s4 5 4 9',
  /** Estresse: manômetro. O ponteiro no alto é a pressão que o corpo acumula. */
  pressao: 'M4 17.5a8 8 0 0116 0M12 17.5l4.2-5',
  /** Foco: alvo. O ponto do meio é traço de comprimento zero, como em `more`. */
  alvo: 'M12 21a9 9 0 110-18 9 9 0 010 18zM12 16.5a4.5 4.5 0 110-9 4.5 4.5 0 010 9zM12 12l0 0',
  sparkle: 'M12 2l1.6 5.4L19 9l-5.4 1.6L12 16l-1.6-5.4L5 9l5.4-1.6L12 2z',
  /*
    Flor: cinco pétalas redondas em volta de um miolo.

    A anterior era um miolo com sete blocos ao redor, e aos 22 pontos não se
    lia como flor nenhuma — virava um aglomerado. Ela passou a importar quando
    a coragem ganhou uma flor desenhada no broto e este ícone virou a legenda
    dela, logo abaixo do desenho: um não parecia o outro.

    Anel de 6, pétala de 3,3, miolo de 2,1. As medidas vêm de comparar cinco
    versões aos 30 pontos: com anel menor as pétalas se encostam e o contorno
    interno vira ruído; com pétala em gota a flor lê como estrela, que é o
    ícone da criatividade.
  */
  flower:
    'M8.7 6a3.3 3.3 0 1 0 6.6 0a3.3 3.3 0 1 0-6.6 0M14.41 10.15a3.3 3.3 0 1 0 6.6 0a3.3 3.3 0 1 0-6.6 0M12.23 16.85a3.3 3.3 0 1 0 6.6 0a3.3 3.3 0 1 0-6.6 0M5.17 16.85a3.3 3.3 0 1 0 6.6 0a3.3 3.3 0 1 0-6.6 0M2.99 10.15a3.3 3.3 0 1 0 6.6 0a3.3 3.3 0 1 0-6.6 0M9.9 12a2.1 2.1 0 1 0 4.2 0a2.1 2.1 0 1 0-4.2 0',
  star: 'M12 2l2.6 6.6L21 9.2l-5 4.5 1.5 6.8L12 17l-5.5 3.5L8 13.7l-5-4.5 6.4-.6L12 2z',
  check: 'M4 12l5 5L20 6',
  plus: 'M12 5v14M5 12h14',
  home: 'M4 11l8-7 8 7v9a1 1 0 01-1 1h-4v-6H9v6H5a1 1 0 01-1-1z',
  book: 'M4 5a2 2 0 012-2h5v18H6a2 2 0 01-2-2zM20 5a2 2 0 00-2-2h-5v18h5a2 2 0 002-2z',
  leaf: 'M20 4S8 3 5 12c-2 6 2 9 6 8 8-2 9-16 9-16z',
  user: 'M12 12a4.5 4.5 0 100-9 4.5 4.5 0 000 9zM4 21c1.5-5 5-7 8-7s6.5 2 8 7',
  lock: 'M6 11V8a6 6 0 1112 0v3M5 11h14v9a1 1 0 01-1 1H6a1 1 0 01-1-1z',
  chevronRight: 'M9 6l6 6-6 6',
  trash: 'M4 7h16M9 7V5a1 1 0 011-1h4a1 1 0 011 1v2M6 7l1 13a1 1 0 001 1h8a1 1 0 001-1l1-13M10 11v6M14 11v6',
  // Cápsula + arco + haste, num traço só — o contorno da Composta.
  mic: 'M12 3a3 3 0 013 3v5a3 3 0 01-6 0V6a3 3 0 013-3zM6 11a6 6 0 0012 0M12 17v4M9 21h6',
  search: 'M11 4a7 7 0 100 14 7 7 0 000-14zM20.5 20.5L16 16',
  close: 'M6 6l12 12M18 6L6 18',
} as const;

export type IconName = keyof typeof PATHS;
export const ICON_NAMES = Object.keys(PATHS) as IconName[];

/**
 * Ícones cujo desenho não cabe na caixa padrão de 24x24.
 *
 * A engrenagem foi traçada até fora dela: a geometria vai de y=-1 a y=21 e de
 * x=1 a x=23. Como o traço de 2 é centrado na linha, o que se desenha de fato
 * ocupa x 0..24 e y -2..22 — ou seja, o topo era cortado inteiro e as laterais
 * perdiam metade do contorno. Aqui ela ganha folga em vez de ser redesenhada.
 */
const VIEW_BOX: Partial<Record<IconName, string>> = {
  settings: '-2 -4 28 28',
};

type Props = {
  name: IconName;
  size?: number;
  color?: string;
  strokeWidth?: number;
};

/** Icon — conjunto de ícones em contorno, no mesmo peso de traço do mascote. */
export function Icon({ name, size = 22, color, strokeWidth = 2 }: Props) {
  // O padrão era '#3A3630' escrito à mão — o `brown900` do tema claro. Vindo do
  // tema, ele acompanha: no escuro o ícone sem cor explícita clareia junto.
  const { colors } = useTema();
  const traco = color ?? colors.textPrimary;
  const d = PATHS[name];
  if (!d) return null;
  return (
    <Svg width={size} height={size} viewBox={VIEW_BOX[name] ?? '0 0 24 24'} fill="none">
      <Path
        d={d}
        stroke={traco}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
