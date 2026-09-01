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

/**
 * Valores que rendem enfeites no broto (ver tela "Meus valores").
 *
 * São quatro, e os valores são cinco: **coragem não tem desenho.** Não é
 * esquecimento a consertar sem pedir — é um desenho que ninguém fez.
 */
export type Decoration = 'criatividade' | 'curiosidade' | 'autocuidado' | 'conexao';

const ENFEITES: readonly Decoration[] = [
  'criatividade',
  'curiosidade',
  'autocuidado',
  'conexao',
];

/**
 * O valor guardado numa planta rende enfeite?
 *
 * As duas telas do jardim traziam `planta.valor as never` — um `string`
 * empurrado para dentro de `Decoration` sem ninguém conferir. Enquanto a caixa
 * do broto era fixa, o pior que acontecia era não desenhar nada. Com a caixa
 * calculada, um valor sem desenho passa a **alargar** a caixa para caber um
 * enfeite que não existe, e o broto encolhe sem motivo. É o caso de "coragem",
 * que é um valor de verdade e acontece de verdade.
 */
export function ehEnfeite(v: unknown): v is Decoration {
  return typeof v === 'string' && (ENFEITES as readonly string[]).includes(v);
}

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

/**
 * Até onde o vaso chega, contando a metade de fora do traço de 3,5.
 *
 * O vaso é um `d` de Bézier e um `<Rect>` dentro de `Sprout`, não uma tabela,
 * então estes três números são transcritos e não calculados — como o casco da
 * folha. E como ele, ficam guardados por `confere-broto.js`, que lê o desenho
 * do arquivo e confere que a transcrição ainda bate.
 */
export const VASO_ALCANCA = { esquerda: 56.25, direita: 143.75, baixo: 221.75 };

/**
 * A caixa que cerca planta **e** vaso.
 *
 * Existe para quando não há halo atrás do broto. O enquadramento de sempre,
 * `0 0 200 224`, foi desenhado em volta do halo: ele reserva uns 53 de altura
 * acima da planta, que é exatamente o espaço que o disco ocupava. Sem disco,
 * aquilo vira um vazio no topo da tela e o broto parece pequeno e caído.
 *
 * Recortando, o mesmo desenho passa a ocupar cerca de um terço a mais de
 * altura no mesmo espaço da tela — sem mexer em `size`, que era o botão
 * errado: aumentar `size` aumentava o vazio junto.
 */
export function caixaComVaso(stage: SproutStage, temEnfeite = false): Caixa {
  const planta = caixaDaPlanta(stage, temEnfeite);
  const esquerda = Math.min(planta.x, VASO_ALCANCA.esquerda);
  const direita = Math.max(planta.x + planta.largura, VASO_ALCANCA.direita);
  const meia = Math.max(CX - esquerda, direita - CX);
  return {
    x: CX - meia,
    y: planta.y,
    largura: 2 * meia,
    altura: VASO_ALCANCA.baixo + FOLGA_DA_CAIXA - planta.y,
  };
}

/** Uma caixa no formato que a `viewBox` de um SVG espera. */
export function comoViewBox(c: Caixa): string {
  const n = (v: number) => Math.round(v * 100) / 100;
  return `${n(c.x)} ${n(c.y)} ${n(c.largura)} ${n(c.altura)}`;
}

/** A caixa da planta sozinha, já no formato da `viewBox`. */
export function viewBoxDaPlanta(stage: SproutStage, temEnfeite = false): string {
  return comoViewBox(caixaDaPlanta(stage, temEnfeite));
}

/** O enquadramento de sempre, desenhado em volta do halo. */
export const CAIXA_COM_HALO: Caixa = { x: 0, y: 0, largura: 200, altura: 224 };
