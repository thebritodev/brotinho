import React, { useEffect, useRef } from 'react';
import { AccessibilityInfo, Animated, Easing, Pressable, Text } from 'react-native';

import { colors, palette, radius, shadows, fonts } from '../../theme';
import type { SproutStage } from './Sprout';
import { AnimatedSprout } from './AnimatedSprout';
import { Button } from '../core/Button';

/**
 * O aviso de que o broto cresceu.
 *
 * O tom aqui importa: o app promete que "não cobra, não pontua". Então isto
 * marca o momento e sai — nada de troféu, nível ou pontuação.
 */
const TEXTOS: Record<Exclude<SproutStage, 1>, { titulo: string; corpo: (dias: number) => string }> = {
  2: {
    titulo: 'Seu broto criou folhas',
    corpo: (d) => `${d} dias em que você apareceu. Ele foi crescendo junto, sem você precisar fazer nada além disso.`,
  },
  3: {
    titulo: 'Seu broto está firme',
    corpo: (d) => `${d} dias cuidados. Repare no caule: ele não estava assim quando você começou.`,
  },
};

type Props = {
  stage: SproutStage;
  days: number;
  onClose: () => void;
};

export function GrowthNotice({ stage, days, onClose }: Props) {
  const entrada = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    void AccessibilityInfo.isReduceMotionEnabled().then((menosMovimento) => {
      if (menosMovimento) return entrada.setValue(1);
      Animated.timing(entrada, {
        toValue: 1,
        duration: 420,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    });
  }, []);

  const texto = TEXTOS[stage === 3 ? 3 : 2];

  return (
    <Animated.View
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 28,
        backgroundColor: 'rgba(58, 54, 48, 0.4)',
        opacity: entrada,
      }}
    >
      {/* Fechar tocando fora, como em qualquer folha solta na tela. */}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Fechar"
        onPress={onClose}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
      />

      <Animated.View
        style={{
          width: '100%',
          alignItems: 'center',
          gap: 14,
          backgroundColor: colors.surface,
          borderRadius: radius.lg,
          paddingVertical: 28,
          paddingHorizontal: 24,
          ...shadows.lg,
          transform: [
            { translateY: entrada.interpolate({ inputRange: [0, 1], outputRange: [24, 0] }) },
            { scale: entrada.interpolate({ inputRange: [0, 1], outputRange: [0.92, 1] }) },
          ],
        }}
      >
        <AnimatedSprout mood="feliz" stage={stage} size={150} swayOnMount />

        <Text
          style={{ fontFamily: fonts.display.bold, fontSize: 22, textAlign: 'center' }}
        >
          {texto.titulo}
        </Text>
        <Text
          style={{
            fontFamily: fonts.body.regular,
            fontSize: 15,
            lineHeight: 15 * 1.55,
            color: palette.brown700,
            textAlign: 'center',
          }}
        >
          {texto.corpo(days)}
        </Text>

        <Button onPress={onClose} style={{ marginTop: 4 }}>
          Que bom
        </Button>
      </Animated.View>
    </Animated.View>
  );
}
