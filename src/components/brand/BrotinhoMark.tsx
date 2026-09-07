import React from 'react';
import Svg, { Circle, Ellipse, Path } from 'react-native-svg';

/**
 * BrotinhoMark — o símbolo do app: um trevo de três laços sobre um disco.
 *
 * As cores são fixas de propósito. Este mesmo desenho é o botão central da
 * barra de abas, e botão de marca não muda de cor junto com o tema — por isso
 * elas não saem de `theme/tokens`.
 */

/** O disco. Mesma matiz do verde que o app usa na notificação (`app.json`). */
export const MARK_DISCO = '#5B8A72';

/** O traço. O creme do papel do app, o mesmo `cream100` da paleta clara. */
export const MARK_TRACO = '#FBF6EC';

/**
 * O desenho vive num quadrado de 100×100, com o disco de raio 49.
 *
 * ## Por que tudo aqui é traço, e não forma preenchida
 *
 * O símbolo anterior era sólido: duas folhas cheias e um caule. Este é
 * monolinear — três laços vazados e um caule, todos com a **mesma espessura**.
 * É essa espessura constante que dá a ele o jeito de símbolo desenhado de uma
 * tacada só, e é ela que precisa ser preservada em qualquer ajuste: mudar a
 * grossura de um dos laços quebra o conjunto mais do que mudar o tamanho dele.
 *
 * ## As medidas
 *
 * O laço de cima é círculo; os dois de baixo são elipses giradas. Elipse, e não
 * curva desenhada à mão, porque o desenho é simétrico e uma elipse girada
 * acerta a silhueta com dois números em vez de oito pontos de controle — e dois
 * números são o que dá para ajustar depois sem redesenhar nada.
 *
 * O caule começa **dentro** do vazio do laço de cima (o topo em 32 cai abaixo
 * da borda interna, em 40,4) e desce até 93. Como tudo é da mesma cor, a ordem
 * de desenho não muda o resultado: onde dois traços se cruzam, o creme cobre o
 * creme.
 */
const TRACO = 8.8;

/** O laço de cima. */
const ANEL = { cx: 50, cy: 28.3, r: 16.5 };

/** Os dois de baixo: a mesma elipse, espelhada. */
const FOLHA = { cx: 30.5, cy: 63.5, rx: 18, ry: 10.8, giro: -38 };

/** O caule, de dentro do anel até a ponta de baixo. */
const CAULE = 'M 50 32 L 50 93';
const CAULE_TRACO = 5.1;

export function BrotinhoMark({ size = 32 }: { size?: number }) {
  const folha = (lado: 1 | -1) => (
    <Ellipse
      cx={lado === 1 ? FOLHA.cx : 100 - FOLHA.cx}
      cy={FOLHA.cy}
      rx={FOLHA.rx}
      ry={FOLHA.ry}
      transform={`rotate(${FOLHA.giro * lado} ${lado === 1 ? FOLHA.cx : 100 - FOLHA.cx} ${FOLHA.cy})`}
      fill="none"
      stroke={MARK_TRACO}
      strokeWidth={TRACO}
    />
  );

  return (
    <Svg viewBox="0 0 100 100" width={size} height={size}>
      <Circle cx={50} cy={50} r={49} fill={MARK_DISCO} />
      {folha(1)}
      {folha(-1)}
      <Circle
        cx={ANEL.cx}
        cy={ANEL.cy}
        r={ANEL.r}
        fill="none"
        stroke={MARK_TRACO}
        strokeWidth={TRACO}
      />
      <Path
        d={CAULE}
        fill="none"
        stroke={MARK_TRACO}
        strokeWidth={CAULE_TRACO}
        strokeLinecap="round"
      />
    </Svg>
  );
}
