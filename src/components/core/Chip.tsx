import React from 'react';
import { Pressable, StyleProp, Text, TextStyle, ViewStyle } from 'react-native';

import { fonts, radius, useTema } from '../../theme';

type Props = {
  children: React.ReactNode;
  selected?: boolean;
  onPress?: () => void;
  tint?: string;
  tile?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
};

/**
 * Chip — pílula selecionável usada em escolhas (humor, interesses, tags).
 *
 * ## O que mudou, e por que não é só cor
 *
 * Marcado e não marcado eram a mesma pastilha com a borda de outra cor. Numa
 * lista de oito valores, era preciso comparar duas bordas de um pixel e meio
 * para saber qual estava escolhida — e quem tem dificuldade de contraste não
 * conseguia.
 *
 * Agora a diferença é de **relevo**: o não marcado é vidro, deitado, igual às
 * outras superfícies; o marcado é verde pálido, com anel verde grosso e sombra
 * própria, levantado da tela. Dá para ver de longe e sem distinguir cor.
 *
 * A pílula também virou pílula de verdade — raio 999 em vez de 14. Chip com
 * canto quadrado ao lado de cartão com canto quadrado lê como cartão pequeno.
 */
export function Chip({
  children,
  selected = false,
  onPress,
  tint,
  tile = false,
  style,
  textStyle,
}: Props) {
  const { colors, palette, shadows, vidros } = useTema();
  const base: ViewStyle = selected
    ? {
        borderRadius: tile ? radius.lg : radius.pill,
        backgroundColor: tint ?? colors.primarySoft,
        /*
          O anel é desenhado por fora, com `borderWidth` grosso e o mesmo raio.
          O documento usa `box-shadow: 0 0 0 1.6px` — um anel que não ocupa
          espaço no layout —, e a diferença aqui é que a borda empurra o
          conteúdo. Como ela existe nos dois estados (transparente quando não
          marcado), a pílula não pula de tamanho ao ser escolhida.
        */
        borderWidth: 1.6,
        borderColor: colors.primaryStrong,
        ...shadows.sm,
      }
    : {
        borderRadius: tile ? radius.lg : radius.pill,
        ...(tint ? { backgroundColor: tint } : vidros.cartao),
        borderWidth: 1.6,
        borderColor: 'transparent',
        ...shadows.sm,
      };

  const layout: ViewStyle = tile
    ? { padding: 16, alignItems: 'flex-start', gap: 26, minHeight: 96 }
    : { paddingVertical: 11, paddingHorizontal: 18 };

  return (
    <Pressable
      accessibilityRole="button"
      // O chip marca escolha (humor, resposta do onboarding). Sem o estado,
      // quem usa leitor de tela não tem como saber qual está selecionada.
      accessibilityState={{ selected }}
      onPress={onPress}
      style={[base, layout, style]}
    >
      {typeof children === 'string' ? (
        <Text
          style={[
            {
              fontFamily: fonts.body.bold,
              fontSize: 15,
              color: selected ? palette.green900 : colors.textPrimary,
            },
            textStyle,
          ]}
        >
          {children}
        </Text>
      ) : (
        children
      )}
    </Pressable>
  );
}
