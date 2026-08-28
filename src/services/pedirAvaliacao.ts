import * as StoreReview from 'expo-store-review';

/**
 * Pede a avaliação na loja — uma vez, e só na colheita.
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
 * Por isso o pedido mora **só na colheita**: três semanas de cuidado, a planta
 * amadureceu, e é a única boa notícia do app que não depende de nada difícil
 * ter acabado de acontecer. É raro por natureza — o que também evita insistir.
 *
 * A Apple mostra o pedido no máximo três vezes por ano, por pessoa, e pode não
 * mostrar nenhuma. Nada aqui depende de ele aparecer.
 */
export async function pedirAvaliacaoNaColheita(): Promise<void> {
  try {
    // `isAvailableAsync` cobre o Expo Go, a web e aparelhos sem loja.
    if (!(await StoreReview.isAvailableAsync())) return;
    if (!(await StoreReview.hasAction())) return;
    await StoreReview.requestReview();
  } catch {
    // Um pedido de avaliação que falha não pode estragar a colheita.
  }
}
