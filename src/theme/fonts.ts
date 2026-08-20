/**
 * No React Native `fontWeight` não combina com fontes customizadas de forma confiável:
 * cada peso é uma família própria. Por isso o token expõe a família por peso.
 */
export const fonts = {
  /** Baloo 2 — títulos, números grandes, o "voz" da marca. */
  display: {
    regular: 'Baloo2_400Regular',
    medium: 'Baloo2_500Medium',
    semiBold: 'Baloo2_600SemiBold',
    bold: 'Baloo2_700Bold',
    extraBold: 'Baloo2_800ExtraBold',
  },
  /** Nunito — corpo de texto, rótulos, botões. */
  body: {
    regular: 'Nunito_400Regular',
    semiBold: 'Nunito_600SemiBold',
    bold: 'Nunito_700Bold',
    extraBold: 'Nunito_800ExtraBold',
  },
} as const;

/** Escala tipográfica (`--text-*`). */
export const type = {
  h1: { fontFamily: fonts.display.bold, fontSize: 32, lineHeight: 32 * 1.2 },
  h2: { fontFamily: fonts.display.bold, fontSize: 24, lineHeight: 24 * 1.25 },
  h3: { fontFamily: fonts.display.semiBold, fontSize: 19, lineHeight: 19 * 1.3 },
  bodyLg: { fontFamily: fonts.body.regular, fontSize: 17, lineHeight: 17 * 1.5 },
  body: { fontFamily: fonts.body.regular, fontSize: 15, lineHeight: 15 * 1.5 },
  caption: { fontFamily: fonts.body.regular, fontSize: 13, lineHeight: 13 * 1.4 },
  label: { fontFamily: fonts.body.bold, fontSize: 13, lineHeight: 13 * 1.2 },
} as const;
