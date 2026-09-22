import React, { useEffect, useRef } from 'react';
import { Animated, Easing, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { useMenosMovimento } from '../../hooks/useMenosMovimento';
import { tracos } from '../../theme/tokens';

/**
 * O broto que sai do monte de adubo, balançando ao vento.
 *
 * ## Por que ele saiu do desenho grande
 *
 * Ele era dois caminhos dentro do `Svg` da terra. Para balançar, o giro teria
 * de ser uma propriedade animada de SVG — e propriedade de SVG **não roda no
 * driver nativo**: cada quadro seria uma conta em JavaScript, na mesma linha
 * que já cuida da contagem da Composta e da ditadura de voz. Numa travada, o
 * broto congelaria torto.
 *
 * Aqui ele é um desenho próprio dentro de uma `View` que gira. Giro de `View`
 * o driver nativo anda sozinho: o balanço continua liso mesmo com o
 * JavaScript ocupado, que é a mesma razão de as palavras da Composta terem um
 * relógio só. O desenho é o mesmo de antes, ponto por ponto.
 *
 * ## O pé é o eixo
 *
 * `View` gira pelo meio. Uma planta gira pelo **pé** — é ali que ela está
 * presa na terra. As duas translações em volta do giro trocam o eixo: sobem o
 * desenho até o meio cair sobre o pé, giram, e descem de volta.
 */

/** A caixa do desenho. O pé do broto fica no meio de baixo. */
export const CAIXA = { largura: 160, altura: 116 };

/** Quanto a haste sobe do pé. O mesmo 46 → 2 do desenho antigo. */
const HASTE = 44;

/** O quanto ele se inclina, em graus. Vento de brisa, não de tempestade. */
const VENTO = [0, -1.1, -2.4, -1.3, -2.1, -0.5, 0.5, -0.7, 0] as const;

/** Uma volta inteira da brisa. Longa de propósito: vento não tem compasso. */
const CICLO_MS = 5400;

export function BrotoAoVento({ ativa = true }: { ativa?: boolean }) {
  const menosMovimento = useMenosMovimento();
  const brisa = useRef(new Animated.Value(0)).current;

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

  const giro = brisa.interpolate({
    inputRange: VENTO.map((_, i) => i / (VENTO.length - 1)),
    outputRange: VENTO.map((g) => `${g}deg`),
  });

  const meio = CAIXA.altura / 2;
  const x = CAIXA.largura / 2;

  return (
    <Animated.View
      pointerEvents="none"
      style={{
        width: CAIXA.largura,
        height: CAIXA.altura,
        transform: [{ translateY: meio }, { rotate: giro }, { translateY: -meio }],
      }}
    >
      <Svg width="100%" height="100%" viewBox={`0 0 ${CAIXA.largura} ${CAIXA.altura}`}>
        <Path
          d={`M${x} ${CAIXA.altura} L${x} ${CAIXA.altura - HASTE}`}
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
          transform={`translate(${x} ${CAIXA.altura - HASTE}) rotate(-52) scale(0.78)`}
        />
        <Path
          d="M0 0 C -6 -14 -18 -26 -32 -24 C -42 -22 -44 -6 -34 4 C -22 16 -8 12 0 0 Z"
          fill={tracos.folhaClara}
          stroke={tracos.contornoFolha}
          strokeWidth={2.6}
          transform={`translate(${x} ${CAIXA.altura - HASTE + 6}) rotate(232) scale(0.64)`}
        />
      </Svg>
    </Animated.View>
  );
}

/**
 * O broto posto na terra: o pé dele cai exatamente onde a haste antiga nascia.
 *
 * `esquerda` e `pe` são coordenadas da faixa; quem chama não precisa saber o
 * tamanho da caixa nem que o desenho tem folga em volta.
 */
export function BrotoNaTerra({
  pe,
  coluna,
  ativa,
}: {
  /** O y do pé do broto, na faixa. */
  pe: number;
  /** O x do pé do broto, na faixa. */
  coluna: number;
  ativa?: boolean;
}) {
  return (
    <View
      pointerEvents="none"
      style={{
        position: 'absolute',
        left: coluna - CAIXA.largura / 2,
        top: pe - CAIXA.altura,
      }}
      collapsable={false}
    >
      <BrotoAoVento ativa={ativa} />
    </View>
  );
}
