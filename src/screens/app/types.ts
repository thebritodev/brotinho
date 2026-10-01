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
   * Configurações aberta direto em "Meus dados".
   *
   * O "Editar" do Perfil leva ao nome e ao nome do broto, que é o que a
   * pessoa quer editar ali. Parando na lista de Configurações, ele pediria um
   * segundo toque para chegar onde o próprio rótulo prometeu.
   */
  | 'dados'
  /**
   * O Diário virou tela empilhada.
   *
   * Ele era aba, na esquerda da barra, e o lugar dele agora é o primeiro
   * cartão do carrossel da tela inicial. Empilhado, ele ganha o botão de
   * voltar que toda tela de dentro tem — e a barra fica com três destinos que
   * são lugares, e não com dois lugares e uma ação.
   */
  | 'diario';
