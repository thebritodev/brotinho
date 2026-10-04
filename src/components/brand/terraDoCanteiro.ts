/**
 * Os tons de terra dos desenhinhos do carrossel.
 *
 * Nasceram dentro do cartão da Frase do dia, onde eram a terra do canteiro.
 * Saíram de lá quando o Diário e a Composta ganharam desenho próprio: os três
 * cartões dividem a mesma fileira, e três terras ligeiramente diferentes
 * apareceriam como erro de impressão.
 *
 * Não vêm da paleta do tema de propósito, pela mesma razão que `tracos` não
 * vem: isto é desenho, e desenho não muda quando alguém acerta o verde de um
 * botão. E não segue o tema escuro — a terra é a mesma de dia e de noite.
 */
export const TERRA = '#8A7A63';
export const TERRA_FUNDA = '#5F5443';
export const TERRA_CLARA = '#A3927A';
export const TERRA_SOMBRA = '#4B4237';
/** O calor que escapa de baixo da terra: a dica de que tem algo ali. */
export const BRASA = '#E8B65A';

/*
  O texto que fica **em cima** da terra.

  Ele mora aqui, e não na paleta do tema, pelo mesmo motivo que a terra: a
  terra é a mesma de dia e de noite, então quem escreve sobre ela também tem
  de ser. `palette.cream200` parecia servir e não serve — no escuro ele deixa
  de ser creme e vira quase-fundo (#2C2823), o que daria texto escuro sobre
  marrom escuro exatamente à noite.

  Os dois são medidos contra `TERRA_FUNDA`, que é o tom sob o qual eles caem:
  8,6 e 5,3. Ver `FaixaDaComposta`.
*/
export const TEXTO_NA_TERRA = '#FBF6EC';
export const TEXTO_NA_TERRA_FRACO = '#E4DCC9';

/**
 * O botão que fica **dentro** da terra — o "Compostar esse pensamento".
 *
 * ## Por que ele não segue o tema
 *
 * Pela mesma regra de tudo o que está desenhado sobre esta terra: ela tem luz
 * própria e é a mesma de dia e de noite, então quem pousa nela também é. O
 * botão seguia `colors.primary` e `colors.textInverse`, e no escuro os dois
 * **invertem**: o verde clareia e a tinta vira quase preta. Sobre uma terra
 * que não mudou, isso é um botão verde-claro com letra preta no meio de um
 * bloco marrom escuro — o contrário do que ele é no claro.
 *
 * O verde é o do documento, o mesmo do "Postar nos stories". A tinta é branca,
 * e branca de verdade: `colors.textInverse` tem o nome certo e o valor errado
 * aqui, porque ele responde ao tema do app e não ao fundo em que está.
 *
 * `confere-contraste.js` mede o par.
 */
export const BOTAO_NA_TERRA = { fundo: '#5B8A72', tinta: '#FFFFFF' };
