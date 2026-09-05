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
  /**
   * `destaque` puxa o cartão para o verde.
   *
   * É para o que chama para agir — a Composta na tela inicial, o convite de
   * prática. Um cartão comum apresenta; um de destaque pede. Numa tela onde
   * quase tudo é cartão, é a única diferença de peso que existe, e ela só
   * funciona enquanto for rara.
   */
  tom?: 'cartao' | 'destaque';
};

/**
 * Card — a superfície de tudo.
 *
 * Era branco opaco. Agora é vidro: branco translúcido com um gradiente curto,
 * mais o anel de luz que vem da sombra. A diferença que importa é a
 * translucidez — o papel creme da página aparece por baixo, e o cartão passa a
 * receber a mesma luz de ambiente do fundo em vez de recortar um retângulo
 * branco no meio dela. Ver `vidros` em `tokens`.
 */
export function Card({ children, padding = 20, style, onPress, label, tom = 'cartao' }: Props) {
  const { shadows, vidros } = useTema();
  const base: StyleProp<ViewStyle> = [
    {
      ...vidros[tom],
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
