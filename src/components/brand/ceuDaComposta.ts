/**
 * O céu da faixa da Composta — e ele é o mesmo de dia e de noite.
 *
 * ## Por que sair do tema
 *
 * O céu vinha de `useTema`: verde de estufa em cima, fundo no meio, tom
 * afundado embaixo. No claro isso dá uma manhã; no escuro, as mesmas três
 * paradas viram um verde quase preto, e o alto da tela inicial ficava um
 * bloco escuro com palavras caindo dentro. A paisagem sumia: as nuvens não
 * tinham onde aparecer, os morros encostavam no preto, e o broto — que é
 * desenho de traço fixo, e por isso continua claro — boiava num vazio.
 *
 * A terra desta mesma faixa já era assim: `terraDoCanteiro` não segue o tema,
 * porque terra é a mesma de dia e de noite. O céu passou a seguir a mesma
 * regra, pelo mesmo motivo. O escuro continua inteiro do botão para baixo,
 * que é onde ele é fundo de leitura; aqui em cima é paisagem, e paisagem tem
 * luz própria.
 *
 * ## O que isso obriga
 *
 * Tudo o que fica **em cima** do céu também sai do tema, senão à noite vira
 * claro sobre claro: as palavras que caem, a saudação e as pastilhas do
 * cabeçalho. É a mesma consequência que `TEXTO_NA_TERRA` já resolvia do outro
 * lado da crista. Os pares são medidos em `confere-contraste.js`.
 *
 * E a barra de status: no escuro ela é de ícones brancos, que sobre este céu
 * não apareceriam. Quem pede ícones escuros enquanto a tela inicial está à
 * vista é a `BarraSobreOCeu`, na `HomeScreen`.
 */

/** O verde de estufa do alto. Era `colors.primarySoft` do tema claro. */
export const CEU_ALTO = '#E3EDE6';
/** O creme do meio, onde o céu abre. Era `colors.bg` do tema claro. */
export const CEU_MEIO = '#FBF6EC';
/** O tom afundado junto à crista. Era `colors.surfaceSunken` do tema claro. */
export const CEU_BAIXO = '#F5EFDE';

/** As nuvens paradas do fundo. Era `colors.surface` do tema claro. */
export const NUVEM = '#FFFFFF';

/** Os morros ao longe. Era `palette.green300` do tema claro. */
export const MORRO = '#9EBBAA';

/**
 * O reforço da nuvem.
 *
 * Branco sobre creme, com a opacidade que servia no escuro, deixava o céu
 * liso de novo. Era um caso especial do tema claro; com o céu fixo, virou a
 * única conta que existe.
 */
export const PESO_DA_NUVEM = 1.7;

/*
  O texto que cai **pelo** céu, e o que está pousado nele.

  Mesma história do `TEXTO_NA_TERRA`: a superfície não muda com o tema, então
  quem escreve sobre ela também não pode mudar. `colors.textPrimary` resolvia
  os dois casos quando o céu escurecia junto; com o céu fixo, ele passaria a
  ser creme sobre creme à noite.

  Medidos contra `CEU_MEIO`, o creme do meio do degradê: 11,14 e 4,91. As
  pontas do degradê são mais escuras, e portanto mais fáceis — ver
  `confere-contraste.js`, que mede as três.
*/
export const TEXTO_NO_CEU = '#3A3630';
export const TEXTO_NO_CEU_FRACO = '#716B60';

/**
 * O fundo das pastilhas do cabeçalho, que ficam sobre o céu.
 *
 * É o vidro do tema claro. No escuro o vidro é branco a 6% — sobre este céu,
 * uma pastilha que não existe.
 */
export const VIDRO_NO_CEU = 'rgba(255,255,255,0.75)';
