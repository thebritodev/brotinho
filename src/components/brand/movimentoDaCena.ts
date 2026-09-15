/**
 * As contas que fazem uma cena de SVG se mexer ao toque.
 *
 * ## Por que texto, e não valor animado
 *
 * Porque `Animated` entrega valor novo para um nó de `react-native-svg`
 * chamando `setNativeProps`, que o `react-native-web` não implementa: lá a
 * animação roda e o desenho fica parado. Como a versão web é a única superfície
 * em que este app consegue ser conferido sem um aparelho na mão, animação que
 * só existe no nativo é animação que ninguém verificou.
 *
 * Então o passo é um número comum, a cena é função dele, e `transform` sai como
 * texto — igual em toda plataforma. Quem produz o número é `useToqueAnimado`.
 */

/**
 * Gira `graus` em torno de um ponto do desenho.
 *
 * Em SVG, giro sem centro explícito acontece em torno de (0, 0) — o canto de
 * cima à esquerda da caixa. Uma ampulheta girada assim sairia voando pela
 * diagonal em vez de pender no lugar.
 */
export const gira = (graus: number, cx: number, cy: number) => `rotate(${graus} ${cx} ${cy})`;

/**
 * Cresce ou encolhe `fator` vezes em torno de um ponto do desenho.
 *
 * SVG não tem origem de escala: `scale` sempre puxa para (0, 0). O jeito de
 * fixar outro ponto é o sanduíche — leva o ponto até a origem, escala, devolve.
 * É isso que deixa a areia encolher para dentro do próprio bico e o monte de
 * baixo crescer a partir do chão do vidro.
 */
export const cresce = (fator: number, cx: number, cy: number) =>
  `translate(${cx} ${cy}) scale(${fator}) translate(${-cx} ${-cy})`;

/**
 * Estica em cada eixo por seu fator, em torno de um ponto.
 *
 * Serve para o que cresce numa direção só — uma linha de caderno ganhando
 * comprimento sem engordar, por exemplo. `cresce` é o caso particular em que os
 * dois fatores são iguais.
 */
export const estica = (fx: number, fy: number, cx: number, cy: number) =>
  `translate(${cx} ${cy}) scale(${fx} ${fy}) translate(${-cx} ${-cy})`;

/** Desloca, em unidades do desenho. */
export const desloca = (dx: number, dy: number) => `translate(${dx} ${dy})`;

/**
 * Mapeia o passo numa curva de cinco tempos.
 *
 * Cinco e não dois porque quase todo movimento daqui vai e volta — a ampulheta
 * pende para um lado, passa do ponto para o outro e assenta. Com só começo e
 * fim, tudo viraria deslizamento em linha reta.
 */
export function curva(p: number, valores: [number, number, number, number, number]) {
  const t = Math.min(Math.max(p, 0), 1) * 4;
  const i = Math.min(Math.floor(t), 3);
  return valores[i] + (valores[i + 1] - valores[i]) * (t - i);
}
