import React from 'react';
import { Text, View } from 'react-native';

import { fonts, radius, useTema } from '../../theme';
import { Sprout } from './Sprout';

/** InsightCard — o balão "Seu broto percebeu", trazendo um padrão notado no diário/desabafos. */
export function InsightCard({ text }: { text: string }) {
  const { colors, palette } = useTema();
  return (
    <View
      style={{
        flexDirection: 'row',
        gap: 12,
        /*
          Centralizado, e não alinhado pelo topo.

          O broto tem altura fixa e o texto tem uma, duas ou três linhas. Preso
          ao topo, um texto curto ficava encostado na borda de cima com o broto
          sobrando embaixo — o cartão parecia torto. Centralizado, o texto
          acompanha o broto em qualquer tamanho.
        */
        alignItems: 'center',
        backgroundColor: colors.primarySoft,
        borderRadius: radius.lg,
        padding: 16,
      }}
    >
      <Sprout mood="leve" stage={2} size={56} showPot={false} showBg={false} />
      <Text
        style={{
          flex: 1,
          fontFamily: fonts.body.regular,
          fontSize: 15,
          lineHeight: 15 * 1.5,
          color: palette.brown900,
        }}
      >
        {text}
      </Text>
    </View>
  );
}
