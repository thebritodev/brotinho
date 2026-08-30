/**
 * Onde cada parte do broto fica, e que caixa cabe em volta dela.
 *
 * Isto existe porque a caixa foi derivada à mão uma vez e saiu errada. Sem
 * vaso, a `viewBox` de sempre — `0 0 200 224` — deixa um terço de vazio
 * embaixo, e o desenho, encaixado nela, aparece com metade do tamanho. O
 * recorte que eu escrevi para resolver isso cortava as folhas: elas caem bem
 * abaixo da boca do vaso, e eu tinha parado a caixa doze unidades depois dela.
 *
 * A lição não é o número errado, é o método. Uma caixa escrita à mão fica
 * parada enquanto o desenho anda. Aqui ela é **calculada a partir das mesmas
 * tabelas que desenham** — mexeu na folha, na haste ou no bulbo, a caixa
 * acompanha sozinha. E `scripts/confere-broto.js` confere que as tabelas ainda
 * descrevem o desenho de verdade, que é a única parte que um cálculo não
 * garante.
 */

export type SproutStage = 1 | 2 | 3;

/** Valores que rendem enfeites no broto (ver tela "Meus valores"). */
export type Decoration = 'criatividade' | 'curiosidade' | 'autocuidado' | 'conexao';

/** O eixo do broto. Tudo é desenhado simétrico em volta dele. */
export const CX = 100;

/** A boca do vaso, de onde a haste sai. */
export const POT_TOP_Y = 168;

export type Folha = { x: number; y: number; rotate: number; scale: number };

export const LEAVES_BY_STAGE: Record<SproutStage, Folha[]> = {
  1: [
    { x: CX, y: POT_TOP_Y - 4, rotate: -35, scale: 0.55 },
    { x: CX, y: POT_TOP_Y - 4, rotate: 210, scale: 0.5 },
  ],
  2: [
    { x: CX, y: POT_TOP_Y - 10, rotate: -35, scale: 0.85 },
    { x: CX, y: POT_TOP_Y - 10, rotate: 215, scale: 0.8 },
    { x: CX, y: POT_TOP_Y - 30, rotate: -8, scale: 0.6 },
  ],
  3: [
    { x: CX, y: POT_TOP_Y - 14, rotate: -40, scale: 1 },
    { x: CX, y: POT_TOP_Y - 14, rotate: 220, scale: 0.95 },
    { x: CX, y: POT_TOP_Y - 40, rotate: -10, scale: 0.8 },
    { x: CX, y: POT_TOP_Y - 40, rotate: 190, scale: 0.75 },
  ],
};

export const STEM_TOP_Y: Record<SproutStage, number> = {
  1: POT_TOP_Y - 26,
  2: POT_TOP_Y - 44,
  3: POT_TOP_Y - 62,
};

export const BULB_R: Record<SproutStage, number> = { 1: 20, 2: 27, 3: 33 };

/** A espessura do contorno da folha, em `Leaf`. */
export const TRACO_DA_FOLHA = 3;

/** A espessura do contorno do bulbo. */
export const TRACO_DO_BULBO = 3.5;

/** A espessura da haste. */
export const TRACO_DA_HASTE = 6;

/**
 * Os pontos do contorno da folha: âncoras e controles do `d` de `Leaf`.
 *
 * Uma curva de Bézier nunca sai do casco convexo dos seus pontos de controle,
 * então cercar estes nove cerca a folha inteira — com folga, nunca de menos,
 * que é o lado certo de errar numa caixa.
 *
 * `confere-broto.js` lê o `d` do desenho e confere que a lista continua sendo
 * a mesma. É esse o ponto onde os dois poderiam se separar em silêncio.
 */
export const CASCO_DA_FOLHA: ReadonlyArray<readonly [number, number]> = [
  [0, 0],
  [-6, -14],
  [-18, -26],
  [-32, -24],
  [-42, -22],
  [-44, -6],
  [-34, 4],
  [-22, 16],
  [-8, 12],
];

/**
 * Até onde os enfeites de valores chegam, a partir do centro da carinha.
 *
 * Os quatro são desenhados em volta do bulbo, cada um com sua forma: a estrela
 * da criatividade em cima à esquerda, o brilho da curiosidade em cima à
 * direita, as bolinhas do autocuidado nos dois lados, o broto pequeno da
 * conexão embaixo à direita. Este retângulo cobre os quatro juntos, com folga.
 *
 * É a única parte medida em vez de calculada, porque cada enfeite é um `d`
 * próprio e não uma tabela. Como só entra na conta quando há enfeite, o broto
 * comum não paga por essa folga.
 */
export const ENFEITES_ALCANCAM = { esquerda: 50, direita: 65, cima: 47, baixo: 50 };

/**
 * A folga entre o desenho e a borda da caixa.
 *
 * Uma caixa colada nos extremos deixa a ponta da folha encostada na borda, e
 * ali qualquer arredondamento de subpixel vira um corte fino — que é
 * exatamente o defeito que se está consertando. Duas unidades custam pouco
 * mais de 2% de tamanho e tiram o desenho da beirada.
 */
export const FOLGA_DA_CAIXA = 2;

export type Caixa = { x: number; y: number; largura: number; altura: number };

/**
 * A caixa que cerca a planta — sem o vaso, que quem chama pode não querer.
 *
 * Fica centrada em `CX` de propósito, ainda que a planta penda para um lado:
 * uma caixa colada nos extremos poria o broto torto dentro do próprio quadro,
 * e ele é um personagem, não um gráfico.
 */
export function caixaDaPlanta(stage: SproutStage, temEnfeite = false): Caixa {
  const stemTopY = STEM_TOP_Y[stage];
  const cy = stemTopY - 4;

  let esquerda = Infinity;
  let direita = -Infinity;
  let cima = Infinity;
  let baixo = -Infinity;

  const conta = (x: number, y: number, margem = 0) => {
    esquerda = Math.min(esquerda, x - margem);
    direita = Math.max(direita, x + margem);
    cima = Math.min(cima, y - margem);
    baixo = Math.max(baixo, y + margem);
  };

  // A haste, do vaso até o bulbo.
  conta(CX, POT_TOP_Y, TRACO_DA_HASTE / 2);
  conta(CX, stemTopY, TRACO_DA_HASTE / 2);

  // O bulbo, que leva a carinha dentro.
  conta(CX, cy, BULB_R[stage] + TRACO_DO_BULBO / 2);

  // As folhas, giradas e reduzidas como o desenho as gira e reduz.
  for (const folha of LEAVES_BY_STAGE[stage]) {
    const rad = (folha.rotate * Math.PI) / 180;
    const cos = Math.cos(rad);
    const sen = Math.sin(rad);
    for (const [px, py] of CASCO_DA_FOLHA) {
      const ex = px * folha.scale;
      const ey = py * folha.scale;
      conta(
        folha.x + ex * cos - ey * sen,
        folha.y + ex * sen + ey * cos,
        (TRACO_DA_FOLHA * folha.scale) / 2,
      );
    }
  }

  if (temEnfeite) {
    conta(CX - ENFEITES_ALCANCAM.esquerda, cy - ENFEITES_ALCANCAM.cima);
    conta(CX + ENFEITES_ALCANCAM.direita, cy + ENFEITES_ALCANCAM.baixo);
  }

  const meia = Math.max(CX - esquerda, direita - CX) + FOLGA_DA_CAIXA;
  return {
    x: CX - meia,
    y: cima - FOLGA_DA_CAIXA,
    largura: 2 * meia,
    altura: baixo - cima + 2 * FOLGA_DA_CAIXA,
  };
}

/** A mesma caixa no formato que a `viewBox` de um SVG espera. */
export function viewBoxDaPlanta(stage: SproutStage, temEnfeite = false): string {
  const c = caixaDaPlanta(stage, temEnfeite);
  const n = (v: number) => Math.round(v * 100) / 100;
  return `${n(c.x)} ${n(c.y)} ${n(c.largura)} ${n(c.altura)}`;
}
