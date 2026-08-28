import React, { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button, Card, Icon, TopBar, ValueBadge } from '../../components';
import { useAppState } from '../../state/AppStateProvider';
import { livedValues, moodRange, moodWeek, patterns, ventThemes } from '../../state/derived';
import { shareTherapyPdf } from '../../services/therapyReport';
import { colors, moodColors, palette, radius, fonts } from '../../theme';

export function TherapySummaryScreen({ onBack }: { onBack: () => void }) {
  const insets = useSafeAreaInsets();
  const { data } = useAppState();

  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * O gráfico mostrava só 7 dias fixos. Quem registra há meses coletava o dado
   * todo dia e nunca via o próprio arco — que é o motivo de registrar.
   */
  const [periodo, setPeriodo] = useState<7 | 30 | 90>(7);
  const semana = useMemo(() => moodWeek(data), [data]);
  const longo = useMemo(() => moodRange(data, periodo), [data, periodo]);
  const diasComRegistro = longo.filter((d) => d.mood).length;
  const padroes = useMemo(() => patterns(data), [data]);
  const valores = useMemo(() => livedValues(data), [data]);
  const temas = useMemo(() => ventThemes(data), [data]);
  const maiorTema = temas[0]?.count ?? 1;

  const temConteudo = data.journal.length > 0 || data.moodHistory.length > 0;

  const exportar = async () => {
    setError(null);
    setExporting(true);
    try {
      await shareTherapyPdf(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Não consegui gerar o PDF.');
    } finally {
      setExporting(false);
    }
  };

  const sectionTitle = (t: string) => (
    <Text style={{ fontFamily: fonts.display.semiBold, fontSize: 17, marginBottom: 12 }}>{t}</Text>
  );

  return (
    <View style={{ flex: 1, paddingTop: insets.top }}>
      <TopBar title="Para minha terapia" onBack={onBack} />
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 32, gap: 20 }}
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
          Um resumo do que você registrou, organizado para você levar e conversar com seu terapeuta.
        </Text>

        {!temConteudo && (
          <Card>
            <Text
              style={{
                fontFamily: fonts.body.regular,
                fontSize: 15,
                lineHeight: 15 * 1.5,
                color: colors.textSecondary,
              }}
            >
              Ainda não há o que resumir. Conforme você registrar seu humor e escrever no diário,
              este resumo se monta sozinho.
            </Text>
          </Card>
        )}

        {temConteudo && (
          <>
            <Card>
              <View style={{ marginBottom: 12, gap: 10 }}>
                <Text style={{ fontFamily: fonts.display.semiBold, fontSize: 17 }}>
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
                /* Com 30 ou 90 dias não cabe rótulo por dia: viram faixas finas
                   lado a lado, onde o que se lê é o desenho do período. */
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

            {padroes.length > 0 && (
              <Card>
                {sectionTitle('Padrões identificados')}
                <View style={{ gap: 12 }}>
                  {padroes.map((p) => (
                    <View key={p} style={{ flexDirection: 'row', gap: 10, alignItems: 'flex-start' }}>
                      <View style={{ marginTop: 2 }}>
                        <Icon name="leaf" size={17} color={colors.primary} />
                      </View>
                      <Text
                        style={{
                          flex: 1,
                          fontFamily: fonts.body.regular,
                          fontSize: 14,
                          lineHeight: 14 * 1.5,
                          color: palette.brown700,
                        }}
                      >
                        {p}
                      </Text>
                    </View>
                  ))}
                </View>
              </Card>
            )}

            {valores.length > 0 && (
              <Card>
                {sectionTitle('Valores mais vividos')}
                <View style={{ gap: 8 }}>
                  {valores.slice(0, 3).map((v) => (
                    <ValueBadge key={v.value} value={v.value} count={v.count} />
                  ))}
                </View>
              </Card>
            )}

            {temas.length > 0 && (
              <Card>
                {sectionTitle('Temas dos desabafos')}
                <View style={{ gap: 10 }}>
                  {temas.map((x) => (
                    <View key={x.theme}>
                      <View style={{ flexDirection: 'row', marginBottom: 4 }}>
                        <Text style={{ flex: 1, fontFamily: fonts.body.bold, fontSize: 13 }}>
                          {x.theme}
                        </Text>
                        <Text
                          style={{
                            fontFamily: fonts.body.bold,
                            fontSize: 13,
                            color: palette.brown400,
                          }}
                        >
                          {x.count} registro{x.count === 1 ? '' : 's'}
                        </Text>
                      </View>
                      <View
                        style={{
                          height: 7,
                          borderRadius: radius.pill,
                          backgroundColor: palette.brown100,
                          overflow: 'hidden',
                        }}
                      >
                        <View
                          style={{
                            width: `${(x.count / maiorTema) * 100}%`,
                            height: '100%',
                            borderRadius: radius.pill,
                            backgroundColor: colors.primary,
                          }}
                        />
                      </View>
                    </View>
                  ))}
                </View>
              </Card>
            )}

            <Button
              variant="primary"
              style={{ width: '100%' }}
              onPress={exportar}
              disabled={exporting}
              icon={exporting ? <ActivityIndicator size="small" color="#fff" /> : undefined}
            >
              {exporting ? 'Gerando PDF...' : 'Exportar e compartilhar em PDF'}
            </Button>

            {!!error && (
              <Text
                style={{
                  fontFamily: fonts.body.regular,
                  fontSize: 13,
                  lineHeight: 13 * 1.4,
                  color: colors.danger,
                  textAlign: 'center',
                }}
              >
                {error}
              </Text>
            )}

            <Text
              style={{
                fontFamily: fonts.body.regular,
                fontSize: 12,
                lineHeight: 12 * 1.5,
                color: colors.textSecondary,
                textAlign: 'center',
              }}
            >
              O PDF traz padrões e contagens — o texto dos seus registros não vai junto.
            </Text>
          </>
        )}
      </ScrollView>
    </View>
  );
}
