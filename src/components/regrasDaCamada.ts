/**
 * As decisões da `CamadaEmpilhada` sobre **quando refazer a tela de dentro** —
 * fora do componente, para poderem ser testadas.
 *
 * ## O defeito que trouxe este arquivo
 *
 * A camada empilhada desenha a tela de dentro **uma vez** e guarda o elemento.
 * Isso existe por um motivo medido: `render` devolve um elemento novo a cada
 * chamada, e a camada renderiza a cada toque que mexe no `MainTabs` e a cada
 * passo do próprio estado. Sem o congelamento, o Voltar redesenhava a tela
 * inteira — 215 ms de linha travada em cima dos 220 ms do deslize de saída.
 *
 * Só que a primeira versão refazia o elemento **quando a chave mudava**, e a
 * chave é a identidade da *tela*, não a do *conteúdo*. Abrir a prática da
 * ansiedade e voltar deixava guardado `{ chave: 'praticas', no: <Práticas
 * alvo={ansiedade}/> }`. Abrir qualquer outra prática punha a chave em
 * `'praticas'` de novo — igual à guardada —, o elemento congelado era
 * reaproveitado, e a tela abria na ansiedade.
 *
 * O Pedro relatou assim: "todos os cards de todas as práticas da tela inicial
 * redirecionam para a MESMA prática". Conferido no navegador antes do
 * conserto: quatro cartões de temas diferentes abriram os quatro em "Acalmar a
 * ansiedade", que foi o primeiro que eu toquei.
 *
 * E não era só das práticas. Qualquer tela empilhada cujas propriedades mudem
 * entre duas aberturas tinha o mesmo defeito — o diário aberto com a pergunta
 * de uma prática, por exemplo, reabriria com a pergunta da prática anterior.
 *
 * ## A regra, agora
 *
 * O que refaz o elemento não é a chave: é **uma abertura nova**. Uma abertura
 * nova é a camada passar de fechada para aberta, ou trocar direto de uma tela
 * empilhada para outra. Fechar não conta — é justamente durante o fechamento
 * que o congelamento precisa valer, senão o deslize de saída volta a travar.
 */

/** O que a camada tem guardado, sem o elemento — que não é testável. */
export type Guardado<Chave> = { chave: Chave; abertura: number } | null;

/**
 * O número da abertura depois de olhar para o estado de agora.
 *
 * Sobe quando `aberta` vira uma tela **diferente** da de antes e não é nula:
 * abrir (`null` → `'praticas'`) e trocar (`'praticas'` → `'diario'`) contam,
 * fechar (`'praticas'` → `null`) não.
 *
 * É chamada no corpo do render, e por isso tem de ser idempotente quando nada
 * muda: duas chamadas seguidas com o mesmo `aberta` devolvem o mesmo número.
 */
export function contaAbertura<Chave>(
  anterior: Chave | null,
  aberta: Chave | null,
  abertura: number,
): number {
  return aberta !== null && aberta !== anterior ? abertura + 1 : abertura;
}

/**
 * A tela de dentro precisa ser desenhada de novo?
 *
 * Três casos dizem que sim: não há nada guardado, o que está guardado é de
 * outra tela, ou é da mesma tela mas de uma **abertura anterior** — este
 * último é o que estava faltando, e era o defeito.
 *
 * Com `mostrada` nula não há o que desenhar, e a resposta é não: isso mantém o
 * elemento congelado inteiro durante o deslize de saída.
 */
export function precisaRedesenhar<Chave>(
  guardado: Guardado<Chave>,
  mostrada: Chave | null,
  abertura: number,
): boolean {
  if (mostrada === null) return false;
  if (guardado === null) return true;
  return guardado.chave !== mostrada || guardado.abertura !== abertura;
}
