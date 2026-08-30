import React, { useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button, Card, HumorNoTempo, Icon, TopBar, ValueBadge } from '../../components';
import { useAppState } from '../../state/AppStateProvider';
import { fazTerapia, livedValues, patterns, ventThemes } from '../../state/derived';
import { shareTherapyPdf } from '../../services/therapyReport';
import { fonts, radius, useTema } from '../../theme';

export function TherapySummaryScreen({ onBack }: { onBack: () => void }) {
  const { colors, palette } = useTema();
  const insets = useSafeAreaInsets();
  const { data } = useAppState();

  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const padroes = useMemo(() => patterns(data), [data]);
  const valores = useMemo(() => livedValues(data), [data]);
  const temas = useMemo(() => ventThemes(data), [data]);
  const maiorTema = temas[0]?.count ?? 1;

  const temConteudo = data.journal.length > 0 || data.moodHistory.length > 0;
  const emTerapia = fazTerapia(data);

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
    <Text style={{ color: colors.textPrimary, fontFamily: fonts.display.semiBold, fontSize: 17, marginBottom: 12 }}>{t}</Text>
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
          {emTerapia
            ? 'Um resumo do que você registrou, organizado para você levar e conversar com seu terapeuta.'
            : 'Um resumo do que você registrou, organizado para você reler com calma — ou levar a uma consulta, se um dia quiser.'}
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
            <HumorNoTempo />

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
                        <Text style={{ color: colors.textPrimary, flex: 1, fontFamily: fonts.body.bold, fontSize: 13 }}>
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
