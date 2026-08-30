import React from 'react';
import { ScrollView, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AnimatedSprout, Sprout, TopBar, VALUES, type ValueKey } from '../../components';
import { useAppState } from '../../state/AppStateProvider';
import {
  MATURIDADE, dayKey, daysToNextStage, diasNoCiclo, sproutStage,
} from '../../state/derived';
import { fonts, type Mood, radius, useTema } from '../../theme';

/**
 * O jardim: as plantas que já amadureceram, e o broto de agora.
 *
 * Existe porque o crescimento tinha teto. O broto ia até o estágio 3, aos dez
 * dias, e nunca mais mudava — dez dias de crescimento numa assinatura anual.
 * Aqui cada planta guarda um período da vida da pessoa, com o valor e o humor
 * que o marcaram. O que se acumula é memória, não pontuação: não há número
 * total, não há recorde, não há nada a bater.
 */

const MES = [
  'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
  'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro',
];

const mesDe = (dia: string) => {
  const d = new Date(`${dia}T12:00:00`);
  return Number.isNaN(d.getTime()) ? '' : MES[d.getMonth()];
};

const ROTULO_HUMOR: Record<Mood, string> = {
  feliz: 'dias felizes', leve: 'dias leves', ansioso: 'dias ansiosos',
  triste: 'dias tristes', cansado: 'dias cansados', neutro: 'dias comuns',
};

export function GardenScreen({ onBack }: { onBack: () => void }) {
  const { colors, moodColors, palette, shadows } = useTema();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { data } = useAppState();

  const hoje = dayKey();
  const humorDeHoje = data.moodHistory.find((m) => m.date === hoje)?.mood ?? 'neutro';
  const noCiclo = diasNoCiclo(data);
  const faltam = daysToNextStage(data);
  const tamanho = Math.min(width * 0.42, 170);

  return (
    <View style={{ flex: 1, paddingTop: insets.top }}>
      <TopBar title="Meu jardim" onBack={onBack} />

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 32, gap: 20 }}
        showsVerticalScrollIndicator={false}
      >
        {/* O broto de agora */}
        <View style={{ alignItems: 'center', gap: 10 }}>
          <AnimatedSprout mood={humorDeHoje} stage={sproutStage(data)} size={tamanho} breathe />
          <Text style={{ fontFamily: fonts.display.bold, fontSize: 19 }}>Crescendo agora</Text>
          <Text
            style={{
              fontFamily: fonts.body.regular,
              fontSize: 14,
              lineHeight: 14 * 1.5,
              color: palette.brown700,
              textAlign: 'center',
            }}
          >
            {noCiclo === 0
              ? 'Ele começa a crescer no primeiro dia em que você aparecer.'
              : faltam === null
                ? 'Esta planta está madura e logo vai para o jardim.'
                : `${noCiclo} ${noCiclo === 1 ? 'dia' : 'dias'} de cuidado. Faltam ${faltam} para o próximo passo.`}
          </Text>

          {/* Uma linha de progresso do ciclo, sem número grande e sem meta. */}
          <View
            style={{
              width: '100%',
              height: 6,
              borderRadius: 3,
              backgroundColor: palette.brown100,
              overflow: 'hidden',
            }}
          >
            <View
              style={{
                width: `${Math.min(100, (noCiclo / MATURIDADE) * 100)}%`,
                height: 6,
                backgroundColor: colors.primary,
              }}
            />
          </View>
        </View>

        <View style={{ height: 1, backgroundColor: palette.brown100 }} />

        {data.garden.length === 0 ? (
          <View style={{ alignItems: 'center', gap: 10, paddingVertical: 20 }}>
            <Sprout mood="leve" stage={3} size={96} showBg={false} />
            <Text
              style={{
                fontFamily: fonts.body.regular,
                fontSize: 15,
                lineHeight: 15 * 1.55,
                color: colors.textSecondary,
                textAlign: 'center',
              }}
            >
              Seu jardim ainda está vazio.{'\n'}
              Quando este broto amadurecer, ele fica guardado aqui — e outro começa.
            </Text>
          </View>
        ) : (
          <View style={{ gap: 12 }}>
            <Text style={{ fontFamily: fonts.display.semiBold, fontSize: 19 }}>
              Plantas que você criou
            </Text>

            {/* Da mais nova para a mais antiga: o que aconteceu por último
                importa mais do que o começo de tudo. */}
            {[...data.garden].reverse().map((planta) => {
              const valor = VALUES[planta.valor as ValueKey];
              return (
                <View
                  key={planta.id}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 14,
                    backgroundColor: colors.surface,
                    borderRadius: radius.lg,
                    padding: 14,
                    ...shadows.sm,
                  }}
                >
                  <View
                    style={{
                      width: 64,
                      height: 64,
                      borderRadius: 32,
                      backgroundColor: planta.mood ? moodColors[planta.mood] : palette.cream200,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Sprout
                      mood={planta.mood ?? 'leve'}
                      stage={3}
                      size={54}
                      showBg={false}
                      showPot={false}
                      decorations={planta.valor ? [planta.valor as never] : []}
                    />
                  </View>

                  <View style={{ flex: 1, gap: 3 }}>
                    <Text style={{ fontFamily: fonts.body.extraBold, fontSize: 15 }}>
                      {mesDe(planta.maturedAt) || 'período guardado'}
                    </Text>
                    <Text
                      style={{
                        fontFamily: fonts.body.regular,
                        fontSize: 13,
                        lineHeight: 13 * 1.45,
                        color: palette.brown700,
                      }}
                    >
                      {planta.dias} dias de cuidado
                      {planta.mood ? ` · sobretudo ${ROTULO_HUMOR[planta.mood]}` : ''}
                      {valor ? `\nvocê viveu ${valor.label.toLowerCase()}` : ''}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
    </View>
  );
}
