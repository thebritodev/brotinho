import React, { useEffect, useState } from 'react';
import { Text, View } from 'react-native';

import { Button, Sprout } from '../../components';
import { colors, palette, radius, fonts } from '../../theme';

/**
 * Guia por etapas: conduz uma prática um passo por vez, com tempo próprio.
 * A pessoa pode adiantar — o tempo é sugestão, não prova.
 */

type Step = { label: string; text: string; seconds: number };

type Props = {
  steps: Step[];
  onDone: () => void;
  onCancel: () => void;
};

export function StepGuide({ steps, onDone, onCancel }: Props) {
  const [index, setIndex] = useState(0);
  const [left, setLeft] = useState(steps[0].seconds);

  const step = steps[index];
  const isLast = index === steps.length - 1;

  const avançar = () => {
    if (isLast) onDone();
    else setIndex((i) => i + 1);
  };

  useEffect(() => {
    setLeft(step.seconds);
    const id = setInterval(() => {
      setLeft((s) => {
        if (s > 1) return s - 1;
        clearInterval(id);
        avançar();
        return 0;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [index]);

  return (
    <View style={{ flex: 1, padding: 24, gap: 24 }}>
      {/* Trilha de progresso: um traço por etapa. */}
      <View style={{ flexDirection: 'row', gap: 6 }}>
        {steps.map((s, i) => (
          <View
            key={s.label}
            style={{
              flex: 1,
              height: 5,
              borderRadius: radius.pill,
              backgroundColor: i <= index ? colors.primary : palette.brown100,
            }}
          />
        ))}
      </View>

      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 22 }}>
        <Sprout mood="leve" stage={2} size={120} />

        <Text
          style={{
            fontFamily: fonts.display.bold,
            fontSize: 26,
            lineHeight: 26 * 1.25,
            textAlign: 'center',
            color: colors.textPrimary,
          }}
        >
          {step.label}
        </Text>

        <Text
          style={{
            fontFamily: fonts.body.regular,
            fontSize: 16,
            lineHeight: 16 * 1.5,
            textAlign: 'center',
            color: palette.brown700,
          }}
        >
          {step.text}
        </Text>

        <Text
          style={{
            fontFamily: fonts.display.bold,
            fontSize: 40,
            color: colors.primaryStrong,
          }}
        >
          {left}
        </Text>
      </View>

      <View style={{ gap: 10 }}>
        <Button variant="primary" style={{ width: '100%' }} onPress={avançar}>
          {isLast ? 'Concluir' : 'Já fiz, seguir'}
        </Button>
        <Button variant="ghost" style={{ width: '100%' }} onPress={onCancel}>
          Parar
        </Button>
      </View>
    </View>
  );
}
