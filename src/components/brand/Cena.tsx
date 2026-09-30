import React, { useEffect, useRef } from 'react';
import { Animated, View } from 'react-native';
import Svg, { Path, Rect } from 'react-native-svg';

import { useMenosMovimento } from '../../hooks/useMenosMovimento';
import { lacoDeIdaEVolta } from '../laco';
import { useTema, type Mood } from '../../theme';
import { palette } from '../../theme/tokens';
import { TERRA, TERRA_FUNDA } from './terraDoCanteiro';

/**
 * A cena: o lugar onde o broto está.
 *
 * ## O que ela substitui
 *
 * O app desenhava o fundo de cada tela por conta própria — a faixa de céu da
 * tela inicial, o degradê do `FundoDaTela`, o creme chapado das outras. O
 * broto aparecia *sobre* esses fundos, e por isso lia como um adesivo colado
 * numa superfície em vez de um personagem num lugar. Aqui o céu, o morro, o
 * chão e a hora do dia são uma coisa só, e é a mesma em toda tela onde ele
 * aparece.
 *
 * ## Os dois eixos: o humor e a hora
 *
 * O **humor** pinta o céu — é a cor que a pessoa disse estar sentindo, vinda
 * de `moodColorsFundo` (o tom de superfície, não o de pastilha). A **hora**
 * decide o que tem no céu: sol e nuvens de dia, lua e estrelas de noite, com
 * um véu por cima. Os dois são independentes: dá para estar feliz às onze da
 * noite, e a cena mostra as duas coisas.
 *
 * A hora é a do relógio da pessoa, não a preferência de tema. Um app de
 * ansiedade aberto às duas da manhã deve mostrar que é de madrugada mesmo
 * para quem deixou o tema no claro.
 *
 * ## Por que metade é SVG e metade é `View`
 *
 * Tudo que tem forma — morro, terra, nuvem, lua, capim — é caminho, e caminho
 * é SVG. Tudo que **se mexe** é `View` animada: o sol que pulsa, as estrelas
 * que piscam, as nuvens que passam. Não é gosto — `Animated` entrega valor
 * novo chamando `setNativeProps`, que os nós do `react-native-svg` não
 * implementam no `react-native-web`, e ali a animação simplesmente não
 * acontece (a nota longa em `desenhosDosTemas` conta o episódio inteiro).
 * Movendo e apagando `View`s, o mesmo código roda igual nas três plataformas
 * e ainda vai para o driver nativo.
 *
 * ## O broto não mora aqui dentro
 *
 * No protótipo ele é mais um grupo do SVG da cena. Aqui não: ele é uma árvore
 * de `View`s com animações próprias — a brisa, a respiração, a folha que
 * acena. Enfiá-lo no SVG custaria todas elas. Quem usa a cena põe o broto por
 * cima, e `LINHA_DO_CHAO` diz onde estão os pés dele.
 */

/** As medidas do protótipo valem nesta largura; o resto é proporção. */
const LARGURA_DE_REFERENCIA = 390;

/** O caminho de uma nuvem, com 96 por 34. */
const NUVEM =
  'M 0 30 C 0 18 12 12 22 16 C 26 4 44 0 54 10 C 60 4 76 6 78 18 C 90 18 96 30 88 34 L 4 34 C 1 34 0 32 0 30 Z';

/** A lua crescente: um disco com outro disco mordido fora. */
const LUA = 'M 62 84 A 24 24 0 1 0 86 116 A 19 19 0 1 1 62 84 Z';

/** Onde as estrelas ficam, na largura de referência. */
const ESTRELAS: Array<[number, number]> = [
  [40, 70],
  [120, 50],
  [300, 90],
  [350, 140],
  [250, 60],
  [80, 150],
];

/** As três nuvens: x e y na referência, escala e o ciclo de ida e volta. */
const NUVENS: Array<{ x: number; y: number; escala: number; ms: number }> = [
  { x: LARGURA_DE_REFERENCIA - 150, y: 70, escala: 0.9, ms: 14000 },
  { x: 90, y: 150, escala: 0.6, ms: 11000 },
  { x: LARGURA_DE_REFERENCIA - 70, y: 170, escala: 0.5, ms: 9000 },
];

/** Quanto uma nuvem anda para o lado, em unidades da referência. */
const PASSEIO_DA_NUVEM = 16;

/** O sol e a lua ficam no mesmo lugar: em cima, à esquerda. */
const ASTRO = { x: 62, y: 108, raio: 30, halo: 44 };

/** O ciclo do halo do sol. */
const HALO_MS = 5000;

export type ChaoDaCena = 'grama' | 'terra' | 'nenhum';

/**
 * A que altura do fim da cena começa o chão — onde os pés do broto pousam.
 *
 * Quem posiciona o broto precisa disto, e por isso é uma tabela exportada em
 * vez de um número escrito dentro do desenho. A terra sobe mais que a grama
 * porque ela é um canteiro cortado, não um morro visto de longe.
 */
export const LINHA_DO_CHAO: Record<ChaoDaCena, number> = {
  grama: 46,
  terra: 50,
  nenhum: 0,
};

/**
 * A altura do chão **no meio** da cena, que é onde o broto costuma ficar.
 *
 * `LINHA_DO_CHAO` é onde o chão encosta nas bordas; o morro sobe no meio, e
 * plantar o broto na altura da borda o deixaria com os pés enterrados. Os dois
 * números saem da mesma curva: uma Bézier cúbica no meio vale
 * `(inicio + 3·controle + 3·controle + fim) / 8`, e é essa conta, e não uma
 * medida no olho, que mantém os dois juntos se a curva mudar.
 */
export const CRISTA_DO_MORRO: Record<ChaoDaCena, number> = {
  grama: (46 + 78 * 3 + 78 * 3 + 46) / 8,
  terra: (50 + 72 * 3 + 72 * 3 + 50) / 8,
  nenhum: 0,
};

type Props = {
  largura: number;
  altura: number;
  /** O humor que pinta o céu. */
  humor?: Mood;
  /** Um tom próprio no lugar do humor — os cartões de tema usam isto. */
  ceu?: string;
  /** Depois do pôr do sol: véu, estrelas e lua no lugar do sol. */
  noite?: boolean;
  /** Sem sol nem lua, quando o alto da cena é ocupado por outra coisa. */
  semAstro?: boolean;
  nuvens?: boolean;
  chao?: ChaoDaCena;
  /** Tufos de capim no chão, dos dois lados do broto. */
  capim?: boolean;
  /** Onde o broto está, para o capim nascer em volta dele. */
  xDoBroto?: number;
};

export function Cena({
  largura,
  altura,
  humor = 'neutro',
  ceu,
  noite = false,
  semAstro = false,
  nuvens = true,
  chao = 'grama',
  capim = false,
  xDoBroto,
}: Props) {
  const { moodColorsFundo, cena } = useTema();
  const menosMovimento = useMenosMovimento();

  const k = largura / LARGURA_DE_REFERENCIA;
  const corDoCeu = ceu ?? moodColorsFundo[humor];
  const sx = xDoBroto ?? largura / 2;

  return (
    <View style={{ width: largura, height: altura, overflow: 'hidden' }} pointerEvents="none">
      <Svg width={largura} height={altura} viewBox={`0 0 ${largura} ${altura}`}>
        <Rect x={0} y={0} width={largura} height={altura} fill={corDoCeu} />

        {noite && (
          <>
            <Rect
              x={0}
              y={0}
              width={largura}
              height={altura}
              fill={cena.noite}
              opacity={cena.noiteForca}
            />
            {!semAstro && <Path d={LUA} transform={`scale(${k} 1)`} fill={palette.cream100} />}
          </>
        )}

        {/*
          O chão, em duas ou três camadas.

          O morro de trás é o que dá distância: sem ele o chão encosta no céu
          numa linha só e a cena vira duas faixas de cor. Ele é a cor da nuvem
          a 40% — no claro, branco; no escuro, o cinza de céu noturno.
        */}
        {chao === 'terra' && (
          <>
            <Path
              d={morro(largura, altura, 72, 100, 70, 92)}
              fill={cena.morro}
              opacity={0.4}
            />
            <Path d={morro(largura, altura, 50, 72, 72, 50)} fill={TERRA} />
            <Path d={morro(largura, altura, 42, 64, 64, 42)} fill={TERRA_FUNDA} />
          </>
        )}
        {chao === 'grama' && (
          <>
            <Path
              d={morro(largura, altura, 70, 105, 60, 95)}
              fill={cena.morro}
              opacity={0.45}
            />
            <Path d={morro(largura, altura, 46, 78, 78, 46)} fill={cena.chao} />
          </>
        )}

        {capim && chao !== 'nenhum' && (
          <>
            {[
              [sx - 90 * k, altura - 62],
              [sx + 80 * k, altura - 60],
              [sx + 128 * k, altura - 54],
            ].map(([x, y], i) => (
              <Path
                key={i}
                d={
                  `M ${x} ${y} q -2 -8 -6 -12 `
                  + `M ${x} ${y} q 1 -9 1 -14 `
                  + `M ${x} ${y} q 3 -7 7 -10`
                }
                stroke={palette.green300}
                strokeWidth={2.5}
                strokeLinecap="round"
                fill="none"
              />
            ))}
          </>
        )}
      </Svg>

      {!noite && !semAstro && (
        <Sol x={ASTRO.x * k} y={ASTRO.y} k={k} parado={menosMovimento} />
      )}

      {noite &&
        ESTRELAS.map(([x, y], i) => (
          <Estrela key={i} x={x * k} y={y} cor={cena.estrela} indice={i} parado={menosMovimento} />
        ))}

      {nuvens &&
        NUVENS.map((n, i) => (
          <Nuvem
            key={i}
            x={n.x * k}
            y={n.y}
            escala={n.escala * k}
            ms={n.ms}
            cor={cena.nuvem}
            k={k}
            parado={menosMovimento}
          />
        ))}
    </View>
  );
}

/**
 * Um morro: uma curva que atravessa a cena e fecha embaixo.
 *
 * Os quatro números são alturas medidas **do fim da cena para cima** — é assim
 * que o protótipo escreve, e é a forma certa: o morro se apoia no chão da
 * cena, e a cena muda de altura entre as telas.
 */
function morro(
  largura: number,
  altura: number,
  inicio: number,
  controleEsq: number,
  controleDir: number,
  fim: number,
) {
  return (
    `M 0 ${altura - inicio} `
    + `C ${largura * 0.3} ${altura - controleEsq} ${largura * 0.7} ${altura - controleDir} `
    + `${largura} ${altura - fim} L ${largura} ${altura} L 0 ${altura} Z`
  );
}

/**
 * O sol, e o halo que respira em volta dele.
 *
 * O halo é uma `View` redonda, e não um `<Circle>` com o raio animado: o raio
 * é propriedade de SVG, e propriedade de SVG animada não chega no
 * `react-native-web`. Uma `View` com `borderRadius` e `scale` desenha o mesmo
 * círculo e vai para o driver nativo.
 */
function Sol({ x, y, k, parado }: { x: number; y: number; k: number; parado: boolean }) {
  const passo = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (parado) {
      passo.setValue(0.5);
      return;
    }
    const laco = lacoDeIdaEVolta(passo, { ms: HALO_MS });
    laco.start();
    return () => laco.stop();
  }, [parado]);

  const halo = ASTRO.halo * k;
  const raio = ASTRO.raio * k;
  /* 40 a 48 de raio, como no documento, virados em escala sobre 44. */
  const scale = passo.interpolate({ inputRange: [0, 1], outputRange: [40 / 44, 48 / 44] });

  return (
    <>
      <Animated.View
        style={{
          position: 'absolute',
          left: x - halo,
          top: y - halo,
          width: halo * 2,
          height: halo * 2,
          borderRadius: halo,
          backgroundColor: palette.yellow300,
          opacity: 0.28,
          transform: [{ scale }],
        }}
      />
      <View
        style={{
          position: 'absolute',
          left: x - raio,
          top: y - raio,
          width: raio * 2,
          height: raio * 2,
          borderRadius: raio,
          backgroundColor: palette.yellow300,
        }}
      />
    </>
  );
}

/** Uma estrela piscando. Cada uma no seu tempo, para não piscarem em coro. */
function Estrela({
  x,
  y,
  cor,
  indice,
  parado,
}: {
  x: number;
  y: number;
  cor: string;
  indice: number;
  parado: boolean;
}) {
  const passo = useRef(new Animated.Value(0)).current;
  const ms = 2000 + indice * 400;

  useEffect(() => {
    if (parado) {
      passo.setValue(0);
      return;
    }
    const laco = lacoDeIdaEVolta(passo, { ms });
    laco.start();
    return () => laco.stop();
  }, [ms, parado]);

  return (
    <Animated.View
      style={{
        position: 'absolute',
        left: x - 1.8,
        top: y - 1.8,
        width: 3.6,
        height: 3.6,
        borderRadius: 1.8,
        backgroundColor: cor,
        opacity: passo.interpolate({ inputRange: [0, 1], outputRange: [1, 0.3] }),
      }}
    />
  );
}

/** Uma nuvem indo e voltando devagar. */
function Nuvem({
  x,
  y,
  escala,
  ms,
  cor,
  k,
  parado,
}: {
  x: number;
  y: number;
  escala: number;
  ms: number;
  cor: string;
  k: number;
  parado: boolean;
}) {
  const passo = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (parado) {
      passo.setValue(0);
      return;
    }
    const laco = lacoDeIdaEVolta(passo, { ms });
    laco.start();
    return () => laco.stop();
  }, [ms, parado]);

  const larg = 96 * escala;
  const alt = 34 * escala;

  return (
    <Animated.View
      style={{
        position: 'absolute',
        left: x,
        top: y,
        width: larg,
        height: alt,
        transform: [
          {
            translateX: passo.interpolate({
              inputRange: [0, 1],
              outputRange: [0, PASSEIO_DA_NUVEM * k],
            }),
          },
        ],
      }}
    >
      <Svg width={larg} height={alt} viewBox="0 0 96 34">
        <Path d={NUVEM} fill={cor} />
      </Svg>
    </Animated.View>
  );
}
