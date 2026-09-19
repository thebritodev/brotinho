import { sorteio } from './quedaDosFarelos';

/**
 * As raízes que saem de baixo do broto do adubo e se espalham pela terra.
 *
 * ## O que elas são
 *
 * Fios finos, num tom de terra mais claro e com pouca opacidade: quem olha a
 * faixa vê textura do solo, e quem olha o broto vê que ele está preso ali. É
 * de propósito que não tenham contorno — contorno as faria lerem como galhos
 * desenhados por cima da terra, e não como coisa **dentro** dela.
 *
 * ## Por que a forma mora fora do desenho
 *
 * Raiz que sai da tela, que sobe acima da superfície ou que afunda até onde a
 * terra já está sumindo não parece raiz, parece risco. São três contas de
 * limite, e é mais barato conferi-las num teste do que olhar quadro a quadro
 * em cinco larguras de tela. Ver `scripts/testa-raizes-do-broto.js`.
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

export type Raiz = {
  /** O caminho em SVG, na mesma escala da terra. */
  d: string;
  espessura: number;
  opacidade: number;
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
    Três raízes principais: uma para cada lado e uma quase a prumo. Os
    comprimentos são diferentes porque três fios do mesmo tamanho leem como
    um tridente, e não como raiz.
  */
  const principais: Curva[] = [-1, 1, 0].map((lado, i) => {
    const alcance = largura * entre(0.16, 0.3) * (lado === 0 ? 0.25 : 1);
    const alvoX = x + lado * alcance;
    const alvoY = y + desce * entre(i === 2 ? 0.86 : 0.5, i === 2 ? 1 : 0.78);
    return {
      p0: { x, y },
      c1: { x: x + lado * alcance * 0.16, y: y + desce * 0.34 },
      c2: { x: alvoX - lado * alcance * 0.3, y: alvoY - desce * 0.1 },
      p1: { x: alvoX, y: alvoY },
    };
  });

  const prender = (c: Curva): Curva => {
    const dentro = (p: P): P => ({
      x: Math.min(Math.max(p.x, MARGEM), largura - MARGEM),
      /* Nunca acima do pé do broto: raiz que sobe vira galho. */
      y: Math.min(Math.max(p.y, y), chao),
    });
    /*
      Prender os quatro pontos basta para prender a curva inteira: uma cúbica
      nunca sai do fecho convexo dos pontos que a definem.
    */
    return { p0: dentro(c.p0), c1: dentro(c.c1), c2: dentro(c.c2), p1: dentro(c.p1) };
  };

  const presas = principais.map(prender);

  /*
    De cada principal sai um fio menor, do meio dela para fora e para baixo.

    Ele nasce da curva **já presa**, e não da de antes: com o broto perto da
    borda, o meio da curva solta cai fora da tela, e o fio saía de um ponto
    onde não há raiz nenhuma desenhada.
  */
  const ramos: Curva[] = presas.map((raiz, i) => {
    const meio = cubica(raiz, entre(0.45, 0.62));
    const lado = raiz.p1.x >= x ? 1 : -1;
    const alcance = largura * entre(0.06, 0.12);
    const cai = desce * entre(0.16, 0.3);
    return {
      p0: meio,
      c1: { x: meio.x + lado * alcance * 0.4, y: meio.y + cai * 0.3 },
      c2: { x: meio.x + lado * alcance * 0.8, y: meio.y + cai * 0.7 },
      p1: { x: meio.x + lado * alcance * (i === 2 ? 1.4 : 1), y: meio.y + cai },
    };
  });

  return [
    ...presas.map((c) => ({ ...desenho(c), espessura: 2, opacidade: 0.3 })),
    ...ramos.map((c) => ({ ...desenho(prender(c)), espessura: 1.2, opacidade: 0.22 })),
  ];
}
