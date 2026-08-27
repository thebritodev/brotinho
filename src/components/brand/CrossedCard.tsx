import React from 'react';
import { Text, View } from 'react-native';

import { colors, palette, radius, shadows, fonts } from '../../theme';
import type { Atravessado } from '../../state/derived';
import { Icon } from '../core/Icon';

/**
 * Um pensamento que a pessoa compostou e que não voltou desde então.
 *
 * O app já sabia dizer, na Composta, "esta é a terceira vez que isto volta". O
 * contrário — que é a notícia boa — ele tinha o dado para saber e nunca dizia.
 *
 * Este cartão é a promessa da Composta sendo verificada com o registro da
 * própria pessoa: aquilo que doía tanto a ponto de ela escrever e repetir em
 * voz alta não apareceu mais, nem numa composta, nem no diário.
 *
 * O tom é o mesmo do `MemoryCard`, e por decisão: nada de comemoração
 * exagerada, nada de "parabéns". Mostrar o que ela escreveu e há quanto tempo
 * já diz tudo — e quem lê é quem decide o que aquilo significa.
 *
 * Não é tocável de propósito. Reabrir aquele pensamento não é um convite que o
 * app deva fazer; se a pessoa quiser, ele está no histórico.
 */
export function CrossedCard({ atravessado }: { atravessado: Atravessado }) {
  return (
    <View
      accessible
      accessibilityLabel={`${atravessado.quando} você compostou: ${atravessado.texto}. Não voltou desde então.`}
      style={{
        backgroundColor: colors.surface,
        borderRadius: radius.lg,
        padding: 16,
        gap: 8,
        ...shadows.sm,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <Icon name="leaf" size={16} color={colors.primaryStrong} />
        <Text
          style={{ fontFamily: fonts.body.extraBold, fontSize: 13, color: colors.primaryStrong }}
        >
          {atravessado.quando}, você compostou
        </Text>
      </View>

      <Text
        numberOfLines={3}
        style={{
          fontFamily: fonts.body.regular,
          fontSize: 15,
          lineHeight: 15 * 1.5,
          color: palette.brown900,
        }}
      >
        {atravessado.texto}
      </Text>

      <Text
        style={{
          fontFamily: fonts.body.bold,
          fontSize: 12,
          lineHeight: 12 * 1.4,
          color: colors.textSecondary,
        }}
      >
        Não voltou desde então.
      </Text>
    </View>
  );
}
