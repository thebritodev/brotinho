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
 * ser mudar quem está por cima e esmaecer — trabalho de compositor, não de
 * JavaScript.
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

/** Como uma aba montada é desenhada no instante da troca. */
export type CamadaDaAba = {
  /** Quem fica por cima de quem. */
  altura: number;
  /** A opacidade fixa, ou `null` quando ela é a da animação de entrada. */
  opacidade: number | null;
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
  /** A que está saindo, ainda desenhada por baixo. `null` fora da troca. */
  anterior: Chave | null;
  /**
   * A única aba com permissão de se mexer.
   *
   * **Durante a troca, é a que está saindo** — e é de propósito.
   *
   * Esta resposta chega às folhas animadas por contexto, e quem lê um contexto
   * é redesenhado quando ele muda. Passando a valer para a aba nova no começo
   * da troca, o redesenho cairia dentro dos 220 ms do esmaecer: medido, 140 ms
   * de linha travada bem no meio da animação, que é justamente o defeito que
   * as abas montadas vieram tirar. Virando só no fim, o esmaecer não tem
   * nenhum trabalho de JavaScript pela frente, e a aba que chega começa a se
   * mexer quando já está inteira na tela.
   */
  seMexendo: Chave;
};

/**
 * A aba que chega entra por cima, esmaecendo; a que sai fica inteira embaixo
 * até a de cima cobri-la.
 *
 * O contrário — a de baixo esmaecendo junto — deixa o fundo do app aparecer no
 * meio da troca, e o que era corte seco vira piscada.
 */
export function camadaDaAba<Chave extends string>(
  chave: Chave,
  { ativa, anterior, seMexendo }: CenaDasAbas<Chave>,
): CamadaDaAba {
  const aVista = chave === seMexendo;
  if (chave === ativa) return { altura: 2, opacidade: null, recebeToque: true, aVista };
  if (chave === anterior) return { altura: 1, opacidade: 1, recebeToque: false, aVista };
  return { altura: 0, opacidade: 0, recebeToque: false, aVista };
}
