import React, { useMemo } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Card, HumorNoTempo, Icon, Sprout, StatRow, Switch, TopBar } from '../../components';
import { useAppState } from '../../state/AppStateProvider';
import { caringSince, fazTerapia, sproutStage, stats } from '../../state/derived';
import { fonts, useTema } from '../../theme';
import type { SubScreen } from './types';

type Props = {
  name: string;
  onNavigate: (screen: SubScreen) => void;
};

export function ProfileScreen({ name, onNavigate }: Props) {
  const { colors, palette } = useTema();
  const insets = useSafeAreaInsets();
  const { data, updateSettings } = useAppState();

  const growth = useMemo(() => stats(data), [data]);
  /** Ver `fazTerapia`: o resumo é o mesmo, o texto é que para de pressupor. */
  const emTerapia = fazTerapia(data);
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
      <Text style={{ color: colors.textPrimary, flex: 1, fontFamily: fonts.body.bold, fontSize: 15 }}>{label}</Text>
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
            <Text style={{ color: colors.textPrimary, fontFamily: fonts.body.extraBold, fontSize: 17 }}>{name}</Text>
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

        {/* O arco do humor saiu de dentro de "Para minha terapia", onde só quem
            faz terapia via. Ver `components/brand/HumorNoTempo.tsx`. */}
        <HumorNoTempo />

        <Card
          onPress={() => onNavigate('terapia')}
          label={emTerapia ? 'Para minha terapia' : 'Um resumo do que você registrou'}
        >
          <Text style={{ color: colors.textPrimary, fontFamily: fonts.body.extraBold, fontSize: 15, marginBottom: 4 }}>
            {emTerapia ? 'Para minha terapia' : 'Um resumo do que você registrou'}
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
            {emTerapia
              ? 'Seus padrões e desabafos organizados para levar e compartilhar com seu terapeuta.'
              : 'Seus padrões e desabafos organizados num arquivo só — para você reler, ou levar a uma primeira consulta, se um dia quiser.'}
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
              <Text style={{ color: colors.textPrimary, flex: 1, fontFamily: fonts.body.bold, fontSize: 15 }}>
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
