import type { BoxShadowValue } from 'react-native';

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

/**
 * Os raios do redesenho.
 *
 * Eram 6/8/12/16. O desenho novo trabalha em 10/14/18/28, e a mudanca e mais
 * do que cosmetica: com sombra longa e anel de luz na borda, canto de 12
 * parece corte, nao dobra. O cartao e a peca que define o resto, e ele e 18
 * -- o raio mais frequente do documento inteiro, 91 ocorrencias.
 *
 * Os nomes nao mudaram, e e o que faz esta linha valer por trinta e nove:
 * `radius.lg` aparece em 39 lugares e todos passam a 18 de uma vez. Renomear
 * para `cartao`/`chip` seria mais bonito e obrigaria a tocar em 72 chamadas
 * para nao mudar nada de comportamento.
 */
export const radius = {
  sm: 10,
  md: 14,
  lg: 18,
  xl: 28,
  pill: 999,
  /*
    O botão tem raio próprio, e fora da escada, porque no documento ele é 16 —
    entre o cartão (18) e a pastilha (14) — em todas as vinte e poucas
    aparições. Arredondar para um dos vizinhos seria escolher a escada em vez
    do desenho; e a escada existe para dar consistência, não para vencer dele.
  */
  botao: 16,
} as const;

export const borderWidth = 1.5;

/**
 * As sombras do redesenho — e por que elas sao duas coisas, nao uma.
 *
 * ## O que mudou
 *
 * A sombra antiga era um borrao macio embaixo do cartao: um deslocamento
 * pequeno, opacidade 0,07, e pronto. A do desenho novo tem **duas camadas**,
 * e o efeito vem da combinacao:
 *
 * 1. um **anel de luz por dentro** da borda -- `inset 0 0 0 1px` em branco
 *    quase opaco. E ele que da o aspecto de vidro: a borda superior do cartao
 *    parece pegar a luz do ambiente.
 * 2. uma sombra **longa, deslocada e recolhida** -- `0 16px 32px -20px`. O
 *    raio grande espalha, e o spread negativo puxa de volta, entao ela cai
 *    longe do cartao sem virar mancha em volta dele.
 *
 * Nenhuma das duas cabe na API antiga: `shadowOffset`/`shadowOpacity` fazem
 * **uma** sombra, sem `inset` e sem spread.
 *
 * ## Por que ha dois caminhos aqui
 *
 * `boxShadow` aceita lista e `inset`, e existe no React Native 0.81 -- mas so
 * desenha na **Nova Arquitetura**. Este projeto nao declara `newArchEnabled`,
 * entao ele herda o padrao do SDK, e herdado nao e o mesmo que sabido: se eu
 * apostar em `boxShadow` e a Fabric estiver desligada, o app perde **todas** as
 * sombras de uma vez, sem erro nenhum, e a falha aparece so no aparelho.
 *
 * Entao a escolha e feita em tempo de execucao, olhando se a Fabric esta de
 * pe. Onde ela esta, sai o desenho novo; onde nao esta, sai a sombra antiga,
 * que e pior mas existe. Isto e para ser apagado quando o projeto declarar a
 * arquitetura explicitamente -- ai sobra so um caminho.
 */
const NA_FABRIC = typeof global !== 'undefined' && !!(global as { nativeFabricUIManager?: unknown }).nativeFabricUIManager;

/** Uma sombra do desenho novo, com o recuo da antiga para quem nao tem Fabric. */
const sombra = (nova: BoxShadowValue[], antiga: SombraLegada): Sombra =>
  NA_FABRIC ? { boxShadow: nova } : antiga;

/** Branco do anel de luz: forte no claro, quase nada no escuro. */
const ANEL_CLARO: BoxShadowValue = {
  offsetX: 0, offsetY: 0, blurRadius: 0, spreadDistance: 1,
  color: 'rgba(255,255,255,0.9)', inset: true,
};
const ANEL_ESCURO: BoxShadowValue = { ...ANEL_CLARO, color: 'rgba(255,255,255,0.1)' };

export const shadows = {
  /** Cartao de lista, chip, botao pequeno. */
  sm: sombra(
    [ANEL_CLARO, { offsetX: 0, offsetY: 10, blurRadius: 22, spreadDistance: -14, color: 'rgba(58,54,48,0.6)' }],
    { shadowColor: palette.brown900, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 8, elevation: 2 },
  ),
  /** Cartao principal de uma tela. */
  md: sombra(
    [ANEL_CLARO, { offsetX: 0, offsetY: 16, blurRadius: 32, spreadDistance: -20, color: 'rgba(58,54,48,0.6)' }],
    { shadowColor: palette.brown900, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 16, elevation: 4 },
  ),
  /**
   * O que flutua sobre a tela: folha de baixo, modal, o aparelho no mockup.
   *
   * Esta nao leva anel -- e a unica das tres sem ele. Uma folha que sobe por
   * cima do conteudo ja se separa pela distancia; somar borda luminosa faria
   * dela um objeto recortado em vez de uma camada acima.
   */
  lg: sombra(
    [{ offsetX: 0, offsetY: 26, blurRadius: 60, spreadDistance: -22, color: 'rgba(58,54,48,0.45)' }],
    { shadowColor: palette.brown900, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.13, shadowRadius: 28, elevation: 8 },
  ),
  /**
   * A barra de abas, e e a unica sombra do app que aponta para cima.
   *
   * Ela existe porque a barra deixou de reservar espaco no layout: a tela
   * passa por tras dela agora, e sem nada separando os dois o painel encosta
   * direto no conteudo. O documento resolve com sombra para cima em vez de
   * borda -- `0 -18px 36px -24px`, numeros dele.
   *
   * **Na Fabric desligada, no Android, esta sombra nao existe.** O `elevation`
   * so sabe desenhar sombra para baixo; nao ha valor legado que faca o que
   * esta linha faz. O recuo assumido e ficar sem ela, e nao trocar por uma
   * sombra que cai para o lado errado.
   */
  barra: sombra(
    [{ offsetX: 0, offsetY: -18, blurRadius: 36, spreadDistance: -24, color: 'rgba(58,54,48,0.55)' }],
    { shadowColor: palette.brown900, shadowOffset: { width: 0, height: -6 }, shadowOpacity: 0.1, shadowRadius: 14, elevation: 0 },
  ),
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
/** A sombra da API antiga: uma camada, sem `inset`, sem spread. */
export type SombraLegada = {
  shadowColor: string;
  shadowOffset: { width: number; height: number };
  shadowOpacity: number;
  shadowRadius: number;
  elevation: number;
};

/**
 * Uma sombra, do jeito que der.
 *
 * Os dois formatos sao espalhados em `style` do mesmo jeito (`...shadows.sm`),
 * entao os 28 lugares que consomem sombra nao sabem qual dos dois receberam --
 * e e por isso que trocar o desenho inteiro nao encostou em nenhum deles.
 */
export type Sombra = { boxShadow: BoxShadowValue[] } | SombraLegada;
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
export type Vidro = { experimental_backgroundImage: string } | { backgroundColor: string };

/**
 * Uma superfície em gradiente, com a cor sólida de recuo.
 *
 * O ângulo é 150° para superfície e 180° para botão — é a diferença entre luz
 * que vem de lado, atravessando um cartão deitado, e luz que vem de cima, num
 * objeto levantado. O `solido` é a parada do meio, para onde não há Fabric.
 */
const vidro = (de: string, para: string, solido: string, angulo = 150): Vidro =>
  NA_FABRIC
    ? { experimental_backgroundImage: `linear-gradient(${angulo}deg, ${de}, ${para})` }
    : { backgroundColor: solido };

/**
 * As superfícies de vidro do redesenho.
 *
 * ## O que é "vidro" aqui
 *
 * O cartão deixou de ser branco opaco. Ele é um branco **translúcido** com um
 * gradiente muito curto no sentido 150°, e é a translucidez que faz o efeito:
 * o papel creme da página aparece por baixo, então o cartão pega a luz de
 * ambiente do fundo em vez de recortar um retângulo branco no meio dela.
 *
 * Junto com o anel de luz das sombras, é isso que o documento chama de vidro.
 *
 * ## Por que não `expo-linear-gradient`
 *
 * Porque é módulo nativo, e acrescentar um obriga a refazer o development
 * build antes de qualquer teste no aparelho. Para um gradiente de duas paradas
 * de branco, não compensa.
 *
 * `experimental_backgroundImage` faz o mesmo sem dependência nova — e o nome
 * diz o quanto dá para contar com ele, então vale a mesma regra das sombras:
 * onde a Fabric está de pé sai o gradiente, onde não está sai a cor sólida do
 * meio das duas paradas. A diferença entre as duas é um brilho de sobra; a
 * translucidez, que é o que importa, os dois caminhos entregam.
 *
 * **No navegador sai sempre a versão sólida**, porque `react-native-web` não
 * implementa a propriedade. Quem quiser ver o gradiente tem de olhar no
 * aparelho.
 */
/**
 * O botão principal, que deixou de ser uma chapada de verde.
 *
 * Ele é um gradiente vertical curto com uma sombra longa da própria cor e um
 * fio de luz na aresta de cima. O efeito é de peça **levantada** da tela — e é
 * o que separa o botão de tudo o mais, num app onde quase toda superfície é
 * clara e discreta. É a única coisa em qualquer tela que projeta sombra colorida.
 *
 * **No escuro ele clareia em vez de escurecer.** O verde escuro do tema claro
 * sobre um fundo quase preto sumiria; ali o botão vira verde claro com texto
 * escuro. É a mesma inversão que `textInverse` já fazia — "a cor que se lê
 * sobre o verde" muda de lado entre os temas.
 */
export const botaoPrimario = {
  claro: {
    ...vidro('#5A8A6F', '#42705A', '#4C7B62', 180),
    sombra: sombra(
      [
        { offsetX: 0, offsetY: 18, blurRadius: 34, spreadDistance: -14, color: 'rgba(46,74,59,0.7)' },
        { offsetX: 0, offsetY: 1, blurRadius: 0, color: 'rgba(255,255,255,0.22)', inset: true },
      ],
      { shadowColor: '#2E4A3B', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 14, elevation: 4 },
    ),
  },
  escuro: {
    ...vidro('#9CC9AE', '#7FAF92', '#8DBCA0', 180),
    sombra: sombra(
      [{ offsetX: 0, offsetY: 20, blurRadius: 36, spreadDistance: -16, color: 'rgba(0,0,0,0.8)' }],
      { shadowColor: '#000000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.5, shadowRadius: 14, elevation: 4 },
    ),
  },
} as const;

export const vidros = {
  claro: {
    /** O cartão comum — 34 dos 54 do documento. */
    cartao: vidro('rgba(255,255,255,0.92)', 'rgba(255,255,255,0.76)', 'rgba(255,255,255,0.85)'),
    /** O cartão que puxa para o verde: Composta, convites, o que chama para agir. */
    destaque: vidro('rgba(255,255,255,0.8)', 'rgba(227,237,230,0.74)', 'rgba(241,246,242,0.85)'),
  },
  escuro: {
    /*
      No escuro o cartão é branco a 8%, não um cinza opaco.

      Pela mesma razão do claro, invertida: o fundo escuro tem a luz de âmbar
      do halo passando por ele, e um cartão opaco cortaria essa luz num
      retângulo. A 8% ele clareia o que estiver atrás sem apagar.
    */
    cartao: vidro('rgba(255,255,255,0.08)', 'rgba(255,255,255,0.04)', 'rgba(255,255,255,0.06)'),
    destaque: vidro('rgba(255,255,255,0.09)', 'rgba(156,201,174,0.1)', 'rgba(190,220,203,0.09)'),
  },
} as const;

/**
 * As sombras do tema escuro.
 *
 * **Nao sao as claras com a cor trocada**, e antes eram: a versao anterior
 * espalhava `shadows.sm` e sobrescrevia `shadowColor`. Isso parou de funcionar
 * quando a sombra virou lista -- espalhar uma lista e depois pousar
 * `shadowColor` ao lado dela produz um objeto com os dois formatos misturados,
 * do qual o React Native usa um e ignora o outro sem reclamar.
 *
 * O anel de luz e a diferenca de fundo entre os temas. No claro ele e branco
 * a 90%: a borda do cartao pega a luz e o cartao parece vidro sobre papel. No
 * escuro, o mesmo branco desenharia um contorno aceso em volta de cada cartao.
 * Ali ele cai para 10% -- o suficiente para a borda existir, longe de brilhar.
 *
 * A sombra em si escurece e se alonga, porque o fundo tambem escureceu: sombra
 * de marrom sobre `#211E1A` nao aparece, e a saida e preto puro com mais raio.
 */
export const sombrasEscuras: Sombras = {
  sm: sombra(
    [ANEL_ESCURO, { offsetX: 0, offsetY: 18, blurRadius: 36, spreadDistance: -22, color: '#000000' }],
    { shadowColor: '#000000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 2 },
  ),
  md: sombra(
    [ANEL_ESCURO, { offsetX: 0, offsetY: 20, blurRadius: 40, spreadDistance: -22, color: '#000000' }],
    { shadowColor: '#000000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.38, shadowRadius: 16, elevation: 4 },
  ),
  lg: sombra(
    [{ offsetX: 0, offsetY: 26, blurRadius: 60, spreadDistance: -22, color: 'rgba(28,24,20,0.6)' }],
    { shadowColor: '#000000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.45, shadowRadius: 28, elevation: 8 },
  ),
  barra: sombra(
    [{ offsetX: 0, offsetY: -18, blurRadius: 36, spreadDistance: -24, color: '#000000' }],
    { shadowColor: '#000000', shadowOffset: { width: 0, height: -6 }, shadowOpacity: 0.3, shadowRadius: 14, elevation: 0 },
  ),
};

export type Tema = 'claro' | 'escuro';

/**
 * A preferência guardada nos ajustes. `sistema` obedece ao aparelho.
 *
 * Mora aqui, e não junto do provedor, porque `state/types.ts` precisa dela e
 * não pode arrastar o React junto: os testes rodam esses módulos em Node puro.
 */
export type PreferenciaDeTema = 'sistema' | 'claro' | 'escuro';


/**
 * Um tom por tema de prática — o quadrado atrás do ícone na lista.
 *
 * ## Por que um conjunto próprio, e não a paleta
 *
 * Os tons vinham das entradas da paleta, e três pares repetiam: Ansiedade e
 * Luto dividiam `blue100`, Tristeza e Estresse `slate100`, Autoestima e
 * Gratidão `yellow100`. Não dava para separar mexendo nelas: `blue100` **é** a
 * cor do humor ansioso, `yellow100` a do feliz — trocar mudaria as carinhas.
 * Daí um conjunto à parte, que não é usado por mais ninguém.
 *
 * ## O que estava errado no escuro
 *
 * `brown100` e `cream300` são o mesmo hex (#38332C): Solidão e Culpa tinham
 * quadrados idênticos. E cinco dos treze ficavam com contraste de 1,02 a 1,22
 * contra o cartão — sumiam. Os que funcionavam iam a 2,69. O conjunto inteiro
 * variava de 1,02 a 2,69 sem nenhum critério.
 *
 * ## Como estes foram feitos
 *
 * Treze matizes igualmente espaçadas, 27,7° entre elas. Para cada uma, a
 * *lightness* é **resolvida** para atingir uma luminância alvo — não fixada.
 * A distinção é o ponto: lightness não é luminância. Com L=25% no HSL um
 * amarelo tem quase o dobro da luminância de um azul, porque o olho pesa verde
 * 0,72 e azul 0,07 — e foi assim que os azuis sumiram e os amarelos saltaram.
 *
 * Resolvendo por luminância, os treze saem com o mesmo contraste: **1,25**
 * contra o cartão branco no claro, **1,60** contra o #2C2823 no escuro. O
 * ícone fica em 9,5 e 7,5 no pior caso, bem acima dos 4,5 exigidos.
 *
 * ## O que estes tons não fazem
 *
 * Não identificam o tema sozinhos. A saturação é baixa de propósito — subi-la
 * até separar bem dava #DBE513 e #A1F155, neon, o oposto do tom do app. Com
 * treze temas e uma paleta sóbria não existe conjunto que seja ao mesmo tempo
 * muito distinto e discreto, e escolhi discreto. No claro, o par mais parecido
 * (Solidão e Tristeza) fica a 6,2 de distância: quase iguais.
 *
 * Quem diferencia um tema do outro é o **ícone**. O tom é apoio.
 */
export const tintsDosTemas = {
  raiva: '#F3E2DF',
  procrastinacao: '#EEE4D4',
  autoestima: '#E6E8C3',
  gratidao: '#DAEACA',
  foco: '#D0ECCF',
  comparacao: '#CFECDB',
  estresse: '#CDEBE8',
  ansiedade: '#D9E7F0',
  solidao: '#E1E4F3',
  tristeza: '#E7E3F4',
  insonia: '#EEE0F3',
  luto: '#F3E0EF',
  culpa: '#F3E0E7',
} as const;

export type TintDoTema = keyof typeof tintsDosTemas;

export const tintsDosTemasEscuros: Record<TintDoTema, string> = {
  raiva: '#633F3A',
  procrastinacao: '#544732',
  autoestima: '#494A2C',
  gratidao: '#3D4E2E',
  foco: '#30512F',
  comparacao: '#2F4F3D',
  estresse: '#2E4F4B',
  ansiedade: '#344C59',
  solidao: '#3F476A',
  tristeza: '#4F4170',
  insonia: '#5D3D67',
  luto: '#653B5C',
  culpa: '#673C4B',
};

/** Os dois temas, para o provedor escolher e para o teste de contraste medir. */
export const TEMAS = {
  claro: {
    palette,
    colors,
    moodColors,
    moodColorsFundo,
    shadows,
    tintsDosTemas,
    vidros: vidros.claro,
    botaoPrimario: botaoPrimario.claro,
  },
  escuro: {
    palette: paletteEscura,
    colors: coresEscuras,
    moodColors: moodColorsEscuros,
    moodColorsFundo: moodColorsFundoEscuros,
    shadows: sombrasEscuras,
    tintsDosTemas: tintsDosTemasEscuros,
    vidros: vidros.escuro,
    botaoPrimario: botaoPrimario.escuro,
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

  /*
    Os tons de luz e sombra de cada peça do broto, para o desenho modelado.

    As três cores acima eram chapadas: uma cor por peça, contorno em volta,
    fim. O desenho novo modela o volume, e volume precisa de três tons — o que
    pega a luz, o do corpo, e o que fica na sombra.

    **Os tons do corpo são os mesmos de antes**, e isso não é acaso: o desenho
    novo pegou cada cor chapada e construiu um gradiente em volta dela. `vaso`
    é a parada do meio do vaso; `folhaClara` é a do meio do bulbo. Quem já
    desenhava com esses valores continua desenhando igual, e é por isso que as
    ilustrações das práticas não precisaram mudar junto.

    Só a folha foge à regra: o gradiente dela vai de #7E9E87 a #5F7F69, e
    `folha` (#6F9079) cai entre os dois em vez de ser uma das paradas. O
    desenho antigo tinha escolhido a média.
  */
  /** Bulbo: a cabeça do broto, iluminada em cima à esquerda. */
  bulboLuz: '#C6DACB',
  bulboSombra: '#87A493',
  /** A sombra interna que dá curvatura ao bulbo, sob a linha do queixo. */
  bulboCurva: '#5A7A66',
  /** Folha da frente, em gradiente; a de trás fica no tom escuro, chapada. */
  folhaLuz: '#7E9E87',
  folhaSombra: '#5F7F69',
  /** Vaso: barro, com a luz batendo de cima à esquerda. */
  vasoLuz: '#D0906E',
  vasoSombra: '#A26B4F',
  /** A listra escura no lado sem luz do vaso. */
  vasoRisco: '#7A4426',
  /** A terra na boca do vaso. */
  terra: '#4A3323',
  /** A haste, mais clara que o contorno das folhas para não virar um vinco. */
  haste: palette.green700,
  /** As bochechas — o único calor no personagem inteiro. */
  bochecha: palette.terracotta400,
} as const;
