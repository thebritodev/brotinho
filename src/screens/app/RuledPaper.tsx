import React from 'react';
import { View } from 'react-native';

import { borderWidth, radius, useTema } from '../../theme';

/** Altura de cada linha do papel pautado. */
export const LINE_HEIGHT = 35;
const LINE_COUNT = 14;
const TOP_PADDING = 6;

/**
 * Folha de caderno: pauta horizontal, margem vermelha e cantos arredondados.
 * Serve tanto para a folha que está sendo escrita quanto para a folha de baixo,
 * que aparece durante a animação de virar a página.
 */
export function RuledPaper({
  children,
  style,
}: {
  children?: React.ReactNode;
  style?: React.ComponentProps<typeof View>['style'];
}) {
  const { palette, shadows } = useTema();
  return (
    <View
      style={[
        {
          backgroundColor: palette.cream100,
          borderRadius: radius.lg,
          borderWidth,
          borderColor: palette.brown200,
          paddingVertical: TOP_PADDING,
          paddingLeft: 44,
          minHeight: 260,
          overflow: 'hidden',
          ...shadows.sm,
        },
        style,
      ]}
    >
      {Array.from({ length: LINE_COUNT }).map((_, i) => (
        <View
          key={i}
          pointerEvents="none"
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: TOP_PADDING + (i + 1) * LINE_HEIGHT,
            height: 1,
            backgroundColor: palette.brown200,
          }}
        />
      ))}
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          top: 0,
          bottom: 0,
          left: 30,
          width: 1.5,
          backgroundColor: palette.terracotta100,
        }}
      />
      {children}
    </View>
  );
}
