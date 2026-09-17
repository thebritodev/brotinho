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
