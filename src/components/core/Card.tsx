import React from 'react';
import { Pressable, StyleProp, View, ViewStyle } from 'react-native';

import { radius, useTema } from '../../theme';

type Props = {
  children: React.ReactNode;
  padding?: number;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
  /**
   * Nome do cartão quando ele é tocável.
   *
   * Sem isso o leitor de tela lê tudo o que está dentro em sequência — título,
   * parágrafo, as duas legendas — antes de a pessoa saber o que o cartão faz.
   * Um nome curto diz a mesma coisa em três palavras.
   */
  label?: string;
};

/** Card — superfície base: cantos suaves, sombra leve, fundo branco creme. */
export function Card({ children, padding = 20, style, onPress, label }: Props) {
  const { colors, shadows } = useTema();
  const base: StyleProp<ViewStyle> = [
    {
      backgroundColor: colors.surface,
      borderRadius: radius.lg,
      padding,
      ...shadows.sm,
    },
    style,
  ];

  if (onPress) {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        onPress={onPress}
        style={({ pressed }) => [base, { opacity: pressed ? 0.85 : 1 }]}
      >
        {children}
      </Pressable>
    );
  }
  return <View style={base}>{children}</View>;
}
