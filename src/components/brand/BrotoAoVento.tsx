import React, { useEffect, useId, useMemo, useRef } from 'react';
import { Animated, Easing, Pressable, View } from 'react-native';
import Svg, { Defs, Ellipse, G, LinearGradient, Path, RadialGradient, Stop } from 'react-native-svg';

import { useMenosMovimento } from '../../hooks/useMenosMovimento';
import { toqueLeve } from '../../services/toque';
import { useAppState } from '../../state/AppStateProvider';
import { palette, tracos } from '../../theme/tokens';

/**
 * O broto que sai do monte de adubo: vento, respiração, estirão e toque.
 *
 * ## Tudo gira no driver nativo
 *
 * Giro de propriedade de SVG não roda no nativo — cada quadro seria conta em
 * JavaScript, na mesma linha da contagem da Composta. Por isso o broto é
 * montado em **peças**, cada uma dentro de uma `View` que gira: o corpo pelo
 * pé, a parte de cima pela junta, cada folha pelo ponto onde nasce.
 *
 * ## O pivô no centro da caixa
 *
 * `View` gira pelo meio. Em vez de somar translações em volta de cada giro,
 * cada peça mora numa caixa **com o pivô no centro**: o corpo numa caixa cujo
 * meio é o pé, a parte de cima numa cujo meio é a junta, cada folha numa cujo
 * meio é o nascimento dela. O desenho ocupa só uma metade da caixa.
 *
 * ## As quatro animações
 *
 * - **Vento**: o corpo inclina pelo pé, e a parte de cima inclina **mais e
 *   atrasada**, pela junta — é o que faz a haste parecer flexível, e não um
 *   palito girando.
 * - **Respiração**: as folhas crescem e voltam um pouco, e tremulam cada uma
 *   no seu tempo.
 * - **Estirão**: quando a seiva de uma palavra chega (`alimento`, de 0 a 1),
 *   o broto estica, as folhas abrem e um brilho acende atrás dele.
 * - **Toque**: sacode e solta brilhos, com uma vibração leve.
 */

/** O relógio da brisa: uma volta longa, porque vento não tem compasso. */
const CICLO_MS = 5400;

/** O corpo inclina pelo pé, em graus. Brisa, não tempestade. */
const VENTO = [0, -1.1, -2.4, -1.3, -2.1, -0.5, 0.5, -0.7, 0];

/** A parte de cima: o mesmo vento um passo atrasado, e mais largo. */
const VENTO_DE_CIMA = VENTO.map((_, i) => VENTO[(i - 1 + 8) % 8] * 1.7);

/** Uma onda de três batidas por volta, para o tremular das folhas. */
function tremular(amplitude: number, fase: number): number[] {
  return Array.from({ length: 13 }, (_, i) => amplitude * Math.sin((i / 12) * Math.PI * 2 * 3 + fase));
}
const ENTRADA = Array.from({ length: 13 }, (_, i) => i / 12);

/** A junta, onde a parte de cima se apoia: acima do pé, em pontos. */
const JUNTA = 44;

/** Uma folha: onde nasce, para onde aponta, e o tamanho. */
type Folha = {
  x: number;
  y: number;
  angulo: number;
  comprimento: number;
  largura: number;
  clara?: boolean;
  fase: number;
};

/** As de baixo nascem no corpo; as de cima, na parte de cima (a partir da junta). */
const FOLHAS_DE_BAIXO: Folha[] = [
  { x: -1, y: -24, angulo: -158, comprimento: 40, largura: 13, fase: 0 },
  { x: 1, y: -31, angulo: -24, comprimento: 36, largura: 12, fase: 1.7 },
];
const FOLHAS_DE_CIMA: Folha[] = [
  { x: -2, y: -22, angulo: -146, comprimento: 26, largura: 9, clara: true, fase: 3.1 },
  { x: -1, y: -27, angulo: -38, comprimento: 24, largura: 8.5, clara: true, fase: 4.4 },
];

/** Onde a haste de cima termina, a partir da junta: é onde fica o botão. */
const PONTA = { x: -3, y: -40 };

/** O contorno de uma folha em amêndoa, deitada, nascendo na origem. */
function contornoDaFolha(c: number, l: number): string {
  return `M0 0 C${c * 0.22} ${-l} ${c * 0.72} ${-l * 0.92} ${c} 0 C${c * 0.72} ${l * 0.92} ${c * 0.22} ${l} 0 0 Z`;
}

/** Uma folha na caixa dela, com o nascimento no centro. */
function FolhaViva({
  folha,
  origem,
  brisa,
  alimento,
  gradiente,
}: {
  folha: Folha;
  /** Onde fica, na caixa de quem a carrega, o ponto de onde ela é medida. */
  origem: { x: number; y: number };
  brisa: Animated.Value;
  alimento: Animated.AnimatedInterpolation<number> | null;
  gradiente: string;
}) {
  const lado = folha.comprimento * 2 + 12;
  const giro = useMemo(
    () =>
      brisa.interpolate({
        inputRange: ENTRADA,
        outputRange: tremular(2.6, folha.fase).map((g) => `${g}deg`),
      }),
    [brisa, folha.fase],
  );
  /* A respiração: duas vezes por volta, bem de leve. E o estirão soma por cima. */
  const escala = useMemo(() => {
    const respira = brisa.interpolate({
      inputRange: [0, 0.25, 0.5, 0.75, 1],
      outputRange: [1, 1.035, 1, 1.035, 1],
    });
    if (!alimento) return respira;
    return Animated.multiply(
      respira,
      alimento.interpolate({ inputRange: [0, 1], outputRange: [1, 1.1] }),
    );
  }, [brisa, alimento]);

  const c = folha.comprimento;
  const l = folha.largura;
  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: 'absolute',
        left: origem.x + folha.x - lado / 2,
        top: origem.y + folha.y - lado / 2,
        width: lado,
        height: lado,
        transform: [{ rotate: giro }, { scale: escala }],
      }}
    >
      <Svg width={lado} height={lado} viewBox={`${-lado / 2} ${-lado / 2} ${lado} ${lado}`}>
        <G transform={`rotate(${folha.angulo})`}>
          <Path
            d={contornoDaFolha(c, l)}
            fill={`url(#${gradiente})`}
            stroke={tracos.contornoFolha}
            strokeWidth={2.4}
            strokeLinejoin="round"
          />
          {/* A nervura: do nascimento quase até a ponta, um pouco curvada. */}
          <Path
            d={`M2 0 Q${c * 0.5} ${-l * 0.14} ${c * 0.9} 0`}
            stroke={tracos.contornoFolha}
            strokeWidth={1.3}
            strokeLinecap="round"
            fill="none"
            opacity={0.45}
          />
          {/* O brilho: a luz batendo na metade de cima. */}
          <Path
            d={`M${c * 0.22} ${-l * 0.5} Q${c * 0.48} ${-l * 0.78} ${c * 0.74} ${-l * 0.46}`}
            stroke="#FFFFFF"
            strokeWidth={1.6}
            strokeLinecap="round"
            fill="none"
            opacity={0.38}
          />
        </G>
      </Svg>
    </Animated.View>
  );
}

/** Os brilhos do toque: de onde saem e para onde vão, a partir do pé. */
const BRILHOS = [
  { x: -30, y: -50, dx: -26, dy: -30, r: 0 },
  { x: 28, y: -58, dx: 30, dy: -26, r: 20 },
  { x: -8, y: -86, dx: -14, dy: -38, r: 40 },
  { x: 10, y: -84, dx: 18, dy: -40, r: 10 },
  { x: -36, y: -24, dx: -34, dy: -8, r: 30 },
  { x: 34, y: -32, dx: 36, dy: -6, r: 50 },
  { x: 0, y: -96, dx: 2, dy: -34, r: 25 },
];

/** Uma estrela de quatro pontas, pequena. */
const ESTRELA = 'M0 -6 C0.8 -1.6 1.6 -0.8 6 0 C1.6 0.8 0.8 1.6 0 6 C-0.8 1.6 -1.6 0.8 -6 0 C-1.6 -0.8 -0.8 -1.6 0 -6 Z';

/** A caixa do corpo: o pé fica no centro. */
const CORPO = { largura: 220, altura: 260 };
/** A caixa da parte de cima: a junta fica no centro. */
const CIMA = { largura: 160, altura: 140 };

export type PropsDoBroto = {
  ativa?: boolean;
  /** A seiva chegando, de 0 a 1 — vem do relógio das palavras. */
  alimento?: Animated.AnimatedInterpolation<number> | null;
};

/**
 * O broto posto na terra: o pé dele cai em `pe` e `coluna`, coordenadas da
 * faixa. Quem chama não precisa saber o tamanho das caixas.
 */
export function BrotoNaTerra({
  pe,
  coluna,
  ativa = true,
  alimento = null,
}: PropsDoBroto & { pe: number; coluna: number }) {
  const id = useId().replace(/:/g, '');
  const menosMovimento = useMenosMovimento();
  const { data } = useAppState();
  const brisa = useRef(new Animated.Value(0)).current;
  const sacudida = useRef(new Animated.Value(0)).current;
  const brilho = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!ativa || menosMovimento) {
      brisa.stopAnimation();
      /* Parado, ele fica reto: um broto torto e imóvel lê como defeito. */
      brisa.setValue(0);
      return;
    }
    const volta = Animated.loop(
      Animated.timing(brisa, {
        toValue: 1,
        duration: CICLO_MS,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    volta.start();
    return () => volta.stop();
  }, [ativa, menosMovimento, brisa]);

  const tocar = () => {
    toqueLeve(data.settings.vibracao);
    if (menosMovimento) return;
    sacudida.stopAnimation();
    brilho.stopAnimation();
    sacudida.setValue(0);
    brilho.setValue(0);
    /* Um chacoalhão que morre sozinho: cada ida menor que a anterior. */
    const ida = (para: number, ms: number) =>
      Animated.timing(sacudida, {
        toValue: para,
        duration: ms,
        easing: Easing.inOut(Easing.quad),
        useNativeDriver: true,
      });
    Animated.sequence([ida(1, 90), ida(-0.8, 150), ida(0.5, 140), ida(-0.25, 130), ida(0, 120)]).start();
    Animated.timing(brilho, {
      toValue: 1,
      duration: 1100,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start();
  };

  /* Os giros, em graus e somados: o vento mais a sacudida do toque. */
  const giroDoCorpo = useMemo(() => {
    const vento = brisa.interpolate({ inputRange: VENTO.map((_, i) => i / 8), outputRange: VENTO });
    const toque = sacudida.interpolate({ inputRange: [-1, 1], outputRange: [-7, 7] });
    return Animated.add(vento, toque).interpolate({
      inputRange: [-360, 360],
      outputRange: ['-360deg', '360deg'],
    });
  }, [brisa, sacudida]);

  const giroDeCima = useMemo(() => {
    const vento = brisa.interpolate({
      inputRange: VENTO_DE_CIMA.map((_, i) => i / 8),
      outputRange: VENTO_DE_CIMA,
    });
    /* No toque a ponta vai ainda mais longe, atrasada como no vento. */
    const toque = sacudida.interpolate({ inputRange: [-1, 1], outputRange: [5, -5] });
    return Animated.add(vento, toque).interpolate({
      inputRange: [-360, 360],
      outputRange: ['-360deg', '360deg'],
    });
  }, [brisa, sacudida]);

  const estica = useMemo(
    () => (alimento ? alimento.interpolate({ inputRange: [0, 1], outputRange: [1, 1.08] }) : 1),
    [alimento],
  );
  const aura = useMemo(
    () => (alimento ? alimento.interpolate({ inputRange: [0, 1], outputRange: [0, 0.85] }) : 0),
    [alimento],
  );

  const g = {
    folha: `folha-${id}`,
    clara: `folha-clara-${id}`,
    aura: `aura-${id}`,
  };

  return (
    <>
      {/* O brilho do estirão, atrás de tudo: a seiva chegou. */}
      <Animated.View
        pointerEvents="none"
        style={{
          position: 'absolute',
          left: coluna - 70,
          top: pe - 130,
          width: 140,
          height: 140,
          opacity: aura,
        }}
      >
        <Svg width={140} height={140}>
          <Defs>
            <RadialGradient id={g.aura} cx="50%" cy="50%" r="50%">
              <Stop offset="0" stopColor={palette.yellow300} stopOpacity={0.9} />
              <Stop offset="0.55" stopColor={palette.yellow300} stopOpacity={0.35} />
              <Stop offset="1" stopColor={palette.yellow300} stopOpacity={0} />
            </RadialGradient>
          </Defs>
          <Ellipse cx={70} cy={70} rx={70} ry={70} fill={`url(#${g.aura})`} />
        </Svg>
      </Animated.View>

      {/* O corpo: gira pelo pé, que é o centro desta caixa. */}
      <Animated.View
        pointerEvents="none"
        style={{
          position: 'absolute',
          left: coluna - CORPO.largura / 2,
          top: pe - CORPO.altura / 2,
          width: CORPO.largura,
          height: CORPO.altura,
          transform: [{ rotate: giroDoCorpo }, { scaleY: estica }],
        }}
      >
        <Svg
          style={{ position: 'absolute' }}
          width={CORPO.largura}
          height={CORPO.altura}
          viewBox={`${-CORPO.largura / 2} ${-CORPO.altura / 2} ${CORPO.largura} ${CORPO.altura}`}
        >
          <Defs>
            <LinearGradient id={g.folha} x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0" stopColor={tracos.folhaLuz} />
              <Stop offset="1" stopColor={tracos.folhaSombra} />
            </LinearGradient>
            <LinearGradient id={g.clara} x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0" stopColor={tracos.folhaClara} />
              <Stop offset="1" stopColor={tracos.folhaLuz} />
            </LinearGradient>
          </Defs>
          {/* A haste de baixo, com uma curva leve e um fio de luz. */}
          <Path
            d={`M0 0 C3 ${-JUNTA * 0.35} -2 ${-JUNTA * 0.7} 0 ${-JUNTA}`}
            stroke={tracos.haste}
            strokeWidth={5.5}
            strokeLinecap="round"
            fill="none"
          />
          <Path
            d={`M-1.2 -4 C1.8 ${-JUNTA * 0.35} -3.2 ${-JUNTA * 0.7} -1.2 ${-JUNTA + 4}`}
            stroke="#FFFFFF"
            strokeWidth={1.3}
            strokeLinecap="round"
            fill="none"
            opacity={0.28}
          />
        </Svg>

        {/*
          As peças que giram por conta própria ficam dentro do corpo, em
          coordenadas da caixa dele: o pé está em (meia largura, meia altura).
        */}
        {/*
          A âncora tem o tamanho da caixa, e não zero: no Android, filho fora
          dos limites de uma `View` vazia pode ser recortado.
        */}
        <View
          pointerEvents="none"
          style={{ position: 'absolute', left: 0, top: 0, width: CORPO.largura, height: CORPO.altura }}
        >
          {FOLHAS_DE_BAIXO.map((f, i) => (
            <FolhaViva
              key={i}
              folha={f}
              origem={{ x: CORPO.largura / 2, y: CORPO.altura / 2 }}
              brisa={brisa}
              alimento={alimento}
              gradiente={g.folha}
            />
          ))}

          {/* A parte de cima: gira pela junta, que é o centro desta caixa. */}
          <Animated.View
            pointerEvents="none"
            style={{
              position: 'absolute',
              left: CORPO.largura / 2 - CIMA.largura / 2,
              top: CORPO.altura / 2 - JUNTA - CIMA.altura / 2,
              width: CIMA.largura,
              height: CIMA.altura,
              transform: [{ rotate: giroDeCima }],
            }}
          >
            <Svg
              style={{ position: 'absolute' }}
              width={CIMA.largura}
              height={CIMA.altura}
              viewBox={`${-CIMA.largura / 2} ${-CIMA.altura / 2} ${CIMA.largura} ${CIMA.altura}`}
            >
              <Path
                d={`M0 0 C-1 ${PONTA.y * 0.4} ${PONTA.x - 3} ${PONTA.y * 0.75} ${PONTA.x} ${PONTA.y}`}
                stroke={tracos.haste}
                strokeWidth={4.2}
                strokeLinecap="round"
                fill="none"
              />
              {/*
                O nó da junta: a haste de cima e a de baixo são peças que giram
                separadas, e sem ele a emenda abria um vão quando o vento
                entortava a de cima. Planta de verdade tem nó ali.
              */}
              <Ellipse cx={0} cy={0} rx={3.6} ry={3.1} fill={tracos.haste} />
              {/* O botão da ponta: uma folha ainda fechada, apontando para o céu. */}
              <G transform={`translate(${PONTA.x} ${PONTA.y}) rotate(-96)`}>
                <Path
                  d={contornoDaFolha(13, 5.2)}
                  fill={tracos.folhaClara}
                  stroke={tracos.contornoFolha}
                  strokeWidth={2}
                  strokeLinejoin="round"
                />
              </G>
            </Svg>
            <View
              pointerEvents="none"
              style={{ position: 'absolute', left: 0, top: 0, width: CIMA.largura, height: CIMA.altura }}
            >
              {FOLHAS_DE_CIMA.map((f, i) => (
                <FolhaViva
                  key={i}
                  folha={f}
                  origem={{ x: CIMA.largura / 2, y: CIMA.altura / 2 }}
                  brisa={brisa}
                  alimento={alimento}
                  gradiente={g.clara}
                />
              ))}
            </View>
          </Animated.View>
        </View>
      </Animated.View>

      {/* Os brilhos do toque, em volta do broto. */}
      {BRILHOS.map((b, i) => (
        <Animated.View
          key={i}
          pointerEvents="none"
          style={{
            position: 'absolute',
            left: coluna + b.x - 8,
            top: pe + b.y - 8,
            width: 16,
            height: 16,
            opacity: brilho.interpolate({
              inputRange: [0, 0.12, 0.6, 1],
              outputRange: [0, 1, 0.8, 0],
            }),
            transform: [
              { translateX: brilho.interpolate({ inputRange: [0, 1], outputRange: [0, b.dx] }) },
              { translateY: brilho.interpolate({ inputRange: [0, 1], outputRange: [0, b.dy] }) },
              { scale: brilho.interpolate({ inputRange: [0, 0.2, 1], outputRange: [0.3, 1, 0.5] }) },
              {
                rotate: brilho.interpolate({
                  inputRange: [0, 1],
                  outputRange: [`${b.r}deg`, `${b.r + 90}deg`],
                }),
              },
            ],
          }}
        >
          <Svg width={16} height={16} viewBox="-8 -8 16 16">
            <Path d={ESTRELA} fill={palette.yellow300} stroke="#FFFFFF" strokeWidth={0.8} />
          </Svg>
        </Animated.View>
      ))}

      {/*
        O alvo do toque: o broto inteiro, acima do pé.

        Fica por cima do botão da faixa — que é o bloco de terra inteiro — só
        na área do broto: tocar nele é brincar com ele, e não abrir a
        ferramenta. Fora do leitor de tela, porque não faz nada que alguém
        precise alcançar.
      */}
      <Pressable
        onPress={tocar}
        accessible={false}
        importantForAccessibility="no"
        style={{
          position: 'absolute',
          left: coluna - 52,
          top: pe - 112,
          width: 104,
          height: 108,
        }}
      />
    </>
  );
}
