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
  /**
   * O âmbar de *ler*, sobre o `amber100`.
   *
   * Era `'#8a6318'` escrito à mão dentro do Badge — a única cor de texto do app
   * que não vinha da paleta, e por isso a única que não teria como acompanhar o
   * tema escuro.
   */
  amber700: '#8A6318',
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
  amber700: '#E8C07A',
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
 * As cores de humor no escuro: os mesmos pastéis, um tom abaixo.
 *
 * Duas tentativas erradas antes desta, e as duas erraram no mesmo lugar —
 * mexer na luminosidade como se ela fosse a variável livre.
 *
 * A primeira **escureceu o pastel**. Amarelo-claro escurecido vira oliva;
 * verde-claro escurecido vira quase preto. A matiz, que é a única coisa que
 * distingue um humor do outro aqui, se perde exatamente no escurecer.
 *
 * A segunda foi ao outro extremo: **tom médio e saturação alta.** Resolveu a
 * matiz e criou outro problema, maior. Ler cada cor sozinha não era o teste;
 * o teste era olhar a tela inteira. Um mostarda saturado e três cinzas médios
 * lado a lado não são os pastéis do Brotinho num tema diferente — são outra
 * paleta, de outro aplicativo. O tema escuro deixava de parecer o mesmo lugar.
 *
 * O que faltava é que **num fundo escuro o pastel não precisa mudar de faixa.**
 * Ele já contrasta: `bg` é #211E1A. Uma pastilha clara sobre marrom quase preto
 * lê alto, separa bem e continua sendo a mesma cor que a pessoa vê de dia.
 * Então cada um destes é o pastel do tema claro com a luminosidade descendo uns
 * sete pontos e a saturação um pouco abaixo — o suficiente para não acender a
 * tela de madrugada, longe o bastante de virar cor nova.
 *
 * Repare que nenhum vem de `paletteEscura`. Lá, `yellow100` e companhia são
 * superfícies escuras, feitas para receber texto claro por cima. Estas são o
 * oposto: pastilhas claras que recebem a tinta escura da carinha — ver
 * `MoodFace`. Mesmo nome, trabalhos contrários; por isso ficam separadas.
 */
export const moodColorsEscuros: Record<Mood, string> = {
  feliz: '#F2E2B0',
  leve: '#CFE0D4',
  ansioso: '#C8DCE8',
  triste: '#C4CDD8',
  cansado: '#D3C9DC',
  neutro: '#E6DCC4',
};

/**
 * A cor do humor quando ela é **fundo**, e não pastilha.
 *
 * Aqui esbarrou o mesmo limite de `brown900` e `tracos`: um nome, dois
 * trabalhos opostos. Como pastilha — a carinha, a barra do gráfico, a palavra
 * escolhida — a cor do humor precisa ser **clara**, porque recebe tinta escura
 * por cima e porque é um objeto pequeno que tem de se destacar. Como fundo —
 * o halo atrás do broto, o disco do jardim, o círculo da colheita — ela é
 * **superfície**, e superfície clara no tema escuro é um holofote.
 *
 * Enquanto os dois usaram a mesma tabela, um dos dois ficou errado a cada
 * ajuste: com as cores escuras o jardim ficava sujo, e com as claras ele passou
 * a ter um disco aceso atrás de cada broto. Não era questão de achar o tom
 * certo — não existe tom que sirva para os dois.
 *
 * No tema claro os dois trabalhos coincidem: pastel sobre creme já é discreto,
 * e por isso `moodColorsFundo` é literalmente `moodColors` ali. É no escuro que
 * eles se separam, e é por isso que a tabela precisou existir.
 *
 * De quebra, some o acoplamento que eu tinha documentado em `Sprout`: o halo
 * era desenhado com opacidade — 0,4, depois 0,18, depois 0,14 — perseguindo a
 * cor de humor a cada mudança. Com a cor de fundo própria, ele volta a ser
 * opacidade 1 nos dois temas, como qualquer outra superfície.
 */
export const moodColorsFundo: Record<Mood, string> = moodColors;

/**
 * Os tons têm de ficar **entre** o fundo e o cartão, e é uma faixa estreita.
 *
 * `bg` é #211E1A e `surface` é #2C2823 — oito pontos de luminosidade separam os
 * dois. O halo da tela inicial é desenhado sobre o fundo; os discos do jardim e
 * da colheita, sobre o cartão. Alto demais, o halo vira uma lua num círculo de
 * 192 sobre marrom quase preto; baixo demais, o disco do jardim some dentro do
 * cartão. Estes ficam por volta de 18% de luminosidade: uns seis pontos acima
 * do fundo e uns três acima do cartão.
 *
 * A primeira tentativa foi a 20%, e no escuro isso já era disco em vez de
 * brilho. No escuro o olho lê diferença de luminosidade com mais sensibilidade
 * do que no claro — o mesmo delta que passa despercebido sobre creme salta
 * sobre marrom escuro. Por isso a distância aqui é menor que a do tema claro,
 * e não igual.
 */
export const moodColorsFundoEscuros: Record<Mood, string> = {
  feliz: '#383124',
  leve: '#27342C',
  ansioso: '#253039',
  triste: '#2A2E36',
  cansado: '#302A3A',
  neutro: '#363028',
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

/**
 * A preferência guardada nos ajustes. `sistema` obedece ao aparelho.
 *
 * Mora aqui, e não junto do provedor, porque `state/types.ts` precisa dela e
 * não pode arrastar o React junto: os testes rodam esses módulos em Node puro.
 */
export type PreferenciaDeTema = 'sistema' | 'claro' | 'escuro';

/** Os dois temas, para o provedor escolher e para o teste de contraste medir. */
export const TEMAS = {
  claro: { palette, colors, moodColors, moodColorsFundo, shadows },
  escuro: {
    palette: paletteEscura,
    colors: coresEscuras,
    moodColors: moodColorsEscuros,
    moodColorsFundo: moodColorsFundoEscuros,
    shadows: sombrasEscuras,
  },
} as const;

/**
 * As cores do desenho — iguais nos dois temas, de propósito.
 *
 * Aqui esbarrou o limite de reaproveitar a paleta: `brown900` quer dizer duas
 * coisas opostas. Como texto, é "a tinta mais escura que existe", e no tema
 * escuro isso tem de virar quase branco. Como traço do broto, é o contorno do
 * personagem — e ali inverter significa que o broto vira um negativo de si
 * mesmo: cara escura com contorno claro, que foi exatamente o que apareceu na
 * primeira tentativa.
 *
 * **Personagem não inverte.** O broto é o mesmo de dia e de noite; o que muda é
 * a luz em volta dele — o halo, o papel, o céu da janela, o cartão embaixo da
 * ilustração. Essa é a parte que o tema controla.
 *
 * Como não dependem do tema, estes valores são importados direto, sem gancho —
 * o que também tira as ilustrações inteiras da migração.
 */
/**
 * A paleta clara, para quem desenha.
 *
 * É o mesmo objeto que `palette`, com outro nome — e o nome é o ponto. Num
 * arquivo migrado, `palette` vem do gancho e muda com o tema; numa ilustração,
 * ela precisa ficar parada. Duas intenções com o mesmo identificador é
 * exatamente a armadilha que fez o broto virar negativo de si mesmo, então
 * cada uma ganhou o seu.
 */
export const paletteDoDesenho = palette;

export const tracos = {
  /** O contorno grosso de tudo: broto, vaso, ilustrações das práticas. */
  contorno: palette.brown900,
  /** O contorno verde-escuro das folhas. */
  contornoFolha: palette.green900,
  /*
    Estes três deixaram de apontar para a paleta e viraram valores próprios.

    Eram `green500`, `green300` e `terracotta400`, e apontar para lá amarrava a
    cor do personagem à cor da interface: mexer no verde de um botão mexia na
    folha do broto. São coisas diferentes, e a separação já existia em espírito
    — `tracos` nasceu justamente para o desenho não seguir o tema.

    Os tons também secaram. Quando o tom do app foi decidido como sóbrio em vez
    de fofo, saturação alta passou a ser o que mais denunciava brinquedo, e
    estes são os mesmos matizes alguns pontos abaixo.
  */
  folha: '#6F9079',
  folhaClara: '#A9C0B0',
  vaso: '#C08363',
  /** Papel dentro de um desenho — a folha do caderno ilustrado, a lua. */
  papel: palette.cream100,
} as const;
