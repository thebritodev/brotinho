import React from 'react';
import { Text, View } from 'react-native';

import { colors, palette, fonts } from '../../theme';
import { Icon } from '../core/Icon';
import { IconButton } from '../core/IconButton';

type Props = {
  title: string;
  onBack?: () => void;
  trailing?: React.ReactNode;
};

/** TopBar — cabeçalho com botão voltar opcional, título e ação à direita. */
export function TopBar({ title, onBack, trailing }: Props) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingTop: 18,
        paddingBottom: 10,
        paddingHorizontal: 20,
      }}
    >
      {!!onBack && (
        <IconButton
          accessibilityLabel="Voltar"
          icon={<Icon name="back" color={palette.brown700} />}
          onPress={onBack}
        />
      )}
      <Text
        style={{
          flex: 1,
          fontFamily: fonts.display.bold,
          fontSize: 20,
          color: colors.textPrimary,
        }}
      >
        {title}
      </Text>
      {trailing}
    </View>
  );
}
