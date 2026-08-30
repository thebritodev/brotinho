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
        alignItems: 'flex-start',
        backgroundColor: colors.primarySoft,
        borderRadius: radius.lg,
        padding: 16,
      }}
    >
      <Sprout mood="leve" stage={2} size={44} showPot={false} showBg={false} />
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
