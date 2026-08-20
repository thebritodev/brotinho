import React from 'react';
import { Pressable, StyleProp, Text, ViewStyle } from 'react-native';

import { colors, radius, borderWidth, fonts } from '../../theme';

type Variant = 'primary' | 'secondary' | 'ghost';
type Size = 'md' | 'lg';

const VARIANT = {
  primary: { background: colors.primary, color: '#fff', borderColor: 'transparent' },
  secondary: { background: colors.primarySoft, color: colors.primaryStrong, borderColor: 'transparent' },
  ghost: { background: 'transparent', color: colors.primaryStrong, borderColor: colors.border },
} as const;

const SIZE = {
  md: { paddingVertical: 13, paddingHorizontal: 22, fontSize: 15 },
  lg: { paddingVertical: 19, paddingHorizontal: 26, fontSize: 18 },
} as const;

type Props = {
  children: React.ReactNode;
  variant?: Variant;
  size?: Size;
  disabled?: boolean;
  icon?: React.ReactNode;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
};

/** Button — ação principal, ação tingida secundária ou ação de contorno. */
export function Button({
  children,
  variant = 'primary',
  size = 'lg',
  disabled = false,
  icon,
  onPress,
  style,
}: Props) {
  const v = VARIANT[variant] ?? VARIANT.primary;
  const s = SIZE[size] ?? SIZE.lg;

  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      disabled={disabled}
      style={({ pressed }) => [
        {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          borderRadius: radius.md,
          borderWidth: variant === 'ghost' ? borderWidth : 0,
          borderColor: v.borderColor,
          backgroundColor: v.background,
          paddingVertical: s.paddingVertical,
          paddingHorizontal: s.paddingHorizontal,
          opacity: disabled ? 0.5 : 1,
          transform: [{ scale: pressed && !disabled ? 0.97 : 1 }],
        },
        style,
      ]}
    >
      {icon}
      <Text style={{ fontFamily: fonts.body.bold, fontSize: s.fontSize, color: v.color }}>
        {children}
      </Text>
    </Pressable>
  );
}
