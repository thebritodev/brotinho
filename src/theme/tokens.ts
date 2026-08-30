/**
 * Design tokens do Brotinho.
 * Porte direto das CSS custom properties do protótipo web (`:root { --green-900: ... }`).
 */

export const palette = {
  green900: '#2E4A3B',
  green700: '#3E6B54',
  green600: '#4C7B62',
  green500: '#5B8A72',
  green300: '#9EBBAA',
  green100: '#E3EDE6',
  green50: '#F1F6F2',

  cream100: '#FBF6EC',
  cream200: '#F5EFDE',
  cream300: '#EFE6CF',

  brown900: '#3A3630',
  brown700: '#5B5548',
  /**
   * Era `#8A8375`, que dava 3,49 de contraste sobre o creme — abaixo dos 4,5
   * exigidos para texto. É o tom de quase todo texto de apoio do app, então a
   * falha aparecia em dezenas de telas. Escurecido mantendo matiz e saturação:
   * agora 4,91 sobre o creme e 5,28 sobre o branco.
   */
  brown400: '#716B60',
  brown200: '#D9D1BF',
  brown100: '#E9E2D2',

  amber400: '#E8B65A',
  amber100: '#FBEFD4',

  terracotta400: '#D98866',
  /**
   * O terracota escuro, para quando a cor precisa ser *lida* e não só vista.
   *
   * O `terracotta400` continua existindo porque é a cor do vaso do broto e do
   * telhado da casinha — escurecer aquilo mudaria o desenho. Mas como texto ele
   * dá 2,74 sobre o branco, e como fundo de botão com texto branco dá os mesmos
   * 2,74. Este tom resolve os dois lados de uma vez: 5,26 nas duas direções.
   */
  terracotta600: '#AD512B',
  terracotta100: '#F7E2D8',

  blue300: '#A9C4D6',
  blue100: '#DCE8F0',

  /**
   * O céu de noite da cena da janela, e só isso.
   *
   * Entrou contrariando a regra de não inventar tom novo, porque a paleta não
   * tinha como escurecer: `blue300` é claro demais para ler como noite e
   * `brown900` deixaria o céu marrom. É a mesma família dessaturada dos
   * outros tons escuros — o azul que o `blue300` seria depois do pôr do sol.
   */
  night700: '#3E4A5C',

  lavender300: '#B9AEC7',
  lavender100: '#E4DEE8',

  yellow300: '#F2D680',
  yellow100: '#FCEFC7',

  slate300: '#AEB6BE',
  slate100: '#D8DEE6',
} as const;

export const colors = {
  bg: palette.cream100,
  surface: '#FFFFFF',
  surfaceSunken: palette.cream200,

  textPrimary: palette.brown900,
  textSecondary: palette.brown400,
  textInverse: '#FFFFFF',

  border: palette.brown200,
  borderStrong: palette.brown400,

  /**
   * O verde de *preencher*: fundo de botão, chave ligada, bolinha de progresso.
   *
   * Era o `green500`, e o texto branco em cima dele dava 3,94 — o botão
   * principal do app, aquele que a pessoa precisa enxergar para fazer qualquer
   * coisa, era o pior contraste da tela. O `green600` já existia na paleta e
   * resolve com 4,86, sem inventar tom novo e sem encostar no `green700`, que
   * continua sendo o verde de escrever.
   *
   * O `green500` segue na paleta: é a cor das folhas do broto, e ali ele é
   * forma, não texto.
   */
  primary: palette.green600,
  primaryStrong: palette.green700,
  primarySoft: palette.green100,

  accentWarm: palette.amber400,
  danger: palette.terracotta600,
  dangerSoft: palette.terracotta100,
} as const;

export type Mood = 'feliz' | 'leve' | 'ansioso' | 'triste' | 'cansado' | 'neutro';

export const moodColors: Record<Mood, string> = {
  feliz: palette.yellow100,
  leve: palette.green100,
  ansioso: palette.blue100,
  triste: palette.slate100,
  cansado: palette.lavender100,
  neutro: palette.cream200,
};

export const spacing = {
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  8: 32,
  10: 40,
  12: 48,
  16: 64,
} as const;

export const radius = {
  sm: 6,
  md: 8,
  lg: 12,
  xl: 16,
  pill: 999,
} as const;

export const borderWidth = 1.5;

/**
 * Equivalentes RN das sombras `--shadow-*`.
 * `shadow*` cobre iOS/web, `elevation` cobre Android.
 */
export const shadows = {
  sm: {
    shadowColor: palette.brown900,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 2,
  },
  md: {
    shadowColor: palette.brown900,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 4,
  },
  lg: {
    shadowColor: palette.brown900,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.13,
    shadowRadius: 28,
    elevation: 8,
  },
} as const;

// ===========================================================================
// TEMA ESCURO
// ===========================================================================

/*
  Os tipos abaixo são estruturais de propósito.

  As tabelas claras são `as const`, então cada valor tem tipo literal — usar
  `typeof palette` para tipar a escura exigiria que ela repetisse `'#FBF6EC'`
  exatamente, o que é o contrário do que se quer. Estes tipos guardam as
  **chaves** e liberam os valores, e é isso que garante o que importa: uma cor
  esquecida na paleta escura não compila.
*/
export type Palette = { [K in keyof typeof palette]: string };
export type Cores = { [K in keyof typeof colors]: string };
export type Sombra = {
  shadowColor: string;
  shadowOffset: { width: number; height: number };
  shadowOpacity: number;
  shadowRadius: number;
  elevation: number;
};
export type Sombras = { [K in keyof typeof shadows]: Sombra };

/**
 * A paleta escura.
 *
 * **Não é a clara invertida.** A identidade do app é papel creme, e papel à
 * noite não vira carvão: vira marrom quente sob um abajur. Todo fundo aqui tem
 * a mesma matiz do `brown900`, só que muito mais escuro — por isso `#211E1A` e
 * não `#000000`. Preto puro deixaria o app parecendo outro produto.
 *
 * As chaves são **as mesmas** da paleta clara, uma a uma. É o que permite trocar
 * o tema sem tocar em nenhum dos 305 lugares que escrevem `palette.brown700`:
 * o nome continua valendo, o valor é que muda de lado.
 *
 * Duas regras que guiaram cada valor:
 *
 * - **Os claros e os escuros trocam de papel.** `brown900` é o texto no tema
 *   claro e passa a ser quase-fundo no escuro; `cream100` é o fundo no claro e
 *   vira o texto no escuro. Quem escreve `palette.brown900` quer "a cor mais
 *   contrastante que existe", e continua recebendo isso.
 * - **Verde e terracota clareiam.** No claro eles são escuros para serem lidos
 *   sobre creme; no escuro precisam do contrário. Ver `confere-contraste.js`,
 *   que mede isso em vez de confiar no olho.
 */
export const paletteEscura: Palette = {
  // O verde escuro do traço vira o verde claro do traço: no escuro é ele que
  // desenha o contorno do broto contra o fundo.
  green900: '#B7D6C3',
  green700: '#9CC9AE',
  green600: '#7FAF92',
  green500: '#6E9C81',
  green300: '#4E6D5B',
  green100: '#2B3A32',
  green50: '#232E28',

  // Os cremes deixam de ser fundo e viram texto.
  cream100: '#F1EBDD',
  cream200: '#2C2823',
  cream300: '#38332C',

  // Os marrons trocam de ponta: o 900 era o texto, agora é quase o fundo.
  brown900: '#F1EBDD',
  brown700: '#CFC6B4',
  brown400: '#ADA595',
  brown200: '#453F37',
  brown100: '#38332C',

  amber400: '#E8B65A',
  amber100: '#4A4126',

  terracotta400: '#D98866',
  terracotta600: '#E89372',
  terracotta100: '#3A251E',

  blue300: '#6E8DA5',
  blue100: '#3A5468',

  night700: '#3E4A5C',

  lavender300: '#8E82A3',
  lavender100: '#514A63',

  yellow300: '#D7B95F',
  yellow100: '#7A6836',

  slate300: '#79828C',
  slate100: '#4A525C',
};

export const coresEscuras: Cores = {
  bg: '#211E1A',
  surface: '#2C2823',
  surfaceSunken: '#1A1714',

  textPrimary: paletteEscura.cream100,
  textSecondary: paletteEscura.brown400,
  /**
   * No claro é branco sobre verde escuro; no escuro é o contrário — texto
   * escuro sobre o verde claro do botão. Inverter os dois de uma vez é o que
   * mantém o botão legível sem inventar um terceiro verde.
   */
  textInverse: '#1A1714',

  border: paletteEscura.brown200,
  borderStrong: paletteEscura.brown400,

  primary: paletteEscura.green600,
  primaryStrong: paletteEscura.green700,
  primarySoft: paletteEscura.green100,

  accentWarm: paletteEscura.amber400,
  danger: paletteEscura.terracotta600,
  dangerSoft: paletteEscura.terracotta100,
};

/**
 * As cores de humor no escuro.
 *
 * No claro são pastéis quase brancos, porque o fundo é creme. No escuro os
 * mesmos pastéis cegariam — mas escurecer demais faria o dia registrado ficar
 * igual ao dia vazio no gráfico. São tons médios: distinguem a matiz e não
 * brilham. `confere-contraste.js` cobra que cada um se separe do fundo.
 */
export const moodColorsEscuros: Record<Mood, string> = {
  feliz: paletteEscura.yellow100,
  leve: paletteEscura.green100,
  ansioso: paletteEscura.blue100,
  triste: paletteEscura.slate100,
  cansado: paletteEscura.lavender100,
  neutro: paletteEscura.cream300,
};

/**
 * Sombra no escuro quase não aparece — o que separa um cartão do fundo ali é a
 * própria diferença de cor, não a sombra. Mantida com opacidade maior para o
 * pouco que rende, e preta em vez de marrom.
 */
export const sombrasEscuras: Sombras = {
  sm: { ...shadows.sm, shadowColor: '#000000', shadowOpacity: 0.3 },
  md: { ...shadows.md, shadowColor: '#000000', shadowOpacity: 0.38 },
  lg: { ...shadows.lg, shadowColor: '#000000', shadowOpacity: 0.45 },
};

export type Tema = 'claro' | 'escuro';

/** Os dois temas, para o provedor escolher e para o teste de contraste medir. */
export const TEMAS = {
  claro: { palette, colors, moodColors, shadows },
  escuro: {
    palette: paletteEscura,
    colors: coresEscuras,
    moodColors: moodColorsEscuros,
    shadows: sombrasEscuras,
  },
} as const;
