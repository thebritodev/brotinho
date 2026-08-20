import React from 'react';
import { Pressable, View } from 'react-native';

import { colors, palette, radius, shadows } from '../../theme';

type Props = {
  checked?: boolean;
  onChange?: (next: boolean) => void;
};

/** Switch — alternador liga/desliga das configurações. */
export function Switch({ checked = false, onChange }: Props) {
  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityState={{ checked }}
      onPress={() => onChange?.(!checked)}
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
          backgroundColor: '#fff',
          ...shadows.sm,
        }}
      />
    </Pressable>
  );
}
