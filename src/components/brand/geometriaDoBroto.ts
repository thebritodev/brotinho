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

import type { Mood } from '../../theme';

export type SproutStage = 1 | 2 | 3;

/**
 * Valores que rendem enfeites no broto (ver tela "Meus valores").
 *
 * Eram quatro para cinco valores: coragem não tinha desenho, e isso ficou
 * anotado aqui por um tempo como "um desenho que ninguém fez". Agora tem — a
 * flor. Ver `Decorations`, no `Sprout`, para o porquê de ser uma flor.
 */
export type Decoration =
  | 'criatividade'
  | 'curiosidade'
  | 'autocuidado'
  | 'conexao'
  | 'coragem';

const ENFEITES: readonly Decoration[] = [
  'criatividade',
  'curiosidade',
  'autocuidado',
  'conexao',
  'coragem',
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

/**
 * Os seis rostos, num lugar só.
 *
 * **Havia duas cópias desta tabela** — uma no `Sprout`, outra no `MoodFace` —
 * e elas divergiram na primeira vez que alguém mexeu num rosto: o broto grande
 * passou a sorrir de um jeito e a carinha da fileira de outro, na mesma tela.
 * Duas descrições do mesmo desenho não têm como ficar iguais por disciplina.
 *
 * As coordenadas valem numa `viewBox` de -26 a 26, com o rosto no centro. Quem
 * desenha num raio diferente escala o grupo inteiro em vez de recalcular
 * ponto a ponto — ver `MoodFace` e `Face`, em `Sprout`.
 *
 * `feliz` tem olho redondo como os outros cinco, e não em arco: a 24 px, que é
 * o tamanho dele na fileira de humores, dois arcos sobre uma boca leem como
 * sobrancelhas. Só a boca o distingue do `leve`, e basta.
 */
export type Cara = { eye: string | 'circle'; r?: number; mouth: string };

export const CARAS: Record<Mood, Cara> = {
  feliz: { eye: 'circle', r: 2.6, mouth: 'M -10 5 Q 0 14 10 5' },
  leve: { eye: 'circle', r: 2.6, mouth: 'M -8 6 Q 0 11 8 6' },
  ansioso: { eye: 'circle', r: 3.2, mouth: 'M -6 8 Q -3 5 0 8 Q 3 11 6 8' },
  triste: { eye: 'circle', r: 2.6, mouth: 'M -9 9 Q 0 2 9 9' },
  cansado: { eye: 'M -9 -1 L -2 -1', mouth: 'M -7 7 L 7 7' },
  neutro: { eye: 'circle', r: 2.4, mouth: 'M -7 7 L 7 7' },
};

/**
 * As poses — o que o broto está **fazendo**, por cima do que ele está sentindo.
 *
 * Humor e pose são dois eixos, e é de propósito que sejam dois. `mood` é o que
 * a pessoa disse que está sentindo, e é ela quem o define; `pose` é o que o
 * broto faz naquela tela, e é a tela quem define. Um broto pode estar triste e
 * ainda assim acenar quando a pessoa chega, e essa combinação é a que dá
 * personagem em vez de termômetro.
 *
 * ## Por que a tabela mora aqui, e não em cada tela
 *
 * Pela mesma razão que `CARAS` mora aqui: havia duas descrições do mesmo rosto
 * e elas divergiram. Uma pose descrita na tela onde é usada é uma pose que só
 * existe ali — e a de acenar aparece em três telas.
 *
 * ## O que cada campo decide
 *
 * O rosto é composto: a pose sobrepõe o que quiser do humor e deixa o resto
 * passar. `dorme` fecha os olhos seja qual for o humor, mas `pensa` só muda a
 * boca e para onde os olhos olham — quem está ansioso continua com o olho
 * maior.
 */
/**
 * Os rostos das pastilhas de humor — e por que não são os do broto.
 *
 * ## Duas tabelas, de propósito
 *
 * `CARAS` é a cara do **personagem**: ela é desenhada num bulbo de 27 de raio,
 * vista de longe, e tem de continuar legível quando o broto está do tamanho de
 * um polegar numa faixa de céu. Por isso ela é mínima — dois olhos e uma boca.
 *
 * Isto aqui é outra coisa: é o **símbolo de um sentimento**, num botão de 56
 * que a pessoa olha de perto para escolher. Ali cabe, e precisa caber, o que
 * distingue ansiedade de tristeza sem ler o rótulo: a sobrancelha, a gota de
 * suor, a lágrima, o "z" de quem está acabado. O documento desenha assim, e
 * desenha assim porque a tarefa é outra.
 *
 * A regra antiga continua valendo, e é por isso que esta tabela mora **aqui**
 * e não dentro do `MoodFace`: houve um tempo em que havia duas cópias do rosto
 * em dois arquivos, e elas divergiram na primeira vez que alguém mexeu numa.
 * Uma casa para a geometria dos rostos; duas tabelas dentro dela, com nomes
 * que dizem para que serve cada uma.
 *
 * As coordenadas são as do documento, numa caixa de 56 por 56.
 */
export type RostoDoHumor = {
  /** Os olhos: dois círculos, ou dois caminhos já espelhados. */
  olhos: { tipo: 'circulo'; r: number; y: number } | { tipo: 'traco'; d: string };
  boca: string;
  /** A boca preenchida do `feliz` — a única que é uma forma, e não um traço. */
  bocaCheia?: boolean;
  /** As sobrancelhas, quando a expressão depende delas. */
  sobrancelhas?: string;
  /** A gota: de suor no ansioso, de choro no triste. */
  gota?: { d: string; traco: number };
  /** O "z" de quem está acabado, em cima e à direita. */
  zeta?: boolean;
  /** A bochecha corada — só quem está bem cora. */
  bochecha?: boolean;
};

/** Onde os olhos ficam, na caixa de 56. */
export const OLHOS_DO_HUMOR = { esquerdo: 21, direito: 35 };

export const ROSTOS_DO_HUMOR: Record<Mood, RostoDoHumor> = {
  feliz: {
    olhos: { tipo: 'traco', d: 'M 17 24 q 4 -5 8 0 M 31 24 q 4 -5 8 0' },
    boca: 'M 19 32 q 9 10 18 0 Z',
    bocaCheia: true,
    bochecha: true,
  },
  leve: {
    olhos: { tipo: 'circulo', r: 2.6, y: 24 },
    boca: 'M 21 33 q 7 6 14 0',
    bochecha: true,
  },
  ansioso: {
    olhos: { tipo: 'circulo', r: 3.2, y: 25 },
    sobrancelhas: 'M 16 18 l 7 -2 M 40 18 l -7 -2',
    boca: 'M 20 35 q 3 -3 6 0 q 3 3 6 0 q 2 -2 4 0',
    gota: { d: 'M 44 16 q 3 4 0 6 q -3 -2 0 -6 Z', traco: 1.6 },
  },
  cansado: {
    olhos: { tipo: 'traco', d: 'M 17 25 q 4 3 8 0 M 31 25 q 4 3 8 0' },
    boca: 'M 23 34 l 10 0',
    zeta: true,
  },
  triste: {
    olhos: { tipo: 'circulo', r: 2.6, y: 25 },
    sobrancelhas: 'M 16 21 q 3 -1 7 -4 M 40 21 q -3 -1 -7 -4',
    boca: 'M 22 36 q 6 -4 12 0',
    gota: { d: 'M 20 30 q 2 3 0 5 q -2 -2 0 -5 Z', traco: 1.4 },
  },
  /*
    O neutro não aparece na fileira de escolha — ele é o estado de quem ainda
    não respondeu. Existe aqui porque a tabela cobre `Mood` inteiro, e porque
    o calendário do mês desenha os dias sem registro.
  */
  neutro: {
    olhos: { tipo: 'circulo', r: 2.4, y: 25 },
    boca: 'M 22 34 l 12 0',
  },
};

/**
 * O "z" do cansado, desenhado a traço.
 *
 * Não é um `<Text>` com a fonte do app: fonte própria dentro de SVG falha em
 * silêncio no Android — a mesma história do `ArDoBroto`, e lá está escrita por
 * extenso. Três traços fazem o mesmo zê e não dependem de fonte nenhuma.
 */
export const ZETA_DO_CANSADO = 'M 38 13 H 46 L 38 21 H 46';

/** As bochechas do `feliz` e do `leve`, na caixa de 56. */
export const BOCHECHAS_DO_HUMOR = [
  { cx: 15, cy: 30 },
  { cx: 41, cy: 30 },
];

export type Pose =
  | 'parado'
  | 'acena'
  | 'espreguica'
  | 'pensa'
  | 'calmo'
  | 'dorme'
  | 'comemora';

/** O olho que a pose impõe, quando impõe algum. */
export type OlhoDePose = 'fechado' | 'feliz' | 'cansado';

/**
 * A boca que a pose impõe.
 *
 * `'aberta'` e `'ronco'` não são caminhos: a primeira é preenchida e a segunda
 * é uma elipse que pulsa. As duas são desenhadas à parte, no `Sprout`.
 */
export type BocaDePose = string | 'aberta' | 'ronco';

export type Balanco = { graus: number; ms: number };

export type MexeAsFolhas = {
  /** Quais folhas da tabela do estágio entram no movimento. */
  quais: 'primeira' | 'as duas de baixo';
  /** A amplitude, em graus. A segunda folha vai para o outro lado. */
  graus: number;
  /** O ciclo inteiro, ida e volta. */
  ms: number;
  /** `acena` vai e volta duas vezes por ciclo; as outras, uma. */
  vaievem?: boolean;
};

export type DescricaoDaPose = {
  olho?: OlhoDePose;
  boca?: BocaDePose;
  /** Para onde a carinha olha, nas unidades do desenho. */
  olhar?: { x: number; y: number };
  /** Força a bochecha a aparecer — ou a sumir, em quem dorme. */
  bochecha?: boolean;
  /** O que flutua em volta: o sono ou a festa. */
  ar?: 'zzz' | 'brilhos';
  folhas?: MexeAsFolhas;
  /** Um pulo, em unidades de desenho. */
  pulo?: { altura: number; ms: number };
  /** O bamboleio próprio da pose. Quando falta, vale a brisa de sempre. */
  balanco?: Balanco;
};

/**
 * Os arcos de olho das poses.
 *
 * Valem nas mesmas unidades de `CARAS`: centradas no olho, num bulbo de raio
 * 27. `fechado` é uma pálpebra caída — a curva desce; `feliz` é a mesma curva
 * ao contrário. `cansado` é a reta que o humor de mesmo nome já usava, e está
 * repetida aqui de propósito: a pose de dormir não deve depender de qual humor
 * a pessoa marcou.
 */
export const OLHOS_DE_POSE: Record<OlhoDePose, string> = {
  fechado: 'M -5.5 -1 Q 0 4 5.5 -1',
  feliz: 'M -5.5 1.5 Q 0 -5.5 5.5 1.5',
  cansado: 'M -5 0 L 5 0',
};

export const POSES: Record<Pose, DescricaoDaPose> = {
  /** O padrão: o broto só existindo. A brisa de `AnimatedSprout` basta. */
  parado: {},
  /**
   * Acenar com a folha da frente.
   *
   * Duas idas por ciclo, e não uma: um aceno de uma ida só lê como a folha
   * tendo sido empurrada pelo vento. O que faz virar cumprimento é repetir.
   */
  acena: {
    bochecha: true,
    folhas: { quais: 'primeira', graus: 28, ms: 1600, vaievem: true },
  },
  /** Espreguiçar: as duas folhas de baixo abrem para fora, devagar. */
  espreguica: {
    olho: 'feliz',
    bochecha: true,
    folhas: { quais: 'as duas de baixo', graus: 16, ms: 3400 },
  },
  /**
   * Pensar: olha para cima e para o lado, com a boca torta.
   *
   * O olhar é a parte que importa. Boca torta sozinha lê como dúvida sobre
   * alguma coisa na tela; com os olhos fora do eixo, lê como estar longe.
   *
   * ## A torta tem de subir, não descer
   *
   * A primeira versão era `M -4 8 Q 1 6 5 9`, e o ponto de controle acima das
   * pontas faz a curva arquear **para cima** — que em tela, onde o y cresce
   * para baixo, é a boca do `triste`. O broto ficava de cara triste em sete
   * lugares: o guia dos passos, o diário em branco, dois cartões do
   * onboarding e três temas.
   *
   * E não é um erro só de desenho. A regra do personagem é que ele não
   * espelha o estado de quem está ali — um broto triste na tela de quem veio
   * atravessar a tristeza deixa a pessoa sozinha nela. Pensar é olhar para
   * longe, não é estar mal.
   *
   * A boca de agora é quase uma linha, subindo um pouco à direita: o canto
   * levantado de quem está considerando alguma coisa.
   */
  pensa: {
    boca: 'M -5 8.5 Q 0 9.6 5 7',
    olhar: { x: 2, y: -3 },
  },
  /** Calmo: olhos fechados e um sorriso mínimo. É a pose de quem respira. */
  calmo: {
    olho: 'fechado',
    boca: 'M -6 7 Q 0 10.5 6 7',
  },
  /**
   * Dormir: olhos fechados, boca redonda que pulsa, e os zês.
   *
   * Sem bochecha — a cor da bochecha é sangue subindo, e quem dorme não cora.
   * O balanço é mais lento e só para um lado, como quem pende.
   */
  dorme: {
    olho: 'fechado',
    boca: 'ronco',
    bochecha: false,
    ar: 'zzz',
    balanco: { graus: 2, ms: 7000 },
  },
  /** Comemorar: boca aberta, pulo curto, folhas batendo e brilhos em volta. */
  comemora: {
    olho: 'feliz',
    boca: 'aberta',
    bochecha: true,
    ar: 'brilhos',
    folhas: { quais: 'as duas de baixo', graus: 22, ms: 700 },
    pulo: { altura: 16, ms: 700 },
  },
};

/**
 * Onde ficam os zês e os brilhos, em volta da carinha.
 *
 * São deslocamentos a partir do centro do bulbo, em unidades do desenho, e
 * quem os posiciona na tela é `ArDoBroto` — fora do SVG, porque ali cada um
 * pode ser uma `View` animada pelo driver nativo em vez de um `<animate>` que
 * o `react-native-svg` não roda.
 *
 * O raio do bulbo entra na conta em quem chama: o estágio 1 tem 20 de raio e o
 * 3 tem 33, e um deslocamento fixo grudaria os zês na cabeça do menor.
 */
export type LugarNoAr = {
  /** `x = r * raio + solto`, a partir do centro do bulbo. */
  x: { raio: number; solto: number };
  y: { raio: number; solto: number };
  escala: number;
};

export const AR_DO_BROTO: { zzz: LugarNoAr[]; brilhos: LugarNoAr[] } = {
  /** Três zês subindo na diagonal, cada um maior que o anterior. */
  zzz: [
    { x: { raio: 1, solto: 6 }, y: { raio: -1, solto: 4 }, escala: 1 },
    { x: { raio: 1, solto: 15 }, y: { raio: -1, solto: -8 }, escala: 1.25 },
    { x: { raio: 1, solto: 24 }, y: { raio: -1, solto: -20 }, escala: 1.5 },
  ],
  /** Cinco brilhos em volta, em tamanhos diferentes para não virar coroa. */
  brilhos: [
    { x: { raio: -1, solto: -22 }, y: { raio: -1, solto: 2 }, escala: 1 },
    { x: { raio: 1, solto: 20 }, y: { raio: -1, solto: -8 }, escala: 1.2 },
    { x: { raio: 1, solto: 30 }, y: { raio: 0, solto: 6 }, escala: 0.7 },
    { x: { raio: -1, solto: -30 }, y: { raio: 0, solto: 14 }, escala: 0.8 },
    { x: { raio: 0, solto: -8 }, y: { raio: -1, solto: -22 }, escala: 0.6 },
  ],
};

/** Onde um lugar no ar cai, em unidades de desenho, para um bulbo de raio `r`. */
export function noAr(l: LugarNoAr, r: number) {
  return { x: l.x.raio * r + l.x.solto, y: l.y.raio * r + l.y.solto };
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

/*
  As espessuras do desenho.

  Eram 3, 3,5 e 6. Afinaram juntas quando o tom do app foi decidido como
  **sóbrio** em vez de fofo: é a espessura do contorno, mais que a forma, que
  separa "parece brinquedo" de "parece objeto". A referência de design premium
  em bem-estar de 2026 aponta contenção, não mais fofura — e a forma do broto
  não mudou nada nessa passagem.

  A caixa que cerca o desenho é calculada a partir destes números, então ela
  encolheu sozinha junto com o traço. É para isso que eles moram aqui.
*/

/** A espessura do contorno da folha, em `Leaf`. */
export const TRACO_DA_FOLHA = 2.2;

/** A espessura do contorno do bulbo. */
export const TRACO_DO_BULBO = 2.2;

/** A espessura da haste. */
export const TRACO_DA_HASTE = 3.6;

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

/**
 * A largura que define a escala do mascote na tela.
 *
 * É a largura do enquadramento antigo, `0 0 200 224`, que existiu enquanto
 * havia um disco de humor atrás do broto. O disco saiu, mas o número fica: ele
 * é o que faz o broto ter hoje exatamente o tamanho que sempre teve, em vez de
 * mudar de tamanho junto com a caixa. Ver `medidasDoMascote`.
 */
export const LARGURA_DE_REFERENCIA = 200;

/** A caixa que o mascote usa: fechada em volta da planta e do vaso. */
export function caixaDoMascote(stage: SproutStage, temEnfeite: boolean): Caixa {
  return caixaComVaso(stage, temEnfeite);
}

/**
 * O quadro do mascote na tela, em pixels.
 *
 * **A escala é sempre a mesma, e é isso que importa aqui.** Um pixel de tela
 * vale `size / 200` unidades de desenho, venha de qual caixa vier — então o
 * broto tem exatamente o mesmo tamanho nos dois temas. O que muda entre eles é
 * só o quadro: sem halo ele encolhe e passa a abraçar o desenho, em vez de
 * reservar a altura que o disco ocupava.
 *
 * A primeira versão disto amarrava a altura em `size * 1,12` e tirava a largura
 * da proporção da caixa. O efeito colateral era o desenho crescer 65% no tema
 * escuro — some o vazio, sim, mas trocando um problema por outro: trocar de
 * tema virava trocar de app. Encolher o quadro sobe o broto sem tocar no
 * tamanho dele, que era o pedido.
 */
export function medidasDoMascote(caixa: Caixa, size: number) {
  const escala = size / LARGURA_DE_REFERENCIA;
  return { largura: caixa.largura * escala, altura: caixa.altura * escala };
}

/**
 * O quadro do broto: a caixa escolhida e o tamanho dela na tela.
 *
 * As duas regras de quadro — a do mascote, de escala fixa, e a do broto dos
 * cartões, que preenche o espaço — estavam escritas duas vezes: uma no
 * `Sprout`, que desenha, e outra no `AnimatedSprout`, que reserva o espaço.
 * Enquanto ninguém precisava de mais nada, duas cópias passavam; quando a
 * folha que acena passou a ser posicionada por fora do SVG, a conta virou
 * três, e a terceira precisa cair exatamente em cima das outras duas.
 */
export function quadroDoBroto(
  stage: SproutStage,
  size: number,
  { showPot = true, temEnfeite = false }: { showPot?: boolean; temEnfeite?: boolean } = {},
) {
  const caixa = showPot ? caixaDoMascote(stage, temEnfeite) : caixaDaPlanta(stage, temEnfeite);
  const { largura, altura } = showPot
    ? medidasDoMascote(caixa, size)
    : { altura: size * 1.12, largura: size * 1.12 * (caixa.largura / caixa.altura) };
  return { caixa, largura, altura, escala: largura / caixa.largura };
}

/** Onde um ponto do desenho cai dentro de um quadro já medido, em pixels. */
export function noQuadro(
  quadro: { caixa: Caixa; largura: number; altura: number },
  x: number,
  y: number,
) {
  return {
    x: ((x - quadro.caixa.x) / quadro.caixa.largura) * quadro.largura,
    y: ((y - quadro.caixa.y) / quadro.caixa.altura) * quadro.altura,
  };
}

/**
 * A altura do desenho na tela — e, por tabela, o diâmetro do halo de luz.
 *
 * No documento de redesenho, o halo da tela inicial é um círculo de 300 sobre
 * um broto de 300 de altura. A regra é essa: **diâmetro igual à altura do
 * desenho**, não uma fração inventada dela.
 *
 * Existe como função, e não como medida tirada em tempo de execução, porque
 * medir se mostrou pouco confiável: `onLayout` não dispara no
 * `react-native-web`, então a versão que media ficava com o valor de recuo no
 * navegador — e era justamente no navegador que eu conferia. Um número que só
 * está certo onde não dá para olhar não serve.
 *
 * Aqui não há o que falhar: é a mesma tabela que desenha o broto.
 */
export function alturaDoMascote(stage: SproutStage, size: number, temEnfeite = false) {
  return medidasDoMascote(caixaDoMascote(stage, temEnfeite), size).altura;
}
