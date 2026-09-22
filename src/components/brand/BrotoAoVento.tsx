import React, { useEffect, useId, useMemo, useRef } from 'react';
import { Animated, Easing, View } from 'react-native';
import Svg, { Defs, G, LinearGradient, Path, Stop } from 'react-native-svg';

import { useMenosMovimento } from '../../hooks/useMenosMovimento';
import { tracos } from '../../theme/tokens';

/**
 * O broto que sai do monte de adubo, balançando ao vento.
 *
 * ## Por que ele não é um desenho só
 *
 * Ele era dois caminhos dentro do `Svg` da terra, e balançava inteiro, como
 * uma peça de madeira girando no pé. Planta não faz isso: o caule cede no
 * vento e **cada folha** responde no tempo dela, porque cada uma tem um
 * tamanho e um cabo diferentes.
 *
 * Então o broto é montado em peças: o caule numa `View` que gira pelo pé, e
 * cada folha numa `View` que gira pelo ponto onde ela nasce, dentro da do
 * caule. O movimento de uma folha é o do caule **mais** o dela — que é como
 * funciona na planta.
 *
 * Giro de propriedade de SVG não roda no driver nativo: cada quadro seria uma
 * conta em JavaScript, na mesma linha que já cuida da contagem da Composta e
 * da ditadura de voz. Giro de `View` o nativo anda sozinho, e o balanço
 * continua liso mesmo com o JavaScript ocupado — a mesma razão de as palavras
 * da Composta terem um relógio só.
 *
 * ## O pivô no centro da caixa
 *
 * `View` gira pelo meio. Em vez de somar translações em volta de cada giro,
 * cada peça mora numa caixa **com o pivô no centro**: o caule numa caixa cujo
 * meio é o pé, cada folha numa cujo meio é o nascimento dela. O desenho ocupa
 * só parte da caixa, e a caixa tem folga para a folha girar sem ser cortada.
 *
 * ## Um relógio só, com rajadas
 *
 * Todas as peças leem o mesmo valor animado. O que as faz parecerem
 * independentes são as curvas: cada uma tem a própria amplitude, o próprio
 * número de batidas por volta e a própria defasagem. Uma volta leva nove
 * segundos e tem duas rajadas — o vento acelera, a planta cede e volta devagar
 * —, e é isso que tira o aspecto de metrônomo.
 */

/** Uma volta inteira da brisa. Longa de propósito: vento não tem compasso. */
const CICLO_MS = 9000;

/**
 * O caule, em graus, ao longo da volta.
 *
 * Duas rajadas: cai depressa para o lado e volta devagar, como galho cedendo.
 * O primeiro e o último valor são iguais, senão a volta dá um tranco.
 */
const CAULE = [0, -1.4, -4.2, -3.1, -1.6, -0.4, -3.6, -2.4, -1, 0.5, 0];

/** Uma onda de `batidas` por volta, para o tremular de cada folha. */
function onda(amplitude: number, batidas: number, fase: number, pontos = 17): number[] {
  const valores = Array.from({ length: pontos }, (_, i) =>
    amplitude * Math.sin(((i / (pontos - 1)) * Math.PI * 2 * batidas) + fase),
  );
  /* A volta tem de fechar onde começou. */
  valores[pontos - 1] = valores[0];
  return valores;
}

const entradaDe = (pontos: number) => Array.from({ length: pontos }, (_, i) => i / (pontos - 1));

/**
 * Uma folha: onde nasce, para onde aponta, o tamanho, e como ela responde ao
 * vento.
 *
 * `batidas` e `fase` são o que fazem cada uma ter o tempo dela: a folha
 * grande balança devagar e pouco, porque é pesada, e a menor responde mais
 * depressa.
 *
 * São **duas**, e é a silhueta de sempre. Uma terceira folhinha na base já
 * esteve aqui e saiu: de longe ela lia como uma folha a mais, e o broto de
 * duas folhas é o que o app é.
 */
type Folha = {
  x: number;
  y: number;
  angulo: number;
  comprimento: number;
  largura: number;
  clara?: boolean;
  /** Quantas nervuras laterais de cada lado. */
  nervuras: number;
  vento: { amplitude: number; batidas: number; fase: number };
  respira: { amplitude: number; fase: number };
};

const FOLHAS: Folha[] = [
  {
    x: 1,
    y: -44,
    angulo: -150,
    comprimento: 40,
    largura: 14,
    nervuras: 2,
    vento: { amplitude: 3.4, batidas: 2, fase: 0 },
    respira: { amplitude: 0.03, fase: 0.4 },
  },
  {
    x: -1,
    y: -50,
    angulo: -22,
    comprimento: 34,
    largura: 12,
    clara: true,
    nervuras: 2,
    vento: { amplitude: 4.6, batidas: 3, fase: 2.1 },
    respira: { amplitude: 0.035, fase: 2.4 },
  },
];

/** Quanto o caule sobe do pé. */
const CAULE_ALTURA = 50;

/** A caixa do caule: o pé fica no centro dela. */
const CORPO = { largura: 200, altura: 240 };

/** O contorno de uma folha em amêndoa, nascendo na origem e deitada para +x. */
function contornoDaFolha(c: number, l: number): string {
  return `M0 0 C${c * 0.22} ${-l} ${c * 0.72} ${-l * 0.94} ${c} 0 C${c * 0.72} ${l * 0.94} ${c * 0.22} ${l} 0 0 Z`;
}

/** Uma folha na caixa dela, girando pelo ponto onde nasce. */
function FolhaViva({
  folha,
  origem,
  brisa,
  id,
}: {
  folha: Folha;
  /** Onde, na caixa do caule, fica o pé — de onde a folha é medida. */
  origem: { x: number; y: number };
  brisa: Animated.Value;
  /** Um nome único para o gradiente desta folha. */
  id: string;
}) {
  /* A caixa é quadrada e do tamanho da folha inteira, para ela girar solta. */
  const lado = folha.comprimento * 2 + 14;

  const giro = useMemo(() => {
    const valores = onda(folha.vento.amplitude, folha.vento.batidas, folha.vento.fase);
    return brisa.interpolate({
      inputRange: entradaDe(valores.length),
      outputRange: valores.map((g) => `${g}deg`),
    });
  }, [brisa, folha.vento]);

  const escala = useMemo(() => {
    const valores = onda(folha.respira.amplitude, 1, folha.respira.fase, 9).map((v) => 1 + v);
    return brisa.interpolate({ inputRange: entradaDe(valores.length), outputRange: valores });
  }, [brisa, folha.respira]);

  const c = folha.comprimento;
  const l = folha.largura;
  const nervuras = Array.from({ length: folha.nervuras }, (_, i) => {
    const p = 0.26 + ((i + 1) / (folha.nervuras + 1)) * 0.5;
    return p;
  });

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
        {/*
          O gradiente mora **aqui dentro**, e não no `Svg` do caule.

          No Android, um `Svg` não enxerga a definição que está noutro: o
          `fill` não encontra o nome, e o que não encontra é desenhado
          **preto**. No navegador funciona, porque lá o nome vale para a
          página inteira — foi assim que isto passou batido daqui e só
          apareceu no celular, com o broto todo preto.
        */}
        <Defs>
          <LinearGradient id={id} x1="0" y1="0" x2="0.6" y2="1">
            <Stop offset="0" stopColor={folha.clara ? tracos.folhaClara : tracos.folhaLuz} />
            <Stop offset="1" stopColor={folha.clara ? tracos.folhaLuz : tracos.folhaSombra} />
          </LinearGradient>
        </Defs>
        <G transform={`rotate(${folha.angulo})`}>
          <Path
            d={contornoDaFolha(c, l)}
            fill={`url(#${id})`}
            stroke={tracos.contornoFolha}
            strokeWidth={2.4}
            strokeLinejoin="round"
          />
          {/* A nervura do meio, um pouco curvada, como toda folha tem. */}
          <Path
            d={`M2 0 Q${c * 0.5} ${-l * 0.12} ${c * 0.9} 0`}
            stroke={tracos.contornoFolha}
            strokeWidth={1.2}
            strokeLinecap="round"
            fill="none"
            opacity={0.45}
          />
          {nervuras.map((p) =>
            [-1, 1].map((s) => (
              <Path
                key={`${p}-${s}`}
                d={`M${c * p} ${s * l * 0.06} Q${c * (p + 0.1)} ${s * l * 0.4} ${c * (p + 0.2)} ${s * l * 0.52}`}
                stroke={tracos.contornoFolha}
                strokeWidth={0.9}
                strokeLinecap="round"
                fill="none"
                opacity={0.3}
              />
            )),
          )}
          {/* O brilho: a luz batendo na metade de cima da folha. */}
          <Path
            d={`M${c * 0.2} ${-l * 0.5} Q${c * 0.46} ${-l * 0.76} ${c * 0.72} ${-l * 0.44}`}
            stroke="#FFFFFF"
            strokeWidth={1.5}
            strokeLinecap="round"
            fill="none"
            opacity={0.35}
          />
        </G>
      </Svg>
    </Animated.View>
  );
}

/**
 * O broto posto na terra: o pé dele cai em `pe` e `coluna`, coordenadas da
 * faixa. Quem chama não precisa saber o tamanho das caixas.
 */
export function BrotoNaTerra({
  pe,
  coluna,
  ativa = true,
}: {
  /** O y do pé do broto, na faixa. */
  pe: number;
  /** O x do pé do broto, na faixa. */
  coluna: number;
  ativa?: boolean;
}) {
  const id = useId().replace(/:/g, '');
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

  const giroDoCaule = useMemo(
    () =>
      brisa.interpolate({
        inputRange: entradaDe(CAULE.length),
        outputRange: CAULE.map((g) => `${g}deg`),
      }),
    [brisa],
  );

  const meio = { x: CORPO.largura / 2, y: CORPO.altura / 2 };

  return (
    <Animated.View
      pointerEvents="none"
      collapsable={false}
      style={{
        position: 'absolute',
        left: coluna - meio.x,
        top: pe - meio.y,
        width: CORPO.largura,
        height: CORPO.altura,
        transform: [{ rotate: giroDoCaule }],
      }}
    >
      <Svg
        style={{ position: 'absolute' }}
        width={CORPO.largura}
        height={CORPO.altura}
        viewBox={`${-meio.x} ${-meio.y} ${CORPO.largura} ${CORPO.altura}`}
      >
        {/* O caule, com uma curva leve — planta não cresce em linha reta. */}
        <Path
          d={`M0 0 C3 ${-CAULE_ALTURA * 0.36} -2 ${-CAULE_ALTURA * 0.68} 0 ${-CAULE_ALTURA}`}
          stroke={tracos.haste}
          strokeWidth={5}
          strokeLinecap="round"
          fill="none"
        />
        {/* O fio de luz do lado de onde vem a claridade da faixa. */}
        <Path
          d={`M-1.2 -6 C1.8 ${-CAULE_ALTURA * 0.36} -3.2 ${-CAULE_ALTURA * 0.68} -1.2 ${-CAULE_ALTURA + 5}`}
          stroke="#FFFFFF"
          strokeWidth={1.2}
          strokeLinecap="round"
          fill="none"
          opacity={0.26}
        />
      </Svg>

      {/*
        As folhas ficam numa âncora do tamanho da caixa, e não numa `View`
        vazia: no Android, filho fora dos limites de uma `View` sem tamanho
        pode ser recortado.
      */}
      <View
        pointerEvents="none"
        style={{ position: 'absolute', left: 0, top: 0, width: CORPO.largura, height: CORPO.altura }}
      >
        {FOLHAS.map((folha, i) => (
          <FolhaViva key={i} folha={folha} origem={meio} brisa={brisa} id={`folha-${id}-${i}`} />
        ))}
      </View>
    </Animated.View>
  );
}
