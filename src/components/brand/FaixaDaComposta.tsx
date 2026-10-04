import React, { useEffect, useId, useMemo, useRef } from 'react';
import { Animated, Easing, Pressable, Text, View } from 'react-native';
import Svg, { Defs, Ellipse, LinearGradient, Path, RadialGradient, Rect, Stop } from 'react-native-svg';

import { fraseQueODiaDemonstra } from '../../data/composta';
import { useMenosMovimento } from '../../hooks/useMenosMovimento';
import { lacoQueSoVai } from '../laco';
import { useAbaAVista } from '../AbasVivas';
import { useCoberta } from '../CamadaEmpilhada';
import { AnimatedSprout } from './AnimatedSprout';
import { Nuvem } from './Cena';
import { BalaoDoBroto } from './BalaoDoBroto';
import {
  CX,
  POT_TOP_Y,
  noQuadro,
  quadroDoBroto,
  type Pose,
  type SproutStage,
} from './geometriaDoBroto';
import {
  MORRO,
  NUVEM,
  PESO_DA_NUVEM,
  TEXTO_NO_CEU,
} from './ceuDaComposta';
import { ceuDoHumor } from './ceuDoHumor';
import { fonts, radius, useTema, type Mood } from '../../theme';
import { tracos } from '../../theme/tokens';
import {
  OPACIDADE_NA_QUEDA,
  TOMBO,
  curvaDaPalavra,
  planejarQueda,
} from './planoDaQueda';
import {
  BRASA,
  TERRA,
  TERRA_CLARA,
  TERRA_FUNDA,
  TERRA_SOMBRA,
  TEXTO_NA_TERRA,
  TEXTO_NA_TERRA_FRACO,
  BOTAO_NA_TERRA,
} from './terraDoCanteiro';

/**
 * A Composta como **lugar**, e não como cartão.
 *
 * ## O que isto substitui, e por quê
 *
 * A Composta já foi o segundo cartão de um carrossel, depois um `CartaoHeroi`
 * de largura inteira acima dele. As duas versões resolviam a mesma metade do
 * problema — a de estar à vista — e nenhuma resolvia a outra: ela continuava
 * sendo *uma caixa entre caixas*, com o mesmo raio de canto e a mesma sombra
 * da prática de hoje e da frase do dia. Um cartão diz "aqui tem um recurso".
 * Numa tela que tem sete, isso não distingue o mecanismo único do app de mais
 * um item de prateleira.
 *
 * Aqui ela deixa de ser um objeto na tela e passa a ser a tela. O cabeçalho —
 * o nome da pessoa, os botões, o broto e o que ele fala — mora **dentro do
 * céu**; as palavras caem por esse céu aberto; embaixo tem terra, e o convite
 * está pousado nela. É o mesmo movimento que a aba do broto já fazia com o
 * personagem: ele não está numa moldura, ele está num lugar.
 *
 * ## As três camadas, e a ordem delas importa
 *
 * 1. **O céu** — degradê e morros distantes.
 * 2. **As palavras** — caindo.
 * 3. **A terra** — desenhada *por cima* das palavras.
 *
 * A terceira em cima da segunda é o ponto: a palavra não pousa na crista, ela
 * **entra** na terra e some lá dentro. Pousar descreve um objeto chegando ao
 * chão; afundar descreve a coisa que dá nome à ferramenta. Também é o que
 * dispensa qualquer acerto fino de onde exatamente a queda termina — o que
 * passa da crista fica escondido.
 *
 * ## Por que "desfocada" virou perspectiva atmosférica
 *
 * O pedido era uma paisagem desfocada ao fundo. O `react-native-svg` 15.12
 * tem `FeGaussianBlur`, mas filtro de SVG no Android é caro e é exatamente a
 * coisa que eu não conseguiria conferir daqui antes de mandar para a loja.
 *
 * Os morros são elipses preenchidas com **gradiente radial** que termina em
 * opacidade zero: a borda desaparece de verdade, sem filtro nenhum. É como
 * ilustração faz profundidade desde sempre — o que está longe perde contraste
 * e perde contorno —, e custa três elipses. O primeiro plano mantém o traço
 * grosso de sempre, senão a tela deixa de parecer deste app.
 *
 * ## Nada aqui é cor escrita à mão
 *
 * Nem o céu nem a terra seguem o tema, e é de propósito: os dois são
 * paisagem, e paisagem tem luz própria. A terra vem de `terraDoCanteiro`; o
 * céu, de `ceuDaComposta`, que conta lá por que ele deixou de anoitecer junto
 * com o app — e o que isso obriga em tudo o que fica em cima dele.
 *
 * O que segue o tema aqui é só o que está **abaixo da crista**: o título, a
 * linha e o botão moram na terra, e a terra é escura nos dois temas.
 *
 * ## A animação não passa pelo JavaScript
 *
 * As cenas do carrossel desenham as palavras em `<SvgText>`, e por isso
 * precisam de `Animated.Value` → ouvinte → `setState` a cada quadro: o
 * `react-native-web` não implementa `setNativeProps` em nó de SVG.
 *
 * Aqui as palavras são `Text` de verdade, então elas andam por `Animated` com
 * `useNativeDriver`. A faixa inteira anima sem um render por quadro — que é o
 * que torna aceitável um laço rodando na tela que abre o app.
 */

/**
 * Quanto a terra ocupa **abaixo do botão** quando a faixa termina ali.
 *
 * É a zona de dissolução: terra vazia que vai perdendo opacidade até o fundo
 * da tela aparecer. Quando a faixa continua numa outra logo abaixo, esta
 * sobra não existe — quem dissolve é a última da sequência.
 */
const DISSOLUCAO = 42;

/**
 * A altura do bloco de terra.
 *
 * Começou em 176 e o conteúdo não coube: o que sobra transborda **para
 * cima**, e ia parar acima da crista, boiando no céu bem na coluna por onde
 * as palavras caem. Com folga, o conteúdo fica abaixo da crista, que é
 * embaixo da terra do ponto de vista da palavra: quando ela chega ali já
 * está escondida.
 *
 * A altura não encolheu quando a etiqueta saiu: o conteúdo é encostado
 * embaixo, e o que a etiqueta deixou foi respiro — que é o que faltava.
 */
const ALTURA_DA_TERRA = 248;

/** A mesma terra sem a sobra de baixo: é o que sobe quando ela continua. */
const ALTURA_DA_TERRA_CONTINUA = ALTURA_DA_TERRA - DISSOLUCAO;

/**
 * Onde a terra começa a sumir, em fração da altura dela.
 *
 * A faixa acabava numa linha reta: terra cheia num pixel, fundo da tela no
 * seguinte. Lido de cima para baixo isso não é uma paisagem terminando, é
 * uma ferramenta acabando e outra começando — corte seco entre a Composta e
 * a prateleira de práticas.
 *
 * Daqui para baixo a terra perde opacidade até zero. Ela não desbota para
 * uma cor: ela some, e quem aparece embaixo é o `FundoDaTela`, que já estava
 * lá o tempo todo. Por isso a emenda funciona nos dois temas sem nenhuma cor
 * escrita à mão — o que reaparece é exatamente o fundo da tela em uso.
 *
 * O número é o que sobra abaixo do botão: o `paddingBottom` do convite é o
 * mesmo tamanho, então a dissolução inteira acontece em terra vazia.
 */
const TERRA_COMECA_A_SUMIR = 0.76;

/**
 * Quanto a faixa ocupa, ao todo.
 *
 * Existe para a `HomeScreen` saber, sem duplicar a conta, a partir de que
 * altura de rolagem a faixa saiu da vista — que é o que liga e desliga o laço.
 */
export function alturaDaFaixa(
  topo: number,
  cabecalho: number,
  queda: number,
  continua = false,
): number {
  return topo + cabecalho + queda + (continua ? ALTURA_DA_TERRA_CONTINUA : ALTURA_DA_TERRA);
}

/**
 * A emenda entre o céu e a terra — e o vão preto que morava nela.
 *
 * ## O defeito
 *
 * O `Svg` da terra começa `RECUO` pontos acima da crista, e dentro dele a
 * curva do monte entra em `BORDA_ESQUERDA` de um lado e `BORDA_DIREITA` do
 * outro. Nas pontas, portanto, a terra só começa a pintar
 * `BORDA_DIREITA - RECUO` pontos **abaixo** da crista — no meio da faixa ela
 * sobe muito acima disso, que é o que faz a curva ser uma curva.
 *
 * O céu terminava quatro pontos abaixo da crista. Entre o fim do céu e o
 * começo da terra sobravam seis pontos, num triângulo colado em cada borda, e
 * ninguém pintava aquilo: o SVG ali é transparente, e o Android compõe
 * transparente sobre preto.
 *
 * É a "faixa preta entre o solo e o fundo, no canto esquerdo e direito" que o
 * Pedro fotografou. No navegador ela não aparecia porque o fundo da página é
 * branco — o vão existia igual, e eu estava medindo com a cor errada atrás.
 *
 * ## O conserto
 *
 * O céu desce até `EMENDA`, que é calculado da própria curva e não escolhido:
 * a borda mais baixa da terra, mais dois pontos de folga. A terra continua por
 * cima, então o céu a mais fica escondido em toda a largura, menos justamente
 * nas duas pontas, que é onde ele precisa aparecer.
 */
const CURVA_DA_TERRA = {
  /** Quanto o `Svg` da terra sobe acima da crista. */
  RECUO: 26,
  /** Onde a curva entra, em cada ponta, dentro do `Svg` da terra. */
  BORDA_ESQUERDA: 34,
  BORDA_DIREITA: 36,
  /** Os dois pontos de controle da curva, também para dentro do `Svg`. */
  CONTROLE_ESQUERDO: 10,
  CONTROLE_DIREITO: 8,
};

/** Quanto o céu passa da crista, para encontrar a terra nas pontas. */
const EMENDA =
  Math.max(CURVA_DA_TERRA.BORDA_ESQUERDA, CURVA_DA_TERRA.BORDA_DIREITA) - CURVA_DA_TERRA.RECUO + 2;

/** A curva do alto da terra, escrita uma vez e usada pelo preenchimento e pelo fio. */
const CRISTA_DA_TERRA = (largura: number) =>
  `M-8 ${CURVA_DA_TERRA.BORDA_ESQUERDA} `
  + `C${largura * 0.24} ${CURVA_DA_TERRA.CONTROLE_ESQUERDO} ${largura * 0.7} ${CURVA_DA_TERRA.CONTROLE_DIREITO} `
  + `${largura + 8} ${CURVA_DA_TERRA.BORDA_DIREITA}`;

/** Quanto a palavra afunda para além da crista antes de sumir de vez. */
const AFUNDA = 18;

/**
 * A velocidade da queda, em pontos por segundo.
 *
 * É velocidade, e não duração, porque a queda agora tem altura diferente em
 * cada aparelho. Com duração fixa, a palavra cairia mais rápido num celular
 * grande — o contrário do que se quer de uma tela alta.
 *
 * Começou em 63 pt/s, herdados do cartão antigo (1800 ms para uns 114
 * pontos). Foi a 78 quando a queda dobrou de tamanho, e voltou para baixo
 * quando a faixa encolheu: a queda tem hoje uns 182 pontos, e a 78 a palavra
 * atravessava tudo em dois segundos e três décimos — rápido demais para uma
 * coisa que está ali para ser lida.
 *
 * A 57 ela levava três segundos e dois décimos, e Pedro ainda pediu mais
 * devagar depois de ver no aparelho. Tem razão: três segundos é o tempo de
 * **ler** a palavra, e não é disso que a cena trata. A palavra não está ali
 * para ser lida uma vez — ela está caindo, e o que a faixa mostra é um
 * pensamento afundando na terra. Isso é lento.
 *
 * A 38 ela leva quase cinco segundos na queda de hoje. É devagar o bastante
 * para o movimento ler como peso descendo, e não como legenda passando.
 */
const VELOCIDADE = 38;

/*
  O atraso entre as palavras e a coluna de cada uma saíram daqui: eram duas
  constantes escolhidas no olho, e as duas estavam erradas no aparelho.
  Moram em `planoDaQueda`, calculadas a partir do tamanho das palavras e
  testadas frase por frase.
*/

/**
 * O tempo parado antes da primeira queda.
 *
 * A tela entra com uma transição. Palavra caindo no meio dela é movimento
 * dentro de movimento, e não se lê nem uma coisa nem outra.
 */
const ESPERA_PARA_LER = 420;

/**
 * A paisagem ao longe, do mais distante para o mais perto.
 *
 * `x` e `largura` são frações da tela — a paisagem acompanha o aparelho em
 * vez de ficar espremida num celular estreito. `sobe` é quanto o centro da
 * elipse fica **acima** da crista da terra, e `alto` é o raio vertical: os
 * dois juntos decidem quanto de cada copa aparece por cima da linha.
 *
 * Opacidade cresce com a proximidade, que é o único jeito de três formas da
 * mesma cor lerem como três distâncias.
 */
const MORROS = [
  { x: 0.1, sobe: 52, alto: 72, largura: 0.4, op: 0.26 },
  { x: 0.88, sobe: 42, alto: 62, largura: 0.42, op: 0.32 },
  { x: 0.48, sobe: 22, alto: 46, largura: 0.3, op: 0.24 },
  /* A rasteira: o pé da paisagem, atravessando a tela inteira. */
  { x: 0.46, sobe: -4, alto: 44, largura: 0.9, op: 0.42 },
] as const;
/**
 * As nuvens do céu da tela inicial.
 *
 * ## Elas eram manchas, e agora são nuvens
 *
 * A primeira versão desenhava quatro elipses com degradê radial caindo a
 * zero: sem aresta, sem recorte, e paradas. Lado a lado com o documento o
 * problema fica óbvio — o documento tem **nuvem de desenho**, com a barriga
 * ondulada em cima e a base reta, do mesmo traço do resto do app. Mancha de
 * degradê não é um jeito diferente de desenhar nuvem; é um borrão.
 *
 * Agora são as mesmas da `Cena`, com o mesmo caminho e o mesmo passeio. Uma
 * nuvem só no app inteiro.
 *
 * ## Por que elas saíram de dentro do `Svg`
 *
 * Porque andam. Propriedade de SVG animada não chega no `react-native-web`
 * (a nota longa em `desenhosDosTemas` conta o episódio), então quem anda é
 * uma `View` com `transform` — e `View` não entra dentro de `Svg`.
 *
 * O preço é que elas passam a ficar **na frente** dos morros em vez de atrás.
 * Na prática não encosta: os morros vivem no pé do céu e as nuvens no alto
 * dele, que é onde nuvem fica.
 *
 * `x` e `y` são frações do céu, para o tempo nublado ser o mesmo num celular
 * estreito e num largo.
 */
const NUVENS = [
  { x: 0.06, y: 0.3, escala: 0.9, ms: 14000 },
  { x: 0.42, y: 0.16, escala: 0.62, ms: 11000 },
  { x: 0.7, y: 0.44, escala: 0.75, ms: 17000 },
] as const;

/** A coluna do broto do adubo, em fração da largura. */
const COLUNA_DO_BROTO = 0.76;

/**
 * Onde o pé do broto encontra a terra, medido da borda de cima do monte.
 *
 * Eram 46 — fundo o bastante para o caule do broto anônimo atravessar a
 * superfície e as raízes saírem lá de dentro. Com o mascote no lugar dele,
 * 46 enterrava as folhas: elas nascem logo acima do pé, e ficavam debaixo da
 * terra. Dez deixa a planta pousada na superfície, e as raízes continuam
 * saindo do mesmo ponto que ela — que é o que mantém as duas coisas ligadas.
 */
const PE_DO_BROTO = 10;

/* A opacidade ao longo da queda mora em `planoDaQueda`: ver `OPACIDADE_NA_QUEDA`. */

type Props = {
  /**
   * O humor de hoje, que pinta o céu. `null` enquanto ninguém respondeu.
   *
   * Ver `ceuDoHumor`: as três paradas do gradiente saem daqui, e continuam
   * sendo cor fixa — o céu não segue o tema, e isso é decisão antiga.
   */
  humor?: Mood | null;
  /** Depois do pôr do sol o céu ganha um véu. */
  noite?: boolean;
  /** O estágio do broto plantado na terra. */
  estagio?: SproutStage;
  /** O que ele está fazendo — ver `POSES`. */
  pose?: Pose;
  /** Tocar nele faz ele falar outra coisa. Sem isto, ele não é botão. */
  aoTocarNoBroto?: () => void;
  rotuloDaFala?: string;
  /** O que ele está dizendo agora. Sem isto, não há balão. */
  fala?: string;
  /** A largura da tela. A paisagem é desenhada em pontos, 1:1, sem escala. */
  largura: number;
  /** O respiro do alto: barra de status mais a margem da tela. */
  topo: number;
  /** A margem lateral que o conteúdo recupera — a faixa sangra para fora. */
  recuo: number;
  /**
   * A altura reservada ao cabeçalho dentro do céu.
   *
   * Vem de fora, e é fixa, porque `onLayout` **não dispara no
   * react-native-web** — medir aqui daria um número certo no celular e errado
   * justamente no navegador, que é onde eu confiro. Ver `LuzDeEstufa`.
   */
  cabecalho: number;
  /** O céu aberto entre o cabeçalho e a crista: é por aqui que elas caem. */
  queda: number;
  /** A saudação, os botões, o broto e o balão. Desenhados dentro do céu. */
  children: React.ReactNode;
  /** A faixa está à vista **na rolagem**? Fora dela o laço para — ver `HomeScreen`. */
  ativa: boolean;
  /**
   * A terra desta faixa emenda na de baixo, em vez de acabar aqui.
   *
   * Com isto ligado ela não se dissolve no fim: fica cheia até a última
   * linha, e quem dissolve é a faixa seguinte. É o que faz a Composta e a
   * Frase do dia parecerem duas ferramentas no **mesmo** terreno, em vez de
   * duas faixas empilhadas que por acaso são marrons.
   */
  continua?: boolean;
  titulo: string;
  linha: string;
  acao: string;
  onPress: () => void;
  label: string;
};

export function FaixaDaComposta({
  largura,
  topo,
  recuo,
  cabecalho,
  queda,
  children,
  ativa,
  continua = false,
  titulo,
  linha,
  acao,
  onPress,
  label,
  humor = null,
  noite = false,
  estagio = 2,
  pose = 'parado',
  aoTocarNoBroto,
  rotuloDaFala,
  fala,
}: Props) {
  /* Só o que está abaixo da crista segue o tema: ver o cabeçalho. */
  const { colors } = useTema();
  const id = useId().replace(/[^a-zA-Z0-9]/g, '');
  const menosMovimento = useMenosMovimento();
  /* A escala do aparelho: as nuvens são escritas na largura de referência. */
  const k = largura / 390;
  /*
    À vista na rolagem, com a aba aberta, e descoberta — as três.

    Com uma prática aberta por cima, a Home fica montada embaixo — ver
    `CamadaEmpilhada`; e com o Perfil aberto ela também continua montada —
    ver `AbasVivas`. Sem as duas perguntas esta faixa seguiria derrubando
    palavras e balançando o broto para ninguém, redesenhando a tela de baixo a
    cada quadro.

    As perguntas são feitas **aqui**, e não na `HomeScreen`: quem lê um
    contexto é redesenhado quando ele muda, e o corpo da Home é caro demais
    para ser redesenhado dentro de um toque.
  */
  /* As três paradas do céu, do humor de hoje — ver `ceuDoHumor`. */
  const ceu = ceuDoHumor(humor, noite);

  /*
    O tamanho do mascote sai da largura da tela, com teto.

    Uma fração pura cresceria junto com o tablet e o broto viraria um cartaz;
    um número fixo encolheria demais num aparelho estreito, onde ele divide a
    faixa com o cabeçalho e as palavras caindo.

    ## Por que a fração desceu de 0,46 para 0,40

    Porque num aparelho de verdade ele **era** o cartaz. Quase meia tela de
    largura, e a faixa inteira passava a ser sobre ele: o cabeçalho encolhia
    para o canto, o balão de fala ficava com cento e quarenta pontos de largura
    — o mínimo que ele aceita — e as palavras da Composta caíam numa coluna
    estreita à esquerda. A faixa tem quatro coisas para mostrar, e uma delas
    estava comendo o espaço das outras três.

    Quarenta por cento devolve vinte e três pontos de largura para o balão e
    para as palavras, e o broto continua sendo o maior objeto da faixa — o que
    ele tem de ser. Não é um broto pequeno, é um broto que divide a faixa.
  */
  const tamanhoDoMascote = Math.round(Math.min(largura * 0.4, 164));
  const quadroDoMascote = quadroDoBroto(estagio, tamanhoDoMascote, { showPot: false });
  const peDoMascote = noQuadro(quadroDoMascote, CX, POT_TOP_Y);
  /*
    A coluna dele, já presa dentro da tela.

    `COLUNA_DO_BROTO` foi medida para um broto estreito; o mascote é quase
    meia tela de largura, e na fração crua a folha da direita saía pela borda.
    Prender aqui, e não mudar a fração, mantém a coluna igual em aparelho
    largo — onde ela cabe — e só cede no estreito, que é onde o corte
    acontecia.
  */
  const xDoBroto = Math.min(
    largura - quadroDoMascote.largura / 2 - 6,
    largura * COLUNA_DO_BROTO,
  );

  const coberta = useCoberta();
  const abaAVista = useAbaAVista();
  const rodando = ativa && abaAVista && !coberta;

  const alturaDaTerra = continua ? ALTURA_DA_TERRA_CONTINUA : ALTURA_DA_TERRA;
  const altura = alturaDaFaixa(topo, cabecalho, queda, continua);
  /** Onde a terra começa a subir. Tudo acima disto é céu. */
  const crista = altura - alturaDaTerra;

  /*
    As raízes são sempre as mesmas para a mesma tela — a semente é fixa —,
    mas a conta é de doze pontos por fio e não precisa refazer a cada quadro
    da queda das palavras.

    O fundo é onde a terra começa a sumir: raiz desenhada dentro da névoa
    apareceria boiando. Emendando com a faixa de baixo não há névoa, e o
    limite é quase o fim do bloco.
  */
  const inicioDaQueda = topo + cabecalho;
  const distancia = queda + AFUNDA;

  /*
    A frase é do app, e nunca a da pessoa.

    Esta tela é a que qualquer um lê por cima do ombro dela no ônibus — a frase
    mais dolorosa que ela digitou não pode morar aqui em corpo grande. E, para
    o objetivo, a frase do app é melhor mesmo: quem precisa ser convencido pela
    demonstração é justamente quem ainda não compostou nada.
  */
  const palavras = useMemo(() => fraseQueODiaDemonstra().split(/\s+/).filter(Boolean), []);

  /*
    A conta da queda inteira — quem cai quando, onde, e com que letra.

    Ela é feita uma vez por frase e largura de tela, e é a mesma conta que
    o `testa-queda-da-composta` percorre quadro a quadro. Ver `planoDaQueda`.
  */
  const plano = useMemo(
    () =>
      planejarQueda({
        palavras,
        larguraDaTela: largura,
        distancia,
        velocidade: VELOCIDADE,
        /* As palavras param antes do broto — ver `limiteDireito`. */
        limiteDireito: xDoBroto - quadroDoMascote.largura / 2 - 6,
      }),
    [palavras, largura, distancia, xDoBroto, quadroDoMascote.largura],
  );

  /**
   * O relógio da queda — **um só, para todas as palavras**.
   *
   * Já foi um valor animado por palavra, cada um com seu laço e seu
   * temporizador de partida. No aparelho, o JavaScript trava um instante
   * depois que a tela abre, e os temporizadores que vencem durante a travada
   * disparam todos juntos — em "vai dar tudo errado", o "vai" caía certo e
   * as outras três partiam juntas, e como cada uma repetia com o mesmo
   * período, nunca mais se separavam.
   *
   * Com um relógio só não há o que desencontrar: a defasagem de cada
   * palavra está escrita na curva dela. Se o JavaScript travar, todas
   * congelam juntas e voltam juntas.
   *
   * Ele vai de 0 a 1 na primeira volta e de 1 a 2 em cada volta seguinte —
   * ver `curvaDaPalavra` para o porquê das duas partes.
   */
  const tempo = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    tempo.setValue(0);
    if (!rodando || menosMovimento) return;

    /*
      Linear, e não suavizado nas pontas.

      Uma queda com `easing` desacelera no fim — o que descreve uma coisa
      pousando, e não uma coisa se desfazendo. E, num laço, a emenda entre o
      fim lento e o começo lento aparece como uma batida a cada volta.

      O laço é uma animação só, sem `delay` dentro: é isso que deixa o
      driver nativo rodá-lo sozinho, volta após volta, sem passar pelo
      JavaScript. O `Animated.delay` não roda no nativo, e bastava um para
      o laço inteiro voltar a depender do JavaScript a cada volta.
    */
    const volta = (ate: number) =>
      Animated.timing(tempo, {
        toValue: ate,
        duration: plano.cicloMs,
        easing: Easing.linear,
        useNativeDriver: true,
      });
    const animacao = Animated.sequence([
      volta(1),
      lacoQueSoVai(tempo, { ms: plano.cicloMs, easing: Easing.linear, ate: 2 }),
    ]);
    const espera = setTimeout(() => animacao.start(), ESPERA_PARA_LER);

    return () => {
      clearTimeout(espera);
      animacao.stop();
    };
  }, [rodando, menosMovimento, tempo, plano.cicloMs]);

  return (
    <View style={{ height: altura, marginHorizontal: -recuo }}>
      {/* 1. O céu, e o que está longe demais para ter contorno. */}
      <View
        style={{ position: 'absolute', top: 0, left: 0, right: 0, height: crista + EMENDA }}
      >
        <Svg width="100%" height="100%" viewBox={`0 0 ${largura} ${crista + EMENDA}`}>
          <Defs>
            <LinearGradient id={`ceu-${id}`} x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={ceu.alto} stopOpacity={1} />
              <Stop offset="0.3" stopColor={ceu.meio} stopOpacity={1} />
              <Stop offset="1" stopColor={ceu.baixo} stopOpacity={1} />
            </LinearGradient>
            {/*
              Um gradiente por morro, e todos terminando em zero.

              É isto que faz a borda sumir sem filtro nenhum: a elipse não
              tem aresta, ela se dissolve no céu. O `FeGaussianBlur` existe
              no `react-native-svg` 15.12 e resolveria também — mas filtro de
              SVG no Android é caro, e é a coisa que eu não teria como
              conferir daqui antes de mandar para a loja.

              O meio da parada é 0,58 e não o dobro da de fora: com a queda
              linear até zero, a elipse inteira vira névoa e some. Segurando
              o miolo, ela tem uma **copa** — e copa é o que diferencia um
              morro de uma mancha.
            */}
            {MORROS.map((m, i) => (
              <RadialGradient key={i} id={`morro${i}-${id}`} cx="50%" cy="50%" r="50%">
                <Stop offset="0" stopColor={MORRO} stopOpacity={m.op} />
                <Stop offset="0.58" stopColor={MORRO} stopOpacity={m.op * 0.88} />
                <Stop offset="1" stopColor={MORRO} stopOpacity={0} />
              </RadialGradient>
            ))}
          </Defs>

          {/*
            O céu passa quatro pontos de cada lado, pelo mesmo motivo que o
            morro da `Cena` passa: a borda exata cai no meio de uma coluna de
            pixel no aparelho, e meio pixel de céu sobre transparente vira um
            fio escuro colado na lateral. O `viewBox` recorta a sobra.
          */}
          <Rect
            x={-4}
            y={0}
            width={largura + 8}
            height={crista + EMENDA}
            fill={`url(#ceu-${id})`}
          />


          {/*
            A paisagem ao longe: três copas e uma crista rasteira.

            A primeira tentativa foi discreta demais e o céu inteiro leu como
            falha de pintura — cento e quarenta pontos de creme liso entre o
            balão e a terra. A segunda errou para o outro lado: elipses mais
            largas que a tela, que não têm copa visível e por isso empilham
            numa tarja verde horizontal, que é névoa e não relevo.

            Estas três cabem na largura, então dá para ver onde cada uma sobe
            e desce. A quarta — `rasteira` — é a única que transborda de
            propósito: ela não é morro, é o pé da paisagem encostando na
            terra, e precisa atravessar sem começo nem fim.
          */}
          {MORROS.map((m, i) => (
            <Ellipse
              key={i}
              cx={largura * m.x}
              cy={crista - m.sobe}
              rx={largura * m.largura}
              ry={m.alto}
              fill={`url(#morro${i}-${id})`}
            />
          ))}
        </Svg>

        {/*
          As nuvens, por cima do `Svg` porque elas andam. Ver `NUVENS`.

          `k` é a escala do aparelho: as posições e o passeio são escritos na
          largura de referência, como na `Cena`, para o tempo nublado ser o
          mesmo em qualquer tela.
        */}
        {NUVENS.map((n, i) => (
          <Nuvem
            key={`n${i}`}
            x={largura * n.x}
            y={(crista + EMENDA) * n.y}
            escala={n.escala * k}
            ms={n.ms}
            cor={NUVEM}
            k={k}
            parado={menosMovimento}
          />
        ))}
      </View>

      {/*
        2. As palavras, cada uma na coluna dela.

        O contentor ocupa a largura inteira e cada palavra é centrada nele;
        quem a leva para a própria coluna é o `translateX`. Fazer assim, e não
        com um contentor por palavra, é o que mantém a posição horizontal
        dentro da mesma lista de transformações que já anima a queda e o
        tombo — uma coisa só para o driver nativo mexer.
      */}
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          top: inicioDaQueda,
          left: 0,
          width: largura,
          height: distancia + 40,
        }}
      >
        {plano.palavras.map((p, i) => {
          const curva = (pontos: readonly (readonly [number, number])[]) =>
            curvaDaPalavra(p.inicio, plano.janela, pontos);

          const andar = tempo.interpolate(curva([[0, 0], [1, distancia]]));
          const opacidade = tempo.interpolate(curva(OPACIDADE_NA_QUEDA));
          /*
            A palavra tomba um pouco enquanto desce, para um lado ou para o
            outro conforme a posição dela na frase. Caindo reta, parece objeto
            descendo de elevador; tombando, parece folha.
          */
          const graus = curva([[0, 0], [1, p.lado * TOMBO]]);
          const giro = tempo.interpolate({
            inputRange: graus.inputRange,
            outputRange: graus.outputRange.map((g) => `${g}deg`),
          });
          /*
            A coluna desta palavra, já ajustada à largura dela — ver
            `planoDaQueda`. O texto é centrado num contentor da largura da
            tela, então nasce no meio; o deslocamento leva até a coluna.
          */
          const coluna = p.centro - largura / 2;
          return (
            <Animated.Text
              key={`${i}-${p.palavra}`}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                textAlign: 'center',
                fontFamily: fonts.body.bold,
                fontSize: p.fonte,
                lineHeight: p.linha,
                /*
                  Não segue o tema, porque o céu por onde elas caem também não.

                  Por um tempo elas foram `colors.textPrimary`, e era o certo:
                  o céu escurecia à noite, e o texto clareava junto. Com o céu
                  fixo em claro, esse mesmo acerto passaria a escrever creme
                  sobre creme. Ver `TEXTO_NO_CEU`.
                */
                color: TEXTO_NO_CEU,
                opacity: opacidade,
                transform: [{ translateX: coluna }, { translateY: andar }, { rotate: giro }],
              }}
            >
              {p.palavra}
            </Animated.Text>
          );
        })}
      </View>

      {/* 3. A terra, por cima das palavras — é nela que elas somem. */}
      <View
        pointerEvents="none"
        style={{ position: 'absolute', left: 0, right: 0, top: crista - CURVA_DA_TERRA.RECUO, bottom: 0 }}
      >
        <Svg
          width="100%"
          height="100%"
          viewBox={`0 0 ${largura} ${alturaDaTerra + CURVA_DA_TERRA.RECUO}`}
        >
          <Defs>
            <LinearGradient id={`terra-${id}`} x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={TERRA_CLARA} />
              <Stop offset="0.14" stopColor={TERRA} />
              {/*
                Escurece cedo, e não no meio: o título e a linha ficam a partir
                de um terço daqui para baixo, e sobre o tom claro da crista o
                creme do texto dava 2,6 de contraste. Sobre `TERRA_FUNDA` dá
                mais de seis.
              */}
              {/*
                A parada escura sobe de 0,46 para 0,42.

                Não é ajuste de gosto: o convite subiu junto com a terra que
                cresceu, e sobre o tom mais claro o creme do título caía para
                4,74 — abaixo do piso de 4,5 com folga nenhuma. Chegando mais
                cedo ao tom escuro, ele volta aos 4,88 de antes sem mexer na
                crista iluminada lá em cima, que é o que dá relevo à terra.
              */}
              <Stop offset="0.42" stopColor={TERRA_FUNDA} />
              {/*
                A terra chega ao tom mais escuro e, daí para baixo, some.

                As duas últimas paradas são a mesma cor: o que muda entre elas
                é só a opacidade. Mudar a cor também faria a terra clarear
                enquanto some, que é o que dá aquele aspecto de névoa.
              */}
              {/*
                A dissolução só existe quando a faixa acaba aqui. Continuando,
                a terra chega cheia à última linha e a emenda com a faixa de
                baixo fica invisível — que é o ponto de elas serem o mesmo
                terreno.
              */}
              {/*
                Continuando, o tom mais escuro chega em 0,8 e não em 1.

                Com a parada no fim, a terra ainda estava interpolando na
                última linha e encontrava a faixa de baixo — que já começa
                chapada — num tom mais claro. O resultado era uma risca
                horizontal na emenda, e duas lajes onde deveria haver um
                terreno. Chegando antes, os últimos vinte por cento são
                iguais dos dois lados e a costura some.
              */}
              <Stop
                offset={continua ? 0.8 : TERRA_COMECA_A_SUMIR}
                stopColor={TERRA_SOMBRA}
                stopOpacity={1}
              />
              {/*
                Continuando, esta parada repete a de cima em vez de sumir: o
                `react-native-svg` não aceita filho condicional aqui, e uma
                parada duplicada no mesmo ponto não desenha nada.
              */}
              <Stop offset="1" stopColor={TERRA_SOMBRA} stopOpacity={continua ? 1 : 0} />
            </LinearGradient>
            <RadialGradient id={`brasa-${id}`} cx="50%" cy="50%" r="50%">
              <Stop offset="0" stopColor={BRASA} stopOpacity={0.4} />
              <Stop offset="1" stopColor={BRASA} stopOpacity={0} />
            </RadialGradient>
          </Defs>

          {/* O calor de dentro do monte, bem onde as palavras entram. */}
          <Ellipse cx={largura * 0.31} cy={40} rx={largura * 0.3} ry={30} fill={`url(#brasa-${id})`} />

          {/* A terra sangra para fora dos dois lados: ela é o chão, não um objeto. */}
          <Path
            d={`${CRISTA_DA_TERRA(largura)} L${largura + 8} ${alturaDaTerra + CURVA_DA_TERRA.RECUO} L-8 ${alturaDaTerra + CURVA_DA_TERRA.RECUO} Z`}
            fill={`url(#terra-${id})`}
          />
          <Path
            d={CRISTA_DA_TERRA(largura)}
            stroke={TERRA_CLARA}
            strokeWidth={3}
            strokeLinecap="round"
            fill="none"
            opacity={0.55}
          />
          {[0.12, 0.3, 0.58, 0.82, 0.94].map((f, i) => (
            <Ellipse
              key={f}
              cx={largura * f}
              cy={46 + (i % 3) * 13}
              rx={4}
              ry={3.2}
              fill={TERRA_SOMBRA}
              opacity={0.45}
            />
          ))}

          {/*
            Aqui ficavam as raízes do broto, e elas saíram.

            A ideia era boa no papel: um leque de fios finos saindo do pé da
            haste, com pouca opacidade, para quem olhasse a faixa ver textura
            de solo e quem olhasse o broto ver que ele está preso ali.

            Na tela, não era isso. Num aparelho de verdade os fios ficam com
            menos de um pixel de largura, o antisserrilhado os espalha, e o
            que sobra é uma mancha clara em leque debaixo do mascote — não lê
            como raiz, lê como borrão. E ela cai exatamente onde o título
            "Não sai da cabeça?" começa, roubando contraste de uma linha que
            precisa de todo o contraste que tem.

            `raizesDoBroto` continua existindo, com os testes dela: o desenho
            não estava errado, estava no tamanho errado. Se um dia houver uma
            tela em que a terra seja o assunto, e grande, ele serve.
          */}
        </Svg>
      </View>

      {/*
        4. O broto do adubo, balançando.

        Por cima da terra e com o pé no mesmo ponto de sempre: a terra
        começa 26 pontos acima da crista, e o pé está a 46 dali para baixo.
        Fora da vista ele para de balançar, como as palavras param de cair.
      */}
      {/*
        É o **mascote** que está plantado aqui, e não mais o broto anônimo.

        Eram dois brotos diferentes no mesmo app: o personagem, com rosto,
        morava na aba dele; aqui crescia um broto sem cara, desenhado à parte.
        A tela que a pessoa mais vê era justamente a única sem o personagem.

        As raízes continuam, e continuam sendo o ponto: o pensamento vira adubo
        e o adubo vira raiz. O que muda é quem está em cima delas.

        `top` em vez de `bottom` porque o que precisa cair no lugar certo é o
        **pé da haste**, que fica no meio do desenho — as folhas descem abaixo
        dele. `noQuadro` devolve onde esse ponto cai dentro do quadro.
      */}
      {/*
        O que ele diz, à esquerda dele, com o bico apontando de volta.

        Fica **dentro do céu** como tudo o mais desta faixa, e por isso o texto
        é cor fixa: no escuro, `textPrimary` seria creme sobre céu claro. Ver
        `ceuDaComposta`.

        E por isso o balão também: `tom="noCeu"` é o branco que não anoitece.
        Com o tom normal ele vira `colors.surface` — quase preto à noite —, e
        o texto fixo escuro desaparece dentro dele. Era o único lugar da faixa
        em que a regra do céu valia para a letra e não valia para o fundo.

        A largura máxima é a distância até o broto, menos uma folga — escrita
        como conta e não como número, porque a coluna dele é uma fração da
        tela e muda de aparelho para aparelho.
      */}
      {!!fala && (
        <BalaoDoBroto
          lado="direita"
          tom="noCeu"
          apareceEm={fala}
          style={{
            position: 'absolute',
            left: 20,
            top: crista - 26 + PE_DO_BROTO - peDoMascote.y + 12,
            maxWidth: Math.max(140, xDoBroto - quadroDoMascote.largura / 2 - 36),
          }}
        >
          <Text
            style={{
              fontFamily: fonts.body.bold,
              fontSize: 14.5,
              lineHeight: 14.5 * 1.35,
              color: TEXTO_NO_CEU,
            }}
          >
            {fala}
          </Text>
        </BalaoDoBroto>
      )}

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={rotuloDaFala ?? 'Falar com o broto'}
        onPress={aoTocarNoBroto}
        disabled={!aoTocarNoBroto}
        style={{
          position: 'absolute',
          left: xDoBroto - quadroDoMascote.largura / 2,
          top: crista - 26 + PE_DO_BROTO - peDoMascote.y,
        }}
      >
        <AnimatedSprout
          mood={humor ?? 'neutro'}
          stage={estagio}
          size={tamanhoDoMascote}
          showPot={false}
          pose={pose}
          bamboleia={rodando}
        />
      </Pressable>

      {/* O cabeçalho, dentro do céu e com a altura que foi reservada a ele. */}
      <View style={{ height: topo + cabecalho, paddingTop: topo, paddingHorizontal: recuo }}>
        {children}
      </View>

      {/*
        O convite, pousado na terra.

        O alvo de toque é o bloco de terra inteiro — largura cheia, cento e
        setenta e seis pontos de altura. O botão continua sendo **desenho**,
        e não um `Pressable` dentro de outro: dois alvos concêntricos que fazem
        a mesma coisa viram dois anúncios no leitor de tela. Ver `CartaoHeroi`.
      */}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        onPress={onPress}
        style={({ pressed }) => ({
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          height: alturaDaTerra,
          paddingHorizontal: recuo,
          /*
            Quando a faixa acaba aqui, o respiro é do tamanho da dissolução:
            menor que isso, o botão ficaria pousado na parte que está sumindo,
            e ele é a única coisa da faixa que não pode parecer que vai
            embora. Continuando, não há o que evitar — sobra o respiro normal.
          */
          paddingBottom: continua ? 24 : 66,
          justifyContent: 'flex-end',
          gap: 9,
          opacity: pressed ? 0.88 : 1,
        })}
      >
        {/*
          Creme sobre terra, nos dois temas — e por isso vindo de
          `terraDoCanteiro`, não da paleta.

          `colors.textPrimary` aqui seria o erro clássico: ele inverte com o
          tema, e a terra não. No claro daria quase-preto sobre marrom escuro.
        */}
        <Text style={{ fontFamily: fonts.display.extraBold, fontSize: 25, color: TEXTO_NA_TERRA }}>
          {titulo}
        </Text>
        <Text
          numberOfLines={2}
          style={{
            fontFamily: fonts.body.regular,
            fontSize: 14,
            lineHeight: 14 * 1.42,
            color: TEXTO_NA_TERRA_FRACO,
          }}
        >
          {linha}
        </Text>
        <View
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
          style={{
            /* Fixo, como tudo que pousa nesta terra. Ver `BOTAO_NA_TERRA`. */
            backgroundColor: BOTAO_NA_TERRA.fundo,
            borderRadius: radius.botao,
            paddingVertical: 16,
            alignItems: 'center',
            marginTop: 2,
          }}
        >
          <Text
            style={{
              fontFamily: fonts.body.bold,
              /* Dezoito, e não dezesseis: é o único botão da primeira dobra e
                 estava menor que o título que ele responde. */
              fontSize: 18,
              color: BOTAO_NA_TERRA.tinta,
            }}
          >
            {acao}
          </Text>
        </View>
      </Pressable>
    </View>
  );
}
