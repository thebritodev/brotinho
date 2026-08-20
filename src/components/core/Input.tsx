import React from 'react';
import { Text, TextInput, View } from 'react-native';

import { colors, radius, borderWidth, fonts } from '../../theme';

type Props = {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  label?: string;
  autoFocus?: boolean;
};

/** Input — campo de texto de uma linha. */
export function Input({ value, onChangeText, placeholder, label, autoFocus }: Props) {
  return (
    <View style={{ gap: 6 }}>
      {!!label && (
        <Text style={{ fontFamily: fonts.body.bold, fontSize: 13, color: colors.textSecondary }}>
          {label}
        </Text>
      )}
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textSecondary}
        autoFocus={autoFocus}
        style={{
          fontFamily: fonts.body.regular,
          fontSize: 16,
          paddingVertical: 14,
          paddingHorizontal: 16,
          borderRadius: radius.md,
          borderWidth,
          borderColor: colors.border,
          backgroundColor: colors.surface,
          color: colors.textPrimary,
        }}
      />
    </View>
  );
}
