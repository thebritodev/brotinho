/**
 * Os quatro fundos possíveis do card do story.
 *
 * ## Por que existe escolha
 *
 * Porque postar uma frase é postar algo sobre o próprio dia, e o fundo é parte
 * do que se diz. Um único verde escuro obrigava quem queria mandar uma frase
 * leve a mandá-la com cara de noite. São quatro porque quatro cabem numa linha
 * de botões sem virar um seletor de cor.
 *
 * ## Por que as cores não seguem o tema
 *
 * O mesmo motivo do card inteiro: **isto vira arquivo e sai do aparelho**. Uma
 * frase postada de noite não pode sair diferente da mesma frase postada de
 * dia, e quem recebe não tem tema nenhum. São valores fixos, e é de propósito
 * que não venham de `useTema`.
 *
 * ## O par de cada estilo é medido
 *
 * `confere-contraste.js` mede tinta sobre fundo nos quatro, com o piso de
 * texto grande (3:1 não basta aqui — a frase é lida em miniatura no feed, e a
 * miniatura é o pior caso). O verde continua sendo o padrão porque é o que o
 * app sempre mandou, e trocar o padrão trocaria o que as pessoas já postam
 * sem elas pedirem.
 */

export type EstiloDoStory = {
  chave: string;
  /** O nome que aparece embaixo do botão. */
  rotulo: string;
  fundo: string;
  /** A cor de tudo o que é desenhado por cima: texto, grão, folhas, fio. */
  tinta: string;
  /**
   * A vinheta fecha as bordas. Escura nos fundos escuros, e **clara** nos
   * claros: uma vinheta preta sobre creme sujaria o papel em vez de fechá-lo.
   */
  vinheta: string;
};

export const ESTILOS_DO_STORY: EstiloDoStory[] = [
  {
    chave: 'mata',
    rotulo: 'Mata',
    fundo: '#2E4A3B',
    tinta: '#FBF6EC',
    vinheta: '#000000',
  },
  {
    chave: 'terra',
    rotulo: 'Terra',
    fundo: '#F1E9DA',
    tinta: '#3A3630',
    vinheta: '#5B5548',
  },
  {
    chave: 'sol',
    rotulo: 'Sol',
    fundo: '#F5E3B0',
    tinta: '#3A3630',
    vinheta: '#8A6318',
  },
  {
    chave: 'noite',
    rotulo: 'Noite',
    fundo: '#2F3446',
    tinta: '#FBF6EC',
    vinheta: '#000000',
  },
];

/** O estilo padrão: o verde que o app sempre mandou. */
export const ESTILO_PADRAO = ESTILOS_DO_STORY[0];

export function estiloDoStory(chave: string | undefined): EstiloDoStory {
  return ESTILOS_DO_STORY.find((e) => e.chave === chave) ?? ESTILO_PADRAO;
}
