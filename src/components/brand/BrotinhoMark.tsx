import React from 'react';
import Svg, { Circle, Ellipse, G, Path } from 'react-native-svg';

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

/**
 * O quanto o símbolo encolhe dentro do disco.
 *
 * Desenhado em tamanho cheio, o símbolo mede 79 por 88 numa caixa de 100:
 * as pontas das folhas passam a dez pontos da borda e o caule termina a
 * quatro. Num disco de 64 pontos isso é quase encostar, e um símbolo que
 * encosta na borda do próprio botão fica apertado em vez de assentado.
 *
 * A 0,76 ele fica 60 por 67, com dezesseis pontos de folga em cima e embaixo
 * e vinte dos lados. A folga lateral é maior de propósito: o disco é redondo,
 * e nos lados a borda passa mais perto do que nas pontas de cima e de baixo,
 * que é onde o símbolo é mais estreito.
 *
 * A escala vale para o traço junto — é um `scale` de grupo, não um redesenho.
 * O símbolo inteiro encolhe mantendo a proporção entre a grossura da linha e o
 * tamanho dos laços, que é o que segura o jeito monolinear.
 */
const ESCALA = 0.76;

/**
 * O meio do símbolo não é o meio da caixa.
 *
 * A caixa dele vai de 7,4 a 95,5 em y, então o centro está em 51,5 — um ponto e
 * meio abaixo do centro do disco. Encolher em torno de (50, 50) deixaria a
 * folga de baixo menor que a de cima. Encolher em torno de (50, 51,5) e pousar
 * esse ponto no meio do disco reparte a folga igual.
 */
const CENTRO_DO_SIMBOLO = 52.4;
const ENCOLHER = `translate(50 50) scale(${ESCALA}) translate(-50 -${CENTRO_DO_SIMBOLO})`;

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
      <G transform={ENCOLHER}>
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
      </G>
    </Svg>
  );
}
