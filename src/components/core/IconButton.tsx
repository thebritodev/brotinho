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
  /*
    Quarenta e quatro, e não quarenta.

    É o mínimo confortável de toque, e a literatura de design para pessoas em
    sofrimento trata alvo pequeno como exclusão de acessibilidade, junto com
    contraste baixo e navegação só por gesto. O `Switch` já tinha um `hitSlop`
    corrigindo os 26 dele; este aqui tinha passado batido.
  */
  size = 44,
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
