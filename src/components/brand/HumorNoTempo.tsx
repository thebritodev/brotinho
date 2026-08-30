import React, { useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { ROTULO_DO_HUMOR } from '../../data/humores';
import { moodRange, moodWeek } from '../../state/derived';
import { useAppState } from '../../state/AppStateProvider';
import { fonts, type Mood, radius, useTema } from '../../theme';
import { Card } from '../core/Card';
import { MoodFace } from './MoodFace';

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
 *
 * ## A cor não pode ser o único canal
 *
 * Ele nasceu codificando humor só por matiz, e assim não diz nada a quem não
 * distingue as matizes — nem aos dois temas, porque contraste mede
 * luminosidade e as seis cores têm luminosidade parecida de propósito.
 *
 * A saída óbvia seria altura de barra, e ela está descartada pela segunda
 * regra acima: altura ordena os humores num eixo de melhor para pior, que é
 * exatamente a pontuação que este gráfico não tem. Um gráfico onde "Feliz" é
 * alto e "Triste" é baixo convida a bater o próprio recorde de felicidade.
 *
 * O segundo canal é a **carinha** — a mesma que a pessoa toca para registrar,
 * distinta por expressão e não por cor. Na semana ela cabe dentro da barra. Em
 * 30 e 90 dias a barra tem uns cinco pixels e não cabe nada, então ali o
 * segundo canal é **texto**: a conta por humor embaixo do gráfico. Some a
 * informação por outro caminho, sem inventar eixo nenhum.
 */
export function HumorNoTempo() {
  const { colors, moodColors, palette } = useTema();
  const { data } = useAppState();

  const [periodo, setPeriodo] = useState<7 | 30 | 90>(7);
  const semana = useMemo(() => moodWeek(data), [data]);
  const longo = useMemo(() => moodRange(data, periodo), [data, periodo]);
  const diasComRegistro = longo.filter((d) => d.mood).length;

  /** Quantos dias de cada humor no período, do mais frequente ao menos. */
  const contagem = useMemo(() => {
    const conta = new Map<Mood, number>();
    longo.forEach((d) => {
      if (d.mood) conta.set(d.mood, (conta.get(d.mood) ?? 0) + 1);
    });
    return [...conta.entries()].sort((a, b) => b[1] - a[1]);
  }, [longo]);

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
              {/*
                A barra inteira é um alvo de leitor de tela, e não sete formas
                mudas: antes disto o gráfico simplesmente não existia para
                quem navega por voz.
              */}
              <View
                accessible
                accessibilityLabel={
                  d.mood ? `${d.day}: ${ROTULO_DO_HUMOR[d.mood]}` : `${d.day}: sem registro`
                }
                style={{
                  width: '100%',
                  height: 44,
                  borderRadius: radius.sm,
                  alignItems: 'center',
                  justifyContent: 'center',
                  // Dia sem registro fica vazado, não colorido de mentira.
                  backgroundColor: d.mood ? moodColors[d.mood] : 'transparent',
                  borderWidth: d.mood ? 0 : 1,
                  borderColor: palette.brown100,
                }}
              >
                {/* A carinha é o segundo canal: expressão em vez de matiz. */}
                {!!d.mood && <MoodFace mood={d.mood} size={26} />}
              </View>
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
           lado, onde o que se lê é o desenho do período.

           Escondido do leitor de tela de propósito. Noventa formas anunciadas
           uma a uma seriam noventa paradas para chegar ao fim de um cartão —
           a leitura deste bloco mora na conta por humor, logo abaixo, que diz
           a mesma coisa em quatro linhas. */
        <View
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
          style={{ flexDirection: 'row', gap: 2, flexWrap: 'wrap' }}
        >
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

      {/*
        A conta por humor: o segundo canal de 30 e 90 dias.

        Aparece só ali porque na semana a carinha já está dentro da barra, e
        repetir a mesma informação duas vezes na mesma altura da tela é ruído.
        Ordenada pela contagem, não por uma escala de humor — ordenar por humor
        seria escolher qual vem antes, e é aí que nasce a pontuação que este
        gráfico não tem.
      */}
      {periodo !== 7 && contagem.length > 0 && (
        <View
          style={{
            flexDirection: 'row',
            flexWrap: 'wrap',
            gap: 10,
            marginTop: 12,
          }}
        >
          {contagem.map(([mood, quantos]) => (
            <View
              key={mood}
              accessible
              accessibilityLabel={`${ROTULO_DO_HUMOR[mood]}: ${quantos} ${quantos === 1 ? 'dia' : 'dias'}`}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}
            >
              <MoodFace mood={mood} size={18} />
              <Text
                style={{
                  fontFamily: fonts.body.regular,
                  fontSize: 12,
                  color: colors.textSecondary,
                }}
              >
                {ROTULO_DO_HUMOR[mood]} · {quantos}
              </Text>
            </View>
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
