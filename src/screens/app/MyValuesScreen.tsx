import React from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AnimatedSprout, Card, Chip, TopBar } from '../../components';
import { MAX_VALUES, VALORES } from '../../data/onboarding';
import { useAppState } from '../../state/AppStateProvider';
import { dayKey, sproutStage } from '../../state/derived';
import { fonts, radius, useTema } from '../../theme';

/**
 * Os valores que a pessoa escolheu no onboarding — o que ela quer viver mais.
 * São uma declaração de intenção, diferente da aba Valores, que mostra o que
 * de fato apareceu nos registros.
 */
export function MyValuesScreen({ onBack }: { onBack: () => void }) {
  const { colors, palette } = useTema();
  const insets = useSafeAreaInsets();
  const { data, updateProfile } = useAppState();

  const escolhidos = data.profile.valores;
  const hoje = dayKey();
  const humor = data.moodHistory.find((m) => m.date === hoje)?.mood ?? 'neutro';

  const alternar = (valor: string) => {
    if (escolhidos.includes(valor)) {
      updateProfile({ valores: escolhidos.filter((v) => v !== valor) });
      return;
    }
    // O limite é o mesmo do onboarding: escolher tudo é não escolher nada.
    if (escolhidos.length >= MAX_VALUES) return;
    updateProfile({ valores: escolhidos.concat([valor]) });
  };

  const cheio = escolhidos.length >= MAX_VALUES;

  return (
    <View style={{ flex: 1, paddingTop: insets.top }}>
      <TopBar title="Meus valores pessoais" onBack={onBack} />

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 32, gap: 20 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ alignItems: 'center', gap: 14 }}>
          <AnimatedSprout mood={humor} stage={sproutStage(data)} size={130} />
          <Text
            style={{
              fontFamily: fonts.body.regular,
              fontSize: 15,
              lineHeight: 15 * 1.5,
              color: colors.textSecondary,
              textAlign: 'center',
            }}
          >
            O que você mais quer viver no seu dia a dia. Escolha até {MAX_VALUES} — eles guiam o que
            o broto sugere para você.
          </Text>
        </View>

        <View style={{ gap: 10 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text
              style={{
                flex: 1,
                fontFamily: fonts.body.bold,
                fontSize: 13,
                color: colors.textSecondary,
              }}
            >
              {escolhidos.length} de {MAX_VALUES} escolhidos
            </Text>
            {cheio && (
              <Text
                style={{ fontFamily: fonts.body.bold, fontSize: 13, color: palette.brown400 }}
              >
                toque para trocar
              </Text>
            )}
          </View>

          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
            {VALORES.map((v) => {
              const selecionado = escolhidos.includes(v);
              return (
                <Chip
                  key={v}
                  selected={selecionado}
                  tint={selecionado ? colors.primarySoft : colors.surface}
                  onPress={() => alternar(v)}
                  // Sem espaço livre, os não escolhidos ficam apagados: mostra
                  // que é preciso soltar um antes de pegar outro.
                  style={cheio && !selecionado ? { opacity: 0.45 } : undefined}
                >
                  {v}
                </Chip>
              );
            })}
          </View>
        </View>

        {!escolhidos.length && (
          <Card>
            <Text
              style={{
                fontFamily: fonts.body.regular,
                fontSize: 15,
                lineHeight: 15 * 1.5,
                color: palette.brown700,
              }}
            >
              Você ainda não escolheu nenhum. Não tem resposta certa — vale escolher o que falta,
              não só o que você já é bom.
            </Text>
          </Card>
        )}

        <View
          style={{
            backgroundColor: colors.primarySoft,
            borderRadius: radius.lg,
            padding: 18,
            gap: 6,
          }}
        >
          <Text style={{ fontFamily: fonts.display.semiBold, fontSize: 17 }}>
            Estes são diferentes da aba Valores
          </Text>
          <Text
            style={{
              fontFamily: fonts.body.regular,
              fontSize: 15,
              lineHeight: 15 * 1.55,
              color: palette.brown900,
            }}
          >
            Aqui ficam os valores que você quer viver. Na aba Valores aparecem os que o broto
            reconheceu no que você escreveu — o que aconteceu de fato. Comparar os dois costuma
            dizer mais que cada um sozinho.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}
