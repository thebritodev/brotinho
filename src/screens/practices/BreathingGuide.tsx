import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Text, View } from 'react-native';

import { Button } from '../../components';
import type { BreathingPhase } from '../../data/practices';
import { colors, palette, fonts } from '../../theme';

/**
 * Marcador de ritmo da respiração: um círculo que infla, mantém e esvazia
 * junto com a pessoa. O texto diz o que fazer; o tamanho diz por quanto tempo.
 */

const SMALL = 0.55;
const LARGE = 1;

type Props = {
  phases: BreathingPhase[];
  cycles: number;
  onDone: () => void;
  onCancel: () => void;
};

export function BreathingGuide({ phases, cycles, onDone, onCancel }: Props) {
  const [index, setIndex] = useState(0);
  const [cycle, setCycle] = useState(1);
  const [left, setLeft] = useState(phases[0].seconds);

  const scale = useRef(new Animated.Value(SMALL)).current;
  const phase = phases[index];

  // Anima o círculo para o tamanho que corresponde à fase atual.
  useEffect(() => {
    const target = phase.motion === 'in' ? LARGE : phase.motion === 'out' ? SMALL : null;
    if (target === null) return; // "segure" mantém o tamanho de propósito

    Animated.timing(scale, {
      toValue: target,
      duration: phase.seconds * 1000,
      easing: Easing.inOut(Easing.quad),
      useNativeDriver: true,
    }).start();
  }, [index]);

  // Conta regressiva da fase e avanço para a próxima.
  useEffect(() => {
    setLeft(phase.seconds);

    const id = setInterval(() => {
      setLeft((s) => {
        if (s > 1) return s - 1;

        const próximo = index + 1;
        if (próximo < phases.length) {
          setIndex(próximo);
        } else if (cycle < cycles) {
          setCycle((c) => c + 1);
          setIndex(0);
        } else {
          clearInterval(id);
          onDone();
        }
        return s;
      });
    }, 1000);

    return () => clearInterval(id);
  }, [index, cycle]);

  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 28, padding: 24 }}>
      <Text style={{ fontFamily: fonts.body.bold, fontSize: 13, color: colors.textSecondary }}>
        Ciclo {cycle} de {cycles}
      </Text>

      <View style={{ width: 240, height: 240, alignItems: 'center', justifyContent: 'center' }}>
        {/* Contorno fixo: mostra até onde o ar vai. */}
        <View
          style={{
            position: 'absolute',
            width: 220,
            height: 220,
            borderRadius: 110,
            borderWidth: 2,
            borderColor: palette.green100,
          }}
        />
        <Animated.View
          style={{
            width: 220,
            height: 220,
            borderRadius: 110,
            backgroundColor: palette.green100,
            alignItems: 'center',
            justifyContent: 'center',
            transform: [{ scale }],
          }}
        >
          <Text
            style={{
              fontFamily: fonts.display.bold,
              fontSize: 54,
              color: colors.primaryStrong,
            }}
          >
            {left}
          </Text>
        </Animated.View>
      </View>

      <Text
        style={{
          fontFamily: fonts.display.bold,
          fontSize: 24,
          color: colors.textPrimary,
          textAlign: 'center',
        }}
      >
        {phase.label}
      </Text>

      <Button variant="ghost" style={{ width: '100%' }} onPress={onCancel}>
        Parar
      </Button>
    </View>
  );
}
