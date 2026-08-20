import React from 'react';
import { Text, View } from 'react-native';

import { palette, radius, fonts } from '../../theme';
import { Icon, type IconName } from '../core/Icon';

export type ValueKey = 'criatividade' | 'conexao' | 'coragem' | 'autocuidado' | 'curiosidade';

export const VALUES: Record<ValueKey, { label: string; icon: IconName; tint: string }> = {
  criatividade: { label: 'Criatividade', icon: 'flower', tint: palette.terracotta100 },
  conexao: { label: 'Conexão', icon: 'heart', tint: palette.blue100 },
  coragem: { label: 'Coragem', icon: 'leaf', tint: palette.green100 },
  autocuidado: { label: 'Autocuidado', icon: 'droplet', tint: palette.yellow100 },
  curiosidade: { label: 'Curiosidade', icon: 'sparkle', tint: palette.lavender100 },
};

/** ValueBadge — chip com ícone + rótulo de um valor pessoal vivido na semana. */
export function ValueBadge({ value, count }: { value: ValueKey; count?: number }) {
  const v = VALUES[value];
  if (!v) return null;

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        backgroundColor: v.tint,
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
