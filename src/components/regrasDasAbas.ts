/**
 * As decisões da `AbasVivas`, fora do componente — para poderem ser testadas.
 *
 * ## O que elas resolvem
 *
 * As três abas ocupavam o mesmo lugar na árvore: ir para outra **desmontava** a
 * que estava e montava a de destino do zero. Medido no navegador com a CPU
 * desacelerada quatro vezes, para parecer um celular médio: ir para a Início
 * travava a linha de JavaScript por **899 ms**, e a camada de transição não
 * chegava a desenhar um quadro intermediário sequer — a opacidade ia de 1 para
 * 0 e voltava para 1 de um salto, porque a rede de segurança da transição
 * disparava antes de a linha voltar a respirar. A travada e o corte seco eram
 * exatamente isso.
 *
 * Aqui a regra é uma só: **aba montada não desmonta**. Trocar de aba passa a
 * ser mudar quem está na frente e deslizar — trabalho de compositor, não de
 * JavaScript.
 *
 * ## E por que ninguém esmaece
 *
 * A primeira versão trocava as abas com uma dissolução: a que chega aparecendo
 * por cima da que sai. Tirou a travada e trouxe **o piscar** — e não era
 * defeito de Android nenhum, era o desenho da transição. A Início tem uma
 * faixa de terra escura no alto; o Brotinho e o Perfil são claros. No meio de
 * uma dissolução entre elas aparecem, por 220 ms, **duas telas inteiras uma
 * dentro da outra**: dois cabeçalhos, dois textos, a terra escura lavando por
 * cima do claro. Conferido no navegador, congelando a dissolução na metade.
 *
 * Então nenhuma camada fica translúcida. As duas que participam da troca são
 * **opacas** e andam: a que chega entra inteira pelo lado em que ela está na
 * barra de baixo, e a que sai recua um quarto de tela para o lado oposto, por
 * baixo. O movimento na tela é o mesmo movimento que o dedo fez na barra.
 *
 * O recuo mais curto não é enfeite: é ele que faz as duas se **cruzarem** em
 * vez de se encostarem. Andando as duas a mesma tela inteira, a que sai deixa
 * o lugar no exato ponto em que a que chega o ocupa — e "exato", com
 * arredondamento de pixel, é onde nasce um fio de fundo entre as duas, que
 * atravessa a tela e pisca igual. Cruzadas, não existe ponto sem cobertura:
 * ver a conferência de cobertura em `testa-abas-vivas`.
 */

/**
 * As abas montadas depois de a pessoa ir para `ativa`.
 *
 * Devolve a **mesma** lista quando nada muda. Isso não é economia de bytes: é
 * o que impede o efeito de aquecimento de se reagendar a cada render, e o que
 * deixa o React reaproveitar os elementos das abas em vez de refazê-los.
 */
export function proximasMontadas<Chave extends string>(
  montadas: readonly Chave[],
  ativa: Chave,
): readonly Chave[] {
  return montadas.includes(ativa) ? montadas : [...montadas, ativa];
}

/**
 * A próxima aba a montar em silêncio, ou `null` quando todas já estão de pé.
 *
 * Montar custa caro uma vez só. Pagar esse preço num momento parado — logo
 * depois de o app abrir, com a pessoa ainda lendo a Início — é diferente de
 * pagar no instante do toque, que é quando ele aparece como travada.
 */
export function proximaAAquecer<Chave extends string>(
  montadas: readonly Chave[],
  todas: readonly Chave[],
): Chave | null {
  return todas.find((chave) => !montadas.includes(chave)) ?? null;
}

/**
 * Quanto a aba que sai recua, em larguras de tela.
 *
 * Um quarto: o suficiente para acompanhar o movimento e para as duas se
 * cruzarem sempre, e pouco o bastante para a atenção ficar com a que chega.
 */
export const RECUO_DE_QUEM_SAI = 0.25;

/** Como uma aba montada é desenhada no instante da troca. */
export type CamadaDaAba = {
  /**
   * De onde para onde esta aba anda, em larguras de tela, ou `null` se ela
   * fica parada.
   *
   * `[1, 0]` é "entra inteira pela direita"; `[0, -0.25]` é "recua um quarto
   * de tela para a esquerda".
   */
  desliza: readonly [number, number] | null;
  /** Quem fica por cima de quem: a que chega cobre a que sai. */
  altura: number;
  /**
   * Cheia ou invisível — **nunca um valor no meio**.
   *
   * Camada translúcida é o piscar: duas telas aparecendo uma dentro da outra.
   * Ver o cabeçalho deste arquivo.
   */
  opacidade: 0 | 1;
  /** Recebe toque e é lida pelo leitor de tela. */
  recebeToque: boolean;
  /**
   * Pode se mexer.
   *
   * Quem está montado e fora de vista fica parado: o broto não balança, as
   * palavras não caem. Sem isto, manter as abas montadas trocaria uma travada
   * por três telas animando ao mesmo tempo para sempre.
   */
  aVista: boolean;
};

/** O instante da troca, do ponto de vista de quem desenha. */
export type CenaDasAbas<Chave extends string> = {
  /** A aba em que a pessoa está. */
  ativa: Chave;
  /** A que está saindo, ainda andando para fora. `null` fora da troca. */
  anterior: Chave | null;
  /**
   * A única aba com permissão de se mexer.
   *
   * **Durante a troca, é a que está saindo** — e é de propósito.
   *
   * Esta resposta chega às folhas animadas por contexto, e quem lê um contexto
   * é redesenhado quando ele muda. Passando a valer para a aba nova no começo
   * da troca, o redesenho cairia dentro dos 220 ms da animação: medido, 140 ms
   * de linha travada bem no meio dela, que é justamente o defeito que as abas
   * montadas vieram tirar. Virando só no fim, a animação não tem nenhum
   * trabalho de JavaScript pela frente, e a aba que chega começa a se mexer
   * quando já está inteira na tela.
   */
  seMexendo: Chave;
  /**
   * A ordem das abas **na barra de baixo**, da esquerda para a direita.
   *
   * É ela que decide de que lado a aba nova entra. Ir para a direita na barra
   * traz a tela da direita; voltar traz a da esquerda. O movimento na tela é o
   * mesmo movimento que o dedo fez na barra.
   */
  ordem: readonly Chave[];
};

/**
 * De que lado a aba que chega entra: `1` pela direita, `-1` pela esquerda.
 *
 * Fora da barra — uma aba que não está na ordem — vale a direita, que é o
 * sentido de "avançar" e nunca deixa a tela sem cobertura.
 */
export function sentidoDaTroca<Chave extends string>(
  ativa: Chave,
  anterior: Chave,
  ordem: readonly Chave[],
): 1 | -1 {
  const daAtiva = ordem.indexOf(ativa);
  const daAnterior = ordem.indexOf(anterior);
  if (daAtiva < 0 || daAnterior < 0) return 1;
  return daAtiva >= daAnterior ? 1 : -1;
}

/**
 * A que chega entra inteira por um lado, por cima; a que sai recua um quarto
 * de tela para o outro, por baixo. As duas opacas.
 *
 * Todo o resto fica invisível e parado. Em qualquer instante há no máximo duas
 * camadas visíveis, elas se cruzam, e juntas cobrem a tela inteira.
 */
export function camadaDaAba<Chave extends string>(
  chave: Chave,
  { ativa, anterior, seMexendo, ordem }: CenaDasAbas<Chave>,
): CamadaDaAba {
  const aVista = chave === seMexendo;
  const parada = { desliza: null, altura: 0, opacidade: 0, recebeToque: false, aVista } as const;

  if (anterior === null) {
    return chave === ativa
      ? { desliza: null, altura: 2, opacidade: 1, recebeToque: true, aVista }
      : parada;
  }

  const sentido = sentidoDaTroca(ativa, anterior, ordem);
  if (chave === ativa) {
    return { desliza: [sentido, 0], altura: 2, opacidade: 1, recebeToque: true, aVista };
  }
  if (chave === anterior) {
    return {
      desliza: [0, -sentido * RECUO_DE_QUEM_SAI],
      altura: 1,
      opacidade: 1,
      recebeToque: false,
      aVista,
    };
  }
  return parada;
}
