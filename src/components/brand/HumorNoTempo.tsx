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
 * 30 e 90 dias a célula tem uns vinte pixels e não cabe nada, então ali o
 * segundo canal é **texto**: a conta por humor embaixo do gráfico. Some a
 * informação por outro caminho, sem inventar eixo nenhum.
 *
 * ## Trinta e noventa dias são uma grade, não uma fita
 *
 * Eram uma fita: um retângulo por dia, lado a lado, com a largura em
 * porcentagem. A porcentagem não fecha. Trinta dias a 3% davam 265 pontos de
 * barra mais 58 de vão dentro de um cartão de 295 — e os três últimos dias
 * caíam sozinhos numa segunda fileira, que ninguém desenhou e que muda de
 * tamanho conforme o aparelho. Noventa dias davam barras de quatro pontos e
 * meio em duas fileiras de quarenta e cinco, número que não significa nada.
 *
 * Agora cada **coluna é uma semana** e cada **linha é um dia da semana**, com
 * as iniciais à esquerda. A quebra deixa de ser acidente e passa a ser a
 * informação: dá para correr o dedo numa linha e ver como foram todas as
 * segundas-feiras. Noventa dias viram treze colunas de vinte pontos, e trinta
 * viram cinco colunas largas — os dois enchem a mesma altura, cabem no cartão
 * e não dependem da largura da tela para não ficarem tortos.
 */
/** Altura de cada dia na grade de 30 e 90 dias, e o vão entre eles. */
const GRADE_CELULA = 18;
const GRADE_VAO = 3;

/**
 * As iniciais dos dias, de domingo a sábado.
 *
 * Três delas são "S" e duas são "Q", e é assim mesmo — é a abreviação que todo
 * calendário brasileiro usa, e a posição na coluna resolve o resto. Trocar por
 * duas letras roubaria largura das semanas para desfazer uma ambiguidade que
 * ninguém tem ao olhar uma grade de sete linhas.
 */
const INICIAIS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

export function HumorNoTempo() {
  const { colors, moodColors, palette } = useTema();
  const { data } = useAppState();

  const [periodo, setPeriodo] = useState<7 | 30 | 90>(7);
  const semana = useMemo(() => moodWeek(data), [data]);
  const longo = useMemo(() => moodRange(data, periodo), [data, periodo]);
  const diasComRegistro = longo.filter((d) => d.mood).length;

  /**
   * O período em colunas de semana, uma linha por dia da semana.
   *
   * Uma coluna nova começa a cada domingo. A primeira e a última costumam vir
   * pela metade — o período não começa num domingo nem termina num sábado — e
   * os buracos das pontas ficam `null`: são dias fora do intervalo, e não dias
   * sem registro. Os dois se parecem e não são a mesma coisa, então só o dia
   * sem registro ganha contorno.
   */
  const colunas = useMemo(() => {
    type Celula = { date: string; mood: Mood | null } | null;
    const semanas: Celula[][] = [];
    let coluna: Celula[] = new Array(7).fill(null);
    let comecou = false;

    for (const dia of longo) {
      if (dia.diaDaSemana === 0 && comecou) {
        semanas.push(coluna);
        coluna = new Array(7).fill(null);
      }
      coluna[dia.diaDaSemana] = { date: dia.date, mood: dia.mood };
      comecou = true;
    }
    if (comecou) semanas.push(coluna);
    return semanas;
  }, [longo]);

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
        /* Com 30 ou 90 dias não cabe rótulo por dia: viram uma grade de
           semanas, onde o que se lê é o desenho do período.

           Escondida do leitor de tela de propósito. Noventa formas anunciadas
           uma a uma seriam noventa paradas para chegar ao fim de um cartão —
           a leitura deste bloco mora na conta por humor, logo abaixo, que diz
           a mesma coisa em quatro linhas. */
        <View
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
          style={{ flexDirection: 'row', gap: GRADE_VAO }}
        >
          {/* As iniciais dos dias da semana, uma vez, à esquerda de tudo. */}
          <View style={{ gap: GRADE_VAO }}>
            {INICIAIS.map((letra, i) => (
              <View key={i} style={{ height: GRADE_CELULA, justifyContent: 'center' }}>
                <Text
                  style={{
                    fontFamily: fonts.body.bold,
                    fontSize: 10,
                    lineHeight: GRADE_CELULA,
                    color: palette.brown400,
                    width: 11,
                  }}
                >
                  {letra}
                </Text>
              </View>
            ))}
          </View>

          {colunas.map((semana, c) => (
            <View key={c} style={{ flex: 1, gap: GRADE_VAO }}>
              {semana.map((celula, i) => (
                <View
                  key={i}
                  style={{
                    height: GRADE_CELULA,
                    borderRadius: 3,
                    // Dia fora do período não é dia sem registro: fica vazio de
                    // verdade, sem contorno, para não contar um dia que não há.
                    backgroundColor: celula?.mood ? moodColors[celula.mood] : 'transparent',
                    borderWidth: celula && !celula.mood ? 1 : 0,
                    borderColor: palette.brown100,
                  }}
                />
              ))}
            </View>
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
