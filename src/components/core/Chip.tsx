import React from 'react';
import { Pressable, StyleProp, Text, TextStyle, ViewStyle } from 'react-native';

import { colors, radius, borderWidth, fonts } from '../../theme';

type Props = {
  children: React.ReactNode;
  selected?: boolean;
  onPress?: () => void;
  tint?: string;
  tile?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
};

/** Chip — pílula selecionável usada em escolhas (humor, interesses, tags). */
export function Chip({
  children,
  selected = false,
  onPress,
  tint,
  tile = false,
  style,
  textStyle,
}: Props) {
  const base: ViewStyle = {
    borderWidth,
    borderColor: selected ? colors.primary : colors.border,
    borderRadius: radius.md,
    backgroundColor: tint ?? colors.surface,
  };

  const layout: ViewStyle = tile
    ? { padding: 16, alignItems: 'flex-start', gap: 26, minHeight: 96 }
    : { paddingVertical: 12, paddingHorizontal: 18 };

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
            { fontFamily: fonts.body.bold, fontSize: tile ? 15 : 14, color: colors.textPrimary },
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
