import React, { useEffect, useState } from 'react';
import { Linking, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Card, Icon, Switch, TopBar } from '../../components';
import { horaFalada, lembreteEnquantoDorme } from '../../data/onboarding';
import { notificacoesPermitidas } from '../../services/notifications';
import { useAppState } from '../../state/AppStateProvider';
import { fonts, useTema } from '../../theme';
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
  const { colors, palette } = useTema();
  const insets = useSafeAreaInsets();
  const { data, updateProfile, updateSettings } = useAppState();
  const s = data.settings;

  /**
   * O sistema está bloqueando, mesmo com o interruptor ligado?
   *
   * Esta tela dizia "Todos os dias às 21:00" olhando só para a chave interna do
   * app. Quem tivesse negado a permissão via o horário escrito e nunca recebia
   * nada — sem nenhuma pista de por quê, e depois de o onboarding ter prometido
   * exatamente aquele horário.
   */
  const [bloqueado, setBloqueado] = useState(false);
  const querAviso = s.reminders || s.weeklySummary;

  useEffect(() => {
    if (!querAviso) return setBloqueado(false);
    let vivo = true;
    void notificacoesPermitidas().then((ok) => vivo && setBloqueado(!ok));
    return () => {
      vivo = false;
    };
  }, [querAviso]);

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

        {bloqueado && (
          <Card style={{ gap: 10, backgroundColor: palette.amber100 }}>
            <Text style={{ fontFamily: fonts.body.bold, fontSize: 15, color: palette.brown900 }}>
              O sistema está bloqueando os avisos
            </Text>
            <Text
              style={{
                fontFamily: fonts.body.regular,
                fontSize: 14,
                lineHeight: 14 * 1.5,
                color: palette.brown700,
              }}
            >
              As notificações do Brotinho estão desativadas nos ajustes do aparelho,
              então nada vai chegar no horário escolhido aqui.
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Abrir os ajustes do aparelho"
              onPress={() => void Linking.openSettings().catch(() => {})}
            >
              <Text
                style={{ fontFamily: fonts.body.bold, fontSize: 14, color: colors.primaryStrong }}
              >
                Abrir os ajustes do aparelho
              </Text>
            </Pressable>
          </Card>
        )}

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
                {!s.reminders
                  ? 'Desligado'
                  : bloqueado
                    ? `Às ${data.profile.reminder} — se o sistema deixar`
                    : `Todos os dias às ${data.profile.reminder}`}
              </Text>
            </View>
            <Switch
              label="Lembrete diário"
              checked={s.reminders}
              onChange={(reminders) => updateSettings({ reminders })}
            />
          </View>
        </Card>

        {/* Sem o lembrete ligado, escolher horário não faria nada. */}
        {s.reminders && (
          <>
            <TimeWheel
              value={data.profile.reminder}
              onChange={(reminder) => updateProfile({ reminder })}
              icon="bell"
            />

            {/* O mesmo aviso do onboarding: aqui é onde o horário é trocado
                depois, e onde o conflito com a hora de dormir reaparece. */}
            {lembreteEnquantoDorme(data.profile.reminder, data.profile.sleepTime) && (
              <Text
                style={{
                  fontFamily: fonts.body.regular,
                  fontSize: 14,
                  lineHeight: 14 * 1.5,
                  color: palette.brown700,
                }}
              >
                Você costuma dormir por volta das {horaFalada(data.profile.sleepTime)}. Nesse
                horário o aviso provavelmente vai chegar com você já dormindo.
              </Text>
            )}
          </>
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
              label="Resumo semanal"
              checked={s.weeklySummary}
              onChange={(weeklySummary) => updateSettings({ weeklySummary })}
            />
          </View>
        </Card>
      </ScrollView>
    </View>
  );
}
