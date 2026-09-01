import { ROTULO_DO_HUMOR } from './humores';
import { dayKey, depoisDeEscreverAssim, vezesNoDiario } from '../state/derived';
import type { AppData } from '../state/types';
import type { Mood } from '../theme';

/**
 * O que o broto diz depois que a pessoa escreve.
 *
 * ## Por que isto existe
 *
 * Salvar um registro era o momento mais aberto do app e o mais mudo: vibração,
 * a folha virava, e silêncio. A pessoa acabava de contar o dia dela para
 * alguém que não respondia nada.
 *
 * A pesquisa de retenção diz que **quem tem um único momento de "aha" está a
 * caminho de sair** — o que segura não é a descoberta inicial, é ela se
 * repetir. Uma resposta ao que se acabou de escrever é o lugar natural dessa
 * repetição, todo dia, sem inventar recurso nenhum.
 *
 * ## Por que não é inteligência artificial
 *
 * Porque a promessa do app é que **nada sai do aparelho, nem nós conseguimos
 * ler** — está na política de privacidade, no paywall quatro linhas antes do
 * preço, e na ficha da loja. Modelo em servidor quebraria isso, e privacidade é
 * justamente a queixa mais repetida contra os concorrentes; seria trocar o
 * nosso diferencial pelo problema deles. Modelo no próprio aparelho manteria a
 * promessa, mas custa hoje o Expo Go inteiro e mais de um giga de download.
 *
 * Decidido em 31/08/2026, e é para valer: o texto do diário **nunca** sai do
 * aparelho.
 *
 * ## O que ele diz, então
 *
 * O app já sabe coisas que nenhuma IA genérica saberia, porque tem a memória
 * daquela pessoa: quantas vezes um assunto voltou, o que aconteceu no dia
 * seguinte da última vez que ela escreveu sentindo aquilo, há quanto tempo ela
 * aparece. Uma resposta montada disso é **mais específica** que a de um modelo
 * que só leu o parágrafo de agora.
 *
 * ## As três regras que valem mais que as frases
 *
 * 1. **Só fato verificável, nunca interpretação.** "Esse assunto voltou três
 *    vezes" é conferível no aparelho dela. "Você parece estar sofrendo" não é —
 *    e é o tipo de afirmação que a diretriz 1.4.1 da Apple desaconselha de um
 *    app sem profissional a bordo.
 * 2. **Nunca a notícia ruim.** O app tem como dizer "isso voltou mais vezes" ou
 *    "seu dia seguinte foi pior", e não diz. Mesma regra de `atravessou`.
 * 3. **Calar é resposta válida.** Sem nada específico a dizer, devolve `null` e
 *    a tela fica em silêncio. Frase genérica depois de um desabafo é pior que
 *    silêncio: denuncia que ninguém estava prestando atenção.
 */

/** Humores em que faz sentido notar o que veio depois. */
const DIFICEIS: readonly Mood[] = ['ansioso', 'triste', 'cansado'];

/** Abaixo disto, "o assunto voltou" é coincidência de palavra. */
const VEZES_PARA_SER_ASSUNTO = 2;

export function respostaAoRegistro({
  data,
  texto,
  id,
  agora = new Date(),
}: {
  data: AppData;
  /** O texto recém-salvo. */
  texto: string;
  /** O id do registro salvo, para ele não contar como repetição de si mesmo. */
  id?: string;
  agora?: Date;
}): string | null {
  const humorDeHoje = data.moodHistory.find((m) => m.date === dayKey(agora))?.mood ?? null;

  /*
    Da mais específica para a mais geral.

    Uma frase sobre o assunto que voltou vale mais que uma sobre a contagem de
    registros, e as duas valem mais que qualquer coisa dita a todo mundo.
  */

  // 1. O assunto já apareceu antes no diário.
  const vezes = vezesNoDiario(data, texto, id);
  if (vezes >= VEZES_PARA_SER_ASSUNTO) {
    return `Esse assunto já apareceu ${vezes + 1} vezes no que você escreveu por aqui.`;
  }

  // 2. Da última vez que escreveu sentindo isso, o dia seguinte foi outro.
  if (humorDeHoje && DIFICEIS.includes(humorDeHoje)) {
    const depois = depoisDeEscreverAssim(data, humorDeHoje, agora);
    if (depois) {
      return `Da última vez que você escreveu num dia assim, no dia seguinte marcou "${ROTULO_DO_HUMOR[depois]}".`;
    }
  }

  /*
    3. O primeiro registro. Uma vez só, e nunca mais.

    Conta os **anteriores**, não o total, e isso não é detalhe: a tela chama
    esta função com o estado de antes da gravação, então `journal.length === 1`
    ali quer dizer "havia um registro antes deste" — o segundo, não o primeiro.
    Escrito assim, a frase de boas-vindas aparecia na segunda vez e engolia o
    silêncio que devia haver. Descontar o `id` faz a conta valer nos dois
    sentidos, para quem chamar antes ou depois de gravar.
  */
  const anteriores = data.journal.filter((e) => e.id !== id).length;
  if (anteriores === 0) {
    return 'Primeiro registro guardado. Ele fica aqui, no seu aparelho, e ninguém além de você lê.';
  }

  // 4. Silêncio. É resposta, e é a mais honesta quando não há o que dizer.
  return null;
}
