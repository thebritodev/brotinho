import React from 'react';
import { Pressable, Text, View } from 'react-native';

import { fonts, radius, useTema } from '../../theme';
import type { Lembranca } from '../../state/derived';
import { Icon } from '../core/Icon';

/**
 * Um registro antigo, trazido de volta.
 *
 * O app guardava meses de diário e nunca devolvia nada. Reler o que se
 * escreveu num momento difícil, já do outro lado dele, é a coisa mais forte
 * que um diário faz — e era a única coisa que o Brotinho tinha o dado para
 * fazer e não fazia.
 *
 * O tom evita nostalgia forçada: mostra o texto e a data, sem dizer se aquilo
 * foi bom ou ruim, e sem prometer que hoje está melhor. Quem lê é quem decide.
 */
export function MemoryCard({
  lembranca,
  onPress,
}: {
  lembranca: Lembranca;
  onPress: () => void;
}) {
  const { colors, palette, shadows } = useTema();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${lembranca.quando} você escreveu. Toque para ler.`}
      onPress={onPress}
      style={({ pressed }) => ({
        backgroundColor: colors.surface,
        borderRadius: radius.lg,
        padding: 16,
        gap: 8,
        opacity: pressed ? 0.9 : 1,
        ...shadows.sm,
      })}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <Icon name="book" size={16} color={colors.primaryStrong} />
        <Text
          style={{ fontFamily: fonts.body.extraBold, fontSize: 13, color: colors.primaryStrong }}
        >
          {lembranca.quando}, você escreveu
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
        {lembranca.texto}
      </Text>

      <Text style={{ fontFamily: fonts.body.bold, fontSize: 12, color: colors.textSecondary }}>
        Tocar para ler inteiro
      </Text>
    </Pressable>
  );
}
