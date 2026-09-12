/** Telas empilhadas sobre as abas (abertas a partir da Home ou do Perfil). */
export type SubScreen =
  | 'terapia'
  | 'config'
  | 'privacidade'
  | 'composta'
  | 'praticas'
  | 'valores'
  | 'lembretes'
  | 'jardim'
  | 'conselhos'
  /**
   * O Diário virou tela empilhada.
   *
   * Ele era aba, na esquerda da barra, e o lugar dele agora é o primeiro
   * cartão do carrossel da tela inicial. Empilhado, ele ganha o botão de
   * voltar que toda tela de dentro tem — e a barra fica com três destinos que
   * são lugares, e não com dois lugares e uma ação.
   */
  | 'diario';
