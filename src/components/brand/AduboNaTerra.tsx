import React, { useMemo } from 'react';
import { Animated, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { palette } from '../../theme/tokens';
import {
  GRAOS_POR_PALAVRA,
  curvaDoEvento,
  pontosDoCaminho,
  type AduboDaPalavra,
} from './aduboDaComposta';
import { sorteio } from './quedaDosFarelos';
import type { Pontos } from './planoDaQueda';
import { BRASA, TERRA_CLARA } from './terraDoCanteiro';

/**
 * Os grãos de adubo e a seiva, desenhados por cima da terra e por baixo do
 * texto da faixa.
 *
 * Cada palavra que pousa abre um anel na terra e solta um punhado de grãos,
 * que afunda até a raiz mais próxima; dali um pulso dourado sobe até o pé do
 * broto. Tudo lê o relógio das palavras (`tempo`), no driver nativo. As
 * contas — onde pousa, quando, por onde a seiva passa — estão em
 * `aduboDaComposta`, com teste.
 *
 * ## Três peças por palavra, e não onze
 *
 * A primeira versão tinha cada grão numa peça própria, mais três pontos de
 * seiva: onze peças animadas por palavra. O relógio anda a cada quadro, e
 * **toda** peça ligada a ele é redesenhada a cada quadro — inclusive as
 * paradas, esperando a vez delas.
 *
 * Agora os grãos de uma palavra são um punhado só, desenhado de uma vez, que
 * espirra, afunda e se abre junto; a seiva é uma cabeça com halo; e o anel.
 * Três peças, e o punhado ainda lê como grãos soltos, porque cada um está num
 * lugar diferente dentro dele.
 */

/** A opacidade do punhado: aparece rápido, afunda, e some antes de chegar. */
const PUNHADO: Pontos = [
  [0, 0],
  [0.12, 1],
  [0.7, 0.85],
  [1, 0],
];

/** O punhado espirra (cresce), afunda inteiro e vai se fechando. */
const PUNHADO_ESCALA: Pontos = [
  [0, 0.35],
  [0.2, 1.25],
  [0.6, 1],
  [1, 0.55],
];

/** Até onde os grãos vão do centro do punhado, em pontos. */
const PUNHADO_RAIO = 11;

/**
 * O anel do pouso: abre no ponto onde a palavra tocou a terra e some.
 *
 * É o que faz o instante se ler — sem ele, os grãos eram só uns pontinhos
 * aparecendo, e ninguém ligava aquilo à palavra que acabou de cair.
 */
const ANEL: Pontos = [
  [0, 0],
  [0.1, 0.55],
  [1, 0],
];
const ANEL_ESCALA: Pontos = [
  [0, 0.3],
  [1, 1.5],
];
const ANEL_RAIO = 14;

/** A seiva acende, anda acesa e apaga ao chegar no pé. */
const SEIVA: Pontos = [
  [0, 0],
  [0.1, 1],
  [0.86, 1],
  [1, 0],
];

/**
 * A cabeça da seiva e o halo dela.
 *
 * O halo é pequeno de propósito: o caminho passa por trás do título e do
 * texto da ferramenta, e um halo largo clareava o fundo das letras.
 */
const SEIVA_RAIO = 4.2;
const SEIVA_HALO = 8.5;
const SEIVA_COR = palette.yellow300;
const SEIVA_MIOLO = '#FFF6D6';

type Props = {
  tempo: Animated.Value;
  adubo: AduboDaPalavra[];
  /** Onde a terra começa, na faixa: tudo do adubo é medido a partir daí. */
  topoDaTerra: number;
};

export function AduboNaTerra({ tempo, adubo, topoDaTerra }: Props) {
  /*
    As interpolações são feitas uma vez por plano, e não a cada desenho:
    refazê-las a cada render da faixa trocaria o nó no meio da animação.
  */
  const pecas = useMemo(
    () =>
      adubo.map((a, i) => {
        const acaso = sorteio(1013 + i * 97);
        const entre = (de: number, ate: number) => de + (ate - de) * acaso();
        const alvo = a.caminho[0];

        /* Os grãos, parados dentro do punhado: cada um num lugar e num tom. */
        const graos = Array.from({ length: GRAOS_POR_PALAVRA }, (_, k) => {
          const angulo = entre(0, Math.PI * 2);
          const longe = entre(2, PUNHADO_RAIO - 2.5);
          return {
            x: PUNHADO_RAIO + Math.cos(angulo) * longe,
            y: PUNHADO_RAIO + Math.sin(angulo) * longe * 0.75,
            r: entre(1.4, 2.6),
            cor: k % 2 ? BRASA : TERRA_CLARA,
          };
        });

        /*
          O caminho do punhado: um espirro para cima, depois afunda, e só
          então vai de lado até a raiz.
        */
        const de = a.pouso;
        const meio = { x: de.x + (alvo.x - de.x) * 0.3, y: de.y + (alvo.y - de.y) * 0.62 };
        const g = a.graos;
        const punhado = {
          graos,
          x: tempo.interpolate(
            curvaDoEvento(g.comeco, g.duracao, [[0, de.x], [0.2, de.x], [0.55, meio.x], [1, alvo.x]]),
          ),
          y: tempo.interpolate(
            curvaDoEvento(g.comeco, g.duracao, [[0, de.y], [0.2, de.y - 9], [0.55, meio.y], [1, alvo.y]]),
          ),
          escala: tempo.interpolate(curvaDoEvento(g.comeco, g.duracao, PUNHADO_ESCALA)),
          opacidade: tempo.interpolate(curvaDoEvento(g.comeco, g.duracao, PUNHADO)),
        };

        const escalaDoAnel = tempo.interpolate(curvaDoEvento(g.comeco, g.duracao * 0.7, ANEL_ESCALA));
        const anel = {
          x: de.x,
          y: de.y,
          opacidade: tempo.interpolate(curvaDoEvento(g.comeco, g.duracao * 0.7, ANEL)),
          escala: escalaDoAnel,
          /* Achatado: um anel deitado na terra, e não uma bolha de pé. */
          escalaY: Animated.multiply(escalaDoAnel, 0.45),
        };

        const s = a.seiva;
        const seiva = {
          x: tempo.interpolate(curvaDoEvento(s.comeco, s.duracao, pontosDoCaminho(a.caminho, 'x', 0.04, 0.96))),
          y: tempo.interpolate(curvaDoEvento(s.comeco, s.duracao, pontosDoCaminho(a.caminho, 'y', 0.04, 0.96))),
          opacidade: tempo.interpolate(curvaDoEvento(s.comeco, s.duracao, SEIVA)),
        };

        return { chave: `adubo-${i}`, punhado, anel, seiva };
      }),
    [adubo, tempo],
  );

  return (
    <View
      pointerEvents="none"
      style={{ position: 'absolute', left: 0, right: 0, top: topoDaTerra, bottom: 0 }}
    >
      {pecas.map(({ chave, punhado, anel, seiva }) => (
        <React.Fragment key={chave}>
          <Animated.View
            style={{
              position: 'absolute',
              left: anel.x - ANEL_RAIO,
              top: anel.y - ANEL_RAIO,
              width: ANEL_RAIO * 2,
              height: ANEL_RAIO * 2,
              borderRadius: ANEL_RAIO,
              borderWidth: 2,
              borderColor: BRASA,
              opacity: anel.opacidade,
              transform: [{ scaleX: anel.escala }, { scaleY: anel.escalaY }],
            }}
          />

          <Animated.View
            style={{
              position: 'absolute',
              left: -PUNHADO_RAIO,
              top: -PUNHADO_RAIO,
              width: PUNHADO_RAIO * 2,
              height: PUNHADO_RAIO * 2,
              opacity: punhado.opacidade,
              transform: [
                { translateX: punhado.x },
                { translateY: punhado.y },
                { scale: punhado.escala },
              ],
            }}
          >
            <Svg width={PUNHADO_RAIO * 2} height={PUNHADO_RAIO * 2}>
              {punhado.graos.map((g, k) => (
                <Circle key={k} cx={g.x} cy={g.y} r={g.r} fill={g.cor} />
              ))}
            </Svg>
          </Animated.View>

          <Animated.View
            style={{
              position: 'absolute',
              left: -SEIVA_HALO,
              top: -SEIVA_HALO,
              width: SEIVA_HALO * 2,
              height: SEIVA_HALO * 2,
              alignItems: 'center',
              justifyContent: 'center',
              opacity: seiva.opacidade,
              transform: [{ translateX: seiva.x }, { translateY: seiva.y }],
            }}
          >
            <View
              style={{
                position: 'absolute',
                width: SEIVA_HALO * 2,
                height: SEIVA_HALO * 2,
                borderRadius: SEIVA_HALO,
                backgroundColor: SEIVA_COR,
                opacity: 0.26,
              }}
            />
            <View
              style={{
                width: SEIVA_RAIO * 2,
                height: SEIVA_RAIO * 2,
                borderRadius: SEIVA_RAIO,
                backgroundColor: SEIVA_MIOLO,
                borderWidth: 1.2,
                borderColor: SEIVA_COR,
              }}
            />
          </Animated.View>
        </React.Fragment>
      ))}
    </View>
  );
}
