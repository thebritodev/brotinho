import React from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Card, Icon, Switch, TopBar } from '../../components';
import { useAppState } from '../../state/AppStateProvider';
import { colors, palette, fonts } from '../../theme';
import { TimeWheel } from '../onboarding/TimeWheel';

/**
 * Lembretes — o que o sino da Home abre.
 *
 * Existe porque o horário do lembrete era escolhido no onboarding e depois
 * ficava trancado: Configurações mostrava a hora como texto, sem jeito de
 * mudar. Aqui ela volta a ser editável, na mesma roda do onboarding.
 *
 * Não é preciso reagendar nada à mão: o provider observa `profile.reminder`
 * e `settings.reminders` e refaz o agendamento sozinho.
 */
export function RemindersScreen({ onBack }: { onBack: () => void }) {
  const insets = useSafeAreaInsets();
  const { data, updateProfile, updateSettings } = useAppState();
  const s = data.settings;

  return (
    <View style={{ flex: 1, paddingTop: insets.top }}>
      <TopBar title="Lembretes" onBack={onBack} />

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 32, gap: 18 }}
        showsVerticalScrollIndicator={false}
      >
        <Text
          style={{
            fontFamily: fonts.body.regular,
            fontSize: 15,
            lineHeight: 15 * 1.5,
            color: colors.textSecondary,
          }}
        >
          Um toque por dia, no horário que fizer sentido para você. Sem cobrança se
          você não abrir.
        </Text>

        <Card style={{ gap: 16 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <Icon name="bell" color={palette.brown700} />
            <View style={{ flex: 1 }}>
              <Text style={{ fontFamily: fonts.body.bold, fontSize: 15 }}>Lembrete diário</Text>
              <Text
                style={{
                  fontFamily: fonts.body.regular,
                  fontSize: 12,
                  color: palette.brown400,
                  marginTop: 2,
                }}
              >
                {s.reminders ? `Todos os dias às ${data.profile.reminder}` : 'Desligado'}
              </Text>
            </View>
            <Switch checked={s.reminders} onChange={(reminders) => updateSettings({ reminders })} />
          </View>
        </Card>

        {/* Sem o lembrete ligado, escolher horário não faria nada. */}
        {s.reminders && (
          <TimeWheel
            value={data.profile.reminder}
            onChange={(reminder) => updateProfile({ reminder })}
            icon="bell"
          />
        )}

        <Card style={{ gap: 16 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <Icon name="star" color={palette.brown700} />
            <View style={{ flex: 1 }}>
              <Text style={{ fontFamily: fonts.body.bold, fontSize: 15 }}>Resumo semanal</Text>
              <Text
                style={{
                  fontFamily: fonts.body.regular,
                  fontSize: 12,
                  color: palette.brown400,
                  marginTop: 2,
                }}
              >
                Domingo de manhã
              </Text>
            </View>
            <Switch
              checked={s.weeklySummary}
              onChange={(weeklySummary) => updateSettings({ weeklySummary })}
            />
          </View>
        </Card>
      </ScrollView>
    </View>
  );
}
