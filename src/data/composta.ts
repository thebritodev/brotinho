/**
 * As frases de exemplo da Composta.
 *
 * ## Por que existem, e por que são estas
 *
 * São pensamentos que quase todo mundo já teve numa versão ou outra, curtos o
 * bastante para caberem num balão e genéricos o bastante para não parecerem o
 * problema de uma pessoa específica. Servem em dois lugares:
 *
 * - **Dentro da Composta**, como sugestão para quem abriu e travou na hora de
 *   escrever.
 * - **No cartão da tela inicial**, como a frase que se desmancha para demonstrar
 *   o que a ferramenta faz — ver `CenaDaComposta`.
 *
 * ## A regra que elas existem para respeitar
 *
 * **O que a pessoa escreve nunca aparece na tela inicial.** A frase que ela
 * compostou é a mais dolorosa que ela digitou no app, e a tela inicial é o que
 * qualquer um lê por cima do ombro dela no ônibus. A demonstração precisa de uma
 * frase; essa frase é do app, não dela.
 *
 * Vale também para o desenho: o balão da cena mostra palavras, e as palavras que
 * ele mostra são estas.
 */
export const SUGESTOES_DA_COMPOSTA = [
  'vou ser demitido',
  'ninguém confia em mim',
  'vai dar tudo errado',
] as const;

/**
 * A frase que o cartão demonstra hoje.
 *
 * Muda de dia em dia, e não a cada abertura: um cartão que troca de frase toda
 * vez que a tela é montada vira ruído, e a pessoa nunca chega a reconhecer o
 * gesto. Dentro do dia ele é sempre o mesmo, como a Frase do dia.
 *
 * Sai da data, e não de sorteio, para não depender de nada guardado — isto é só
 * uma ilustração, não merece um campo no disco.
 */
export function fraseQueODiaDemonstra(agora: Date = new Date()): string {
  const dias = Math.floor(
    new Date(agora.getFullYear(), agora.getMonth(), agora.getDate()).getTime() / 86400000,
  );
  return SUGESTOES_DA_COMPOSTA[Math.abs(dias) % SUGESTOES_DA_COMPOSTA.length];
}
