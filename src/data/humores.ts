import type { Mood } from '../theme';

/**
 * Os humores por nome, e as palavras mais precisas de cada um.
 *
 * ## Por que existe uma segunda camada
 *
 * "Categorias de humor rígidas demais" é das queixas mais repetidas nas
 * avaliações de app de humor, e o recurso mais elogiado do *How We Feel* —
 * feito com o centro de inteligência emocional de Yale — é justamente o
 * contrário: dar vocabulário para a pessoa achar a palavra certa.
 *
 * Não é só preferência de público. Um estudo de campo de 24 dias mostra que
 * **nomear a emoção com mais precisão melhora a capacidade de regulá-la sem
 * que nenhuma estratégia seja ensinada** — o ganho vem do nomear, não de um
 * exercício depois. É o efeito mais barato que este app pode oferecer: uma
 * lista de palavras.
 *
 * ## Por que substantivo, e não adjetivo
 *
 * Em inglês dá para listar *anxious*, *tired*, *proud* e acabou. Em português
 * quase todo adjetivo concorda em gênero, e uma lista de adjetivos obrigaria a
 * escolher entre "ansioso" e "ansiosa" — ou seja, entre errar com metade das
 * pessoas e perguntar o gênero de alguém que só queria dizer como está.
 *
 * Substantivo não tem esse problema: *aflição* serve para qualquer pessoa.
 * E lê melhor no lugar onde a palavra reaparece — "hoje foi aflição" soa como
 * alguém nomeando o que sentiu, que é exatamente o que se quer.
 *
 * `scripts/confere-humores.js` guarda essa decisão: reprova palavra terminada
 * nas formas de adjetivo (-oso, -ado, -ido e suas flexões). Sem o guarda, a
 * próxima palavra entra como adjetivo e ninguém percebe.
 *
 * ## Por que os cinco conjuntos não se repetem
 *
 * Nenhuma palavra aparece em dois humores, e isso é requisito, não coincidência:
 * `patterns` cita a palavra sozinha ("*aflição* apareceu em cinco dias"), e uma
 * palavra ambígua tornaria a frase sem sentido.
 */

/** O rótulo de um humor, com a inicial maiúscula, como aparece na tela. */
export const ROTULO_DO_HUMOR: Record<Mood, string> = {
  feliz: 'Feliz',
  leve: 'Leve',
  ansioso: 'Ansioso',
  triste: 'Triste',
  cansado: 'Cansado',
  neutro: 'Neutro',
};

/**
 * As palavras de cada humor.
 *
 * Cinco por humor: o bastante para a pessoa se reconhecer numa, pouco o
 * bastante para caber numa linha e ser lido de relance. `neutro` fica de fora
 * porque não é escolhível — é o estado de quem ainda não marcou nada hoje.
 */
export const PALAVRAS_DO_HUMOR: Record<Exclude<Mood, 'neutro'>, readonly string[]> = {
  feliz: ['alegria', 'gratidão', 'orgulho', 'entusiasmo', 'alívio'],
  leve: ['calma', 'tranquilidade', 'esperança', 'conforto', 'presença'],
  ansioso: ['aflição', 'apreensão', 'medo', 'nervosismo', 'irritação'],
  triste: ['desânimo', 'solidão', 'saudade', 'decepção', 'vazio'],
  cansado: ['exaustão', 'sono', 'desgaste', 'tédio', 'sobrecarga'],
};

/** As palavras de um humor, ou nenhuma se ele não tiver. */
export function palavrasDe(mood: Mood): readonly string[] {
  return mood === 'neutro' ? [] : PALAVRAS_DO_HUMOR[mood];
}

/**
 * A palavra pertence mesmo a este humor?
 *
 * Usado ao ler do disco e ao trazer um arquivo de volta. Uma palavra do humor
 * errado não é só enfeite trocado: ela apareceria numa frase de padrão dizendo
 * algo que a pessoa nunca marcou.
 */
export function palavraValida(mood: Mood, palavra: unknown): palavra is string {
  return typeof palavra === 'string' && palavrasDe(mood).includes(palavra);
}
