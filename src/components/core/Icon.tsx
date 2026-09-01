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
  footprints:
    'M8 4a2 2 0 012 2c0 2-2 2-2 4s2 2 2 3-1 2-2 2-2-1-2-3V6a2 2 0 012-2zM16 10a2 2 0 012 2c0 2-2 2-2 4s2 1 2 3-1 2-2 2-2-1-2-3v-6a2 2 0 012-2z',
  sparkle: 'M12 2l1.6 5.4L19 9l-5.4 1.6L12 16l-1.6-5.4L5 9l5.4-1.6L12 2z',
  flower:
    'M12 8a2.5 2.5 0 100 5 2.5 2.5 0 000-5zM12 3c1.5 0 2.5 1.5 2 3-1.5-1-2.5-1-2-3zM12 3c-1.5 0-2.5 1.5-2 3 1.5-1 2.5-1 2-3zM6 12c0-1.5 1.5-2.5 3-2-1 1.5-1 2.5-3 2zM18 12c0-1.5-1.5-2.5-3-2 1 1.5 1 2.5 3 2zM12 21c1.5 0 2.5-1.5 2-3-1.5 1-2.5 1-2 3zM12 21c-1.5 0-2.5-1.5-2-3 1.5 1 2.5 1 2 3z',
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
