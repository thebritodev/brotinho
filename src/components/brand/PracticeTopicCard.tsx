import React from 'react';
import { Pressable, StyleProp, Text, View, ViewStyle } from 'react-native';

import { colors, palette, radius, shadows, fonts } from '../../theme';
import { Icon, type IconName } from '../core/Icon';

type Props = {
  title: string;
  icon: IconName;
  tint: string;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
};

/** PracticeTopicCard — linha larga que leva a um tema de prática (ansiedade, sono...). */
export function PracticeTopicCard({ title, icon, tint, onPress, style }: Props) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 16,
          width: '100%',
          backgroundColor: colors.surface,
          borderRadius: radius.lg,
          padding: 14,
          opacity: pressed ? 0.85 : 1,
          ...shadows.sm,
        },
        style,
      ]}
    >
      <View
        style={{
          width: 52,
          height: 52,
          borderRadius: radius.md,
          backgroundColor: tint,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Icon name={icon} size={26} color={palette.brown900} />
      </View>
      <Text style={{ fontFamily: fonts.body.extraBold, fontSize: 16, color: palette.brown900 }}>
        {title}
      </Text>
    </Pressable>
  );
}
