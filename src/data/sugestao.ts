import { PRACTICE_TOPICS } from './practices';
import type { Mood } from '../theme';

/**
 * A prática que o app oferece depois que a pessoa diz como está.
 *
 * O humor tocado na Home não levava a lugar nenhum: ela dizia "ansioso", o app
 * registrava em silêncio, e as três práticas de ansiedade ficavam a duas telas
 * de distância, atrás de uma lista de dez temas. É o único momento do dia em
 * que ela conta o que está sentindo — e era o momento em que o app menos fazia
 * com isso.
 *
 * ---
 *
 * **Só para três dos seis humores.** Feliz, leve e neutro não recebem nada. A
 * pesquisa de retenção desta categoria é clara sobre app que não deixa a
 * pessoa em paz, e oferecer exercício para quem acabou de dizer que está bem é
 * exatamente isso. Calar quando não há o que oferecer é o que faz a oferta
 * valer alguma coisa quando ela aparece.
 *
 * **É oferta, não receita.** O convite não promete resultado e não diz o que
 * ela está sentindo — ela já disse. Some sem insistir se ela não tocar, e não
 * volta a aparecer com outra cara mais tarde.
 *
 * **Cansado de madrugada não é cansado de tarde.** À noite a porta é a insônia;
 * durante o dia, o estresse. É a mesma palavra para duas coisas diferentes, e o
 * relógio distingue as duas sem precisar perguntar.
 */

export type Sugestao = {
  /** Chave do tema, para abrir a prática direto. */
  topico: string;
  /** Chave da prática. */
  pratica: string;
  titulo: string;
  convite: string;
};

const OFERTAS: Partial<Record<Mood, { topico: string; convite: string }>> = {
  ansioso: { topico: 'ansiedade', convite: 'Se quiser, tem isto para a ansiedade:' },
  triste: { topico: 'tristeza', convite: 'Se quiser, tem isto para dias assim:' },
  cansado: { topico: 'estresse', convite: 'Se quiser, tem isto para o cansaço:' },
};

/** Da hora em que o cansaço passa a ser sobre dormir. */
const ehNoite = (agora: Date) => {
  const h = agora.getHours();
  return h >= 21 || h < 5;
};

export function sugestaoParaOHumor({
  humor,
  agora,
}: {
  /** O humor marcado hoje. `null` quando ela ainda não disse nada. */
  humor: Mood | null;
  /** Parâmetro para o teste não depender do relógio. */
  agora: Date;
}): Sugestao | null {
  if (!humor) return null;

  const oferta = OFERTAS[humor];
  if (!oferta) return null;

  const chave = humor === 'cansado' && ehNoite(agora) ? 'insonia' : oferta.topico;
  const tema = PRACTICE_TOPICS.find((t) => t.key === chave);
  if (!tema || tema.practices.length === 0) return null;

  // Estável dentro do mesmo dia, como a saudação e a pergunta do diário: a
  // oferta não pode trocar de prática enquanto a pessoa decide se aceita.
  const semente = agora.getFullYear() * 372 + agora.getMonth() * 31 + agora.getDate();
  const pratica = tema.practices[semente % tema.practices.length];

  return {
    topico: tema.key,
    pratica: pratica.key,
    titulo: pratica.title,
    convite: oferta.convite,
  };
}
