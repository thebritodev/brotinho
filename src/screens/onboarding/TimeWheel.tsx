import React, { useMemo, useRef } from 'react';
import { Animated, Easing, PanResponder, PixelRatio, Text, View } from 'react-native';

import { Icon, type IconName } from '../../components';
import { fonts, radius, useTema } from '../../theme';
import { MIN_STEP, pad } from '../../data/onboarding';

/**
 * O carretel é geometria travada em pixels: a altura da linha é o passo do
 * arrasto. Com a fonte grande do sistema, um número de 40px viraria 52 dentro
 * de uma linha de 44 e seria cortado — então a linha cresce junto.
 *
 * Lido uma vez, no carregamento do módulo: mudar a fonte do sistema reinicia
 * o app de qualquer forma.
 */
const ESCALA_DA_FONTE = Math.min(PixelRatio.getFontScale(), 1.6);

/**
 * Altura de cada número no carretel, **em sp** — ou seja, antes da escala.
 *
 * É este número que vai para o `lineHeight`, e só ele. O React Native
 * multiplica `fontSize` e `lineHeight` pela escala da fonte do sistema por
 * conta própria; entregar um valor já multiplicado faz a escala ser aplicada
 * duas vezes. É o mesmo erro que desalinhou o diário das pautas do papel.
 */
const ALTURA_EM_SP = 44;

/** Altura de cada número no carretel, em pixels. Também é o passo do arrasto. */
const ITEM_HEIGHT = Math.round(ALTURA_EM_SP * ESCALA_DA_FONTE);

/**
 * Quantos números aparecem acima e abaixo do escolhido.
 *
 * Era 2, e os cinco números faziam a tela de sono precisar de rolagem num
 * aparelho de 740px. Com um vizinho de cada lado ainda se lê como carretel,
 * e sobram 88px.
 */
const VISIBLE_SIDES = 1;

const REEL_HEIGHT = ITEM_HEIGHT * (VISIBLE_SIDES * 2 + 1);

/**
 * Altura natural da linha na Baloo 2, em frações do corpo: 1078 acima da base
 * e 524 abaixo, num quadrado de 1000.
 *
 * O número do centro tem 40 de corpo e morava numa caixa de linha de 44 — um
 * terço menor que a da própria fonte. Cada plataforma espreme essa diferença
 * de um jeito (o Android tira metade de cima e metade de baixo; o iOS tem regra
 * própria), e a sobra que protege o alto dos algarismos fica dependendo disso.
 * Nenhuma caixa aqui é menor que a da fonte, e o problema deixa de existir.
 *
 * A posição do número não muda: com a entrelinha dividida ao meio, o centro da
 * tinta fica no mesmo lugar em relação ao centro da caixa, qualquer que seja a
 * altura dela. A caixa só passa a sobrar para fora da fileira, o que é
 * inofensivo — o que corta é o carretel, e o número do centro está no meio.
 */
const LINHA_NATURAL = 1.602;

/** Caixa de linha para um corpo: nunca menor que a da fonte, nem que a fileira. */
const caixaDaLinha = (corpo: number) => Math.max(ALTURA_EM_SP, Math.ceil(corpo * LINHA_NATURAL));

type Props = {
  /** Horário no formato "HH:MM". */
  value: string;
  onChange: (next: string) => void;
  /** A roda nasceu para a hora de dormir; o lembrete usa outro símbolo. */
  icon?: IconName;
};

/** TimeWheel — arraste o dedo sobre a hora ou os minutos para ajustar. */
export function TimeWheel({ value, onChange, icon = 'moon' }: Props) {
  const { colors, palette, shadows } = useTema();
  const [h, m] = value.split(':').map(Number);

  const estado = useRef({ h, m, onChange });
  estado.current = { h, m, onChange };

  /** Horário no instante em que o dedo encostou. */
  const inicio = useRef({ h, m });

  /**
   * Deslocamento entre dois números, em pixels. É o que faz o carretel rolar
   * junto com o dedo em vez de pular de valor em valor.
   */
  const restoHora = useRef(new Animated.Value(0)).current;
  const restoMinuto = useRef(new Animated.Value(0)).current;

  const criarResponder = (unidade: 'h' | 'm', resto: Animated.Value) =>
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_e, g) => Math.abs(g.dy) > 2,
      onPanResponderTerminationRequest: () => false,

      onPanResponderGrant: () => {
        inicio.current = { h: estado.current.h, m: estado.current.m };
        resto.setValue(0);
      },

      onPanResponderMove: (_e, g) => {
        const passos = Math.round(-g.dy / ITEM_HEIGHT);
        // O que sobra depois dos passos inteiros é o quanto o carretel desliza.
        resto.setValue(-g.dy - passos * ITEM_HEIGHT);

        const { h: h0, m: m0 } = inicio.current;
        const nh = unidade === 'h' ? (((h0 + passos) % 24) + 24) % 24 : h0;
        const nm =
          unidade === 'm' ? (((m0 + passos * MIN_STEP) % 60) + 60) % 60 : m0;
        estado.current.onChange(`${pad(nh)}:${pad(nm)}`);
      },

      onPanResponderRelease: () => {
        // Encaixa o número escolhido no centro.
        Animated.timing(resto, {
          toValue: 0,
          duration: 180,
          easing: Easing.out(Easing.cubic),
          // Driver de JS: o arrasto chama `setValue` neste mesmo valor, e um nó
          // movido para o lado nativo passa a ignorar chamadas vindas do JS.
          useNativeDriver: false,
        }).start();
      },

      onPanResponderTerminate: () => resto.setValue(0),
    });

  const responderHora = useMemo(() => criarResponder('h', restoHora), []);
  const responderMinuto = useMemo(() => criarResponder('m', restoMinuto), []);

  /** Monta a coluna com os números vizinhos, deslocada pelo resto do arrasto. */
  const coluna = (
    atual: number,
    passo: number,
    total: number,
    resto: Animated.Value,
    responder: ReturnType<typeof PanResponder.create>,
  ) => {
    const numeros = Array.from({ length: VISIBLE_SIDES * 2 + 1 }).map((_, i) => {
      const distancia = i - VISIBLE_SIDES;
      const valor = (((atual + distancia * passo) % total) + total) % total;
      return { distancia, texto: pad(valor) };
    });

    return (
      <View
        {...responder.panHandlers}
        style={{ flex: 1, height: REEL_HEIGHT, overflow: 'hidden' }}
      >
        <Animated.View style={{ transform: [{ translateY: Animated.multiply(resto, -1) }] }}>
          {numeros.map(({ distancia, texto }) => {
            const centro = distancia === 0;
            const corpo = centro ? 40 : 19;
            /*
              O vizinho some ao chegar na borda, em vez de ser fatiado por ela.

              Durante o arrasto o carretel desliza até meia fileira, e o número
              da ponta ficava pela metade, cortado a seco pela borda. Aqui ele
              está inteiro em repouso (a uma fileira do centro) e já invisível
              quando chega a fileira e meia — o ponto em que a borda o partiria.

              Em unidades de `resto`: o número fica a `distancia × fileira −
              resto` do centro.
            */
            const opacidade = centro
              ? 1
              : resto.interpolate({
                  inputRange: [
                    (distancia - 1.5) * ITEM_HEIGHT,
                    (distancia - 1) * ITEM_HEIGHT,
                    (distancia + 1) * ITEM_HEIGHT,
                    (distancia + 1.5) * ITEM_HEIGHT,
                  ],
                  outputRange: [0, 1, 1, 0],
                  extrapolate: 'clamp',
                });
            return (
              <Animated.View
                key={distancia}
                style={{
                  height: ITEM_HEIGHT,
                  alignItems: 'center',
                  justifyContent: 'center',
                  opacity: opacidade,
                }}
              >
                <Text
                  maxFontSizeMultiplier={1.6}
                  style={{
                    fontFamily: fonts.display.bold,
                    fontSize: corpo,
                    /*
                      O número não estava no meio da faixa verde, e a culpa era
                      da caixa de linha, não da faixa.

                      Sem `lineHeight`, a caixa vem da fonte: ela reserva
                      espaço para a descida das letras — o rabo do "p", do "g"
                      —, e dígito nenhum tem descida. Os algarismos ficam
                      encostados no alto da própria caixa, e a caixa é centrada,
                      não eles. Numa escala de fonte menor que 1 a linha encolhe
                      mais que o texto e a folga sobra toda embaixo, que é
                      quando o desencontro fica visível.

                      Dando a caixa de linha explicitamente, e com a entrelinha
                      dividida ao meio, os algarismos ficam centrados nela — e
                      ela, na fileira. Em sp, não em pixels: o valor em pixels
                      já foi multiplicado pela escala uma vez. A altura vem de
                      `caixaDaLinha`, que explica por que nunca é menor que a
                      da fonte.

                      `includeFontPadding` tira a folga extra que o Android
                      acrescenta por fora da caixa, e que reintroduziria o
                      mesmo deslocamento por outro caminho.
                    */
                    lineHeight: caixaDaLinha(corpo),
                    includeFontPadding: false,
                    textAlignVertical: 'center',
                    color: centro ? colors.textPrimary : palette.brown200,
                  }}
                >
                  {texto}
                </Text>
              </Animated.View>
            );
          })}
        </Animated.View>
      </View>
    );
  };

  return (
    <View
      style={{
        backgroundColor: colors.surface,
        borderRadius: radius.lg,
        paddingTop: 16,
        paddingBottom: 14,
        paddingHorizontal: 18,
        alignItems: 'center',
        gap: 12,
        ...shadows.sm,
      }}
    >
      <Icon name={icon} size={26} color={palette.lavender300} />

      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 4,
          width: '100%',
          height: REEL_HEIGHT,
        }}
      >
        {/* Faixa de destaque atrás do número escolhido. */}
        <View
          style={{
            pointerEvents: 'none',
            position: 'absolute',
            left: 0,
            right: 0,
            top: (REEL_HEIGHT - ITEM_HEIGHT) / 2,
            height: ITEM_HEIGHT,
            borderRadius: radius.md,
            backgroundColor: colors.primarySoft,
            opacity: 0.5,
          }}
        />

        {coluna(h, 1, 24, restoHora, responderHora)}
        {/* Os dois-pontos seguem a mesma caixa de linha dos números: sem isso
            eles ficariam centrados por outra régua e sairiam do eixo junto. */}
        <Text
          maxFontSizeMultiplier={1.6}
          style={{
            fontFamily: fonts.display.bold,
            fontSize: 34,
            lineHeight: caixaDaLinha(34),
            includeFontPadding: false,
            textAlignVertical: 'center',
            color: palette.brown200,
          }}
        >
          :
        </Text>
        {coluna(m, MIN_STEP, 60, restoMinuto, responderMinuto)}
      </View>

      <Text
        style={{
          fontFamily: fonts.body.regular,
          fontSize: 13,
          color: colors.textSecondary,
          textAlign: 'center',
        }}
      >
        Deslize sobre a hora ou os minutos
      </Text>
    </View>
  );
}
