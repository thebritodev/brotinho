import React, { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button, GrowingSprout, Icon, ScreenTransition, TopBar } from '../../components';
import { PracticeIllustration } from '../../components/brand/PracticeIllustration';
import type { Practice } from '../../data/practices';
import { useAppState } from '../../state/AppStateProvider';
import { useBotaoVoltar } from '../../navigation/useBotaoVoltar';
import { toqueDeConclusao } from '../../services/toque';
import { vezesPorPratica } from '../../state/derived';
import { fonts, radius, useTema } from '../../theme';
import { BreathingGuide } from './BreathingGuide';
import { StepGuide } from './StepGuide';

type Props = {
  practice: Practice;
  /** Chave do tema, para registrar a prática concluída. */
  topicKey: string;
  tint: string;
  onBack: () => void;
  /**
   * Leva ao diário com a pergunta da prática já na folha.
   *
   * Vinte e cinco das quarenta e uma práticas mandam escrever, e até aqui
   * nenhuma delas oferecia onde. A porta fica no fim, e não na leitura: antes
   * de fazer, o convite competiria com a própria prática.
   */
  onEscreverNoDiario?: (comeco: string) => void;
};

type Mode = 'read' | 'guide' | 'finished';

export function PracticeDetailScreen({
  practice,
  topicKey,
  tint,
  onBack,
  onEscreverNoDiario,
}: Props) {
  const { colors, palette, shadows } = useTema();
  const insets = useSafeAreaInsets();
  const { data, registrarPratica } = useAppState();
  const [mode, setMode] = useState<Mode>('read');

  const comeco = practice.comecoNoDiario;
  const escrever = comeco && onEscreverNoDiario ? () => onEscreverNoDiario(comeco) : null;

  /**
   * No meio do guia, voltar é desistir do guia — e não sair da prática.
   *
   * Na tela de conclusão é o contrário: a prática acabou, e voltar para a
   * leitura seria reabrir o que ela terminou. Ali o `false` deixa a lista
   * responder, que é para onde o botão principal também leva.
   */
  useBotaoVoltar(() => {
    if (mode === 'guide') {
      setMode('read');
      return true;
    }
    return false;
  });

  const jaFeita = vezesPorPratica(data)[`${topicKey}/${practice.key}`] ?? 0;

  /**
   * Só conta quando o guia chega ao fim. Abrir e desistir não é ter feito, e
   * inflar essa contagem tiraria justamente o valor dela.
   */
  const concluir = () => {
    registrarPratica(topicKey, practice.key);
    // Na respiração, cada virada de fase já vibra; faltava o ponto final. Nas
    // outras práticas, era a única resposta tátil da tela inteira.
    toqueDeConclusao(data.settings.vibracao);
    setMode('finished');
  };

  // --- Guia em andamento ---------------------------------------------------

  if (mode === 'guide' && practice.guide) {
    const guide = practice.guide;
    return (
      <ScreenTransition transitionKey="guia" mode="forward">
      <View style={{ flex: 1, backgroundColor: colors.bg, paddingTop: insets.top }}>
        <TopBar title={practice.title} onBack={() => setMode('read')} />
        {guide.kind === 'breathing' ? (
          <BreathingGuide
            phases={guide.phases}
            cycles={guide.cycles}
            onDone={concluir}
            onCancel={() => setMode('read')}
          />
        ) : (
          <StepGuide
            steps={guide.steps}
            onDone={concluir}
            onCancel={() => setMode('read')}
          />
        )}
      </View>
      </ScreenTransition>
    );
  }

  // --- Fim da prática ------------------------------------------------------

  if (mode === 'finished') {
    return (
      <ScreenTransition transitionKey="fim" mode="fade">
      <View
        style={{
          flex: 1,
          backgroundColor: colors.bg,
          paddingTop: insets.top,
          padding: 24,
          alignItems: 'center',
          justifyContent: 'center',
          gap: 22,
        }}
      >
        <GrowingSprout size={150} ate={2} />
        <Text
          style={{
            color: colors.textPrimary,
            fontFamily: fonts.display.bold,
            fontSize: 24,
            lineHeight: 24 * 1.25,
            textAlign: 'center',
          }}
        >
          Pronto
        </Text>
        <Text
          style={{
            fontFamily: fonts.body.regular,
            fontSize: 15,
            lineHeight: 15 * 1.55,
            color: palette.brown700,
            textAlign: 'center',
          }}
        >
          Repare como você está agora, sem cobrar que seja diferente de antes. Fazer já conta.
        </Text>
        {/* Sem contar troféu: só devolve à pessoa que ela já voltou aqui. A
            contagem inclui esta, por isso a comparação é com 1. */}
        {jaFeita > 1 && (
          <Text
            style={{
              fontFamily: fonts.body.bold,
              fontSize: 14,
              color: colors.primaryStrong,
              textAlign: 'center',
            }}
          >
            Esta é a {jaFeita}ª vez que você faz esta prática.
          </Text>
        )}
        <View style={{ width: '100%', gap: 10, marginTop: 8 }}>
          {!!escrever && (
            <Button variant="primary" style={{ width: '100%' }} onPress={escrever}>
              Escrever no diário
            </Button>
          )}
          <Button
            variant={escrever ? 'secondary' : 'primary'}
            style={{ width: '100%' }}
            onPress={onBack}
          >
            Voltar às práticas
          </Button>
          <Button variant="ghost" style={{ width: '100%' }} onPress={() => setMode('guide')}>
            Fazer de novo
          </Button>
        </View>
      </View>
      </ScreenTransition>
    );
  }

  // --- Leitura -------------------------------------------------------------

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg, paddingTop: insets.top }}>
      <TopBar title={practice.title} onBack={onBack} />

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 32, gap: 22 }}
        showsVerticalScrollIndicator={false}
      >
        <View
          style={{
            backgroundColor: tint,
            borderRadius: radius.lg,
            paddingVertical: 18,
            alignItems: 'center',
          }}
        >
          <PracticeIllustration name={practice.illustration} size={200} />
        </View>

        <View style={{ gap: 10 }}>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <View
              style={{
                backgroundColor: colors.surface,
                paddingVertical: 6,
                paddingHorizontal: 10,
                borderRadius: radius.pill,
                ...shadows.sm,
              }}
            >
              <Text
                style={{ fontFamily: fonts.body.bold, fontSize: 12, color: palette.brown700 }}
              >
                {practice.duration}
              </Text>
            </View>
            {!!practice.guide && (
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 6,
                  backgroundColor: colors.primarySoft,
                  paddingVertical: 6,
                  paddingHorizontal: 10,
                  borderRadius: radius.pill,
                }}
              >
                <Icon name="sparkle" size={13} color={colors.primaryStrong} />
                <Text
                  style={{
                    fontFamily: fonts.body.bold,
                    fontSize: 12,
                    color: colors.primaryStrong,
                  }}
                >
                  o app te guia
                </Text>
              </View>
            )}
          </View>

          <Text
            style={{
              fontFamily: fonts.body.regular,
              fontSize: 16,
              lineHeight: 16 * 1.5,
              color: palette.brown700,
            }}
          >
            {practice.summary}
          </Text>
        </View>

        <View style={{ gap: 14 }}>
          <Text style={{ color: colors.textPrimary, fontFamily: fonts.display.semiBold, fontSize: 19 }}>Como fazer</Text>

          {practice.steps.map((s, i) => (
            <View key={s.title} style={{ flexDirection: 'row', gap: 12, alignItems: 'flex-start' }}>
              <View
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: 13,
                  backgroundColor: colors.primary,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text
                  style={{ fontFamily: fonts.body.extraBold, fontSize: 14, color: colors.textInverse }}
                >
                  {i + 1}
                </Text>
              </View>
              <View style={{ flex: 1, gap: 3 }}>
                <Text style={{ color: colors.textPrimary, fontFamily: fonts.body.bold, fontSize: 15 }}>{s.title}</Text>
                <Text
                  style={{
                    fontFamily: fonts.body.regular,
                    fontSize: 14,
                    lineHeight: 14 * 1.5,
                    color: palette.brown700,
                  }}
                >
                  {s.text}
                </Text>
              </View>
            </View>
          ))}
        </View>

        <View
          style={{
            backgroundColor: colors.surface,
            borderRadius: radius.lg,
            padding: 18,
            ...shadows.sm,
          }}
        >
          <Text style={{ color: colors.textPrimary, fontFamily: fonts.display.semiBold, fontSize: 17, marginBottom: 8 }}>
            Por que funciona
          </Text>
          <Text
            style={{
              fontFamily: fonts.body.regular,
              fontSize: 15,
              lineHeight: 15 * 1.55,
              color: palette.brown700,
            }}
          >
            {practice.why}
          </Text>
        </View>

        {practice.guide ? (
          <Button variant="primary" style={{ width: '100%' }} onPress={() => setMode('guide')}>
            Fazer agora com o broto
          </Button>
        ) : (
          /*
            Sem guia, esta tela não tinha saída nenhuma: só "Voltar".

            Dezessete das trinta e uma práticas são assim — mais da metade do
            conteúdo era um beco sem saída. A pessoa lia um exercício de dez
            minutos, fazia, voltava, e o app agia como se ela não tivesse
            aparecido: nada entrava em `practicesDone`, então nem "retomar de
            onde parou" nem "mais feitas" a enxergavam, e o broto não crescia.

            O comentário de `concluir` diz que abrir e desistir não é ter feito.
            Continua valendo: aqui a pessoa declara, e declarar é o único sinal
            que existe numa prática que acontece fora da tela. Num app sem
            placar e sem ranking, não há o que inflar — a contagem só serve para
            ela se reencontrar.
          */
          <Button variant="primary" style={{ width: '100%' }} onPress={concluir}>
            Já fiz esta prática
          </Button>
        )}
      </ScrollView>
    </View>
  );
}
