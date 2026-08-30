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

/** Altura de cada número no carretel. Também é o passo do arrasto. */
const ITEM_HEIGHT = Math.round(44 * ESCALA_DA_FONTE);

/**
 * Quantos números aparecem acima e abaixo do escolhido.
 *
 * Era 2, e os cinco números faziam a tela de sono precisar de rolagem num
 * aparelho de 740px. Com um vizinho de cada lado ainda se lê como carretel,
 * e sobram 88px.
 */
const VISIBLE_SIDES = 1;

const REEL_HEIGHT = ITEM_HEIGHT * (VISIBLE_SIDES * 2 + 1);

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
            return (
              <View
                key={distancia}
                style={{ height: ITEM_HEIGHT, alignItems: 'center', justifyContent: 'center' }}
              >
                <Text
                  maxFontSizeMultiplier={1.6}
                  style={{
                    fontFamily: fonts.display.bold,
                    fontSize: centro ? 40 : 19,
                    color: centro ? colors.textPrimary : palette.brown200,
                  }}
                >
                  {texto}
                </Text>
              </View>
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
          pointerEvents="none"
          style={{
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
        <Text
          maxFontSizeMultiplier={1.6}
          style={{ fontFamily: fonts.display.bold, fontSize: 34, color: palette.brown200 }}
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
