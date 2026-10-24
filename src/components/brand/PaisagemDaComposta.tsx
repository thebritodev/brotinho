import React, { useEffect, useId, useMemo, useRef } from 'react';
import { Animated, Easing, Image, View } from 'react-native';
import Svg, { Circle, Defs, Ellipse, G, LinearGradient, Path, Rect, Stop } from 'react-native-svg';

import { useMenosMovimento } from '../../hooks/useMenosMovimento';
import { lacoDeIdaEVolta, lacoQueSoVai } from '../laco';
import { AnimatedSprout } from './AnimatedSprout';
import { FlorDaComposta, florDoIndice } from './floresDaComposta';
import { CX, POT_TOP_Y, noQuadro, quadroDoBroto } from './geometriaDoBroto';
import { curvaDaPalavra } from './planoDaQueda';
import {
  CEU_DOURADO,
  CEU_PESADO,
  CHUVA,
  CONTORNO,
  GRAMA,
  LARGURA_DO_DOCUMENTO,
  LUZ,
  MORRO,
  NUVEM,
  NUVEM_CONTORNO,
  NUVEM_CONTORNO_GRANDE,
  NUVEM_SOMBRA,
  PARADAS_DO_DOURADO,
  PARADAS_DO_PESADO,
  PEDRA_ESCURA,
  SOL,
  SOL_CONTORNO,
  TERRA,
  TERRA_CLARA,
  TERRA_FUNDA,
  type FlorPlantada,
} from './planoDaPaisagem';
import type { Mood } from '../../theme';
import type { Pose, SproutStage } from './Sprout';

/**
 * A paisagem das telas da Composta — céu, terra e o que vive entre os dois.
 *
 * ## O que ela é
 *
 * Uma cena só, usada pelas cinco telas da ferramenta com parâmetros
 * diferentes: a altura, onde fica a crista da terra, quanta luz o céu tem, que
 * flores estão plantadas e onde está o broto. O documento chama isso de
 * `compScene`, e é a mesma cena em todas — o que faz a sequência das telas ler
 * como **um lugar** em que a pessoa fica, e não cinco ilustrações.
 *
 * A luz é o fio: `luz` 0 é o céu de chumbo do pensamento, `luz` 1 é o dourado
 * da flor, e durante a prática ela sobe de um para o outro junto com o
 * cronômetro. O sol sobe com ela.
 *
 * ## Por que o céu vem com a cena, e não por fora
 *
 * Porque as duas coisas leem a mesma luz. Separados, seriam dois componentes
 * que a tela tem de manter em sincronia à mão — e bastaria uma tela passar
 * `luz` para um e esquecer o outro para o sol nascer num céu cinza. Aqui a
 * tela diz a luz uma vez.
 *
 * ## Como as animações rodam, e por que não são SMIL
 *
 * O documento anima com `<animate>` e `<animateTransform>` dentro do SVG.
 * **`react-native-svg` não implementa SMIL**: as tags são aceitas e ignoradas,
 * sem erro nenhum — a cena ficaria parada no aparelho e ninguém saberia por
 * quê.
 *
 * Então cada coisa que se mexe é um `Animated.View` em cima do desenho, com
 * transformação e opacidade, que é o que o driver nativo sabe animar sozinho.
 * Animar atributo de SVG seria possível, mas cobra um render de React por
 * quadro — `setNativeProps` não existe no `react-native-web` —, e esta cena
 * tem até dez flores balançando.
 *
 * E os laços passam todos por `lacoDeIdaEVolta` / `lacoQueSoVai`: um
 * `Animated.loop` de um `timing` sozinho **não roda** no navegador, e falha
 * calado. Ver `components/laco.ts`, e `scripts/confere-lacos.js`, que guarda a
 * regra.
 *
 * ## Um relógio para cada grupo, não um por objeto
 *
 * As flores de mesmo período dividem um `Animated.Value`, e as seis gotas de
 * chuva dividem outro. Isso não é economia: é o que o documento faz. No SMIL,
 * dois `<animateTransform>` com o mesmo `dur` e o mesmo `begin` andam juntos —
 * então flores de 4 segundos balançam em fase no protótipo também. Copiar isso
 * com um valor por flor daria dez laços que **começam** juntos e se
 * desencontram ao longo dos minutos, que é um defeito, não uma fidelidade.
 *
 * A chuva usa `curvaDaPalavra`, da queda das palavras da tela inicial: um
 * relógio só, e a defasagem de cada gota escrita na curva dela. Ver
 * `planoDaQueda`, que conta o defeito que esse arranjo existe para impedir.
 */

/** A escala em que o documento desenha o sol, as nuvens e as gotas. */
const RAIO_DO_HALO = 92;
/** A que distância da borda direita o sol fica, em pontos. */
const SOL_DA_DIREITA = 78;
/** Onde o sol fica com o céu dourado, e quanto ele desce sem luz. */
const SOL_NO_ALTO = 70;
const SOL_DESCE = 70;

/** O período dos balanços das flores, em milissegundos. Três grupos. */
const BALANCOS = [4000, 5000, 6000];

/** A caixa da flor, em unidades do desenho dela — ver `IconeDaFlor`. */
const CAIXA_DA_FLOR = { x: -26, y: -66, largura: 52, altura: 70 };

/**
 * Onde o pé da flor fica, em fração da altura da caixa dela.
 *
 * A origem do desenho é (0, 0) numa caixa que vai de -66 a 4, então o pé está
 * a 66/70 do alto: 94,3%. O centro da `View` está a 50%. A diferença — 44,3%
 * da altura — é o quanto o pivô precisa descer em relação ao centro, que é a
 * origem padrão do `transform` no React Native.
 *
 * ## Por que não `transformOrigin`
 *
 * Porque **não pega**. Esta casa já descobriu isso uma vez, e está escrito na
 * `AbasVivas`: a propriedade foi usada, a transformação aconteceu em torno do
 * centro assim mesmo, e o defeito foi medido, não deduzido. Eu usei de novo
 * aqui e o Pedro viu o resultado no aparelho — a flor girando pelo meio, o que
 * faz o pé dela varrer para os lados. Lido na tela, não é balanço ao vento: é
 * uma flor deslizando pela terra.
 *
 * O jeito que funciona nas duas plataformas é a conta à mão: `T(d) · R · T(-d)`
 * desloca o pivô até o centro, gira, e desfaz. São três transformações comuns,
 * e o driver nativo sabe compor todas as três.
 */
const PE_DA_FLOR = 66 / 70 - 0.5;

export type BrotoNaPaisagem = {
  /** Na régua do documento. */
  x: number;
  /** A escala do documento: 1 é o mascote em tamanho de cena. */
  escala: number;
  humor: Mood;
  estagio: SproutStage;
  pose?: Pose;
};

type Props = {
  largura: number;
  altura: number;
  /** Onde a terra começa, em pontos contados do alto — ver `CRISTA`. */
  crista: number;
  /** De 0 (céu de chumbo) a 1 (céu dourado). */
  luz: number;
  flores?: FlorPlantada[];
  /** A flor que nasce agora, com a encenação inteira — ver `FlorNascendo`. */
  florNova?: { indice: number; x: number } | null;
  /** Os raios girando atrás do sol. Só na tela da flor. */
  raios?: boolean;
  /** A nuvem grande e centralizada, no lugar das duas pequenas. */
  nuvemGrande?: boolean;
  /** A chuva caindo da nuvem grande. */
  chuva?: boolean;
  /** O que vai dentro da nuvem grande, balançando com ela — ver `NuvemGrande`. */
  naNuvemGrande?: React.ReactNode;
  broto?: BrotoNaPaisagem | null;
  /**
   * Quanto a cena desce por causa da barra de status.
   *
   * A cena vai até o alto da tela — passa por trás da barra de status, e é
   * isso que faz a tela ser um lugar em vez de uma figura colada numa página.
   * Mas as alturas do documento (o sol em 70, as nuvens em 54 e 120, a nuvem
   * grande em 180, a chuva em 246) são contadas do alto **do conteúdo**, e
   * desenhá-las a partir da borda física deixaria o sol metade escondido atrás
   * do relógio do aparelho.
   *
   * Então tudo que vive no céu desce isto, e quem chama soma o mesmo valor à
   * altura e à crista. A terra não precisa: a crista já chega somada.
   */
  recuo?: number;
};

/**
 * O grão do céu.
 *
 * No documento é `feTurbulence`, que `react-native-svg` não implementa — ver
 * `GraoDePapel`, que conta a história e gerou o ladrilho que está em
 * `assets/grao.png`. A diferença aqui é que este grão **não segue o tema**: o
 * céu é de luz própria, então o grão é sempre o escuro em *multiply*, como no
 * tema claro. A força é a do documento: alfa 0,07 numa camada a 0,8.
 */
function GraoNoCeu() {
  return (
    <View
      pointerEvents="none"
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        top: 0,
        bottom: 0,
        opacity: 0.056,
        mixBlendMode: 'multiply',
      }}
    >
      <Image
        source={require('../../../assets/grao.png')}
        resizeMode="repeat"
        style={{ width: '100%', height: '100%' }}
      />
    </View>
  );
}

/**
 * O sol, os halos e os raios.
 *
 * Ele sobe com a luz — `sunY = 70 + (1 - p) · 70` no documento — e aparece
 * mesmo no céu de chumbo, a 15%: um céu cinza sem nenhum sol é um céu sem
 * hora do dia, e a tela do pensamento ainda é de dia.
 */
function Sol({
  largura,
  luz,
  raios,
  parado,
  recuo,
}: {
  largura: number;
  luz: Animated.Value;
  raios: boolean;
  parado: boolean;
  recuo: number;
}) {
  const id = useId().replace(/[^a-zA-Z0-9]/g, '');
  const giro = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!raios || parado) return;
    /* Cinquenta segundos por volta: devagar o bastante para não ser notado
       como animação, e é esse o ponto — é luz, não um ventilador. */
    const laco = lacoQueSoVai(giro, { ms: 50000, easing: Easing.linear });
    laco.start();
    return () => laco.stop();
  }, [raios, parado, giro]);

  const lado = RAIO_DO_HALO * 2;

  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: 'absolute',
        left: largura - SOL_DA_DIREITA - RAIO_DO_HALO,
        top: recuo + SOL_NO_ALTO - RAIO_DO_HALO,
        width: lado,
        height: lado,
        opacity: luz.interpolate({ inputRange: [0, 0.15, 1], outputRange: [0.15, 0.15, 1] }),
        transform: [
          { translateY: luz.interpolate({ inputRange: [0, 1], outputRange: [SOL_DESCE, 0] }) },
        ],
      }}
    >
      <Svg width={lado} height={lado} viewBox={`0 0 ${lado} ${lado}`}>
        <Circle cx={RAIO_DO_HALO} cy={RAIO_DO_HALO} r={92} fill={LUZ} opacity={0.35} />
        <Circle cx={RAIO_DO_HALO} cy={RAIO_DO_HALO} r={60} fill={LUZ} opacity={0.45} />
      </Svg>

      {raios && (
        <Animated.View
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            width: lado,
            height: lado,
            transform: [
              {
                rotate: giro.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] }),
              },
            ],
          }}
        >
          <Svg width={lado} height={lado} viewBox={`${-RAIO_DO_HALO} ${-RAIO_DO_HALO} ${lado} ${lado}`}>
            {Array.from({ length: 12 }, (_, i) => (
              <Path
                key={i}
                d="M -5 -46 L 5 -46 L 2 -86 L -2 -86 Z"
                fill={LUZ}
                opacity={0.55}
                transform={`rotate(${i * 30})`}
              />
            ))}
          </Svg>
        </Animated.View>
      )}

      <Svg
        width={lado}
        height={lado}
        viewBox={`${-RAIO_DO_HALO} ${-RAIO_DO_HALO} ${lado} ${lado}`}
        style={{ position: 'absolute', left: 0, top: 0 }}
      >
        <Defs>
          {/*
            O disco é chapado no documento. O id existe porque o brilho branco
            é uma elipse girada, e `confere-svg.js` confere que todo `url(#…)`
            tenha um `id` com o mesmo nome — sem gradiente nenhum para apontar,
            o arquivo não declara nada e a regra segue valendo.
          */}
          <LinearGradient id={`sol-${id}`} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={SOL} />
            <Stop offset="1" stopColor={SOL} />
          </LinearGradient>
        </Defs>
        <Circle cx={0} cy={0} r={32} fill={`url(#sol-${id})`} stroke={SOL_CONTORNO} strokeWidth={3} />
        <Ellipse cx={-10} cy={-10} rx={9} ry={5} fill="#fff" opacity={0.55} transform="rotate(-30 -10 -10)" />
      </Svg>
    </Animated.View>
  );
}

/** Uma nuvem pequena, com a deriva horizontal do documento. */
function NuvemPequena({
  x,
  y,
  escala,
  ms,
  luz,
  parado,
}: {
  x: number;
  /** Já somado ao recuo pela paisagem. */
  y: number;
  escala: number;
  ms: number;
  luz: Animated.Value;
  parado: boolean;
}) {
  const passo = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (parado) return;
    const laco = lacoDeIdaEVolta(passo, { ms });
    laco.start();
    return () => laco.stop();
  }, [ms, parado, passo]);

  /* A nuvem mede 84 por 34 na escala 1, com folga para o contorno. */
  const largura = 92 * escala;
  const altura = 44 * escala;

  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: 'absolute',
        left: x,
        top: y - 8 * escala,
        width: largura,
        height: altura,
        opacity: luz.interpolate({ inputRange: [0, 1], outputRange: [0.55, 0.9] }),
        transform: [{ translateX: passo.interpolate({ inputRange: [0, 1], outputRange: [0, 14] }) }],
      }}
    >
      <Svg width={largura} height={altura} viewBox="-4 -8 92 44">
        <Path
          d="M 0 30 C -4 16 10 8 22 12 C 28 -2 52 -4 60 10 C 74 6 84 18 78 30 Z"
          fill={NUVEM}
          stroke={NUVEM_CONTORNO}
          strokeWidth={2}
        />
        <Path d="M 12 20 C 16 14 24 13 28 16 C 22 16 17 18 12 20 Z" fill="#fff" opacity={0.9} />
      </Svg>
    </Animated.View>
  );
}

/**
 * A nuvem grande da tela do pensamento — a que carrega a frase.
 *
 * Ela flutua cinco pontos para cima e volta, em cinco segundos. É o movimento
 * mais lento da cena de propósito: a frase escrita mora dentro dela, e texto
 * que balança é texto que não se lê.
 */
/**
 * Onde a nuvem grande está na tela, em pontos.
 *
 * Exportado para quem põe alguma coisa **dentro** dela: o que vai na nuvem é
 * posicionado em relação à caixa dela, e é dentro dela que balança junto.
 */
export function caixaDaNuvemGrande(largura: number, recuo: number) {
  const caixa = { x: -174, y: -70, largura: 348, altura: 158 };
  return { left: largura / 2 + caixa.x, top: recuo + 180 + caixa.y, width: caixa.largura, height: caixa.altura };
}

function NuvemGrande({
  largura,
  recuo,
  parado,
  children,
}: {
  largura: number;
  recuo: number;
  parado: boolean;
  /**
   * O que mora na nuvem — a frase da tela do pensamento.
   *
   * Desenhada por fora, a frase ficava parada enquanto a nuvem subia e
   * descia: cinco pontos de descompasso, que o Pedro notou. Aqui dentro ela
   * anda na mesma `Animated.View`, então não há dois movimentos para manter
   * em sincronia. Posição em relação à caixa — ver `caixaDaNuvemGrande`.
   */
  children?: React.ReactNode;
}) {
  const passo = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (parado) return;
    const laco = lacoDeIdaEVolta(passo, { ms: 5000 });
    laco.start();
    return () => laco.stop();
  }, [parado, passo]);

  /* A nuvem vai de -168 a 162 na horizontal, e de -64 a 80 com a sombra. */
  const caixa = { x: -174, y: -70, largura: 348, altura: 158 };

  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: 'absolute',
        left: largura / 2 + caixa.x,
        top: recuo + 180 + caixa.y,
        width: caixa.largura,
        height: caixa.altura,
        transform: [{ translateY: passo.interpolate({ inputRange: [0, 1], outputRange: [0, -5] }) }],
      }}
    >
      <Svg
        width={caixa.largura}
        height={caixa.altura}
        viewBox={`${caixa.x} ${caixa.y} ${caixa.largura} ${caixa.altura}`}
      >
        <Ellipse cx={0} cy={70} rx={120} ry={10} fill={CONTORNO} opacity={0.07} />
        <Path
          d="M -150 40 C -168 18 -146 -10 -118 -4 C -116 -38 -72 -52 -46 -30 C -32 -60 26 -64 42 -30 C 70 -48 112 -30 108 0 C 140 -6 162 22 146 44 C 138 58 120 60 108 58 L -128 58 C -142 58 -152 52 -150 40 Z"
          fill={NUVEM}
          stroke={NUVEM_CONTORNO_GRANDE}
          strokeWidth={2.5}
        />
        <Path
          d="M -150 40 C -150 54 -140 58 -128 58 L 108 58 C 120 60 138 58 146 44 C 130 50 -120 52 -150 40 Z"
          fill={NUVEM_SOMBRA}
          opacity={0.45}
        />
        <Path
          d="M -110 -2 C -100 -16 -82 -20 -70 -14 C -86 -12 -98 -8 -110 -2 Z M -34 -34 C -22 -46 0 -48 14 -40 C -4 -40 -20 -38 -34 -34 Z"
          fill="#fff"
        />
      </Svg>
      {children}
    </Animated.View>
  );
}

/** As defasagens das seis gotas, em segundos, e o período delas. */
const GOTAS = [
  { dx: -60, atraso: 0 },
  { dx: -20, atraso: 0.7 },
  { dx: 24, atraso: 1.4 },
  { dx: 70, atraso: 0.35 },
  { dx: 110, atraso: 1.05 },
  { dx: -100, atraso: 1.7 },
];
const CICLO_DA_CHUVA = 2200;

/**
 * A chuva que cai da nuvem grande até o solo.
 *
 * Seis riscos, um relógio. A defasagem de cada um está na curva dele, e não
 * num temporizador — ver a nota do alto do arquivo e `planoDaQueda`.
 */
function Chuva({
  largura,
  crista,
  recuo,
  parado,
}: {
  largura: number;
  crista: number;
  recuo: number;
  parado: boolean;
}) {
  const tempo = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (parado) return;
    const laco = lacoQueSoVai(tempo, { ms: CICLO_DA_CHUVA, easing: Easing.linear, ate: 2 });
    laco.start();
    return () => laco.stop();
  }, [parado, tempo]);

  if (parado) return null;

  const queda = crista - (recuo + 250);

  return (
    <>
      {GOTAS.map(({ dx, atraso }, i) => {
        const inicio = atraso / (CICLO_DA_CHUVA / 1000);
        const andar = tempo.interpolate(
          curvaDaPalavra(inicio, 1, [
            [0, 0],
            [1, queda],
          ]),
        );
        const desvio = tempo.interpolate(
          curvaDaPalavra(inicio, 1, [
            [0, 0],
            [1, -4],
          ]),
        );
        const opacidade = tempo.interpolate(
          curvaDaPalavra(inicio, 1, [
            [0, 0],
            [0.5, 0.9],
            [1, 0],
          ]),
        );
        return (
          <Animated.View
            key={i}
            pointerEvents="none"
            style={{
              position: 'absolute',
              left: largura / 2 + dx - 4,
              top: recuo + 246,
              width: 8,
              height: 12,
              opacity: opacidade,
              transform: [{ translateY: andar }, { translateX: desvio }],
            }}
          >
            <Svg width={8} height={12} viewBox="0 0 8 12">
              <Path d="M 5 1 l -2 8" stroke={CHUVA} strokeWidth={2.6} strokeLinecap="round" />
            </Svg>
          </Animated.View>
        );
      })}
    </>
  );
}

/**
 * Uma flor plantada, balançando.
 *
 * O balanço gira em torno do **pé** dela, não do centro: uma flor que gira
 * pelo meio desencosta do chão de um lado e enterra do outro, e o que se vê é
 * a planta escorregando pela terra. Quem resolve isso é `PE_DA_FLOR`, logo
 * acima, que conta por que a conta é feita à mão.
 *
 * ## Por que cinco graus, e não os três do documento
 *
 * Porque três não aparecem. A flor tem uns cinquenta pontos de altura na
 * escala do canteiro; a ponta dela percorre `altura · sen(3°)`, que dá **2,4
 * pontos** para cada lado — menos de cinco pixels de ida e volta, espalhados
 * por quatro segundos. É um pixel por segundo. O Pedro olhou a tela e disse
 * que não havia balanço nenhum, e ele estava descrevendo o que dava para ver.
 *
 * Cinco graus dobram o percurso para uns oito pontos: continua sendo brisa, e
 * passa a existir. O gesto do documento é "as flores balançam"; o número dele
 * foi escrito para uma tela de protótipo e não sobreviveu à escala real.
 */
function FlorBalancando({
  flor,
  x,
  y,
  passo,
}: {
  flor: FlorPlantada;
  x: number;
  y: number;
  passo: Animated.Value;
}) {
  const largura = CAIXA_DA_FLOR.largura * flor.escala;
  const altura = CAIXA_DA_FLOR.altura * flor.escala;

  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: 'absolute',
        left: x + CAIXA_DA_FLOR.x * flor.escala,
        top: y + CAIXA_DA_FLOR.y * flor.escala,
        width: largura,
        height: altura,
        transform: [
          { translateY: altura * PE_DA_FLOR },
          { rotate: passo.interpolate({ inputRange: [0, 1], outputRange: ['-5deg', '5deg'] }) },
          { translateY: -altura * PE_DA_FLOR },
        ],
      }}
    >
      <Svg
        width={largura}
        height={altura}
        viewBox={`${CAIXA_DA_FLOR.x} ${CAIXA_DA_FLOR.y} ${CAIXA_DA_FLOR.largura} ${CAIXA_DA_FLOR.altura}`}
      >
        <FlorDaComposta tipo={florDoIndice(flor.indice).chave} />
      </Svg>
    </Animated.View>
  );
}

/** O halo pulsando da flor selecionada no jardim. */
function HaloDaFlor({ x, y, escala, parado }: { x: number; y: number; escala: number; parado: boolean }) {
  const passo = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (parado) return;
    const laco = lacoDeIdaEVolta(passo, { ms: 3000 });
    laco.start();
    return () => laco.stop();
  }, [parado, passo]);

  const r = 34 * escala;

  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: 'absolute',
        left: x - r,
        top: y - 40 * escala - r,
        width: r * 2,
        height: r * 2,
        opacity: parado ? 0.75 : passo.interpolate({ inputRange: [0, 1], outputRange: [0.5, 0.85] }),
      }}
    >
      <Svg width={r * 2} height={r * 2} viewBox={`0 0 ${r * 2} ${r * 2}`}>
        <Circle cx={r} cy={r} r={r} fill={LUZ} />
      </Svg>
    </Animated.View>
  );
}

/** O caminho de uma faísca, na forma do documento. */
const FAISCA = 'M0 -9 L2.2 -2.2 L9 0 L2.2 2.2 L0 9 L-2.2 2.2 L-9 0 L-2.2 -2.2 Z';
/** Onde as cinco faíscas ficam, e o tamanho de cada uma. */
const FAISCAS = [
  { dx: -46, dy: -110, escala: 0.7 },
  { dx: 40, dy: -128, escala: 0.55 },
  { dx: 62, dy: -70, escala: 0.8 },
  { dx: -60, dy: -60, escala: 0.5 },
  { dx: 10, dy: -150, escala: 0.45 },
];
const CICLO_DAS_FAISCAS = 2600;

/** Quanto dura a encenação do nascimento, do primeiro farelo à flor parada. */
const NASCIMENTO_MS = 2200;

/**
 * A flor nascendo — a encenação inteira do fim da prática.
 *
 * Quatro coisas, em ordem, e a ordem é o que conta a história:
 *
 * 1. **Aos 0,45 s, a terra espirra.** Nove farelos saem em leque e somem em
 *    0,9 s. Eles vêm primeiro de propósito: é o solo se abrindo, e sem eles a
 *    flor simplesmente aparece — o adubo não teria feito nada.
 * 2. **Aos 0,5 s, a flor cresce** de 0 a 1,12 e assenta em 1. O repique acima
 *    de 1 é o que separa "cresceu" de "foi colada ali".
 * 3. **Aos 0,6 s, o halo acende** e fica.
 * 4. **A partir de 1,2 s, cinco brilhos piscam** em laço, defasados.
 *
 * Os três primeiros acontecem uma vez e param (`fill: freeze` no documento):
 * um relógio só, que vai de 0 a 1 e fica. Os brilhos são laço, com relógio
 * próprio.
 */
function FlorNascendo({
  x,
  y,
  indice,
  parado,
}: {
  x: number;
  y: number;
  indice: number;
  parado: boolean;
}) {
  const nascer = useRef(new Animated.Value(parado ? 1 : 0)).current;
  const brilhar = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (parado) {
      nascer.setValue(1);
      return;
    }
    const crescer = Animated.timing(nascer, {
      toValue: 1,
      duration: NASCIMENTO_MS,
      easing: Easing.linear,
      useNativeDriver: true,
      isInteraction: false,
    });
    crescer.start();
    const laco = lacoQueSoVai(brilhar, { ms: CICLO_DAS_FAISCAS, easing: Easing.linear, ate: 2 });
    laco.start();
    return () => {
      crescer.stop();
      laco.stop();
    };
  }, [parado, nascer, brilhar]);

  /** Um instante da encenação, em fração do relógio de 2,2 s. */
  const em = (segundos: number) => Math.min(1, segundos / (NASCIMENTO_MS / 1000));

  const ESCALA = 1.7;
  const largura = CAIXA_DA_FLOR.largura * ESCALA;
  const altura = CAIXA_DA_FLOR.altura * ESCALA;

  /* O repique: 0 → 1,12 → 1, começando em 0,5 s e durando 1,1 s. */
  const cresce = nascer.interpolate({
    inputRange: [0, em(0.5), em(0.5 + 1.1 * 0.7), em(1.6), 1],
    outputRange: [0, 0, 1.12, 1, 1],
  });

  const halo = nascer.interpolate({
    inputRange: [0, em(0.6), em(0.6 + 1.6 * 0.44), em(2.2), 1],
    outputRange: [0, 0, 0.7, 0.45, 0.45],
  });

  const raioDoHalo = 30 * ESCALA;

  return (
    <>
      {/* O halo, atrás da flor. */}
      <Animated.View
        pointerEvents="none"
        style={{
          position: 'absolute',
          left: x - raioDoHalo,
          top: y - 40 * ESCALA - raioDoHalo,
          width: raioDoHalo * 2,
          height: raioDoHalo * 2,
          opacity: halo,
        }}
      >
        <Svg width={raioDoHalo * 2} height={raioDoHalo * 2} viewBox={`0 0 ${raioDoHalo * 2} ${raioDoHalo * 2}`}>
          <Circle cx={raioDoHalo} cy={raioDoHalo} r={raioDoHalo} fill={LUZ} />
        </Svg>
      </Animated.View>

      {/*
        Os farelos de terra. Nove, em leque, saindo do ponto em que a flor
        nasce — o ângulo vai de -2,18 a 0,96 radianos em torno da vertical.
      */}
      {Array.from({ length: 9 }, (_, i) => {
        const a = -Math.PI / 2 + (i - 4) * 0.32;
        const alvoX = Math.cos(a) * 40;
        const alvoY = Math.sin(a) * 34 + 6;
        /* `spline .2 .7 .4 1`: sai rápido e freia — é terra voando, não bola. */
        const curva = (de: number, para: number) => ({
          inputRange: [0, em(0.45), em(0.45 + 0.9 * 0.3), em(1.35), 1],
          outputRange: [de, de, de + (para - de) * 0.75, para, para],
        });
        return (
          <Animated.View
            key={i}
            pointerEvents="none"
            style={{
              position: 'absolute',
              left: x - 2.6,
              top: y - 2.6,
              width: 5.2,
              height: 5.2,
              opacity: nascer.interpolate({
                inputRange: [0, em(0.45), em(1.2), em(1.35), 1],
                outputRange: [0, 1, 1, 0, 0],
              }),
              transform: [
                { translateX: nascer.interpolate(curva(0, alvoX)) },
                { translateY: nascer.interpolate(curva(0, alvoY)) },
              ],
            }}
          >
            <Svg width={5.2} height={5.2} viewBox="0 0 5.2 5.2">
              <Circle cx={2.6} cy={2.6} r={2.6} fill={i % 2 ? TERRA : TERRA_CLARA} />
            </Svg>
          </Animated.View>
        );
      })}

      {/* A flor. */}
      <Animated.View
        pointerEvents="none"
        style={{
          position: 'absolute',
          left: x + CAIXA_DA_FLOR.x * ESCALA,
          top: y + CAIXA_DA_FLOR.y * ESCALA,
          width: largura,
          height: altura,
          /* Cresce do pé, e não do meio — ver `PE_DA_FLOR`. Sem isto ela
             brota para cima **e** para baixo, afundando na terra. */
          transform: [
            { translateY: altura * PE_DA_FLOR },
            { scale: cresce },
            { translateY: -altura * PE_DA_FLOR },
          ],
        }}
      >
        <Svg
          width={largura}
          height={altura}
          viewBox={`${CAIXA_DA_FLOR.x} ${CAIXA_DA_FLOR.y} ${CAIXA_DA_FLOR.largura} ${CAIXA_DA_FLOR.altura}`}
        >
          <FlorDaComposta tipo={florDoIndice(indice).chave} />
        </Svg>
      </Animated.View>

      {/* Os brilhos, em laço. */}
      {!parado &&
        FAISCAS.map(({ dx, dy, escala }, i) => {
          const lado = 18 * escala;
          const opacidade = brilhar.interpolate(
            curvaDaPalavra((i * 0.25) / (CICLO_DAS_FAISCAS / 1000), 1, [
              [0, 0],
              [0.33, 1],
              [0.66, 0.2],
              [1, 1],
            ]),
          );
          return (
            <Animated.View
              key={i}
              pointerEvents="none"
              style={{
                position: 'absolute',
                left: x + dx - lado / 2,
                top: y + dy - lado / 2,
                width: lado,
                height: lado,
                opacity: opacidade,
              }}
            >
              <Svg width={lado} height={lado} viewBox="-9 -9 18 18">
                <Path d={FAISCA} fill={i % 2 ? '#fff' : '#F2C14E'} />
              </Svg>
            </Animated.View>
          );
        })}
    </>
  );
}

export function PaisagemDaComposta({
  largura,
  altura,
  crista,
  luz,
  flores = [],
  florNova = null,
  raios = false,
  nuvemGrande = false,
  chuva = false,
  broto = null,
  recuo = 0,
  naNuvemGrande = null,
}: Props) {
  const id = useId().replace(/[^a-zA-Z0-9]/g, '');
  const parado = useMenosMovimento();

  /**
   * A luz, como valor animado.
   *
   * O documento a transiciona em **um segundo, linear** — e isso não é
   * enfeite: durante a prática a tela recalcula a luz uma vez por segundo, e
   * sem a transição o céu daria um pulo a cada passo do cronômetro. Com ela, a
   * passagem de cinza a dourado é contínua ao longo dos 36 segundos.
   */
  const luzAnimada = useRef(new Animated.Value(luz)).current;
  useEffect(() => {
    if (parado) {
      luzAnimada.setValue(luz);
      return;
    }
    const t = Animated.timing(luzAnimada, {
      toValue: luz,
      duration: 1000,
      easing: Easing.linear,
      useNativeDriver: true,
      isInteraction: false,
    });
    t.start();
    return () => t.stop();
  }, [luz, parado, luzAnimada]);

  /** Da régua do documento para os pontos desta tela. */
  const emX = (x: number) => (x * largura) / LARGURA_DO_DOCUMENTO;

  /* Os três relógios do balanço das flores — ver a nota do alto. */
  const balanco0 = useRef(new Animated.Value(0)).current;
  const balanco1 = useRef(new Animated.Value(0)).current;
  const balanco2 = useRef(new Animated.Value(0)).current;
  const balancos = useMemo(() => [balanco0, balanco1, balanco2], [balanco0, balanco1, balanco2]);

  useEffect(() => {
    if (parado || !flores.length) return;
    const lacos = balancos.map((v, i) => lacoDeIdaEVolta(v, { ms: BALANCOS[i] }));
    lacos.forEach((l) => l.start());
    return () => lacos.forEach((l) => l.stop());
  }, [parado, flores.length, balancos]);

  /*
    A terra, desenhada uma vez.

    A crista é uma onda, e a mesma onda aparece três vezes: no recorte do
    corpo da terra, no contorno escuro e na linha de luz logo abaixo. Escrever
    o caminho uma vez é o que garante que as três não se desencontrem — e elas
    já se desencontraram, na faixa da tela inicial, quando eram três textos
    separados.
  */
  const borda = `M ${emX(-10)} ${crista} C ${emX(50)} ${crista - 10} ${emX(110)} ${crista + 6} ${emX(180)} ${crista - 4} C ${emX(250)} ${crista - 12} ${emX(320)} ${crista + 4} ${emX(400)} ${crista - 6}`;

  const brotoDesenhado = useMemo(() => {
    if (!broto) return null;
    /*
      O tamanho do broto sai da régua do documento, e não de um palpite.

      `size` não é a largura desenhada — a caixa do mascote tem folga para o
      que se mexe por fora dele. Então a conta mede o quadro com um tamanho
      qualquer, descobre a proporção, e resolve para a largura que o documento
      pede: a caixa da planta, na escala da cena, convertida para pontos.
      Mexer no desenho do broto não quebra isto.
    */
    const referencia = quadroDoBroto(broto.estagio, 100, { showPot: false });
    const alvo = referencia.caixa.largura * broto.escala * (largura / LARGURA_DO_DOCUMENTO);
    const size = (100 * alvo) / referencia.largura;
    const quadro = quadroDoBroto(broto.estagio, size, { showPot: false });
    const pe = noQuadro(quadro, CX, POT_TOP_Y);
    return { size, quadro, pe };
  }, [broto, largura]);

  return (
    <View style={{ width: largura, height: altura, overflow: 'hidden' }}>
      {/* 1. O céu de chumbo, sempre atrás. */}
      <Svg
        width={largura}
        height={altura}
        viewBox={`0 0 ${largura} ${altura}`}
        style={{ position: 'absolute', left: 0, top: 0 }}
      >
        <Defs>
          <LinearGradient id={`pesado-${id}`} x1="0" y1="0" x2="0" y2="1">
            {CEU_PESADO.map((cor, i) => (
              <Stop key={cor} offset={PARADAS_DO_PESADO[i]} stopColor={cor} />
            ))}
          </LinearGradient>
        </Defs>
        <Rect x={0} y={0} width={largura} height={altura} fill={`url(#pesado-${id})`} />
      </Svg>

      {/* 2. O dourado, por cima, com a luz da tela. */}
      <Animated.View
        pointerEvents="none"
        style={{ position: 'absolute', left: 0, top: 0, width: largura, height: altura, opacity: luzAnimada }}
      >
        <Svg width={largura} height={altura} viewBox={`0 0 ${largura} ${altura}`}>
          <Defs>
            <LinearGradient id={`dourado-${id}`} x1="0" y1="0" x2="0" y2="1">
              {CEU_DOURADO.map((cor, i) => (
                <Stop key={cor} offset={PARADAS_DO_DOURADO[i]} stopColor={cor} />
              ))}
            </LinearGradient>
          </Defs>
          <Rect x={0} y={0} width={largura} height={altura} fill={`url(#dourado-${id})`} />
        </Svg>
      </Animated.View>

      {/* 3. O grão. */}
      <GraoNoCeu />

      {/* 4. O sol. */}
      <Sol largura={largura} luz={luzAnimada} raios={raios} parado={parado} recuo={recuo} />

      {/* 5. As nuvens. */}
      {nuvemGrande ? (
        <NuvemGrande largura={largura} recuo={recuo} parado={parado}>
          {naNuvemGrande}
        </NuvemGrande>
      ) : (
        <>
          <NuvemPequena
            x={emX(24)}
            y={recuo + 54}
            escala={1}
            ms={16000}
            luz={luzAnimada}
            parado={parado}
          />
          <NuvemPequena
            x={emX(160)}
            y={recuo + 120}
            escala={0.7}
            ms={20000}
            luz={luzAnimada}
            parado={parado}
          />
        </>
      )}

      {/* 6. A chuva. */}
      {chuva && <Chuva largura={largura} crista={crista} recuo={recuo} parado={parado} />}

      {/* 7. O morro e a terra. */}
      <Svg
        width={largura}
        height={altura}
        viewBox={`0 0 ${largura} ${altura}`}
        style={{ position: 'absolute', left: 0, top: 0 }}
      >
        <Path
          d={`M ${emX(-10)} ${crista - 8} C ${emX(60)} ${crista - 46} ${emX(150)} ${crista - 40} ${emX(230)} ${crista - 18} C ${emX(290)} ${crista - 2} ${emX(340)} ${crista - 34} ${emX(400)} ${crista - 26} L ${emX(400)} ${crista + 20} L ${emX(-10)} ${crista + 20} Z`}
          fill={MORRO}
          opacity={0.55}
        />

        <Path d={`${borda} L ${emX(400)} ${altura + 10} L ${emX(-10)} ${altura + 10} Z`} fill={TERRA} />
        <Path
          d={`M ${emX(-10)} ${crista + 26} C ${emX(80)} ${crista + 18} ${emX(200)} ${crista + 32} ${emX(400)} ${crista + 22} L ${emX(400)} ${altura + 10} L ${emX(-10)} ${altura + 10} Z`}
          fill={TERRA_FUNDA}
          opacity={0.35}
        />
        <Path d={borda} fill="none" stroke={CONTORNO} strokeWidth={3} />
        <Path
          d={`M ${emX(-10)} ${crista + 6} C ${emX(50)} ${crista - 4} ${emX(110)} ${crista + 12} ${emX(180)} ${crista + 2} C ${emX(250)} ${crista - 6} ${emX(320)} ${crista + 10} ${emX(400)} ${crista}`}
          fill="none"
          stroke={TERRA_CLARA}
          strokeWidth={3}
          opacity={0.55}
        />

        {/*
          As pedrinhas. Cada uma leva um brilho branco por cima, deslocado
          para o alto e para a esquerda: é o que a faz ler como pedra e não
          como mancha. As que cairiam abaixo da cena são descartadas.
        */}
        {[
          [30, 40, 6, 3.4],
          [96, 58, 4, 2.4],
          [170, 44, 7, 3.6],
          [248, 64, 5, 3],
          [330, 46, 6, 3.2],
          [60, 90, 4, 2.4],
          [210, 96, 5, 2.8],
          [360, 92, 4, 2.2],
          [130, 120, 6, 3],
          [290, 128, 4, 2.4],
        ].map(([x, dy, rx, ry], i) =>
          crista + dy > altura ? null : (
            <G key={`pedra-${i}`}>
              <Ellipse
                cx={emX(x)}
                cy={crista + dy}
                rx={rx}
                ry={ry}
                fill={i % 2 ? TERRA_CLARA : PEDRA_ESCURA}
                opacity={0.7}
              />
              <Ellipse
                cx={emX(x) - rx * 0.3}
                cy={crista + dy - ry * 0.4}
                rx={rx * 0.35}
                ry={ry * 0.3}
                fill="#fff"
                opacity={0.14}
              />
            </G>
          ),
        )}

        {/* Os tufos de grama na crista. */}
        {[
          [14, 0],
          [120, 4],
          [228, -6],
          [372, -4],
        ].map(([x, dy], i) => (
          <Path
            key={`grama-${i}`}
            d={`M ${emX(x)} ${crista + dy} q -2 -8 -6 -10 M ${emX(x)} ${crista + dy} q 0 -10 2 -13 M ${emX(x)} ${crista + dy} q 3 -7 7 -8`}
            stroke={GRAMA}
            strokeWidth={2.2}
            strokeLinecap="round"
            fill="none"
          />
        ))}
      </Svg>

      {/* 8. Os halos das flores em destaque, atrás das flores. */}
      {flores.map((f, i) =>
        f.destaque ? (
          <HaloDaFlor
            key={`halo-${i}`}
            x={emX(f.x)}
            y={crista + 4 + f.dy}
            escala={f.escala}
            parado={parado}
          />
        ) : null,
      )}

      {/* 9. As flores. */}
      {flores.map((f, i) => (
        <FlorBalancando
          key={`flor-${i}`}
          flor={f}
          x={emX(f.x)}
          y={crista + 4 + f.dy}
          passo={balancos[i % balancos.length]}
        />
      ))}

      {/* 10. O broto, com o pé na terra. */}
      {broto && brotoDesenhado && (
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            left: emX(broto.x) - brotoDesenhado.pe.x,
            top: crista + 6 - brotoDesenhado.pe.y,
            width: brotoDesenhado.quadro.largura,
          }}
        >
          {/*
            Ele respira e bambaleia, como em toda tela parada.

            Os dois vinham desligados — são o padrão do `AnimatedSprout` — e o
            resultado era um broto **completamente imóvel** no meio de uma cena
            que se mexe: as nuvens passavam, o sol subia, e o personagem ficava
            parado como um adesivo. Numa tela em que a pessoa repete em voz
            alta para ele por trinta e seis segundos, isso é o oposto do que a
            cena inteira existe para fazer.

            Vale aqui porque é exatamente o caso que o `AnimatedSprout`
            descreve: broto grande, em tela parada. Nenhuma lista rola por
            cima dele.
          */}
          <AnimatedSprout
            mood={broto.humor}
            stage={broto.estagio}
            size={brotoDesenhado.size}
            pose={broto.pose}
            showPot={false}
            breathe
            bamboleia
          />
        </View>
      )}

      {/* 11. A flor nova, na frente de tudo. */}
      {florNova && (
        <FlorNascendo
          x={emX(florNova.x)}
          y={crista + 8}
          indice={florNova.indice}
          parado={parado}
        />
      )}
    </View>
  );
}
