import React, { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button, Card, HumorNoTempo, Icon, TopBar, ValueBadge } from '../../components';
import { useAppState } from '../../state/AppStateProvider';
import {
  fazTerapia,
  livedValues,
  patterns,
  resumoDoPeriodo,
  ventThemes,
  type PeriodoDoResumo,
} from '../../state/derived';
import { shareTherapyPdf } from '../../services/therapyReport';
import { fonts, radius, useTema, type Mood } from '../../theme';
import { POR_TRAS_DA_BARRA } from '../../components/navigation/BottomNav';

/** Os dois recortes que o resumo oferece: a sessão e o mês. */
const PERIODOS: PeriodoDoResumo[] = [7, 30];

/**
 * Os nomes dos humores, para a legenda da barra.
 *
 * `MOODS`, em `data/humores`, guarda as palavras de cada humor — não o nome
 * dele. O nome só existia dentro do `MoodSelector`, onde é rótulo de botão.
 */
const NOME_DO_HUMOR: Record<Mood, string> = {
  feliz: 'Feliz',
  leve: 'Leve',
  ansioso: 'Ansioso',
  triste: 'Triste',
  cansado: 'Cansado',
  neutro: 'Neutro',
};

/** O que a repesagem devolveu, escrito como se fala. */
const PESO_EM_PALAVRAS: Record<'menos' | 'igual' | 'mais', string> = {
  menos: 'ficou mais leve',
  igual: 'pesa igual',
  mais: 'pesa mais',
};

/** As três contagens do período, na ordem em que aparecem. */
const CONTAGENS: { chave: 'registros' | 'praticas' | 'compostas'; rotulo: string }[] = [
  { chave: 'registros', rotulo: 'Registros no diário' },
  { chave: 'praticas', rotulo: 'Práticas feitas' },
  { chave: 'compostas', rotulo: 'Pensamentos compostados' },
];

/* As aspas de fala, fora do JSX: dentro dele elas confundem o destaque. */
const ASPA_ABRE = '\u201c';
const ASPA_FECHA = '\u201d';

export function TherapySummaryScreen({ onBack }: { onBack: () => void }) {
  const { colors, palette, shadows, moodColors } = useTema();
  const insets = useSafeAreaInsets();
  const { data } = useAppState();

  const [periodo, setPeriodo] = useState<PeriodoDoResumo>(7);
  const resumo = useMemo(() => resumoDoPeriodo(data, periodo), [data, periodo]);

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
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 32 + POR_TRAS_DA_BARRA, gap: 20 }}
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
            {/*
              O período, em dois botões.

              Sete dias é o recorte de uma sessão; trinta é o de um mês de
              acompanhamento. Sem a escolha, o resumo tinha de decidir por todo
              mundo — e quem vai à terapia de quinze em quinze dias ficava com a
              janela errada nas duas pontas.
            */}
            <View
              style={{
                flexDirection: 'row',
                backgroundColor: palette.cream300,
                borderRadius: radius.lg,
                padding: 4,
                gap: 4,
              }}
            >
              {PERIODOS.map((n) => {
                const ativo = periodo === n;
                return (
                  <Pressable
                    key={n}
                    accessibilityRole="button"
                    accessibilityLabel={'Últimos ' + n + ' dias'}
                    onPress={() => setPeriodo(n)}
                    style={{
                      flex: 1,
                      height: 38,
                      borderRadius: radius.md,
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: ativo ? colors.surface : 'transparent',
                      ...(ativo ? shadows.sm : null),
                    }}
                  >
                    <Text
                      style={{
                        fontFamily: fonts.body.bold,
                        fontSize: 14,
                        color: ativo ? colors.textPrimary : palette.brown400,
                      }}
                    >
                      Últimos {n} dias
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {/*
              Como ela esteve: uma barra repartida pelos humores do período.

              É a primeira coisa que se pergunta numa sessão, e era justamente a
              que o resumo não respondia — ele mostrava o arco do humor dia a
              dia, que conta a variação e não a proporção.

              Por cento sobre os dias com registro, e não sobre os dias do
              período: ausência de registro não é um estado emocional, e
              somá-la inventaria um. Ver `resumoDoPeriodo`.
            */}
            {resumo.humores.length > 0 && (
              <Card>
                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'baseline',
                    marginBottom: 12,
                  }}
                >
                  <Text
                    style={{
                      color: colors.textPrimary,
                      fontFamily: fonts.body.extraBold,
                      fontSize: 16,
                    }}
                  >
                    Como você esteve
                  </Text>
                  <Text
                    style={{
                      fontFamily: fonts.body.regular,
                      fontSize: 13,
                      color: palette.brown400,
                    }}
                  >
                    {resumo.intervalo}
                  </Text>
                </View>
                <View
                  style={{
                    flexDirection: 'row',
                    height: 16,
                    borderRadius: radius.md,
                    overflow: 'hidden',
                    gap: 2,
                    marginBottom: 12,
                  }}
                >
                  {resumo.humores.map((h) => (
                    <View
                      key={h.mood}
                      style={{ flex: h.dias, backgroundColor: moodColors[h.mood] }}
                    />
                  ))}
                </View>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, columnGap: 14 }}>
                  {resumo.humores.map((h) => (
                    <View
                      key={h.mood}
                      style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}
                    >
                      <View
                        style={{
                          width: 10,
                          height: 10,
                          borderRadius: 5,
                          backgroundColor: moodColors[h.mood],
                        }}
                      />
                      <Text
                        style={{
                          fontFamily: fonts.body.bold,
                          fontSize: 13,
                          color: palette.brown700,
                        }}
                      >
                        {NOME_DO_HUMOR[h.mood]} {h.pct}%
                      </Text>
                    </View>
                  ))}
                </View>
              </Card>
            )}

            {/*
              As palavras que ela escolheu, com quantas vezes cada uma apareceu.

              Elas já eram guardadas — é a segunda camada do humor, a palavra
              mais exata — e não apareciam em lugar nenhum além do dia em que
              foram escritas. Numa conversa de terapia é o material mais útil
              que este app tem: a pessoa chega com o vocabulário dela, e não
              com cinco categorias.
            */}
            {resumo.palavras.length > 0 && (
              <Card>
                {sectionTitle('Palavras que mais apareceram')}
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                  {resumo.palavras.map((p, i) => (
                    <View
                      key={p.palavra}
                      style={{
                        paddingVertical: 7,
                        paddingHorizontal: 12,
                        borderRadius: radius.md,
                        backgroundColor: i < 2 ? colors.primarySoft : colors.surfaceSunken,
                        flexDirection: 'row',
                        gap: 6,
                      }}
                    >
                      <Text
                        style={{
                          fontFamily: fonts.body.bold,
                          fontSize: 14,
                          color: colors.textPrimary,
                        }}
                      >
                        {p.palavra}
                      </Text>
                      <Text
                        style={{
                          fontFamily: fonts.body.regular,
                          fontSize: 14,
                          color: palette.brown400,
                        }}
                      >
                        {p.n}x
                      </Text>
                    </View>
                  ))}
                </View>
              </Card>
            )}

            {/* Os três números do período, com o que cada um esconde embaixo. */}
            <Card>
              <View style={{ gap: 14 }}>
                {CONTAGENS.map(({ chave, rotulo }, i) => (
                  <View
                    key={chave}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 12,
                      borderTopWidth: i ? 1.5 : 0,
                      borderTopColor: palette.cream300,
                      paddingTop: i ? 14 : 0,
                    }}
                  >
                    <Text
                      style={{
                        fontFamily: fonts.display.extraBold,
                        fontSize: 22,
                        color: colors.primaryStrong,
                        minWidth: 32,
                      }}
                    >
                      {resumo[chave]}
                    </Text>
                    <View style={{ flex: 1 }}>
                      <Text
                        style={{
                          color: colors.textPrimary,
                          fontFamily: fonts.body.bold,
                          fontSize: 15,
                        }}
                      >
                        {rotulo}
                      </Text>
                      {chave === 'praticas' && !!resumo.praticaMaisFeita && (
                        <Text
                          style={{
                            fontFamily: fonts.body.regular,
                            fontSize: 13,
                            color: palette.brown400,
                          }}
                        >
                          A mais feita: {resumo.praticaMaisFeita}
                        </Text>
                      )}
                    </View>
                  </View>
                ))}
              </View>
            </Card>

            {/*
              Os pensamentos compostados, com o que a repesagem devolveu.

              Eles ficavam guardados e nunca mais eram vistos, a não ser no dia
              em que o app volta a perguntar se ainda pesam. Aqui viram o
              histórico que são — e o "mais leve" ao lado é a única medida de
              efeito que este app consegue produzir honestamente, porque quem
              respondeu foi ela.
            */}
            {resumo.pensamentos.length > 0 && (
              <Card>
                {sectionTitle('Pensamentos compostados')}
                <View style={{ gap: 10 }}>
                  {resumo.pensamentos.map((p, i) => (
                    <View
                      key={p.texto + i}
                      style={{
                        flexDirection: 'row',
                        gap: 10,
                        alignItems: 'baseline',
                        justifyContent: 'space-between',
                      }}
                    >
                      <Text
                        style={{
                          flex: 1,
                          fontFamily: fonts.display.semiBold,
                          fontSize: 16,
                          color: colors.textPrimary,
                        }}
                      >
                        {ASPA_ABRE}{p.texto}{ASPA_FECHA}
                      </Text>
                      <Text
                        style={{
                          fontFamily: fonts.body.regular,
                          fontSize: 13,
                          color: palette.brown400,
                        }}
                      >
                        {p.quando}
                        {p.peso ? ' - ' + PESO_EM_PALAVRAS[p.peso] : ''}
                      </Text>
                    </View>
                  ))}
                </View>
              </Card>
            )}

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
