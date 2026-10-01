/**
 * Os cinco fundos possíveis do card do story.
 *
 * ## Por que existe escolha
 *
 * Porque postar uma frase é postar algo sobre o próprio dia, e o fundo é parte
 * do que se diz. Um único verde escuro obrigava quem queria mandar uma frase
 * leve a mandá-la com cara de noite. São cinco porque cinco ainda cabem numa
 * linha de botões sem virar um seletor de cor — a tela cheia deu a largura que
 * a folha de baixo não dava.
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
 * `confere-contraste.js` mede tinta sobre fundo nos cinco, com o piso de
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
    /*
      O quinto, e o único que não estava aqui quando a tela de compartilhar
      virou tela cheia.

      O documento mostra quatro fundos — Terra, Sol, Calma e Noite —, e o app
      tinha quatro outros: Mata, Terra, Sol e Noite. Três coincidem; o que
      falta de cada lado é um só. Em vez de trocar o conjunto, entrou o que
      faltava: trocar tiraria o verde, que é o padrão e o que as pessoas já
      postaram, e isso mudaria a cara de posts antigos sem ninguém pedir.
    */
    chave: 'calma',
    rotulo: 'Calma',
    fundo: '#CFE0EA',
    tinta: '#3A3630',
    vinheta: '#2A4556',
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
