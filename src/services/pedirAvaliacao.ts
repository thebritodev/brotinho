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
 * saúde mental isso é insuficiente: a Composta também termina em conclusão, e
 * ali a pessoa acabou de dizer em voz alta o pensamento que mais a machuca.
 * Pedir um favor naquele instante trata a dor dela como oportunidade de
 * marketing.
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
