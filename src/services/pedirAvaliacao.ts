import { Linking } from 'react-native';
import * as StoreReview from 'expo-store-review';

/**
 * Pede a avaliação na loja. Dois lugares, e dois modos diferentes.
 *
 * O app nunca pedia nada. Avaliação é o principal motor de descoberta na App
 * Store, e ficar em silêncio custa alcance de verdade.
 *
 * ---
 *
 * **Onde este pedido NÃO pode aparecer, e o porquê.**
 *
 * A recomendação padrão é pedir "depois de uma ação concluída". Num app de
 * saúde mental isso é insuficiente: terminar não quer dizer que foi bom. A
 * Composta termina em conclusão, e no meio dela a pessoa está dizendo em voz
 * alta o pensamento que mais a machuca — pedir um favor ali trataria a dor
 * dela como oportunidade de marketing.
 *
 * O critério que substituiu "ação concluída" é mais estreito: só se a própria
 * pessoa tiver acabado de dizer que está melhor. No fim da Composta existe a
 * pergunta "quanto ele pesa agora", e só a resposta **"menos"** abre a porta.
 * Ver `pedirAvaliacaoNaComposta`.
 *
 * ---
 *
 * **Por que existem dois modos.**
 *
 * A Apple mostra o pedido nativo no máximo três vezes por ano, por pessoa, e
 * pode não mostrar nenhuma — quem decide é o sistema, e o app nem fica sabendo
 * o que aconteceu. Isso torna o pedido automático um recurso escasso: gastar
 * uma das três chances com alguém que ia ignorar é jogar fora a chance de
 * perguntar para quem ia responder.
 *
 * Por isso:
 *
 * - **`pedirAvaliacaoNaColheita`** aparece sozinho, sem ninguém pedir. Mora só
 *   na colheita: três semanas de cuidado, a planta amadureceu, e é a única boa
 *   notícia do app que não depende de nada difícil ter acabado de acontecer.
 *   É raro por natureza — o que também evita insistir.
 * - **`pedirAvaliacaoAPedido`** só roda quando a pessoa toca no botão — no
 *   passo do onboarding e na linha "Avaliar o Brotinho" das Configurações. A
 *   diretriz da Apple desaconselha o pedido automático no primeiro uso, e com
 *   razão: quem acabou de instalar ainda não tem opinião. Um botão resolve as
 *   duas coisas — ninguém é emboscado, e a chance só é gasta com quem já
 *   decidiu usá-la.
 */

/**
 * O pedido em si, à prova das situações em que ele não pode acontecer.
 *
 * `isAvailableAsync` cobre o Expo Go, a web e aparelhos sem loja; `hasAction`
 * cobre o caso de não haver nem modal nativo nem URL de loja configurada.
 *
 * Devolve se alguma coisa chegou a ser aberta — o que **não** quer dizer que a
 * pessoa avaliou: no iOS a promessa resolve assim que o modal é solicitado, e
 * o sistema ainda pode decidir não mostrá-lo. Nenhum texto do app pode afirmar
 * que houve avaliação.
 */
async function pedir(): Promise<boolean> {
  try {
    if ((await StoreReview.isAvailableAsync()) && (await StoreReview.hasAction())) {
      await StoreReview.requestReview();
      return true;
    }
  } catch {
    // Cai para a ficha da loja.
  }

  /*
    O plano B, para quando o modal nativo não existe.

    Acontece no Android antigo e em build que ainda não tem a ficha publicada.
    A URL vem do `app.json` (`ios.appStoreUrl`); sem ela, `storeUrl()` devolve
    `null` e aqui não se inventa link nenhum.
  */
  const url = StoreReview.storeUrl();
  if (!url) return false;
  try {
    await Linking.openURL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Já pedimos alguma vez?
 *
 * O portão dos dois pedidos **automáticos**. Nunca barra o pedido por toque:
 * quem procura a linha "Avaliar o Brotinho" está escolhendo, e escolha não
 * tem cota.
 */
export function jaPedimosAvaliacao(avaliacaoPedidaEm: number | null): boolean {
  return avaliacaoPedidaEm !== null;
}

/**
 * O pedido automático do fim da Composta — e por que ele passou a existir.
 *
 * Este arquivo dizia, com todas as letras, que a Composta era o pior lugar
 * possível: a pessoa acabou de repetir em voz alta o pensamento que mais a
 * machuca, e pedir um favor ali trata a dor dela como oportunidade.
 *
 * O argumento continua certo sobre o **meio** da Composta. Ele está errado
 * sobre o fim dela, e o que mudou foi a tela: hoje a Composta termina com a
 * frase virando flor, o solo contando quantas já tem, e a pergunta "quanto ele
 * pesa agora". Quem responde **"menos"** acabou de dizer, com o próprio dedo,
 * que a coisa funcionou.
 *
 * É por isso que o pedido é preso nessa resposta, e não no fim da Composta. A
 * diferença entre os dois é a diferença entre perguntar a quem foi ajudado e
 * perguntar a quem acabou de remexer numa ferida. Quem responde "igual" ou
 * "mais", ou não responde, não vê nada — nem agora nem depois, porque a
 * próxima chance continua guardada.
 *
 * Nada disto é um pré-filtro de nota: a pergunta do peso já existia, é parte
 * da Composta e alimenta a repesagem da semana seguinte. O app só escolheu
 * **quando** aproveitar o momento que ela revela, que é o que as duas lojas
 * recomendam. O que elas desaconselham é o contrário: inventar uma pergunta
 * só para filtrar quem vê o pedido.
 */
export async function pedirAvaliacaoNaComposta(): Promise<void> {
  await pedir();
}

/** O pedido automático da colheita. Silencioso: falhar não pode estragá-la. */
export async function pedirAvaliacaoNaColheita(): Promise<void> {
  await pedir();
}

/**
 * O pedido disparado por um toque — no onboarding e nas Configurações.
 *
 * Devolve `false` quando não havia como pedir. Quem chama usa isso para seguir
 * em frente em silêncio, em vez de agradecer por uma coisa que não aconteceu.
 */
export async function pedirAvaliacaoAPedido(): Promise<boolean> {
  return pedir();
}
