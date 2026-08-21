import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  Button,
  Chip,
  Icon,
  Input,
  ScreenTransition,
  Sprout,
  StatRow,
  TopBar,
} from '../../components';
import { useAppState } from '../../state/AppStateProvider';
import { vezesQueVoltou } from '../../state/derived';
import { colors, palette, radius, shadows, fonts } from '../../theme';
import { FallingWords } from './FallingWords';
import { useCompostSession } from './useCompostSession';

/** Segundos de voz necessários para completar uma compostagem. */
const TARGET_SECONDS = 35;

/** Repetições até a frase se desmanchar por completo. */
const REPS_TO_FADE = 12;

const SUGESTOES = ['vou ser demitido', 'ninguém confia em mim', 'vai dar tudo errado'];

type Step = 'explain' | 'thought' | 'record' | 'done';

export function CompostaScreen({ onClose }: { onClose: () => void }) {
  const insets = useSafeAreaInsets();
  const { data, addCompost } = useAppState();

  const [step, setStep] = useState<Step>('explain');
  const [thought, setThought] = useState('');
  const [result, setResult] = useState({ reps: 0, secs: 0 });

  /**
   * Quantas vezes um pensamento parecido já foi compostado, contando este.
   * Calculado antes de salvar, para o número não incluir a sessão em curso
   * duas vezes.
   */
  const [jaVoltou, setJaVoltou] = useState(0);

  const session = useCompostSession({
    targetSeconds: TARGET_SECONDS,
    onFinish: ({ reps, secs }) => {
      setJaVoltou(vezesQueVoltou(data, thought.trim()) + 1);
      setResult({ reps, secs });
      addCompost({ thought: thought.trim(), reps, secs: Math.round(secs) });
      setStep('done');
    },
  });

  const começar = async () => {
    setStep('record');
    await session.start();
  };

  const cancelar = () => {
    session.stop();
    setStep('explain');
  };

  const progresso = Math.min(1, session.secs / TARGET_SECONDS);
  const restante = Math.max(0, Math.ceil(TARGET_SECONDS - session.secs));
  const relógio = `${Math.floor(restante / 60)}:${String(restante % 60).padStart(2, '0')}`;

  /**
   * Cada palavra some num ritmo próprio: as primeiras da frase se desmancham
   * antes, então a frase se desfaz da esquerda para a direita.
   */
  const palavras = useMemo(() => {
    const raw = (thought.trim() || SUGESTOES[0]).split(/\s+/).filter(Boolean);
    const decay = Math.min(1, session.reps / REPS_TO_FADE);

    return raw.map((text, i) => {
      const t = Math.max(0, Math.min(1, decay * 1.5 - i * (0.45 / Math.max(1, raw.length - 1))));
      return {
        text,
        opacity: 1 - 0.85 * t,
        dy: t * 10,
        rot: t * (i % 2 === 0 ? 4 : -4),
      };
    });
  }, [thought, session.reps]);

  const header = (title: string, onBack: () => void, trailing?: React.ReactNode) => (
    <View style={{ paddingTop: insets.top }}>
      <TopBar title={title} onBack={onBack} trailing={trailing} />
    </View>
  );

  // --- Passo 1: o que é e por que funciona --------------------------------

  if (step === 'explain') {
    const passo = (n: string, texto: string) => (
      <View key={n} style={{ flexDirection: 'row', gap: 12, alignItems: 'flex-start' }}>
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
          <Text style={{ fontFamily: fonts.body.extraBold, fontSize: 14, color: '#fff' }}>{n}</Text>
        </View>
        <Text
          style={{ flex: 1, fontFamily: fonts.body.regular, fontSize: 15, lineHeight: 15 * 1.5 }}
        >
          {texto}
        </Text>
      </View>
    );

    const cartão = (titulo: string, corpo: string, icone?: React.ReactNode) => (
      <View
        style={{
          backgroundColor: colors.surface,
          borderRadius: radius.lg,
          padding: 18,
          flexDirection: icone ? 'row' : 'column',
          gap: icone ? 14 : 0,
          ...shadows.sm,
        }}
      >
        {icone}
        <View style={{ flex: 1 }}>
          <Text style={{ fontFamily: fonts.display.semiBold, fontSize: 17, marginBottom: 8 }}>
            {titulo}
          </Text>
          <Text
            style={{
              fontFamily: fonts.body.regular,
              fontSize: 15,
              lineHeight: 15 * 1.55,
              color: palette.brown700,
            }}
          >
            {corpo}
          </Text>
        </View>
      </View>
    );

    return (
      <ScreenTransition transitionKey="explain" mode="forward">
      <View style={{ flex: 1, backgroundColor: colors.bg }}>
        {header('Composta', onClose)}
        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 28, gap: 20 }}
          showsVerticalScrollIndicator={false}
        >
          <View style={{ alignItems: 'center', gap: 12 }}>
            <Sprout mood="leve" stage={2} size={120} />
            <Text
              style={{
                fontFamily: fonts.display.bold,
                fontSize: 20,
                lineHeight: 20 * 1.3,
                textAlign: 'center',
              }}
            >
              Um pensamento repetido em voz alta perde a força
            </Text>
          </View>

          <View style={{ gap: 12 }}>
            {passo('1', 'Você escreve o pensamento que está te incomodando, em uma frase curta.')}
            {passo('2', 'Repete ele em voz alta, rápido, por 30 a 40 segundos, sem pausar.')}
            {passo(
              '3',
              'A frase vai desmanchando na tela a cada repetição, e cada repetição vira adubo para o seu broto.',
            )}
          </View>

          {cartão(
            'Por que funciona',
            'Existe um fenômeno real chamado saciedade semântica: quando você repete uma palavra ou frase rápido e várias vezes, o cérebro para de processá-la como significado e passa a ouvi-la só como som. Na terapia ACT isso se chama defusão cognitiva.',
          )}

          {cartão(
            'O microfone só confirma',
            'O microfone fica ligado para confirmar que você está de fato vocalizando. Não dá para pausar nem fingir. O áudio não é salvo nem enviado.',
            <View style={{ marginTop: 2 }}>
              <Icon name="mic" size={24} color={colors.primaryStrong} />
            </View>,
          )}

          <View
            style={{
              backgroundColor: colors.primarySoft,
              borderRadius: radius.lg,
              padding: 18,
              flexDirection: 'row',
              gap: 12,
              alignItems: 'flex-start',
            }}
          >
            <Sprout mood="leve" stage={2} size={44} showPot={false} showBg={false} />
            <Text
              style={{
                flex: 1,
                fontFamily: fonts.body.regular,
                fontSize: 15,
                lineHeight: 15 * 1.55,
                color: palette.brown900,
              }}
            >
              Eu recebo o pensamento e composto ele. Ele não é suprimido nem ignorado: vira material
              para o meu crescimento.
            </Text>
          </View>

          <Button variant="primary" style={{ width: '100%' }} onPress={() => setStep('thought')}>
            Escolher o pensamento
          </Button>
        </ScrollView>
      </View>
      </ScreenTransition>
    );
  }

  // --- Passo 2: qual pensamento -------------------------------------------

  if (step === 'thought') {
    return (
      <ScreenTransition transitionKey="thought" mode="forward">
      <View style={{ flex: 1, backgroundColor: colors.bg }}>
        {header('O pensamento', () => setStep('explain'))}
        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 28, gap: 18, flexGrow: 1 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Text
            style={{
              fontFamily: fonts.body.regular,
              fontSize: 15,
              lineHeight: 15 * 1.5,
              color: palette.brown700,
            }}
          >
            Uma frase curta, do jeito que ela aparece na sua cabeça.
          </Text>

          <Input value={thought} onChangeText={setThought} placeholder="vou ser demitido" />

          <View style={{ gap: 8 }}>
            <Text
              style={{ fontFamily: fonts.body.bold, fontSize: 13, color: colors.textSecondary }}
            >
              Ou comece por um destes
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {SUGESTOES.map((s) => (
                <Chip key={s} onPress={() => setThought(s)} selected={thought === s}>
                  {s}
                </Chip>
              ))}
            </View>
          </View>

          <View style={{ flex: 1 }} />

          <View
            style={{
              backgroundColor: colors.surface,
              borderRadius: radius.lg,
              padding: 16,
              flexDirection: 'row',
              gap: 12,
              alignItems: 'center',
              ...shadows.sm,
            }}
          >
            <Icon name="mic" size={22} color={colors.primaryStrong} />
            <Text
              style={{
                flex: 1,
                fontFamily: fonts.body.regular,
                fontSize: 14,
                lineHeight: 14 * 1.45,
                color: palette.brown700,
              }}
            >
              Fale em um lugar onde você possa usar a voz. O broto precisa te ouvir.
            </Text>
          </View>

          <Button
            variant="primary"
            style={{ width: '100%' }}
            disabled={thought.trim().length < 3}
            onPress={começar}
          >
            Começar a compostar
          </Button>
        </ScrollView>
      </View>
      </ScreenTransition>
    );
  }

  // --- Passo 3: compostando ------------------------------------------------

  if (step === 'record') {
    const humor = progresso > 0.8 ? 'feliz' : progresso > 0.4 ? 'leve' : 'ansioso';
    const estágio = progresso > 0.66 ? 3 : 2;
    const status = session.silent
      ? 'Continue falando'
      : progresso > 0.66
        ? 'Quase compostado'
        : 'Compostando';

    return (
      <ScreenTransition transitionKey="record" mode="forward">
      <View style={{ flex: 1, backgroundColor: colors.bg, paddingTop: insets.top }}>
        <View style={{ flex: 1, paddingHorizontal: 20, paddingTop: 18, paddingBottom: 22 + insets.bottom }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <Pressable
              onPress={cancelar}
              accessibilityRole="button"
              accessibilityLabel="Cancelar"
              style={{ width: 40, height: 40, alignItems: 'center', justifyContent: 'center' }}
            >
              <Icon name="back" color={colors.textPrimary} />
            </Pressable>
            <Text style={{ flex: 1, fontFamily: fonts.display.bold, fontSize: 20 }}>
              Compostando
            </Text>
            <Text
              style={{ fontFamily: fonts.display.bold, fontSize: 18, color: colors.primaryStrong }}
            >
              {relógio}
            </Text>
          </View>

          <View
            style={{
              height: 8,
              borderRadius: radius.pill,
              backgroundColor: palette.brown100,
              marginTop: 14,
              overflow: 'hidden',
            }}
          >
            <View
              style={{
                height: '100%',
                width: `${progresso * 100}%`,
                borderRadius: radius.pill,
                backgroundColor: colors.primary,
              }}
            />
          </View>

          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 }}>
            <Text
              style={{ fontFamily: fonts.body.bold, fontSize: 12, color: colors.textSecondary }}
            >
              {session.reps} repetições
            </Text>
            <Text
              style={{ fontFamily: fonts.body.bold, fontSize: 12, color: colors.textSecondary }}
            >
              {status}
            </Text>
          </View>

          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 6 }}>
            <View
              style={{
                minHeight: 120,
                justifyContent: 'center',
                paddingHorizontal: 6,
              }}
            >
              <View
                style={{
                  flexDirection: 'row',
                  flexWrap: 'wrap',
                  justifyContent: 'center',
                  columnGap: 10,
                }}
              >
                {palavras.map((w, i) => (
                  <Text
                    key={`${w.text}-${i}`}
                    style={{
                      fontFamily: fonts.display.bold,
                      fontSize: 30,
                      lineHeight: 30 * 1.3,
                      color: colors.textPrimary,
                      opacity: w.opacity,
                      transform: [{ translateY: w.dy }, { rotate: `${w.rot}deg` }],
                    }}
                  >
                    {w.text}
                  </Text>
                ))}
              </View>
            </View>

            <Sprout mood={humor} stage={estágio} size={150} />
            <FallingWords tick={session.repTick} thought={thought.trim() || SUGESTOES[0]} />
          </View>

          {session.manual ? (
            <View style={{ alignItems: 'center', gap: 10 }}>
              <Text
                style={{
                  fontFamily: fonts.body.regular,
                  fontSize: 13,
                  lineHeight: 13 * 1.4,
                  color: colors.textSecondary,
                  textAlign: 'center',
                }}
              >
                Sem acesso ao microfone. Segure o botão enquanto repete em voz alta.
              </Text>
              <Pressable
                accessibilityRole="button"
                onPressIn={session.holdOn}
                onPressOut={session.holdOff}
                style={{
                  width: '100%',
                  padding: 16,
                  borderRadius: radius.md,
                  backgroundColor: colors.primary,
                  alignItems: 'center',
                }}
              >
                <Text style={{ fontFamily: fonts.body.bold, fontSize: 17, color: '#fff' }}>
                  Segurar e repetir
                </Text>
              </Pressable>
            </View>
          ) : (
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 12,
                backgroundColor: colors.surface,
                borderRadius: radius.lg,
                padding: 14,
                ...shadows.sm,
              }}
            >
              <View
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 22,
                  backgroundColor: colors.primarySoft,
                  alignItems: 'center',
                  justifyContent: 'center',
                  // O anel pulsa com a voz — sinal de que o broto está ouvindo.
                  transform: [{ scale: 1 + Math.min(0.35, session.level * 0.7) }],
                }}
              >
                <Icon name="mic" size={22} color={colors.primaryStrong} />
              </View>
              <Text
                style={{
                  flex: 1,
                  fontFamily: fonts.body.regular,
                  fontSize: 14,
                  lineHeight: 14 * 1.45,
                  color: palette.brown700,
                }}
              >
                {session.silent
                  ? 'O broto parou de te ouvir. Volte a repetir a frase.'
                  : 'Estou te ouvindo. Repita rápido, sem parar.'}
              </Text>
            </View>
          )}
        </View>
      </View>
      </ScreenTransition>
    );
  }

  // --- Passo 4: compostado -------------------------------------------------

  const totalCompostagens = data.composts.length;

  return (
    <ScreenTransition transitionKey="done" mode="fade">
    <View style={{ flex: 1, backgroundColor: colors.bg, paddingTop: insets.top }}>
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingTop: 28,
          paddingBottom: 28 + insets.bottom,
          gap: 22,
          alignItems: 'center',
          flexGrow: 1,
        }}
        showsVerticalScrollIndicator={false}
      >
        <Sprout mood="feliz" stage={3} size={160} />

        <Text
          style={{
            fontFamily: fonts.display.bold,
            fontSize: 24,
            lineHeight: 24 * 1.25,
            textAlign: 'center',
          }}
        >
          Seu broto compostou esse pensamento
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
          Você repetiu {result.reps} vezes em {Math.round(result.secs)} segundos. A frase perdeu o
          significado e virou adubo.
        </Text>

        {/* Reconhecer o pensamento que volta é a coisa mais inteligente que o
            app pode dizer aqui. A comparação roda no aparelho, por palavras em
            comum — "nunca vou dar conta" e "não vou dar conta disso" são a
            mesma dor voltando. Sem julgamento e sem alarme: só o fato. */}
        {jaVoltou > 1 && (
          <Text
            style={{
              fontFamily: fonts.body.bold,
              fontSize: 15,
              lineHeight: 15 * 1.5,
              color: colors.primaryStrong,
              textAlign: 'center',
            }}
          >
            Esse pensamento já voltou {jaVoltou} vezes. Reparar nisso também é cuidado.
          </Text>
        )}

        <View
          style={{
            width: '100%',
            backgroundColor: colors.surfaceSunken,
            borderRadius: radius.lg,
            padding: 16,
            alignItems: 'center',
          }}
        >
          <Text
            style={{
              fontFamily: fonts.display.bold,
              fontSize: 20,
              color: palette.brown400,
              opacity: 0.5,
              textAlign: 'center',
            }}
          >
            {thought.trim()}
          </Text>
        </View>

        <StatRow
          stats={[
            { value: result.reps, label: 'repetições' },
            { value: Math.round(result.secs), label: 'segundos' },
            { value: totalCompostagens, label: 'compostagens' },
          ]}
        />

        <Text
          style={{
            fontFamily: fonts.body.regular,
            fontSize: 14,
            lineHeight: 14 * 1.5,
            color: colors.textSecondary,
            textAlign: 'center',
          }}
        >
          Se ele voltar com força, composte de novo. Cada vez alimenta o broto.
        </Text>

        <View style={{ flex: 1 }} />

        <View style={{ width: '100%', gap: 10 }}>
          <Button variant="primary" style={{ width: '100%' }} onPress={onClose}>
            Voltar ao início
          </Button>
          <Button
            variant="ghost"
            style={{ width: '100%' }}
            onPress={() => {
              setThought('');
              setStep('thought');
            }}
          >
            Compostar outro pensamento
          </Button>
        </View>
      </ScrollView>
    </View>
    </ScreenTransition>
  );
}
