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
   *
   * Ela saiu do card quando ele virou o do documento, e continua aqui porque
   * `confere-contraste` ainda a mede e porque um fundo sem vinheta declarada é
   * um fundo que ninguém pensou até o fim.
   */
  vinheta: string;
  /**
   * O papel em que a frase é escrita — claro em todos, porque é papel.
   *
   * O documento usa quase branco nos fundos claros e um creme um pouco mais
   * quente no escuro: papel branco sobre azul-noite brilha demais e vira
   * holofote no meio da imagem.
   */
  papel: string;
  /** Os dois morros do pé do card: o da frente e o de trás. */
  morro: string;
  morroDeTras: string;
};

export const ESTILOS_DO_STORY: EstiloDoStory[] = [
  {
    chave: 'mata',
    rotulo: 'Mata',
    fundo: '#2E4A3B',
    tinta: '#FBF6EC',
    vinheta: '#000000',
    papel: '#F4EEE2',
    morro: '#233A2E',
    morroDeTras: '#3E6B54',
  },
  {
    chave: 'terra',
    rotulo: 'Terra',
    fundo: '#F1E9DA',
    tinta: '#3A3630',
    vinheta: '#5B5548',
    papel: '#FFFDF8',
    morro: '#5B5548',
    morroDeTras: '#8A8375',
  },
  {
    chave: 'sol',
    rotulo: 'Sol',
    fundo: '#F5E3B0',
    tinta: '#3A3630',
    vinheta: '#8A6318',
    papel: '#FFFDF8',
    morro: '#5B8A72',
    morroDeTras: '#88B39A',
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
    papel: '#FFFDF8',
    morro: '#4F7462',
    morroDeTras: '#7FA890',
  },
  {
    chave: 'noite',
    rotulo: 'Noite',
    fundo: '#2F3446',
    tinta: '#FBF6EC',
    vinheta: '#000000',
    papel: '#F4EEE2',
    morro: '#1F2330',
    morroDeTras: '#3A4058',
  },
];

/** O estilo padrão: o verde que o app sempre mandou. */
export const ESTILO_PADRAO = ESTILOS_DO_STORY[0];

export function estiloDoStory(chave: string | undefined): EstiloDoStory {
  return ESTILOS_DO_STORY.find((e) => e.chave === chave) ?? ESTILO_PADRAO;
}
