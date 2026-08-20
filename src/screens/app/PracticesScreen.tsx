import React, { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon, PracticeTopicCard, ScreenTransition, TopBar } from '../../components';
import { PracticeIllustration } from '../../components/brand/PracticeIllustration';
import { PRACTICE_TOPICS, findPractice, findTopic } from '../../data/practices';
import { useAppState } from '../../state/AppStateProvider';
import { vezesPorPratica } from '../../state/derived';
import { colors, palette, radius, shadows, fonts } from '../../theme';
import { PracticeDetailScreen } from '../practices/PracticeDetailScreen';

export function PracticesScreen({ onBack }: { onBack: () => void }) {
  const { data } = useAppState();
  const feitas = vezesPorPratica(data);
  const insets = useSafeAreaInsets();
  const [topicKey, setTopicKey] = useState<string | null>(null);
  const [practiceKey, setPracticeKey] = useState<string | null>(null);

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
