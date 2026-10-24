/**
 * Como o modo acústico da Composta conta uma repetição.
 *
 * Fora do `useCompostSession` para poder ser testado sem microfone: entra
 * "houve voz neste instante?" e quanto tempo passou, sai "contou uma
 * repetição agora?". Ver `testa-contagem-pelo-som`.
 *
 * ## O que o modo acústico sabe, e o que não sabe
 *
 * Ele é o caminho do aparelho que não reconhece fala sem servidor — no iPhone,
 * do XS para trás; o app não manda voz para fora. Não sabe *o que* foi dito,
 * só *quanto*: o medidor diz se há som com jeito de voz (alto, sustentado,
 * oscilando — ver o cabeçalho de `useCompostSession`), e o resto é tempo.
 *
 * ## As duas versões que contavam barulho
 *
 * A primeira contava uma repetição a cada começo de som: tosse, "ah", palavra
 * solta — tudo virava frase.
 *
 * A segunda exigia voz bastante para a frase inteira, mas **somava** a voz de
 * barulhos separados. Três tosses de dois décimos davam os seis décimos de
 * "não vou dar conta". O Pedro viu as duas no iPhone: "qualquer barulho
 * continua sendo entendido como repetição".
 *
 * ## A regra agora
 *
 * A voz conta **de uma vez**. Um trecho de fala vale tantas repetições
 * quantas frases inteiras couberem nele; uma pausa zera o que sobrou. Tosse,
 * "ah", porta, uma palavra — nada disso chega sozinho ao tamanho de uma frase,
 * e a pausa depois apaga o pedaço.
 *
 * O que continua passando é o que tem a forma e o tamanho da fala: alguém
 * conversando ao lado, a televisão. Isso o modo acústico não tem como
 * separar; só o reconhecimento de fala tem.
 */

/**
 * Quanto de voz cada sílaba vale, dita depressa.
 *
 * A prática pede "rápido, sem pausar", e aí uma sílaba leva perto de um
 * décimo e meio de segundo. A conta usa um pouco menos porque o medidor perde
 * o começo de cada som e os vales entre sílabas: a voz que ele conta é sempre
 * um pouco menos que a voz que houve.
 */
export const SEGUNDOS_POR_SILABA = 0.12;
/** Piso: frase de uma palavra não pode voltar a contar tosse. */
export const MENOR_REPETICAO = 0.5;
export const MAIOR_REPETICAO = 3;

/**
 * A pausa que separa um trecho de fala do seguinte.
 *
 * Maior que o vão entre duas sílabas da mesma palavra (o medidor já tolera
 * 0,15 s dentro da fala) e menor que o fôlego entre duas repetições. Quem
 * repete sem pausa nenhuma não chega a ela, e conta pelo tempo corrido.
 */
export const PAUSA_ENTRE_TRECHOS = 0.3;

/** As sílabas de uma frase em português, contadas pelos grupos de vogais. */
export function silabasDe(frase: string) {
  return (frase.toLowerCase().match(/[aeiouáéíóúâêôãõàü]+/g) ?? []).length;
}

/** Quanto de voz contínua vale uma repetição desta frase. */
export function vozDeUmaRepeticao(frase: string) {
  return Math.min(MAIOR_REPETICAO, Math.max(MENOR_REPETICAO, silabasDe(frase) * SEGUNDOS_POR_SILABA));
}

export type ContagemPeloSom = {
  /** Voz contínua desde a última repetição contada, ou desde a última pausa. */
  voz: number;
  /** Há quanto tempo não há voz. */
  silencio: number;
};

export function contagemInicial(): ContagemPeloSom {
  return { voz: 0, silencio: 0 };
}

/**
 * Um passo do medidor. Devolve `true` quando uma repetição acabou de contar.
 *
 * Muda `estado` no lugar, que é como a máquina da sessão guarda o resto do
 * dela — um passo a cada leitura do medidor, dez por segundo.
 */
export function passoPeloSom(
  estado: ContagemPeloSom,
  temVoz: boolean,
  dt: number,
  vozPorRepeticao: number,
): boolean {
  if (!temVoz) {
    estado.silencio += dt;
    /* A pausa encerra o trecho: o pedaço que não chegou a uma frase some. */
    if (estado.silencio >= PAUSA_ENTRE_TRECHOS) estado.voz = 0;
    return false;
  }
  estado.silencio = 0;
  estado.voz += dt;
  /* Uma margem de meio passo para o arredondamento de `dt` não perder a conta. */
  if (estado.voz + 1e-6 >= vozPorRepeticao) {
    estado.voz -= vozPorRepeticao;
    return true;
  }
  return false;
}
