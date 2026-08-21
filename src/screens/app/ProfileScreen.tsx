import React, { useMemo } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Card, Icon, Sprout, StatRow, Switch, TopBar } from '../../components';
import { useAppState } from '../../state/AppStateProvider';
import { caringSince, sproutStage, stats } from '../../state/derived';
import { colors, palette, fonts } from '../../theme';
import type { SubScreen } from './types';

type Props = {
  name: string;
  onNavigate: (screen: SubScreen) => void;
};

export function ProfileScreen({ name, onNavigate }: Props) {
  const insets = useSafeAreaInsets();
  const { data, updateSettings } = useAppState();

  const growth = useMemo(() => stats(data), [data]);
  const since = caringSince(data);

  const row = (
    icon: 'settings' | 'lock',
    label: string,
    screen: SubScreen,
  ) => (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={() => onNavigate(screen)}
      style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}
    >
      <Icon name={icon} color={palette.brown700} />
      <Text style={{ flex: 1, fontFamily: fonts.body.bold, fontSize: 15 }}>{label}</Text>
      <Icon name="chevronRight" color={palette.brown400} />
    </Pressable>
  );

  return (
    <View style={{ flex: 1, paddingTop: insets.top }}>
      <TopBar title="Meu espaço" />
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 32, gap: 20 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
          <Sprout mood="leve" stage={sproutStage(data)} size={64} showBg={false} />
          <View>
            <Text style={{ fontFamily: fonts.body.extraBold, fontSize: 17 }}>{name}</Text>
            {!!since && (
              <Text
                style={{ fontFamily: fonts.body.regular, fontSize: 13, color: colors.textSecondary }}
              >
                Cuidando de si desde {since}
              </Text>
            )}
          </View>
        </View>

        <StatRow stats={growth} />

        <Card onPress={() => onNavigate('terapia')} label="Para minha terapia">
          <Text style={{ fontFamily: fonts.body.extraBold, fontSize: 15, marginBottom: 4 }}>
            Para minha terapia
          </Text>
          <Text
            style={{
              fontFamily: fonts.body.regular,
              fontSize: 14,
              lineHeight: 14 * 1.5,
              color: palette.brown700,
              marginBottom: 12,
            }}
          >
            Um resumo dos seus padrões e desabafos, organizado para levar e compartilhar com seu
            terapeuta.
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Icon name="book" size={18} color={colors.primaryStrong} />
            <Text
              style={{ fontFamily: fonts.body.bold, fontSize: 15, color: colors.primaryStrong }}
            >
              Ver resumo
            </Text>
          </View>
        </Card>

        <Card>
          <View style={{ gap: 16 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <Icon name="bell" color={palette.brown700} />
              <Text style={{ flex: 1, fontFamily: fonts.body.bold, fontSize: 15 }}>
                Lembretes diários
              </Text>
              <Switch
                label="Lembretes diários"
                checked={data.settings.reminders}
                onChange={(reminders) => updateSettings({ reminders })}
              />
            </View>
            {row('settings', 'Configurações', 'config')}
            {row('lock', 'Privacidade', 'privacidade')}
          </View>
        </Card>
      </ScrollView>
    </View>
  );
}
