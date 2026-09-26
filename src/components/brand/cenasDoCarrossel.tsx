import React, { useEffect, useId, useMemo, useRef, useState } from 'react';
import { Animated, Easing, View } from 'react-native';
import Svg, {
  Defs,
  Ellipse,
  G,
  LinearGradient,
  Path,
  RadialGradient,
  Rect,
  Stop,
  Text as SvgText,
} from 'react-native-svg';

import { fraseQueODiaDemonstra } from '../../data/composta';
import { useMenosMovimento } from '../../hooks/useMenosMovimento';
import { fonts } from '../../theme';
import { palette, tracos } from '../../theme/tokens';
import { DesenhoDoTema } from './desenhosDosTemas';
import { curva, desloca, estica, gira } from './movimentoDaCena';
import { BRASA, TERRA, TERRA_CLARA, TERRA_FUNDA, TERRA_SOMBRA } from './terraDoCanteiro';

/**
 * As cenas grandes dos cartões do carrossel: uma por ferramenta, cobrindo o
 * cartão inteiro.
 *
 * ## Por que elas são compostas do zero, e não são ícones ampliados
 *
 * Antes destas havia desenhinhos quadrados de 60 pontos, compostos para serem
 * lidos do tamanho de um ícone: objeto no meio, sombra embaixo, nada em volta.
 * Esticados para 350 × 300 eles não viram ilustração — viram um ícone grande no
 * meio de um vazio grande, que é exatamente o problema que o cartão novo existe
 * para resolver. Saíram do projeto junto com o cartão pequeno que os usava.
 *
 * Estas são compostas na proporção do cartão: o assunto ocupa a metade de cima,
 * o chão atravessa a largura toda, e há coisa nas beiradas — folhas, torrões,
 * um lápis — para a cena continuar depois da borda em vez de acabar nela.
 *
 * ## O véu não mora mais aqui
 *
 * O título e o botão ficam **em cima** da cena, e entre os dois é preciso
 * haver um véu — um degradê que termina na cor de fundo do cartão — ou texto
 * escuro sobre folha clara fica ilegível em metade das linhas.
 *
 * Ele já foi desenhado dentro de cada cena, com altura de 62% do cartão. Esses
 * 62% eram um palpite da altura do bloco de texto, e o palpite era de um
 * título de **uma linha**: "Aterramento 5-4-3-2-1" quebra em duas, o bloco
 * passa de 186 para 226 pontos num cartão de 286, e os 40 que sobram ficavam
 * acima do véu — a cena do tema atravessava a primeira linha do título.
 *
 * A cena não tem como saber disso. Quantas linhas o título ocupou depende da
 * palavra, da largura da tela e do corpo de letra que a pessoa escolheu no
 * sistema, e quem tem essa informação é o layout, dentro do cartão. Por isso o
 * véu foi para o `CartaoHeroi`, colado no bloco de texto — ver o `Veu` de lá,
 * que é onde está a explicação inteira.
 *
 * O que sobrou aqui é só o desenho.
 *
 * ## Os ids
 *
 * `url(#id)` não tem escopo por componente: dois cartões na mesma tela
 * disputariam o mesmo nome de gradiente e um deles apareceria sem preenchimento.
 * Por isso cada instância gera o seu com `useId`.
 */

/** A proporção em que as cenas são compostas. O cartão corta o excedente. */
const LARGURA = 300;
const ALTURA = 290;

/** O casco de toda cena: preenche o cartão e corta o que sobra. */
function Cena({ children }: { children: React.ReactNode }) {
  return (
    <View style={{ flex: 1 }} pointerEvents="none">
      <Svg
        width="100%"
        height="100%"
        viewBox={`0 0 ${LARGURA} ${ALTURA}`}
        preserveAspectRatio="xMidYMid slice"
      >
        {children}
      </Svg>
    </View>
  );
}

/**
 * Um raminho entrando pela borda: haste mais duas folhas na ponta.
 *
 * As folhas já estiveram soltas nos cantos, e soltas elas liam como manchas
 * verdes largadas na ilustração — o olho procura de onde a folha vem, não acha,
 * e aquilo vira sujeira. Com dois centímetros de haste saindo da borda, a mesma
 * folha passa a ser uma planta que continua fora do cartão.
 */
function Ramo({
  d,
  x,
  y,
  giro,
  escala,
}: {
  /** A haste, em coordenadas da cena, começando fora da borda. */
  d: string;
  /** A ponta da haste, onde as folhas nascem. */
  x: number;
  y: number;
  giro: number;
  escala: number;
}) {
  return (
    <G>
      <Path
        d={d}
        stroke={tracos.haste}
        strokeWidth={3.4}
        strokeLinecap="round"
        fill="none"
      />
      <Folha x={x} y={y} giro={giro} escala={escala} />
      <Folha x={x} y={y + 6} giro={giro + 284} escala={escala * 0.8} clara />
    </G>
  );
}

/** Uma folha do broto, no traço do mascote, para pousar nas beiradas. */
function Folha({
  x,
  y,
  giro,
  escala,
  clara = false,
}: {
  x: number;
  y: number;
  giro: number;
  escala: number;
  clara?: boolean;
}) {
  return (
    <Path
      d="M0 0 C -6 -14 -18 -26 -32 -24 C -42 -22 -44 -6 -34 4 C -22 16 -8 12 0 0 Z"
      fill={clara ? tracos.folhaClara : tracos.folha}
      stroke={tracos.contornoFolha}
      strokeWidth={2.6}
      transform={`translate(${x} ${y}) rotate(${giro}) scale(${escala})`}
    />
  );
}

/**
 * Prática de hoje — a cena do tema dela, no tamanho do cartão.
 *
 * Esta não desenha nada próprio: reaproveita a cena do tema
 * (`desenhosDosTemas`) no tamanho de cartão. É de propósito — a pessoa vê a
 * mesma cena de "Insônia" no cartão grande, na grade de treze e na fileira de
 * recentes, e é essa repetição que faz a lua virar o sinal de um lugar em vez
 * de mais um desenho.
 *
 * Por isso ela também não usa o casco `Cena`: aquele monta um `Svg` próprio, e
 * o desenho do tema já vem com o dele. SVG dentro de SVG não é caminho no
 * `react-native-svg`.
 */
export function CenaDaPratica({
  tema,
  altura,
}: {
  tema: string;
  /** A altura do cartão; a cena ocupa a parte de cima dela. */
  altura: number;
}) {
  return (
    <View style={{ flex: 1 }} pointerEvents="none">
      {/*
        A cena é maior que a janela, e a janela corta.

        Desenhada inteira e centralizada, ela ficava perdida: as cenas do tema
        põem o objeto entre 12 e 48 de uma caixa de 60, então um terço da altura
        é folga — e, num cartão de 330, um terço de folga é o objeto flutuando
        no meio de cem pontos de nada. Grande e cortada nas beiradas, ela ocupa
        a faixa de cima do cartão como as outras três cenas ocupam.
      */}
      <View
        style={{
          height: altura * 0.6,
          overflow: 'hidden',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <DesenhoDoTema tema={tema} size={altura * 0.92} />
      </View>
    </View>
  );
}

/**
 * Diário — um caderno aberto sobre a mesa, com um lápis pousado ao lado.
 *
 * Caderno, e não tela: a promessa do diário é que aquilo não sai do aparelho, e
 * papel é o objeto que diz isso sem escrever. O caderno está **aberto** e não
 * fechado porque a ação é escrever agora, não guardar.
 */
/**
 * A cena do Diário.
 *
 * ## O que ela faz ao ser tocada
 *
 * O lápis sai da mesa e sobe até a página, endireitando; e a última pauta da
 * esquerda — a curta, que é onde a escrita parou — cresce.
 *
 * As duas coisas contam a mesma frase, que é a frase do cartão: *a página está
 * começada, e agora você continua*. Nenhuma das duas termina o serviço: o lápis
 * não chega a encostar e a linha não alcança o comprimento das outras, porque
 * quem escreve é a pessoa, do outro lado do toque.
 */
export function CenaDoDiario({ passo = 0 }: { passo?: number }) {
  const id = useId().replace(/[^a-zA-Z0-9]/g, '');
  const p = passo;

  return (
    <Cena>
      <Defs>
        <LinearGradient id={`papel-${id}`} x1="0" y1="0" x2="0.25" y2="1">
          <Stop offset="0" stopColor="#FFFFFF" />
          <Stop offset="0.6" stopColor={palette.cream100} />
          <Stop offset="1" stopColor={palette.cream300} />
        </LinearGradient>
        <RadialGradient id={`chao-${id}`} cx="50%" cy="50%" r="50%">
          <Stop offset="0" stopColor={TERRA_SOMBRA} stopOpacity={0.2} />
          <Stop offset="1" stopColor={TERRA_SOMBRA} stopOpacity={0} />
        </RadialGradient>
      </Defs>

      {/* A sombra do caderno na mesa: sem ela o objeto flutua. */}
      <Ellipse cx={150} cy={140} rx={104} ry={17} fill={`url(#chao-${id})`} />

      <G transform="translate(150 80)">
        {/*
          A folha de trás, espiando — e sem contorno.

          Com traço ela virava um segundo retângulo inteiro atravessando o
          cartão, que lia como erro de desenho e não como caderno. Preenchida e
          sem linha, ela faz o que devia fazer desde o começo: dar espessura à
          pilha e sumir.
        */}
        <Rect
          x={-84}
          y={-54}
          width={168}
          height={106}
          rx={7}
          fill={palette.cream300}
          opacity={0.75}
          transform="rotate(3)"
        />

        <G transform="rotate(-2)">
          {/* As duas páginas abertas, com o vinco no meio. */}
          <Path
            d="M-82 -50 C-82 -53.3 -79.3 -56 -76 -56 L76 -56 C79.3 -56 82 -53.3 82 -50 L82 34 L68 48 L-76 48 C-79.3 48 -82 45.3 -82 42 Z"
            fill={`url(#papel-${id})`}
            stroke={tracos.contorno}
            strokeWidth={2.4}
            strokeLinejoin="round"
          />
          {/* O canto virado, a mesma aresta dobrada para dentro. */}
          <Path
            d="M82 34 L68 34 L68 48 Z"
            fill={palette.cream300}
            stroke={tracos.contorno}
            strokeWidth={2}
            strokeLinejoin="round"
          />
          {/* O vinco central. */}
          <Path d="M0 -54 L0 46" stroke={palette.brown200} strokeWidth={2.2} strokeLinecap="round" />

          {/*
            As pautas. A última da esquerda é curta: é onde a escrita parou, e
            é o convite — a página está começada, não em branco.
          */}
          {[
            [-32, -16],
            [-14, -16],
            [4, -16],
            [22, -44],
          ].map(([y, fim], i) => {
            /*
              Só a última cresce, e só ao longo do próprio eixo.

              Por isso `estica` e não `cresce`: uma pauta que engordasse junto
              com o comprimento viraria um borrão, não uma frase sendo escrita.
              A origem é a margem esquerda, que é de onde se escreve.
            */
            const escrevendo = i === 3;
            return (
              <G
                key={`e${y}`}
                transform={escrevendo ? estica(curva(p, [1, 1.3, 1.6, 1.8, 1.9]), 1, -68, y) : undefined}
              >
                <Path
                  d={`M-68 ${y} L${fim} ${y}`}
                  stroke={palette.brown200}
                  strokeWidth={2.8}
                  strokeLinecap="round"
                />
              </G>
            );
          })}
          {[-32, -14, 4, 22].map((y) => (
            <Path
              key={`d${y}`}
              d={`M16 ${y} L68 ${y}`}
              stroke={palette.cream300}
              strokeWidth={2.8}
              strokeLinecap="round"
            />
          ))}
        </G>
      </G>

      {/*
        O lápis, pousado na mesa ao lado do caderno — e, no toque, subindo até
        a página e endireitando, como quem o pega para escrever.

        O deslocamento vem antes do giro na lista de transformações porque a
        ordem importa em SVG: girar primeiro giraria também o caminho que ele
        ainda vai percorrer, e o lápis subiria de lado.
      */}
      <G
        transform={[
          desloca(204 + curva(p, [0, -5, -11, -15, -17]), 132 + curva(p, [0, -6, -13, -17, -19])),
          gira(curva(p, [18, 15, 11, 8, 7]), 0, 0),
        ].join(' ')}
      >
        <Rect
          x={-38}
          y={-4.4}
          width={64}
          height={8.8}
          rx={2.6}
          fill={tracos.vaso}
          stroke={tracos.contorno}
          strokeWidth={2}
        />
        <Path
          d="M26 -4.4 L38 0 L26 4.4 Z"
          fill={palette.cream200}
          stroke={tracos.contorno}
          strokeWidth={2}
          strokeLinejoin="round"
        />
        <Path d="M34.6 -1.4 L38 0 L34.6 1.4 Z" fill={tracos.contorno} />
      </G>

      {/* Um raminho entrando pelo canto: a cena continua depois da borda. */}
      <Ramo d="M306 8 C288 12 274 22 264 38" x={264} y={38} giro={-58} escala={0.52} />
    </Cena>
  );
}

/**
 * Composta — o pensamento dito em voz alta caindo na terra, e o broto saindo
 * do outro lado.
 *
 * É literalmente o que a ferramenta faz, e é a única das três cenas que conta
 * uma história em vez de mostrar um objeto: balão entrando de um lado, broto
 * saindo do outro.
 */
/**
 * Quanto cada palavra leva para cair, do alto até o adubo.
 *
 * O ciclo inteiro é este número vezes o tamanho da frase — três ou quatro
 * palavras, conforme o dia. Cada uma tem a sua fatia do ciclo e ninguém
 * atropela ninguém: quando a última acaba de sumir, a primeira recomeça, e a
 * volta fecha sem emenda.
 *
 * Começou em mil e cem, escolhidos no papel como "o tempo de ler uma palavra
 * sem pressa". No cartão real era pressa: a palavra fica cheia entre um sétimo
 * e dois terços da queda, ou seja meio segundo a 1100 — e meio segundo não é
 * ler, é entrever.
 *
 * A mil e oitocentos, a mesma janela dá oitocentos e sessenta milissegundos,
 * e a frase inteira leva sete segundos. Vale para o que este cartão é: não é
 * um aviso que precisa ser visto antes de a pessoa rolar, é a ferramenta
 * fazendo o gesto dela em ritmo de gesto.
 */
const QUEDA_DA_PALAVRA = 1800;

/**
 * O tempo parado antes da primeira queda.
 *
 * O cartão entra no carrossel deslizando. Uma palavra caindo no meio desse
 * deslize é movimento dentro de movimento, e não se lê nem uma coisa nem
 * outra.
 */
const ESPERA_PARA_LER = 500;

/** De onde a palavra parte e onde ela encosta, na altura da cena. */
const ALTO = 34;
const SOLO = 132;

/** A coluna por onde elas descem, à esquerda do broto que nasce em 232. */
const COLUNA = 118;

/**
 * A opacidade de uma palavra ao longo da própria queda.
 *
 * Ela **entra** também, e não só sai. Sem a entrada, o primeiro quadro de cada
 * volta punha a palavra no alto já opaca, do nada — e num laço isso é um
 * piscar a cada ciclo, na mesma posição, que é o tipo de coisa que o olho
 * aprende a esperar e passa a incomodar.
 *
 * Ela fica cheia do primeiro sétimo até quase dois terços do caminho, que é
 * onde dá para ler. Dali para baixo some, e chega no chão em zero.
 */
function opacidadeDaQueda(t: number): number {
  const entra = Math.min(1, t / 0.14);
  const sai = 1 - Math.max(0, (t - 0.62) / 0.38);
  return entra * sai;
}

/**
 * A cena da Composta — e, dentro do balão, o gesto acontecendo.
 *
 * ## Por que o cartão faz o truque
 *
 * A Composta é o mecanismo único deste app: repetir a frase em voz alta até ela
 * perder o peso. Mas o que encanta nela — ver as palavras se desmancharem — só
 * acontecia **depois** de a pessoa entrar, escrever e ligar o microfone. De
 * fora, o cartão era um desenho bonito, e desenho não demonstra nada.
 *
 * Agora o balão que dizia "palavras" diz palavras de verdade, e elas somem da
 * esquerda para a direita, como somem lá dentro. Quem passa o dedo pelo
 * carrossel vê o app funcionando antes de tocar em coisa alguma.
 *
 * ## A frase é do app, nunca da pessoa
 *
 * Esta era a parte da ideia que estava errada, e o próprio desenho já dizia por
 * quê: *"o que a pessoa escreve nunca vira desenho"*. A tela inicial é o que
 * qualquer um lê por cima do ombro dela no ônibus — a frase mais dolorosa que
 * ela digitou no app não pode morar ali em corpo grande.
 *
 * E, para o objetivo, a frase do app é melhor mesmo: quem precisa ser
 * convencido pela demonstração é justamente quem ainda não compostou nada.
 */
export function CenaDaComposta({
  demonstrando = false,
}: {
  /** O cartão está à vista: hora de deixar a frase cair. */
  demonstrando?: boolean;
}) {
  const id = useId().replace(/[^a-zA-Z0-9]/g, '');
  const menosMovimento = useMenosMovimento();

  const palavras = useMemo(() => fraseQueODiaDemonstra().split(/\s+/).filter(Boolean), []);

  /*
    O valor animado vira número comum, pelo mesmo motivo de sempre: `Animated`
    entrega valor a um nó de SVG por `setNativeProps`, que o react-native-web
    não implementa. Ver `movimentoDaCena`.
  */
  const valor = useRef(new Animated.Value(0)).current;
  const [p, setP] = useState(0);

  useEffect(() => {
    const ouvinte = valor.addListener(({ value }) => setP(value));
    return () => valor.removeListener(ouvinte);
  }, [valor]);

  useEffect(() => {
    valor.setValue(0);
    if (!demonstrando || menosMovimento) return;
    /*
      Linear, e não suavizado nas pontas.

      Uma queda com `easing` desacelera no fim — o que descreve uma coisa
      pousando, e não uma coisa se desfazendo. E, num laço, a emenda entre o
      fim lento e o começo lento aparece como uma batida a cada volta.
    */
    const laco = Animated.loop(
      Animated.timing(valor, {
        toValue: 1,
        duration: QUEDA_DA_PALAVRA * palavras.length,
        easing: Easing.linear,
        useNativeDriver: false,
      }),
    );
    const espera = setTimeout(() => laco.start(), ESPERA_PARA_LER);
    return () => {
      clearTimeout(espera);
      laco.stop();
    };
  }, [demonstrando, menosMovimento, valor, palavras.length]);

  /** A fatia do ciclo que cabe a cada palavra: uma inteira, sem sobra. */
  const fatia = 1 / palavras.length;

  return (
    <Cena>
      <Defs>
        <LinearGradient id={`terra-${id}`} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={TERRA_CLARA} />
          <Stop offset="0.5" stopColor={TERRA} />
          <Stop offset="1" stopColor={TERRA_SOMBRA} />
        </LinearGradient>
        <RadialGradient id={`brasa-${id}`} cx="50%" cy="50%" r="50%">
          <Stop offset="0" stopColor={BRASA} stopOpacity={0.5} />
          <Stop offset="1" stopColor={BRASA} stopOpacity={0} />
        </RadialGradient>
        <RadialGradient id={`chao-${id}`} cx="50%" cy="50%" r="50%">
          <Stop offset="0" stopColor={TERRA_SOMBRA} stopOpacity={0.24} />
          <Stop offset="1" stopColor={TERRA_SOMBRA} stopOpacity={0} />
        </RadialGradient>
      </Defs>

      {/* O calor de dentro do monte, e a sombra dele no chão. */}
      <Ellipse cx={150} cy={136} rx={80} ry={38} fill={`url(#brasa-${id})`} />
      <Ellipse cx={150} cy={168} rx={130} ry={20} fill={`url(#chao-${id})`} />

      {/*
        O monte de terra — e ele desce até o fim da cena, em vez de acabar numa
        linha no meio do cartão. Assim a terra vira o chão do cartão inteiro; o
        véu apaga o excesso na parte de baixo, onde mora o texto.
      */}
      <Path
        d="M-6 290 L-6 158 C-6 130 56 108 150 108 C244 108 306 130 306 158 L306 290 Z"
        fill={`url(#terra-${id})`}
      />
      <Path
        d="M20 144 Q150 106 280 144"
        stroke={TERRA_CLARA}
        strokeWidth={3}
        strokeLinecap="round"
        fill="none"
        opacity={0.6}
      />
      {[
        { x: 46, y: 152, r: 4 },
        { x: 92, y: 166, r: 3.2 },
        { x: 196, y: 158, r: 3.6 },
        { x: 252, y: 148, r: 4.2 },
        { x: 274, y: 166, r: 2.8 },
      ].map((g) => (
        <Ellipse
          key={`${g.x}:${g.y}`}
          cx={g.x}
          cy={g.y}
          rx={g.r}
          ry={g.r * 0.8}
          fill={TERRA_FUNDA}
          opacity={0.5}
        />
      ))}

      {/*
        As palavras caindo — uma de cada vez, do alto até o adubo.

        ## Por que o balão saiu

        A frase morava dentro de um balão de fala inclinado, e as palavras
        desbotavam no lugar, da esquerda para a direita. O balão dizia "alguém
        falou isto", que é verdade, mas custava metade do cartão para dizer
        uma coisa que já está escrita logo abaixo dele: que a Composta é
        repetir em voz alta.

        O que ele atrapalhava é o resto. Desbotar no lugar mostra a frase
        **sumindo**; cair no monte mostra a frase **virando adubo**, que é a
        palavra que dá nome à ferramenta e a metáfora que o app inteiro usa. A
        terra já estava desenhada ali embaixo, e não recebia nada.

        ## Uma de cada vez, e em laço

        Cada palavra tem a sua fatia inteira do ciclo, e por isso duas nunca
        dividem a coluna: dá para ler cada uma antes de a seguinte aparecer.
        Quando a última encosta no chão, a primeira parte de novo do alto — e a
        volta fecha sem emenda porque a opacidade começa e termina em zero.

        A coluna é 118, à esquerda do broto que nasce em 232: as palavras
        descem de um lado e a planta sobe do outro, que é a frase inteira da
        ferramenta num cartão só.
      */}
      {palavras.map((palavra, i) => {
        const t = Math.max(0, Math.min(1, (p - i * fatia) / fatia));
        const opacidade = opacidadeDaQueda(t);
        if (opacidade <= 0.001) return null;
        /*
          A palavra tomba um pouco enquanto desce, para um lado ou para o outro
          conforme a posição dela na frase. Caindo reta, parece objeto descendo
          de elevador; tombando, parece folha.
        */
        const giro = (i % 2 === 0 ? -1 : 1) * t * 9;
        const y = ALTO + t * (SOLO - ALTO);
        return (
          <SvgText
            key={`${i}-${palavra}`}
            x={COLUNA}
            y={y}
            fontSize={25}
            fontFamily={fonts.body.bold}
            fill={tracos.contorno}
            textAnchor="middle"
            fillOpacity={opacidade}
            transform={`rotate(${giro} ${COLUNA} ${y})`}
          >
            {palavra}
          </SvgText>
        );
      })}

      {/*
        O broto que sai do adubo — o fim da história.

        A haste começa **dentro** do monte, e não na crista: nascendo na
        superfície, o broto ficava pousado ali como um objeto largado.
      */}
      <G transform="translate(232 136)">
        <Path
          d="M0 0 L0 -44"
          stroke={tracos.haste}
          strokeWidth={5}
          strokeLinecap="round"
          fill="none"
        />
        <Folha x={0} y={-44} giro={-52} escala={0.76} />
        <Folha x={0} y={-38} giro={232} escala={0.62} clara />
      </G>
    </Cena>
  );
}

/**
 * Frase do dia — o canteiro fechado, com um calor escapando de baixo da
 * saliência.
 *
 * A frase está enterrada e não aparece: a saliência e o brilho são a única
 * pista de que tem alguma coisa ali, e é isso que faz "desenterrar" ser um
 * gesto e não um botão de carregar texto.
 */
export function CenaDaFrase() {
  const id = useId().replace(/[^a-zA-Z0-9]/g, '');

  return (
    <Cena>
      <Defs>
        <LinearGradient id={`terra-${id}`} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={TERRA_CLARA} />
          <Stop offset="0.5" stopColor={TERRA} />
          <Stop offset="1" stopColor={TERRA_SOMBRA} />
        </LinearGradient>
        <RadialGradient id={`brasa-${id}`} cx="50%" cy="50%" r="50%">
          <Stop offset="0" stopColor={BRASA} stopOpacity={0.55} />
          <Stop offset="1" stopColor={BRASA} stopOpacity={0} />
        </RadialGradient>
        <RadialGradient id={`chao-${id}`} cx="50%" cy="50%" r="50%">
          <Stop offset="0" stopColor={TERRA_SOMBRA} stopOpacity={0.22} />
          <Stop offset="1" stopColor={TERRA_SOMBRA} stopOpacity={0} />
        </RadialGradient>
      </Defs>

      {/* Ordem: brilho por trás, sombra no chão, terra, luz na crista, grãos. */}
      <Ellipse cx={150} cy={98} rx={84} ry={54} fill={`url(#brasa-${id})`} />
      <Ellipse cx={150} cy={166} rx={142} ry={22} fill={`url(#chao-${id})`} />
      {/* O canteiro desce até o fim da cena pelo mesmo motivo da Composta: ele
          é o chão do cartão, e o véu apaga o que sobra embaixo do texto. */}
      <Path
        d="M-6 290 L-6 126 C-6 100 60 84 150 84 C240 84 306 100 306 126 L306 290 Z"
        fill={`url(#terra-${id})`}
      />

      {/* A saliência: o volume do que está enterrado ali embaixo. */}
      <Path
        d="M108 112 Q150 84 192 112"
        stroke={TERRA_FUNDA}
        strokeWidth={5}
        strokeLinecap="round"
        fill="none"
      />
      <Path
        d="M26 116 Q150 78 274 116"
        stroke={TERRA_CLARA}
        strokeWidth={3}
        strokeLinecap="round"
        fill="none"
        opacity={0.55}
      />
      {[
        { x: 52, y: 132, r: 4 },
        { x: 88, y: 148, r: 3 },
        { x: 150, y: 154, r: 3.6 },
        { x: 214, y: 142, r: 4.2 },
        { x: 252, y: 128, r: 3 },
      ].map((g) => (
        <Ellipse
          key={`${g.x}:${g.y}`}
          cx={g.x}
          cy={g.y}
          rx={g.r}
          ry={g.r * 0.8}
          fill={TERRA_FUNDA}
          opacity={0.5}
        />
      ))}

      {/* A quina de papel espiando da terra: o bastante para dar vontade de puxar. */}
      <G transform="translate(150 96) rotate(-8)">
        <Path
          d="M-20 14 L-14 -8 L18 -2 L14 16 Z"
          fill={palette.cream100}
          stroke={tracos.contorno}
          strokeWidth={2.4}
          strokeLinejoin="round"
        />
        <Path d="M-11 1 L12 5" stroke={palette.brown200} strokeWidth={2.6} strokeLinecap="round" />
      </G>

      <Ramo d="M-6 16 C14 20 28 30 38 46" x={38} y={46} giro={-128} escala={0.5} />
      <Ramo d="M306 22 C288 26 274 36 266 50" x={266} y={50} giro={-54} escala={0.46} />
    </Cena>
  );
}
