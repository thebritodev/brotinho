import { sorteio } from './quedaDosFarelos';

/**
 * As raízes que saem de baixo do broto do adubo e se espalham pela terra.
 *
 * ## O que elas são
 *
 * Uma rede em três níveis, como a de uma planta de verdade: algumas raízes
 * principais saindo do pé, ramos saindo delas, e pelinhos nas pontas. Fio
 * fino, num tom de terra mais claro e com pouca opacidade — quem olha a faixa
 * vê textura do solo, e quem olha o broto vê que ele está preso ali.
 *
 * Três níveis, e não um leque de fios soltos: fio que sai do pé e termina sem
 * se dividir não lê como raiz, lê como risco. A divisão é o que dá o nome à
 * coisa.
 *
 * É de propósito que não tenham contorno — contorno as faria lerem como
 * galhos desenhados por cima da terra, e não como coisa **dentro** dela.
 *
 * ## Por que a forma mora fora do desenho
 *
 * Raiz que sai da tela, que sobe acima da superfície, que afunda até onde a
 * terra já está sumindo, ou ramo que nasce longe da raiz de onde deveria sair
 * não parece raiz, parece risco. São contas de limite, e é mais barato
 * conferi-las num teste do que olhar quadro a quadro em cinco larguras de
 * tela. Ver `scripts/testa-raizes-do-broto.js`.
 *
 * A forma é sorteada, mas com semente: a mesma tela desenha sempre a mesma
 * raiz, e o teste confere exatamente o que o app mostra.
 */

/**
 * Quanto a raiz mais funda desce abaixo do pé do broto.
 *
 * Funda: ela atravessa o bloco de terra e passa por trás do título e do texto
 * da ferramenta. Pode, porque o fio é claro, translúcido, e o texto é
 * desenhado **depois**, por cima dele — o que aparece atrás das letras é
 * terra com textura, e não um risco cortando a frase.
 *
 * O que ainda a segura é a névoa: quem chama passa o `fundo`, a linha onde a
 * terra começa a sumir, e nenhuma raiz chega lá. Raiz desenhada dentro da
 * névoa aparece boiando no nada.
 */
export const PROFUNDIDADE = 132;

/** O quanto ela fica longe da borda da tela, no mínimo. */
export const MARGEM = 10;

/**
 * Para onde apontam as principais, em graus, com 90 sendo a prumo.
 *
 * Ímpar de propósito: com um número par elas ficam simétricas em volta do pé,
 * e simetria ali lê como desenho técnico.
 */
const PRINCIPAIS = [141, 115, 92, 68, 43] as const;

/** Onde os ramos nascem ao longo da principal, em fração do comprimento. */
const RAMOS_EM = [0.34, 0.6, 0.82] as const;

export type Raiz = {
  /** O caminho em SVG, na mesma escala da terra. */
  d: string;
  espessura: number;
  opacidade: number;
  /** 0 é principal, 1 é ramo, 2 é pelinho de ponta. */
  nivel: 0 | 1 | 2;
  /** De qual raiz esta nasce — `null` só nas principais, que nascem do pé. */
  pai: number | null;
  /** Os pontos da curva, para o teste medir sem reabrir o caminho. */
  pontos: { x: number; y: number }[];
};

type Curva = { p0: P; c1: P; c2: P; p1: P };
type P = { x: number; y: number };

function cubica(c: Curva, t: number): P {
  const u = 1 - t;
  const a = u * u * u;
  const b = 3 * u * u * t;
  const d = 3 * u * t * t;
  const e = t * t * t;
  return {
    x: a * c.p0.x + b * c.c1.x + d * c.c2.x + e * c.p1.x,
    y: a * c.p0.y + b * c.c1.y + d * c.c2.y + e * c.p1.y,
  };
}

function desenho(c: Curva): { d: string; pontos: P[] } {
  const pontos = Array.from({ length: 13 }, (_, k) => cubica(c, k / 12));
  const n = (v: number) => Math.round(v * 10) / 10;
  return {
    d: `M${n(c.p0.x)} ${n(c.p0.y)} C${n(c.c1.x)} ${n(c.c1.y)} ${n(c.c2.x)} ${n(c.c2.y)} ${n(c.p1.x)} ${n(c.p1.y)}`,
    pontos,
  };
}

/**
 * Um fio que sai de `de`, na direção `angulo`, com um arco de lado `curva`.
 *
 * O arco existe porque raiz não é reta: ela contorna o que encontra pela
 * frente.
 */
function fio(de: P, angulo: number, comprimento: number, curva: number): Curva {
  const rad = (angulo * Math.PI) / 180;
  const lado = rad + Math.PI / 2;
  const ponta = {
    x: de.x + Math.cos(rad) * comprimento,
    y: de.y + Math.sin(rad) * comprimento,
  };
  return {
    p0: de,
    c1: {
      x: de.x + Math.cos(rad) * comprimento * 0.35 + Math.cos(lado) * curva,
      y: de.y + Math.sin(rad) * comprimento * 0.35 + Math.sin(lado) * curva,
    },
    c2: {
      x: de.x + Math.cos(rad) * comprimento * 0.72 - Math.cos(lado) * curva * 0.6,
      y: de.y + Math.sin(rad) * comprimento * 0.72 - Math.sin(lado) * curva * 0.6,
    },
    p1: ponta,
  };
}

export function raizesDoBroto({
  x,
  y,
  largura,
  fundo,
  semente = 1789,
}: {
  /** O pé do broto, na escala da terra. */
  x: number;
  y: number;
  /** A largura da tela: a raiz não passa das bordas. */
  largura: number;
  /** A linha onde a terra começa a sumir: nenhuma raiz chega lá. */
  fundo: number;
  semente?: number;
}): Raiz[] {
  const acaso = sorteio(semente);
  const entre = (a: number, b: number) => a + (b - a) * acaso();

  /* O fundo de verdade é o mais raso entre o alcance da raiz e o da terra. */
  const chao = Math.min(y + PROFUNDIDADE, fundo);
  const desce = Math.max(24, chao - y);

  /*
    Prender os quatro pontos basta para prender a curva inteira: uma cúbica
    nunca sai do fecho convexo dos pontos que a definem.
  */
  const prender = (c: Curva): Curva => {
    const dentro = (p: P): P => ({
      x: Math.min(Math.max(p.x, MARGEM), largura - MARGEM),
      /* Nunca acima do pé do broto: raiz que sobe vira galho. */
      y: Math.min(Math.max(p.y, y), chao),
    });
    return { p0: dentro(c.p0), c1: dentro(c.c1), c2: dentro(c.c2), p1: dentro(c.p1) };
  };

  const raizes: Raiz[] = [];
  const guardar = (c: Curva, nivel: 0 | 1 | 2, pai: number | null): number => {
    const presa = prender(c);
    const espessura = [2.2, 1.3, 0.8][nivel];
    const opacidade = [0.3, 0.22, 0.16][nivel];
    raizes.push({ ...desenho(presa), espessura, opacidade, nivel, pai });
    return raizes.length - 1;
  };

  const pe = { x, y };

  for (const angulo of PRINCIPAIS) {
    /* A do meio desce mais; as de fora abrem mais e descem menos. */
    const aprumo = 1 - Math.abs(angulo - 90) / 90;
    const comprimento = desce * entre(0.62, 0.78) + desce * aprumo * 0.3;
    const principal = fio(pe, angulo + entre(-5, 5), comprimento, entre(-10, 10));
    const iPrincipal = guardar(principal, 0, null);
    const presa = raizes[iPrincipal];

    for (const onde of RAMOS_EM) {
      /* O ramo nasce **num ponto desenhado** da principal, não perto dela. */
      const nasce = presa.pontos[Math.round(onde * 12)];
      const paraFora = angulo > 90 ? 1 : -1;
      const abre = entre(24, 46) * paraFora;
      const ramo = fio(nasce, angulo + abre, comprimento * entre(0.24, 0.42), entre(-5, 5));
      const iRamo = guardar(ramo, 1, iPrincipal);
      const ponta = raizes[iRamo].pontos[12];

      /* Os pelinhos: dois na ponta de cada ramo, abrindo em leque. */
      for (const lado of [-1, 1]) {
        const pelo = fio(ponta, angulo + abre + lado * entre(22, 38), entre(8, 14), entre(-2, 2));
        guardar(pelo, 2, iRamo);
      }
    }

    /* E dois na ponta da principal, que é onde ela ainda está crescendo. */
    const pontaDaPrincipal = presa.pontos[12];
    for (const lado of [-1, 1]) {
      const pelo = fio(pontaDaPrincipal, angulo + lado * entre(18, 32), entre(9, 15), entre(-2, 2));
      guardar(pelo, 2, iPrincipal);
    }
  }

  return raizes;
}
