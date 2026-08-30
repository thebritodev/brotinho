import React from 'react';
import { Text, View } from 'react-native';

import { ROTULO_DO_VALOR, type ValueKey } from '../../data/valores';
import { radius, fonts, useTema, type Palette } from '../../theme';
import { Icon, type IconName } from '../core/Icon';

export type { ValueKey };

/**
 * A tabela guarda o **nome** da cor, não a cor.
 *
 * `tint: palette.blue100` seria resolvido na carga do módulo e congelaria no
 * tema de abertura. Guardando a chave, quem desenha faz `palette[v.tint]` e
 * recebe o azul do tema em uso — e o tipo garante que a chave exista.
 */
export const VALUES: Record<ValueKey, { label: string; icon: IconName; tint: keyof Palette }> = {
  criatividade: { label: ROTULO_DO_VALOR.criatividade, icon: 'flower', tint: 'terracotta100' },
  conexao: { label: ROTULO_DO_VALOR.conexao, icon: 'heart', tint: 'blue100' },
  coragem: { label: ROTULO_DO_VALOR.coragem, icon: 'leaf', tint: 'green100' },
  autocuidado: { label: ROTULO_DO_VALOR.autocuidado, icon: 'droplet', tint: 'yellow100' },
  curiosidade: { label: ROTULO_DO_VALOR.curiosidade, icon: 'sparkle', tint: 'lavender100' },
};

/** ValueBadge — chip com ícone + rótulo de um valor pessoal vivido na semana. */
export function ValueBadge({ value, count }: { value: ValueKey; count?: number }) {
  const { palette } = useTema();
  const v = VALUES[value];
  if (!v) return null;

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        backgroundColor: palette[v.tint],
        borderRadius: radius.md,
        paddingVertical: 10,
        paddingHorizontal: 14,
      }}
    >
      <Icon name={v.icon} size={20} color={palette.brown900} />
      <Text style={{ fontFamily: fonts.body.bold, fontSize: 14, color: palette.brown900 }}>
        {v.label}
      </Text>
      {count != null && (
        <Text
          style={{
            marginLeft: 'auto',
            fontFamily: fonts.body.extraBold,
            fontSize: 14,
            color: palette.brown700,
          }}
        >
          {count}x
        </Text>
      )}
    </View>
  );
}
