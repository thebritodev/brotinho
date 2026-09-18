import React, { useEffect, useId, useMemo } from 'react';
import { Animated, Easing, Pressable, Text, View } from 'react-native';
import Svg, { Defs, Ellipse, LinearGradient, Path, RadialGradient, Rect, Stop } from 'react-native-svg';

import { fraseQueODiaDemonstra } from '../../data/composta';
import { useMenosMovimento } from '../../hooks/useMenosMovimento';
import { fonts, radius, useTema } from '../../theme';
import { tracos } from '../../theme/tokens';
import {
  BRASA,
  TERRA,
  TERRA_CLARA,
  TERRA_FUNDA,
  TERRA_SOMBRA,
  TEXTO_NA_TERRA,
  TEXTO_NA_TERRA_FRACO,
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
 * O céu vem de `useTema`: o verde de estufa em cima, o fundo no meio, o tom
 * afundado embaixo. No escuro essas mesmas três viram um anoitecer sem eu
 * precisar de um caso especial — é a mesma conta que o `FundoDaTela` faz.
 *
 * A terra é a exceção, e é de propósito: ela vem de `terraDoCanteiro`, que não
 * segue o tema. Terra é a mesma de dia e de noite.
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
 * Começou em 176 e o conteúdo não coube: selo, título, linha, botão e o
 * respiro de baixo somam 187, e o que sobra transborda **para cima** — o
 * selo ia parar acima da crista, boiando no céu bem na coluna por onde as
 * palavras caem. Com 200, ele fica nove pontos abaixo da crista, que é
 * embaixo da terra do ponto de vista da palavra: quando ela chega ali já
 * está escondida.
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
 * A 57 ela leva três segundos e dois décimos. É o tempo de ler uma palavra
 * sem pressa, que era a intenção desde o começo.
 */
const VELOCIDADE = 57;

/**
 * Quanto da queda de uma palavra passa antes de a seguinte partir.
 *
 * A palavra desce um terço do caminho e a seguinte já parte. Há quase
 * sempre duas ou três no ar, o que faz a frase parecer se desfazendo em vez
 * de palavras enfileiradas — e a frase inteira se diz em uns quatro
 * segundos e meio, contra treze de uma por vez.
 *
 * ## Isto já foi 1, e o motivo de ter sido estava errado
 *
 * A primeira sobreposição pôs todas as palavras na **mesma coluna**, e no
 * aparelho elas liam como uma em cima da outra mesmo separadas por setenta
 * e seis pontos. Concluí que o problema era sobrepor, e voltei para uma por
 * vez — o que resolveu o sintoma custando o ritmo inteiro.
 *
 * O problema não era sobrepor: era a coluna única. Duas palavras na mesma
 * vertical se disputam por definição, por mais longe que estejam uma da
 * outra. Em colunas diferentes elas convivem, porque o olho lê cada uma no
 * lugar dela. Ver `COLUNAS`.
 */
const ATRASO_ENTRE_PALAVRAS = 0.34;

/**
 * Onde cada palavra cai, em fração da largura da tela.
 *
 * ## Por que não uma coluna só
 *
 * Era uma coluna só, em 31% da largura, e era isso que fazia as palavras se
 * atrapalharem quando mais de uma estava no ar. Espalhadas, elas podem cair
 * juntas sem se disputar — e o céu deixa de ter uma fileira vertical no
 * canto esquerdo com o resto vazio.
 *
 * ## Como as posições foram escolhidas
 *
 * Não são um varrimento da esquerda para a direita: isso leria como uma
 * régua, e o que se quer é coisa caindo onde calha. A sequência alterna
 * lados e nunca repete a mesma zona em palavras seguidas.
 *
 * Os limites são 0,30 e 0,68, e não 0 e 1, por duas razões. À esquerda, a
 * palavra é centrada na posição: uma palavra longa em 0,15 sairia pela
 * borda. À direita, o broto que nasce do adubo fica em 76% — passar por
 * cima dele no fim da queda embaralharia as duas coisas justo onde a
 * história se fecha.
 */
const COLUNAS = [0.32, 0.64, 0.42, 0.68, 0.36, 0.58] as const;

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
 * A opacidade de uma palavra ao longo da própria queda.
 *
 * Herdada do cartão, e pelo mesmo motivo: ela **entra** também, e não só sai.
 * Sem a entrada, o primeiro quadro de cada volta punha a palavra no alto já
 * opaca, do nada — num laço isso é um piscar a cada ciclo, sempre na mesma
 * posição, que é o tipo de coisa que o olho aprende a esperar e passa a
 * incomodar.
 */
const ENTRA = 0.14;
const SAI = 0.62;

type Props = {
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
  /** A faixa está à vista? Fora dela o laço para — ver `HomeScreen`. */
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
  selo?: string | null;
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
  selo,
  titulo,
  linha,
  acao,
  onPress,
  label,
}: Props) {
  const { colors, palette } = useTema();
  const id = useId().replace(/[^a-zA-Z0-9]/g, '');
  const menosMovimento = useMenosMovimento();

  const alturaDaTerra = continua ? ALTURA_DA_TERRA_CONTINUA : ALTURA_DA_TERRA;
  const altura = alturaDaFaixa(topo, cabecalho, queda, continua);
  /** Onde a terra começa a subir. Tudo acima disto é céu. */
  const crista = altura - alturaDaTerra;
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

  /**
   * Um valor animado por palavra, e não um só fatiado entre elas.
   *
   * Com um valor só, a fatia de cada palavra tinha de ser exclusiva: a
   * seguinte não podia começar antes de a anterior acabar, senão a volta do
   * laço cortava quem ainda estivesse caindo. Um valor por palavra deixa
   * cada uma ter o próprio começo e o próprio fim, e a sobreposição passa a
   * ser só uma questão de quando cada laço parte.
   *
   * Cada um vai de 0 a 1 e recomeça em 0, onde a opacidade também é 0 — por
   * isso a volta não aparece.
   *
   * Continua um por palavra mesmo agora que só uma cai por vez: é o que
   * deixa a sobreposição ser uma constante a mudar, e não uma reescrita.
   */
  const valores = useMemo(
    () => palavras.map(() => new Animated.Value(0)),
    [palavras],
  );

  useEffect(() => {
    valores.forEach((v) => v.setValue(0));
    if (!ativa || menosMovimento) return;

    /** O tempo de uma palavra cair inteira, na velocidade de sempre. */
    const quedaMs = Math.round((distancia / VELOCIDADE) * 1000);
    const intervalo = Math.round(quedaMs * ATRASO_ENTRE_PALAVRAS);
    /*
      De quanto em quanto tempo a **mesma** palavra volta.

      É o intervalo vezes o número de palavras — assim a frase inteira se
      diz uma vez por ciclo. O piso existe para frase curta: com duas
      palavras o ciclo ficaria menor que a própria queda, e a palavra teria
      de recomeçar antes de terminar de cair.
    */
    const ciclo = Math.max(intervalo * valores.length, quedaMs);

    const lacos = valores.map((v) =>
      /*
        Linear, e não suavizado nas pontas.

        Uma queda com `easing` desacelera no fim — o que descreve uma coisa
        pousando, e não uma coisa se desfazendo. E, num laço, a emenda entre
        o fim lento e o começo lento aparece como uma batida a cada volta.

        A espera depois da queda é o que mantém o ciclo de todas igual: sem
        ela cada palavra voltaria assim que caísse, e o escalonamento do
        começo se perderia depois da primeira volta.
      */
      Animated.loop(
        Animated.sequence([
          Animated.timing(v, {
            toValue: 1,
            duration: quedaMs,
            easing: Easing.linear,
            useNativeDriver: true,
          }),
          Animated.delay(ciclo - quedaMs),
        ]),
      ),
    );

    const esperas = lacos.map((laco, i) =>
      setTimeout(() => laco.start(), ESPERA_PARA_LER + i * intervalo),
    );

    return () => {
      esperas.forEach(clearTimeout);
      lacos.forEach((laco) => laco.stop());
    };
  }, [ativa, menosMovimento, valores, distancia]);

  return (
    <View style={{ height: altura, marginHorizontal: -recuo }}>
      {/* 1. O céu, e o que está longe demais para ter contorno. */}
      <View style={{ position: 'absolute', top: 0, left: 0, right: 0, height: crista + 4 }}>
        <Svg width="100%" height="100%" viewBox={`0 0 ${largura} ${crista + 4}`}>
          <Defs>
            <LinearGradient id={`ceu-${id}`} x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={colors.primarySoft} stopOpacity={1} />
              <Stop offset="0.3" stopColor={colors.bg} stopOpacity={1} />
              <Stop offset="1" stopColor={colors.surfaceSunken} stopOpacity={1} />
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
                <Stop offset="0" stopColor={palette.green300} stopOpacity={m.op} />
                <Stop offset="0.58" stopColor={palette.green300} stopOpacity={m.op * 0.88} />
                <Stop offset="1" stopColor={palette.green300} stopOpacity={0} />
              </RadialGradient>
            ))}
          </Defs>

          <Rect x={0} y={0} width={largura} height={crista + 4} fill={`url(#ceu-${id})`} />

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
        {palavras.map((palavra, i) => {
          const v = valores[i];
          const andar = v.interpolate({
            inputRange: [0, 1],
            outputRange: [0, distancia],
          });
          const opacidade = v.interpolate({
            inputRange: [0, ENTRA, SAI, 1],
            outputRange: [0, 1, 1, 0],
          });
          /*
            A palavra tomba um pouco enquanto desce, para um lado ou para o
            outro conforme a posição dela na frase. Caindo reta, parece objeto
            descendo de elevador; tombando, parece folha.
          */
          const giro = v.interpolate({
            inputRange: [0, 1],
            outputRange: ['0deg', `${(i % 2 === 0 ? -1 : 1) * 9}deg`],
          });
          /*
            A coluna desta palavra.

            O texto é centrado num contentor da largura da tela, então ele
            nasce no meio; o deslocamento é a distância daí até a coluna dela.
            Fica fora do `interpolate` porque não muda durante a queda — a
            palavra desce reta na coluna em que apareceu.
          */
          const coluna = (COLUNAS[i % COLUNAS.length] - 0.5) * largura;
          return (
            <Animated.Text
              key={`${i}-${palavra}`}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                textAlign: 'center',
                fontFamily: fonts.body.bold,
                fontSize: 30,
                lineHeight: 38,
                /*
                  Segue o tema — e é a única coisa desta faixa que segue.

                  A cena antiga pintava as palavras com `tracos.contorno`, que
                  é fixo (`tracos` existe para o desenho não seguir o tema).
                  Lá isso funcionava porque elas caíam sobre a superfície clara
                  de um cartão. Aqui elas caem sobre o **céu**, que escurece à
                  noite — e `tracos.contorno` é #3A3630 nos dois temas, ou seja
                  1,1 de contraste contra o céu escuro.

                  Elas são texto, não desenho: `colors.textPrimary` inverte
                  junto com o céu e resolve os dois casos de uma vez.
                */
                color: colors.textPrimary,
                opacity: opacidade,
                transform: [{ translateX: coluna }, { translateY: andar }, { rotate: giro }],
              }}
            >
              {palavra}
            </Animated.Text>
          );
        })}
      </View>

      {/* 3. A terra, por cima das palavras — é nela que elas somem. */}
      <View
        pointerEvents="none"
        style={{ position: 'absolute', left: 0, right: 0, top: crista - 26, bottom: 0 }}
      >
        <Svg
          width="100%"
          height="100%"
          viewBox={`0 0 ${largura} ${alturaDaTerra + 26}`}
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
            d={`M-8 ${alturaDaTerra + 26} L-8 34 C${largura * 0.24} 10 ${largura * 0.7} 8 ${largura + 8} 36 L${largura + 8} ${alturaDaTerra + 26} Z`}
            fill={`url(#terra-${id})`}
          />
          <Path
            d={`M-8 34 C${largura * 0.24} 10 ${largura * 0.7} 8 ${largura + 8} 36`}
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
            O broto que sai do adubo — o fim da história.

            A haste começa **dentro** do monte, e não na crista: nascendo na
            superfície, o broto ficava pousado ali como um objeto largado.
          */}
          <Path
            d={`M${largura * 0.76} 46 L${largura * 0.76} 2`}
            stroke={tracos.haste}
            strokeWidth={5}
            strokeLinecap="round"
            fill="none"
          />
          <Path
            d="M0 0 C -6 -14 -18 -26 -32 -24 C -42 -22 -44 -6 -34 4 C -22 16 -8 12 0 0 Z"
            fill={tracos.folha}
            stroke={tracos.contornoFolha}
            strokeWidth={2.6}
            transform={`translate(${largura * 0.76} 2) rotate(-52) scale(0.78)`}
          />
          <Path
            d="M0 0 C -6 -14 -18 -26 -32 -24 C -42 -22 -44 -6 -34 4 C -22 16 -8 12 0 0 Z"
            fill={tracos.folhaClara}
            stroke={tracos.contornoFolha}
            strokeWidth={2.6}
            transform={`translate(${largura * 0.76} 8) rotate(232) scale(0.64)`}
          />
        </Svg>
      </View>

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
        {!!selo && (
          <View
            style={{
              alignSelf: 'flex-start',
              backgroundColor: colors.surface,
              borderRadius: radius.pill,
              paddingVertical: 5,
              paddingHorizontal: 11,
            }}
          >
            <Text
              style={{
                fontFamily: fonts.body.extraBold,
                fontSize: 11,
                letterSpacing: 0.8,
                textTransform: 'uppercase',
                color: colors.primaryStrong,
              }}
            >
              {selo}
            </Text>
          </View>
        )}

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
            backgroundColor: colors.primary,
            borderRadius: radius.botao,
            paddingVertical: 15,
            alignItems: 'center',
            marginTop: 2,
          }}
        >
          <Text style={{ fontFamily: fonts.body.bold, fontSize: 16, color: colors.textInverse }}>
            {acao}
          </Text>
        </View>
      </Pressable>
    </View>
  );
}
