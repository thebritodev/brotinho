import React, { useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { moodRange, moodWeek } from '../../state/derived';
import { useAppState } from '../../state/AppStateProvider';
import { fonts, radius, useTema } from '../../theme';
import { Card } from '../core/Card';

/**
 * O humor da pessoa em 7, 30 ou 90 dias.
 *
 * Existia só dentro de "Para minha terapia", e ali dizia respeito a outra
 * pessoa — o terapeuta. Quem não faz terapia registrava o humor todos os dias
 * e **nunca via o próprio arco**, que é o motivo de registrar.
 *
 * A comparação entre concorrentes é direta neste ponto: o Daylio retém cerca de
 * 40% no trigésimo dia contra 22% do Finch, e a análise credita isso à
 * simplicidade do registro diário somada à visualização de longo prazo — não à
 * gamificação, que é o que o Finch tem de sobra. Este gráfico é a metade que
 * faltava aparecer.
 *
 * Duas regras de leitura, herdadas de onde ele nasceu:
 *
 * - **Dia sem registro fica vazado, não colorido.** Preencher buraco com cor
 *   inventaria um humor que a pessoa não teve.
 * - **Não há nota, média nem pontuação.** O que se lê é o desenho do período,
 *   e não um número que sobe ou desce — nada aqui é para ser batido.
 */
export function HumorNoTempo() {
  const { colors, moodColors, palette } = useTema();
  const { data } = useAppState();

  const [periodo, setPeriodo] = useState<7 | 30 | 90>(7);
  const semana = useMemo(() => moodWeek(data), [data]);
  const longo = useMemo(() => moodRange(data, periodo), [data, periodo]);
  const diasComRegistro = longo.filter((d) => d.mood).length;

  // Sem nenhum humor marcado, um gráfico vazio só ocuparia espaço dizendo à
  // pessoa que ela ainda não fez nada.
  if (data.moodHistory.length === 0) return null;

  return (
    <Card>
      <View style={{ marginBottom: 12, gap: 10 }}>
        <Text style={{ color: colors.textPrimary, fontFamily: fonts.display.semiBold, fontSize: 17 }}>
          Seu humor ao longo do tempo
        </Text>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {([7, 30, 90] as const).map((d) => {
            const ativo = periodo === d;
            return (
              <Pressable
                key={d}
                accessibilityRole="button"
                accessibilityLabel={`Ver ${d} dias`}
                accessibilityState={{ selected: ativo }}
                onPress={() => setPeriodo(d)}
                style={{
                  paddingVertical: 6,
                  paddingHorizontal: 14,
                  borderRadius: radius.pill,
                  borderWidth: 1.5,
                  borderColor: ativo ? colors.primaryStrong : colors.border,
                  backgroundColor: ativo ? colors.primarySoft : colors.surface,
                }}
              >
                <Text
                  style={{
                    fontFamily: fonts.body.bold,
                    fontSize: 12,
                    color: ativo ? colors.primaryStrong : palette.brown700,
                  }}
                >
                  {d} dias
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {periodo === 7 ? (
        <View style={{ flexDirection: 'row', gap: 6 }}>
          {semana.map((d, i) => (
            <View key={i} style={{ flex: 1, alignItems: 'center' }}>
              <View
                style={{
                  width: '100%',
                  height: 44,
                  borderRadius: radius.sm,
                  // Dia sem registro fica vazado, não colorido de mentira.
                  backgroundColor: d.mood ? moodColors[d.mood] : 'transparent',
                  borderWidth: d.mood ? 0 : 1,
                  borderColor: palette.brown100,
                }}
              />
              <Text
                style={{
                  fontFamily: fonts.body.bold,
                  fontSize: 11,
                  color: palette.brown400,
                  marginTop: 5,
                }}
              >
                {d.day}
              </Text>
            </View>
          ))}
        </View>
      ) : (
        /* Com 30 ou 90 dias não cabe rótulo por dia: viram faixas finas lado a
           lado, onde o que se lê é o desenho do período. */
        <View style={{ flexDirection: 'row', gap: 2, flexWrap: 'wrap' }}>
          {longo.map((d) => (
            <View
              key={d.date}
              style={{
                width: periodo === 30 ? '3.0%' : '1.55%',
                height: 44,
                borderRadius: 2,
                backgroundColor: d.mood ? moodColors[d.mood] : 'transparent',
                borderWidth: d.mood ? 0 : 1,
                borderColor: palette.brown100,
              }}
            />
          ))}
        </View>
      )}

      <Text
        style={{
          fontFamily: fonts.body.regular,
          fontSize: 12,
          color: colors.textSecondary,
          marginTop: 10,
        }}
      >
        {diasComRegistro} de {periodo} dias registrados
      </Text>
    </Card>
  );
}
