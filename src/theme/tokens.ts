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
