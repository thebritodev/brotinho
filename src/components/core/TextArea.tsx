import React from 'react';
import { TextInput } from 'react-native';

import { colors, radius, borderWidth, fonts } from '../../theme';

type Props = {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  minHeight?: number;
};

/** TextArea — campo de várias linhas para o diário / desabafo com o broto. */
export function TextArea({ value, onChangeText, placeholder, minHeight = 200 }: Props) {
  return (
    <TextInput
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={colors.textSecondary}
      multiline
      textAlignVertical="top"
      style={{
        fontFamily: fonts.body.regular,
        fontSize: 16,
        lineHeight: 16 * 1.6,
        padding: 16,
        minHeight,
        borderRadius: radius.lg,
        borderWidth,
        borderColor: colors.border,
        backgroundColor: colors.surface,
        color: colors.textPrimary,
      }}
    />
  );
}
