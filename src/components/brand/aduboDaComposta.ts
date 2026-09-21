/**
 * A palavra que cai na terra vira adubo e sobe pela raiz até o broto.
 *
 * ## A história, em três tempos
 *
 * 1. **Pouso.** Quando o meio da palavra cruza a superfície do monte, ela se
 *    desfaz em grãos de adubo, que afundam na direção da raiz mais próxima.
 * 2. **Seiva.** Um pulso dourado percorre essa raiz, do ponto onde os grãos
 *    chegaram até o pé do broto.
 * 3. **Estirão.** O broto recebe e cresce um pouco, com um brilho, e volta.
 *
 * É a ideia da Composta dita sem texto: o pensamento que você repete vira
 * adubo e alimenta a planta.
 *
 * ## Por que tudo sai do relógio das palavras
 *
 * As palavras caem num relógio só, no driver nativo — foi o que acabou com
 * elas se amontoando quando o JavaScript travava (ver `planoDaQueda`). O adubo
 * lê **o mesmo relógio**: o pouso é calculado a partir da queda de cada
 * palavra, e não observado. Assim o pulso nunca sai antes da palavra chegar
 * nem depois de ela ter sumido, trave o que travar.
 *
 * O relógio vai de 0 a 1 na primeira volta — onde cada palavra só aparece na
 * vez dela — e depois repete de 1 a 2. Um evento que começa depois do pouso
 * pode atravessar essa virada; `curvaDoEvento` é a conta que faz ele
 * atravessar sem pulo. O teste é `scripts/testa-adubo-da-composta.js`.
 */

import { valorEm, type PlanoDaQueda, type Pontos } from './planoDaQueda';
import type { Raiz } from './raizesDoBroto';

/** A duração de cada tempo da história, em milissegundos. */
export const GRAOS_MS = 760;
/** A seiva sai quando os grãos já estão quase chegando na raiz. */
export const SEIVA_ATRASO_MS = 520;
export const SEIVA_MS = 980;
export const ESTIRAO_MS = 820;

/** Quantos grãos cada palavra solta. */
export const GRAOS_POR_PALAVRA = 7;

/**
 * A superfície do monte de adubo, na escala da terra.
 *
 * É a mesma curva desenhada na faixa: uma cúbica que sai de fora da tela à
 * esquerda, sobe até o meio e desce saindo à direita.
 */
export function superficieDoMonte(largura: number): (x: number) => number {
  const p0 = { x: -8, y: 34 };
  const c1 = { x: largura * 0.24, y: 10 };
  const c2 = { x: largura * 0.7, y: 8 };
  const p1 = { x: largura + 8, y: 36 };
  const amostras = Array.from({ length: 97 }, (_, k) => {
    const t = k / 96;
    const u = 1 - t;
    return {
      x: u * u * u * p0.x + 3 * u * u * t * c1.x + 3 * u * t * t * c2.x + t * t * t * p1.x,
      y: u * u * u * p0.y + 3 * u * u * t * c1.y + 3 * u * t * t * c2.y + t * t * t * p1.y,
    };
  });
  return (x) => {
    /* A curva anda sempre para a direita, então basta achar o trecho do x. */
    for (let i = 1; i < amostras.length; i++) {
      const a = amostras[i - 1];
      const b = amostras[i];
      if (x <= b.x) return a.y + ((b.y - a.y) * (x - a.x)) / (b.x - a.x || 1);
    }
    return amostras[amostras.length - 1].y;
  };
}

/**
 * Um evento no relógio da queda: começa em `comeco` e dura `duracao`.
 *
 * `pontos` descreve o evento de 0 a 1, e o primeiro valor é o **repouso** —
 * o valor fora do evento. O último pode ser diferente: uma posição termina
 * noutro lugar, e depois do evento volta ao repouso num salto (invisível,
 * porque a opacidade já é zero ali).
 *
 * ## A virada do relógio
 *
 * Na primeira volta (0 a 1) só existe o evento de verdade, a partir de
 * `comeco` — antes disso nenhuma palavra pousou. No laço (1 a 2) o evento se
 * repete a cada volta, e um evento que passa de 2 continua no começo do laço
 * seguinte. Por isso o laço considera as ocorrências em `comeco - 1`,
 * `comeco` e `comeco + 1`: é o que faz o valor em 2 ser igual ao valor em 1.
 *
 * A única emenda que sobra é rara e está do lado certo: se o evento começa
 * tão tarde que atravessa a virada **já na primeira vez**, o laço mostra a
 * ponta dele um instante antes de a primeira volta ter mostrado o começo.
 * Com as frases do repertório não acontece — o teste confere.
 */
export function curvaDoEvento(
  comeco: number,
  duracao: number,
  pontos: Pontos,
): { inputRange: number[]; outputRange: number[] } {
  const repouso = pontos[0][1];
  const ocorrenciasDaPrimeira = comeco < 1 ? [comeco] : [];
  const ocorrenciasDoLaco = [comeco - 1, comeco, comeco + 1];

  const valor = (t: number, inicios: number[]) => {
    for (const s of inicios) {
      if (t >= s && t <= s + duracao) return valorEm(pontos, (t - s) / duracao);
    }
    return repouso;
  };

  const lista: [number, number][] = [];
  const trecho = (de: number, ate: number, inicios: number[]) => {
    const marcas = new Set<number>([de, ate]);
    for (const s of inicios) {
      for (const [p] of pontos) {
        const t = s + p * duracao;
        if (t > de && t < ate) marcas.add(t);
      }
      /* O salto de volta ao repouso logo depois do fim. */
      const fim = s + duracao;
      if (fim > de && fim < ate) marcas.add(fim);
    }
    const ordenadas = [...marcas].sort((a, b) => a - b);
    for (const t of ordenadas) {
      lista.push([t, valor(t, inicios)]);
      /* Fim de uma ocorrência que não termina no repouso: salta para ele. */
      for (const s of inicios) {
        if (Math.abs(t - (s + duracao)) < 1e-12 && t < ate) {
          const ultimo = pontos[pontos.length - 1][1];
          if (ultimo !== repouso) lista.push([t, repouso]);
        }
      }
    }
  };

  trecho(0, 1, ocorrenciasDaPrimeira);
  trecho(1, 2, ocorrenciasDoLaco);

  return {
    inputRange: lista.map(([t]) => t),
    outputRange: lista.map(([, v]) => v),
  };
}

export type AduboDaPalavra = {
  /** Onde o meio da palavra cruza a superfície, na escala da terra. */
  pouso: { x: number; y: number };
  /** O caminho da seiva, do ponto da raiz até o pé do broto, na escala da terra. */
  caminho: { x: number; y: number }[];
  /** Em que instante do relógio a palavra pousa. */
  noRelogio: number;
  /** Os três tempos, já em unidades do relógio. */
  graos: { comeco: number; duracao: number };
  seiva: { comeco: number; duracao: number };
  estirao: { comeco: number; duracao: number };
};

/**
 * O adubo de cada palavra da frase.
 *
 * As medidas seguem a faixa: a terra começa 26 pontos acima da crista, a
 * palavra cai `distancia` pontos a partir do alto da queda, e a crista fica
 * `queda` pontos abaixo desse alto.
 */
export function planejarAdubo({
  plano,
  queda,
  distancia,
  largura,
  raizes,
}: {
  plano: PlanoDaQueda;
  queda: number;
  distancia: number;
  largura: number;
  /** As raízes do broto; só as principais levam seiva. */
  raizes: Raiz[];
}): AduboDaPalavra[] {
  const superficie = superficieDoMonte(largura);
  const principais = raizes.slice(0, 3);
  const emRelogio = (ms: number) => ms / plano.cicloMs;

  return plano.palavras.map((p) => {
    const x = p.centro;
    const y = superficie(x);
    /*
      Quando o meio da palavra chega à superfície. O alto da palavra está em
      `andar` pontos abaixo do alto da queda; a superfície, em
      `queda - 26 + y`.
    */
    const fracao = Math.min(1, Math.max(0, (queda - 26 + y - p.linha / 2) / distancia));
    const noRelogio = p.inicio + fracao * plano.janela;

    /* O ponto de raiz mais perto do pouso, e o caminho dele até o pé. */
    let melhor = { raiz: 0, indice: 0, distancia: Infinity };
    principais.forEach((r, i) => {
      r.pontos.forEach((q, k) => {
        const d = Math.hypot(q.x - x, q.y - y);
        if (d < melhor.distancia) melhor = { raiz: i, indice: k, distancia: d };
      });
    });
    const raiz = principais[melhor.raiz];
    const caminho = raiz ? raiz.pontos.slice(0, melhor.indice + 1).reverse() : [{ x, y }];

    const graos = { comeco: noRelogio, duracao: emRelogio(GRAOS_MS) };
    const seiva = { comeco: noRelogio + emRelogio(SEIVA_ATRASO_MS), duracao: emRelogio(SEIVA_MS) };
    const estirao = {
      comeco: seiva.comeco + seiva.duracao * 0.92,
      duracao: emRelogio(ESTIRAO_MS),
    };
    return { pouso: { x, y }, caminho, noRelogio, graos, seiva, estirao };
  });
}

/**
 * Os pontos de uma posição ao longo de um caminho, pela distância percorrida.
 *
 * Andar pelo índice faria a seiva correr nos trechos onde os pontos da raiz
 * estão espaçados e se arrastar onde estão juntos.
 */
export function pontosDoCaminho(
  caminho: { x: number; y: number }[],
  eixo: 'x' | 'y',
  comeca: number,
  termina: number,
): Pontos {
  const acumulado = [0];
  for (let i = 1; i < caminho.length; i++) {
    acumulado.push(
      acumulado[i - 1] + Math.hypot(caminho[i].x - caminho[i - 1].x, caminho[i].y - caminho[i - 1].y),
    );
  }
  const total = acumulado[acumulado.length - 1] || 1;
  const vao = termina - comeca;
  return [
    [0, caminho[0][eixo]],
    ...caminho.map((q, i) => [comeca + (acumulado[i] / total) * vao, q[eixo]] as [number, number]),
    [1, caminho[caminho.length - 1][eixo]],
  ];
}
