import { RECUO_DE_QUEM_SAI } from './regrasDasAbas';

/**
 * Os números da troca de tela, num lugar só.
 *
 * ## Por que existe
 *
 * Porque o app tinha quatro gramáticas ao mesmo tempo, e dava para ver isso
 * andando por ele: a aba deslizava uma tela inteira, a tela empilhada deslizava
 * 26 pontos, a troca dentro de uma tela subia 20 pontos, e os passos da
 * Composta e das práticas **não se mexiam** — cada passo era uma transição
 * própria, montada do zero, então nunca havia uma tela saindo para animar.
 *
 * Quatro movimentos diferentes para a mesma coisa — trocar o que está na tela —
 * é o que se lê como "umas deslizam e outras só mudam".
 *
 * ## A regra
 *
 * Toda troca de tela do app é **horizontal**: entra pelo lado, sai pelo lado.
 * Nada sobe, nada esmaece, nada aparece parado.
 *
 * O que varia é só a distância, e ela varia por um motivo: aba é **vizinha**, e
 * anda a tela inteira, o mesmo tanto que o dedo andou na barra de baixo; tela é
 * **camada**, e anda um quinto, que é o quanto basta para o olho ver de que
 * lado ela chegou sem que a tela inteira desmanche a cada toque.
 */

/** Quanto dura qualquer troca de tela. */
export const DURACAO_DA_TROCA = 260;

/**
 * O quanto uma camada anda ao entrar, em fração da largura da tela.
 *
 * Era 26 pontos fixos. Fixo, o mesmo deslize é um gesto num aparelho pequeno e
 * um tremor num grande — e num tablet vira "só mudou". Em fração, a distância
 * acompanha o tamanho da tela e o movimento é o mesmo em toda mão.
 */
export const FRACAO_DO_DESLIZE = 0.2;

/**
 * E o quanto a que sai recua, em fração do caminho da que entra.
 *
 * Vem das abas, e pelo mesmo motivo: é o recuo mais curto que faz as duas se
 * **cruzarem** em vez de se encostarem. Encostadas, o arredondamento de pixel
 * abre um fio de fundo entre elas, e o fio atravessa a tela e pisca.
 */
export { RECUO_DE_QUEM_SAI };

/**
 * Para que lado a troca anda, dada a ordem das telas.
 *
 * Avançar na lista entra pela direita; voltar entra pela esquerda. Quem não
 * tem ordem — uma tela que não faz parte de uma sequência — avança.
 */
export function ladoDaTroca<Chave extends string | number>(
  de: Chave,
  para: Chave,
  ordem?: readonly Chave[],
): 'forward' | 'back' {
  if (!ordem) return 'forward';
  const i = ordem.indexOf(de);
  const j = ordem.indexOf(para);
  if (i < 0 || j < 0) return 'forward';
  return j >= i ? 'forward' : 'back';
}
