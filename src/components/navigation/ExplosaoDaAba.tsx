import React, { useEffect, useRef } from 'react';
import { Animated, Easing, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { useMenosMovimento } from '../../hooks/useMenosMovimento';
import { palette } from '../../theme/tokens';

/**
 * A explosão de folhas que sai do ícone quando a pessoa troca de aba.
 *
 * ## Por que ela existe
 *
 * Porque trocar de aba é o gesto mais repetido do app e era o mais mudo. A
 * tela deslizava — e deslizar é a resposta do **destino**, não do toque. Entre
 * o dedo encostar e a tela nova chegar havia um vão em que nada dizia "eu te
 * ouvi", e num aparelho mais lento esse vão é o que faz alguém tocar de novo.
 *
 * As folhas saem de onde o dedo encostou. É o tipo de resposta que não informa
 * nada e serve para uma coisa só: dizer que o toque chegou.
 *
 * ## Por que folhas, e por que brilhos no Perfil
 *
 * As duas abas do personagem — o broto e o Início — soltam folha, que é do que
 * ele é feito. O Perfil não é dele, é da pessoa, e solta brilho. É a mesma
 * distinção que o documento faz, e ela importa menos pelo desenho e mais por
 * não fingir que as três abas são o mesmo lugar.
 *
 * ## Por que não existe a revelação em círculo do documento
 *
 * O documento abre a tela nova num círculo que cresce a partir do ícone. Para
 * isso é preciso recortar uma tela inteira num círculo, e `clip-path` não
 * existe no React Native — daria um `MaskedView`, que é dependência nova.
 *
 * Mas o motivo de verdade é outro: o app **já tem** uma gramática de troca de
 * tela, decidida e unificada depois de ter quatro ao mesmo tempo (ver
 * `regrasDaTroca`). Uma quinta, só nas abas, desfaria justamente o trabalho de
 * fazer todas as trocas parecerem a mesma coisa. A explosão não disputa com a
 * transição: ela é a resposta ao toque, e acontece **em cima** dela.
 */

/** A folha da marca, a mesma do broto. */
const FOLHA = 'M0 0 C -6 -14 -18 -26 -32 -24 C -42 -22 -44 -6 -34 4 C -22 16 -8 12 0 0 Z';

/** O brilho de quatro pontas. */
const BRILHO = 'M0 -9 L2.2 -2.2 L9 0 L2.2 2.2 L0 9 L-2.2 2.2 L-9 0 L-2.2 -2.2 Z';

/** Quantos pedaços voam, e quanto dura o voo. */
const QUANTOS = 9;
const VOO_MS = 1000;

/** O arco que elas percorrem: de -175° a -5°, ou seja, para cima. */
const DE = -Math.PI * 0.97;
const ATE = -Math.PI * 0.03;

/** Quão longe vão — três distâncias, para não saírem todas juntas. */
const DISTANCIAS = [78, 108, 138];

export type TipoDaExplosao = 'folha' | 'brilho';

export type Explosao = {
  /** Muda a cada toque; é o que faz a animação recomeçar. */
  id: number;
  /** Onde o dedo encostou, em pixels da tela. */
  x: number;
  y: number;
  tipo: TipoDaExplosao;
};

export function ExplosaoDaAba({ explosao }: { explosao: Explosao | null }) {
  const menosMovimento = useMenosMovimento();
  if (!explosao || menosMovimento) return null;

  return (
    <View
      /*
        Sem toque, e por cima de tudo: ela acontece durante a troca de tela, e
        não pode nem receber um toque nem ficar atrás da tela que está
        entrando.
      */
      pointerEvents="none"
      style={{ position: 'absolute', left: 0, top: 0, right: 0, bottom: 0, zIndex: 5 }}
    >
      {Array.from({ length: QUANTOS }, (_, i) => (
        <Pedaco key={`${explosao.id}-${i}`} explosao={explosao} indice={i} />
      ))}
    </View>
  );
}

function Pedaco({ explosao, indice }: { explosao: Explosao; indice: number }) {
  const passo = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    passo.setValue(0);
    const a = Animated.timing(passo, {
      toValue: 1,
      duration: VOO_MS + (indice % 3) * 150,
      delay: indice * 25,
      easing: Easing.bezier(0.2, 0.8, 0.3, 1),
      useNativeDriver: true,
      /* Decorativa: não pode segurar a fila do `InteractionManager`. */
      isInteraction: false,
    });
    a.start();
    return () => a.stop();
  }, [explosao.id, indice]);

  const angulo = DE + (ATE - DE) * (indice / (QUANTOS - 1));
  const distancia = DISTANCIAS[indice % DISTANCIAS.length];
  const dx = Math.cos(angulo) * distancia;
  /*
    Trinta pontos a mais para cima no fim.

    Sem isso as folhas descrevem um semicírculo perfeito e o conjunto lê como
    um leque mecânico. Com a subida extra, as que saem para os lados ainda
    sobem um pouco no fim — que é o que folha solta no ar faz.
  */
  const dy = Math.sin(angulo) * distancia - 30;

  const folha = explosao.tipo === 'folha';
  const cor = folha
    ? [palette.green500, palette.green300, palette.green700][indice % 3]
    : [palette.terracotta400, palette.amber400, palette.green500][indice % 3];
  const lado = folha ? 20 : 15;

  return (
    <Animated.View
      style={{
        position: 'absolute',
        left: explosao.x - lado / 2,
        top: explosao.y - lado / 2,
        width: lado,
        height: lado,
        opacity: passo.interpolate({ inputRange: [0, 0.15, 1], outputRange: [0, 1, 0] }),
        transform: [
          { translateX: passo.interpolate({ inputRange: [0, 1], outputRange: [0, dx] }) },
          { translateY: passo.interpolate({ inputRange: [0, 1], outputRange: [0, dy] }) },
          {
            rotate: passo.interpolate({
              inputRange: [0, 1],
              outputRange: ['0deg', `${(indice % 2 ? 1 : -1) * (120 + indice * 25)}deg`],
            }),
          },
        ],
      }}
    >
      <Svg
        width={lado}
        height={lado}
        /*
          Quadrado nos dois casos. A folha ocupa 44 por 42 na caixa dela, e
          numa `viewBox` de 50 por 48 ela sai esticada na horizontal dentro de
          um quadrado de 20 — pequena assim, o esticado le como borrao.
        */
        viewBox={folha ? '-47 -29 52 52' : '-9 -9 18 18'}
      >
        <Path d={folha ? FOLHA : BRILHO} fill={cor} />
      </Svg>
    </Animated.View>
  );
}
