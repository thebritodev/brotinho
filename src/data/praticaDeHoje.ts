import { ANCORA_RAPIDA, PRACTICE_TOPICS, findPractice } from './practices';
import { sugestaoParaOHumor } from './sugestao';
import { dayKey, ultimaPratica } from '../state/derived';
import type { AppData } from '../state/types';

/**
 * Qual prática o cartão grande da tela inicial oferece hoje.
 *
 * ## De onde ela veio
 *
 * A sugestão do dia existia como uma pílula pequena acima da grade de treze
 * temas, e só aparecia em quem tinha marcado um humor pesado — ou seja, quase
 * nunca. Era o melhor que as práticas tinham a oferecer (uma prática
 * **específica**, escolhida para o dia) no menor elemento da seção delas.
 *
 * Como cartão do carrossel ela fica do tamanho do que vale. E, para um cartão
 * fixo do carrossel, "às vezes não tem nada" não serve: ou ele oferece alguma
 * coisa todo dia, ou deixa um buraco na fileira.
 *
 * ## As três respostas, nesta ordem
 *
 * 1. **O humor de hoje**, quando ela marcou um que pede prática. É a única das
 *    três que sabe alguma coisa sobre o dia de hoje, então vem primeiro.
 * 2. **A última que ela fez.** Retomar é melhor oferta que recomeçar: o app já
 *    sabe que aquilo foi escolhido uma vez, e prática guiada quase nunca se
 *    esgota numa sessão.
 * 3. **O aterramento 5-4-3-2-1**, para quem nunca fez nenhuma. É a mesma que o
 *    app oferece como saída de emergência, e a que pede menos de quem chega:
 *    três minutos, sem voz, sem preparo.
 *
 * ## O que o cartão nunca diz
 *
 * Que a pessoa "deveria" fazer. Os três convites são oferta — "se quiser",
 * "você parou aqui", "uma boa para começar" —, nunca cobrança por prática não
 * feita. Ver `docs/retencao.md` para o motivo de o app não ter placar.
 */

export type OfertaDePratica = {
  topico: string;
  pratica: string;
  /** O selo do alto do cartão: por que esta prática, e não outra. */
  selo: string;
  /** A linha acima do nome. */
  convite: string;
  titulo: string;
  /** "3 minutos" — o custo, que é o que costuma decidir se alguém entra. */
  duracao: string;
};

export function praticaDeHoje(data: AppData, agora = new Date()): OfertaDePratica {
  const hoje = dayKey(agora);
  const humor = data.moodHistory.find((m) => m.date === hoje)?.mood ?? null;

  const doHumor = sugestaoParaOHumor({ humor, agora });
  if (doHumor) {
    const pratica = findPractice(doHumor.topico, doHumor.pratica);
    if (pratica) {
      return {
        topico: doHumor.topico,
        pratica: doHumor.pratica,
        selo: 'para hoje',
        convite: doHumor.convite,
        titulo: doHumor.titulo,
        duracao: pratica.duration,
      };
    }
  }

  const ultima = ultimaPratica(data);
  if (ultima) {
    const pratica = findPractice(ultima.topic, ultima.practice);
    /* A prática pode ter saído do repertório numa atualização; nesse caso o
       histórico não serve de oferta e a estreia assume. */
    if (pratica) {
      return {
        topico: ultima.topic,
        pratica: ultima.practice,
        selo: 'continuar',
        convite: 'Você parou nesta:',
        titulo: pratica.title,
        duracao: pratica.duration,
      };
    }
  }

  /*
    A estreia, e por que ela não pode falhar.

    Este cartão é fixo no carrossel: se a função devolvesse `null`, a fileira
    ficaria com um buraco no meio. Então a última linha não confia na âncora —
    se um dia ela sumir do repertório, a primeira prática que existir assume.
    Um tema sem prática nenhuma quebraria o app inteiro muito antes daqui.
  */
  const ancora = findPractice(ANCORA_RAPIDA.topico, ANCORA_RAPIDA.pratica);
  const topico = ancora ? ANCORA_RAPIDA.topico : PRACTICE_TOPICS[0].key;
  const estreia = ancora ?? PRACTICE_TOPICS[0].practices[0];

  return {
    topico,
    pratica: estreia.key,
    selo: 'para começar',
    convite: 'Uma boa para a primeira vez:',
    titulo: estreia.title,
    duracao: estreia.duration,
  };
}
