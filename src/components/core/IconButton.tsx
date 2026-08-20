import React from 'react';
import { Pressable } from 'react-native';

type Props = {
  icon: React.ReactNode;
  size?: number;
  onPress?: () => void;
  background?: string;
  accessibilityLabel?: string;
};

/** IconButton — alvo de toque circular para uma única ação (voltar, ajustes, sino...). */
export function IconButton({
  icon,
  size = 40,
  onPress,
  background = 'transparent',
  accessibilityLabel,
}: Props) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={({ pressed }) => ({
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: background,
        alignItems: 'center',
        justifyContent: 'center',
        opacity: pressed ? 0.6 : 1,
      })}
    >
      {icon}
    </Pressable>
  );
}
