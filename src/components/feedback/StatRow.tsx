import React from 'react';
import { Text, View } from 'react-native';

import { radius, fonts, useTema } from '../../theme';
import { CountUp } from './CountUp';

export type Stat = { value: number | string; label: string };

/** Três cartões estreitos lado a lado; o número grande é o que aperta. */
const LIMITE_DE_FONTE = 1.4;

/** StatRow — trio de estatísticas de crescimento: dias cuidados, valores vividos, padrões. */
export function StatRow({ stats }: { stats: Stat[] }) {
  const { colors, shadows } = useTema();
  // O estilo estava no topo do arquivo, calculado uma vez; aqui dentro ele
  // acompanha o tema.
  const numeroStyle = {
    fontFamily: fonts.display.bold,
    fontSize: 26,
    color: colors.primaryStrong,
  } as const;
  return (
    <View style={{ flexDirection: 'row', gap: 10 }}>
      {stats.map((s, i) => (
        <View
          key={i}
          style={{
            flex: 1,
            backgroundColor: colors.surface,
            borderRadius: radius.lg,
            paddingVertical: 16,
            paddingHorizontal: 10,
            alignItems: 'center',
            ...shadows.sm,
          }}
        >
          {typeof s.value === 'number' ? (
            <CountUp value={s.value} style={numeroStyle} maxFontSizeMultiplier={LIMITE_DE_FONTE} />
          ) : (
            <Text maxFontSizeMultiplier={LIMITE_DE_FONTE} style={numeroStyle}>
              {s.value}
            </Text>
          )}
          <Text
            maxFontSizeMultiplier={LIMITE_DE_FONTE}
            style={{
              fontFamily: fonts.body.bold,
              fontSize: 12,
              color: colors.textSecondary,
              marginTop: 4,
              textAlign: 'center',
            }}
          >
            {s.label}
          </Text>
        </View>
      ))}
    </View>
  );
}
