import React, { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon, PracticeTopicCard, ScreenTransition, TopBar } from '../../components';
import { PracticeIllustration } from '../../components/brand/PracticeIllustration';
import { PRACTICE_TOPICS, findPractice, findTopic } from '../../data/practices';
import { useAppState } from '../../state/AppStateProvider';
import { praticasMaisFeitas, ultimaPratica, vezesPorPratica } from '../../state/derived';
import { colors, palette, radius, shadows, fonts } from '../../theme';
import { PracticeDetailScreen } from '../practices/PracticeDetailScreen';

export function PracticesScreen({
  onBack,
  onEscreverNoDiario,
  alvo,
}: {
  onBack: () => void;
  /** Repassado à prática: o fim dela pode levar ao diário. */
  onEscreverNoDiario?: (comeco: string) => void;
  /** Prática para abrir de saída, vinda da oferta da Home. */
  alvo?: { topico: string; pratica: string } | null;
}) {
  const { data } = useAppState();
  const feitas = vezesPorPratica(data);

  /**
   * Retomar de onde parou. Sem isto, 31 exercícios viravam uma biblioteca em
   * que ninguém lembrava onde tinha ficado — e o app já sabia a resposta.
   */
  const ultima = ultimaPratica(data);
  const retomar = ultima ? findPractice(ultima.topic, ultima.practice) : undefined;
  const temaDaUltima = ultima ? findTopic(ultima.topic) : undefined;

  const repetidas = praticasMaisFeitas(data)
    .map((r) => ({ ...r, pratica: findPractice(r.topic, r.practice), tema: findTopic(r.topic) }))
    .filter((r) => r.pratica && r.tema);
  const insets = useSafeAreaInsets();
  // A oferta da Home chega como estado inicial: esta tela é montada de novo a
  // cada abertura, então não há caso em que o alvo mude com ela na frente.
  const [topicKey, setTopicKey] = useState<string | null>(alvo?.topico ?? null);
  const [practiceKey, setPracticeKey] = useState<string | null>(alvo?.pratica ?? null);

  const topic = topicKey ? findTopic(topicKey) : undefined;
  const practice = topicKey && practiceKey ? findPractice(topicKey, practiceKey) : undefined;

  // --- Uma prática aberta --------------------------------------------------

  if (practice && topic) {
    return (
      <ScreenTransition transitionKey={practice.key} mode="forward">
        <PracticeDetailScreen
          practice={practice}
          topicKey={topic.key}
          tint={topic.tint}
          onBack={() => setPracticeKey(null)}
          onEscreverNoDiario={onEscreverNoDiario}
        />
      </ScreenTransition>
    );
  }

  // --- Lista de práticas de um tema ---------------------------------------

  if (topic) {
    return (
      <ScreenTransition transitionKey={topic.key} mode="forward">
      <View style={{ flex: 1, paddingTop: insets.top }}>
        <TopBar title={topic.title} onBack={() => setTopicKey(null)} />
        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 32, gap: 12 }}
          showsVerticalScrollIndicator={false}
        >
          <Text
            style={{
              fontFamily: fonts.body.regular,
              fontSize: 15,
              lineHeight: 15 * 1.5,
              color: colors.textSecondary,
              marginBottom: 2,
            }}
          >
            {topic.intro}
          </Text>

          {topic.practices.map((p) => (
            <Pressable
              accessibilityRole="button"
              key={p.key}
              onPress={() => setPracticeKey(p.key)}
              style={({ pressed }) => ({
                flexDirection: 'row',
                alignItems: 'center',
                gap: 14,
                backgroundColor: colors.surface,
                borderRadius: radius.lg,
                padding: 14,
                opacity: pressed ? 0.85 : 1,
                ...shadows.sm,
              })}
            >
              <View
                style={{
                  width: 62,
                  height: 62,
                  borderRadius: radius.md,
                  backgroundColor: topic.tint,
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden',
                }}
              >
                <PracticeIllustration name={p.illustration} size={70} />
              </View>

              <View style={{ flex: 1, gap: 3 }}>
                <Text style={{ fontFamily: fonts.body.extraBold, fontSize: 16 }}>{p.title}</Text>
                <Text
                  style={{
                    fontFamily: fonts.body.regular,
                    fontSize: 13,
                    lineHeight: 13 * 1.4,
                    color: palette.brown700,
                  }}
                >
                  {p.summary}
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 }}>
                  <Text
                    style={{
                      fontFamily: fonts.body.bold,
                      fontSize: 12,
                      color: colors.textSecondary,
                    }}
                  >
                    {p.duration}
                  </Text>
                  {!!p.guide && (
                    <>
                      <Text style={{ color: palette.brown200 }}>·</Text>
                      <Text
                        style={{
                          fontFamily: fonts.body.bold,
                          fontSize: 12,
                          color: colors.primaryStrong,
                        }}
                      >
                        guiada
                      </Text>
                    </>
                  )}
                  {/* O app passa a lembrar o que já foi feito: antes eram 31
                      exercícios soltos e ninguém sabia onde tinha parado. */}
                  {!!feitas[`${topic.key}/${p.key}`] && (
                    <>
                      <Text style={{ color: palette.brown200 }}>·</Text>
                      <Text
                        style={{
                          fontFamily: fonts.body.bold,
                          fontSize: 12,
                          color: palette.brown400,
                        }}
                      >
                        feita {feitas[`${topic.key}/${p.key}`]}×
                      </Text>
                    </>
                  )}
                </View>
              </View>

              <Icon name="chevronRight" color={palette.brown400} />
            </Pressable>
          ))}
        </ScrollView>
      </View>
      </ScreenTransition>
    );
  }

  // --- Temas ---------------------------------------------------------------

  return (
    <View style={{ flex: 1, paddingTop: insets.top }}>
      <TopBar title="Práticas" onBack={onBack} />
      {/* Os temas dividem a altura livre em vez de deixarem uma faixa vazia
          embaixo. `flexGrow` (e não `flex`) de propósito nos dois lados: se um
          dia houver temas demais para caber, ou a fonte do sistema estiver
          grande, os cartões voltam ao tamanho natural e a lista rola — com
          `flex` eles encolheriam e o texto seria espremido. */}
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          paddingHorizontal: 20,
          // Igual às laterais: assim o respiro de baixo lê como margem, e não
          // como uma sobra de tela que ninguém preencheu.
          paddingBottom: 20,
          gap: 10,
        }}
        showsVerticalScrollIndicator={false}
      >
        {!!retomar && !!temaDaUltima && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Retomar ${retomar.title}`}
            onPress={() => {
              setTopicKey(temaDaUltima.key);
              setPracticeKey(retomar.key);
            }}
            style={({ pressed }) => ({
              flexDirection: 'row',
              alignItems: 'center',
              gap: 14,
              backgroundColor: colors.primarySoft,
              borderRadius: radius.lg,
              padding: 14,
              opacity: pressed ? 0.9 : 1,
            })}
          >
            <View
              style={{
                width: 44,
                height: 44,
                borderRadius: 22,
                backgroundColor: colors.surface,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Icon name="check" size={22} color={colors.primaryStrong} />
            </View>
            <View style={{ flex: 1, gap: 2 }}>
              <Text
                style={{ fontFamily: fonts.body.bold, fontSize: 12, color: colors.primaryStrong }}
              >
                A última que você fez
              </Text>
              <Text style={{ fontFamily: fonts.body.extraBold, fontSize: 16 }}>
                {retomar.title}
              </Text>
            </View>
            <Icon name="chevronRight" color={colors.primaryStrong} />
          </Pressable>
        )}

        {/* Quem se repete são as favoritas. O app repara em vez de pedir para
            a pessoa marcar estrelinha — é menos uma tarefa para quem já está
            cansado, e o comportamento diz a mesma coisa. */}
        {repetidas.length > 0 && (
          <View style={{ gap: 8, marginTop: 2 }}>
            <Text
              style={{
                fontFamily: fonts.body.bold,
                fontSize: 12,
                letterSpacing: 0.6,
                color: colors.textSecondary,
              }}
            >
              AS QUE VOCÊ MAIS REPETE
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {repetidas.map((r) => (
                <Pressable
                  key={`${r.topic}/${r.practice}`}
                  accessibilityRole="button"
                  accessibilityLabel={`${r.pratica!.title}, feita ${r.vezes} vezes`}
                  onPress={() => {
                    setTopicKey(r.topic);
                    setPracticeKey(r.practice);
                  }}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 7,
                    paddingVertical: 8,
                    paddingHorizontal: 12,
                    borderRadius: radius.pill,
                    backgroundColor: colors.surface,
                    ...shadows.sm,
                  }}
                >
                  <Text style={{ fontFamily: fonts.body.bold, fontSize: 13 }}>
                    {r.pratica!.title}
                  </Text>
                  <Text
                    style={{ fontFamily: fonts.body.extraBold, fontSize: 12, color: palette.brown400 }}
                  >
                    {r.vezes}×
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        )}

        {PRACTICE_TOPICS.map((t) => (
          <PracticeTopicCard
            key={t.key}
            title={t.title}
            icon={t.icon}
            tint={t.tint}
            style={{ flexGrow: 1 }}
            onPress={() => setTopicKey(t.key)}
          />
        ))}
      </ScrollView>
    </View>
  );
}
