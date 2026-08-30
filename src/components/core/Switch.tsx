import React from 'react';
import { Pressable, View } from 'react-native';

import { radius, useTema } from '../../theme';

type Props = {
  checked?: boolean;
  onChange?: (next: boolean) => void;
  /**
   * O que esta chave controla, para quem usa leitor de tela.
   *
   * O papel e o estado já estavam aqui, então o leitor anunciava "ativado,
   * chave" — sem dizer ativado o quê. Em Privacidade são duas chaves seguidas,
   * e sem nome elas ficam indistinguíveis: uma tranca o diário e a outra
   * autoriza a análise dos textos. Errar entre as duas não é detalhe.
   */
  label?: string;
};

/** Switch — alternador liga/desliga das configurações. */
export function Switch({ checked = false, onChange, label }: Props) {
  const { colors, palette, shadows } = useTema();
  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityState={{ checked }}
      accessibilityLabel={label}
      onPress={() => onChange?.(!checked)}
      // O alvo desenhado tem 26px de altura, abaixo do mínimo confortável de
      // toque (44). O hitSlop completa a diferença sem engordar o desenho.
      hitSlop={{ top: 9, bottom: 9, left: 0, right: 0 }}
      style={{
        width: 46,
        height: 26,
        borderRadius: radius.pill,
        backgroundColor: checked ? colors.primary : palette.brown200,
        justifyContent: 'center',
      }}
    >
      <View
        style={{
          position: 'absolute',
          top: 3,
          left: checked ? 23 : 3,
          width: 20,
          height: 20,
          borderRadius: 10,
          backgroundColor: colors.surface,
          ...shadows.sm,
        }}
      />
    </Pressable>
  );
}
