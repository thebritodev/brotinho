import React from 'react';
import { Pressable, StyleProp, View, ViewStyle } from 'react-native';

import { colors, radius, shadows } from '../../theme';

type Props = {
  children: React.ReactNode;
  padding?: number;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
};

/** Card — superfície base: cantos suaves, sombra leve, fundo branco creme. */
export function Card({ children, padding = 20, style, onPress }: Props) {
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
      <Pressable onPress={onPress} style={({ pressed }) => [base, { opacity: pressed ? 0.85 : 1 }]}>
        {children}
      </Pressable>
    );
  }
  return <View style={base}>{children}</View>;
}
