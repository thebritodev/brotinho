import React, { useEffect, useRef } from 'react';
import { Animated, View } from 'react-native';
import Svg, { Circle, G, Path } from 'react-native-svg';

import { useMenosMovimento } from '../../hooks/useMenosMovimento';
import { lacoDeIdaEVolta } from '../laco';

/**
 * O microfone da prática: o anel de progresso, o botão e o halo.
 *
 * ## Por que ele é grande
 *
 * Cento e vinte e quatro pontos. A prática inteira acontece com a pessoa
 * falando em voz alta, quase sempre **sem olhar para a tela** — e o que ela
 * precisa achar de canto de olho é onde pausar. Um botão de 44 no rodapé é
 * alvo de interface; este é o objeto da tela.
 *
 * O anel em volta dele é o cronômetro. Ficava numa barra fina no alto, longe
 * do botão: duas coisas sobre o mesmo assunto em dois cantos. Aqui o tempo
 * corre em volta da coisa que o faz correr.
 *
 * ## O halo é um só, e devagar
 *
 * Quatro segundos, de 44 a 54 e volta. O documento é explícito: **sem pulsar o
 * botão e sem ondas rápidas.** Vale escrever por que, porque a tentação de
 * animar mais aqui é grande: a pessoa está repetindo em voz alta uma frase que
 * dói. Um botão pulsando no ritmo da voz transforma isso em medidor de
 * desempenho — e o que o halo tem de dizer é só "estou aqui, ligado".
 *
 * ## O anel de progresso não é animado, e não precisa ser
 *
 * No documento ele tem `transition: stroke-dashoffset 1s linear`, e tem porque
 * lá o cronômetro é simulado: `compT` anda **uma vez por segundo**, e sem a
 * transição o anel daria trinta e seis saltos de dez graus.
 *
 * Aqui quem move o anel é a sessão de verdade, que acumula a cada tique do
 * medidor — várias vezes por segundo. O anel já segue o dado de perto, e
 * animá-lo seria interpolar entre dois valores que já são próximos.
 *
 * O que isso evita vale escrever, porque a primeira versão fez o contrário e
 * custou caro. Animar `strokeDashoffset` é animar um **atributo de SVG**: o
 * driver nativo não sabe mexer nisso, e no `react-native-web` não há
 * `setNativeProps` para atalhar, então cada quadro custa um render de React. E
 * `Animated.createAnimatedComponent` de um componente do `react-native-svg`
 * ainda derrama `collapsable={false}` no DOM, o que o React rejeita aos gritos:
 * dois erros de console por montagem, numa casa que não tem nenhum.
 */

const LADO = 124;
const CENTRO = LADO / 2;
const RAIO = 50;
const VOLTA = 2 * Math.PI * RAIO;

const CREME = '#FBF6EC';
const VERDE_ATIVO = '#5B8A72';
const VERDE_ICONE = '#3E6B54';
const VERDE_ANEL = '#9EBBAA';
const VERDE_MIOLO = '#E3EDE6';

/** O anel de progresso: a volta inteira, descontado o que falta. */
function AnelDoTempo({ fracao }: { fracao: number }) {
  return (
    <Circle
      cx={CENTRO}
      cy={CENTRO}
      r={RAIO}
      fill="none"
      stroke={VERDE_ANEL}
      strokeWidth={5}
      strokeLinecap="round"
      strokeDasharray={`${VOLTA}`}
      strokeDashoffset={VOLTA * (1 - Math.max(0, Math.min(1, fracao)))}
      /* Começa no alto, e não à direita: é de onde se lê um relógio. */
      transform={`rotate(-90 ${CENTRO} ${CENTRO})`}
    />
  );
}

export function MicrofoneDaComposta({
  ativo,
  fracao,
}: {
  /** Ligado: ouvindo (voz alta) ou com o botão segurado (baixinho). */
  ativo: boolean;
  /** Quanto da prática já passou, de 0 a 1. */
  fracao: number;
}) {
  const parado = useMenosMovimento();
  const halo = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!ativo || parado) return;
    const laco = lacoDeIdaEVolta(halo, { ms: 4000 });
    laco.start();
    return () => {
      laco.stop();
      halo.setValue(0);
    };
  }, [ativo, parado, halo]);

  return (
    <View style={{ width: LADO, height: LADO }}>
      {/*
        O halo, num `Animated.View` por fora do SVG: o que cresce é a escala de
        uma camada, não o raio de um círculo. Mesma razão do anel, pelo
        contrário — aqui dá para ficar no nativo, então fica.

        O círculo é desenhado com raio 54, o maior da animação, e a escala vai
        de 44/54 a 1. Desenhar o menor e crescer deixaria a borda serrilhada.
      */}
      {ativo && (
        <Animated.View
          pointerEvents="none"
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            width: LADO,
            height: LADO,
            opacity: 0.18,
            transform: [
              { scale: halo.interpolate({ inputRange: [0, 1], outputRange: [44 / 54, 1] }) },
            ],
          }}
        >
          <Svg width={LADO} height={LADO} viewBox={`0 0 ${LADO} ${LADO}`}>
            <Circle cx={CENTRO} cy={CENTRO} r={54} fill={CREME} />
          </Svg>
        </Animated.View>
      )}

      <Svg width={LADO} height={LADO} viewBox={`0 0 ${LADO} ${LADO}`} style={{ position: 'absolute' }}>
        {/* O trilho do anel. */}
        <Circle
          cx={CENTRO}
          cy={CENTRO}
          r={RAIO}
          fill="none"
          stroke="rgba(251,246,236,0.35)"
          strokeWidth={5}
        />
        <AnelDoTempo fracao={fracao} />

        {/*
          O botão. A sombra é um círculo igual deslocado quatro pontos para
          baixo, e não uma sombra de caixa: num disco de 42 de raio sobre um céu
          com grão, a sombra de verdade vira uma mancha cinza em volta. Esta é
          a mesma forma, embaixo — é assim que um botão de papel faz sombra.
        */}
        <Circle cx={CENTRO} cy={CENTRO + 4} r={42} fill="rgba(58,54,48,0.25)" />
        <Circle cx={CENTRO} cy={CENTRO} r={42} fill={ativo ? VERDE_ATIVO : CREME} />
        {/* O reflexo em arco: a luz que vem de cima à esquerda. */}
        <Path
          d="M 34 50 C 40 34 56 26 72 28"
          fill="none"
          stroke="#fff"
          strokeWidth={4}
          strokeLinecap="round"
          opacity={ativo ? 0.3 : 0.8}
        />
        <G
          transform="translate(44 44) scale(1.5)"
          fill="none"
          stroke={ativo ? CREME : VERDE_ICONE}
          strokeWidth={2.2}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <Path
            d="M12 3.5a3 3 0 0 0-3 3v5a3 3 0 0 0 6 0v-5a3 3 0 0 0-3-3z"
            fill={ativo ? 'rgba(251,246,236,0.25)' : VERDE_MIOLO}
          />
          <Path d="M6.5 11a5.5 5.5 0 0 0 11 0 M12 16.5V20" />
        </G>
      </Svg>
    </View>
  );
}

export const LADO_DO_MICROFONE = LADO;
