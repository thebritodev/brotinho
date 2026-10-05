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
 * Então nenhuma camada fica translúcida. Essa regra não mudou e não pode
 * mudar: é ela que mantém o piscar fora.
 *
 * ## O deslize virou a revelação em círculo
 *
 * Por um tempo as duas camadas **andavam**: a que chega entrava inteira pelo
 * lado em que ela está na barra, e a que sai recuava um quarto de tela para o
 * lado oposto, cruzando com ela. A ideia era boa — o movimento na tela era o
 * movimento que o dedo fez na barra — e o cruzamento existia por um motivo
 * fino: andando as duas a mesma distância, elas se **encostam** em vez de se
 * sobrepor, e "encostam", com arredondamento de pixel, é onde nasce um fio de
 * fundo atravessando a tela.
 *
 * O documento faz outra coisa: a tela nova **abre num círculo** que cresce a
 * partir de onde o dedo encostou. É a mesma informação — de onde isto veio —
 * dita por outro meio, e dita melhor, porque o círculo nasce exatamente no
 * ícone tocado em vez de apenas vir daquele lado.
 *
 * E ela resolve o fio de fundo de um jeito mais forte do que o cruzamento: as
 * duas camadas ficam **paradas**, uma em cima da outra, as duas opacas, e o
 * que varia é só o recorte da de cima. Não existe instante em que algum ponto
 * da tela não esteja coberto, porque nenhuma das duas sai do lugar — não é um
 * cruzamento bem calculado, é a ausência de movimento. Ver a conferência de
 * cobertura em `testa-abas-vivas`.
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
 * Zero, desde que a troca virou a revelação em círculo: a camada de baixo fica
 * parada e inteira, e é isso que garante que nenhum ponto da tela fique
 * descoberto em instante nenhum. A constante continua existindo porque o teste
 * de cobertura a lê, e porque um dia alguém vai querer saber por que ela é
 * zero — está escrito no alto deste arquivo.
 */
export const RECUO_DE_QUEM_SAI = 0;

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
  /**
   * Esta camada entra **recortada num círculo** que cresce do toque.
   *
   * Só a que chega. A de baixo fica inteira e parada, cobrindo tudo o que o
   * círculo ainda não revelou. Ver o alto deste arquivo.
   */
  revela: boolean;
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
  /* `ordem` não entra: ela decidia de que lado a aba entrava, e desde que
     a troca virou revelação em círculo ninguém anda. Ver `RECUO_DE_QUEM_SAI`. */
  { ativa, anterior, seMexendo }: CenaDasAbas<Chave>,
): CamadaDaAba {
  const aVista = chave === seMexendo;
  const parada = {
    desliza: null,
    revela: false,
    altura: 0,
    opacidade: 0,
    recebeToque: false,
    aVista,
  } as const;

  if (anterior === null) {
    return chave === ativa
      ? { desliza: null, revela: false, altura: 2, opacidade: 1, recebeToque: true, aVista }
      : parada;
  }

  if (chave === ativa) {
    return { desliza: null, revela: true, altura: 2, opacidade: 1, recebeToque: true, aVista };
  }
  if (chave === anterior) {
    return {
      /* Parada e inteira: é ela que cobre o que o círculo ainda não revelou. */
      desliza: RECUO_DE_QUEM_SAI === 0 ? null : [0, -RECUO_DE_QUEM_SAI],
      revela: false,
      altura: 1,
      opacidade: 1,
      recebeToque: false,
      aVista,
    };
  }
  return parada;
}
